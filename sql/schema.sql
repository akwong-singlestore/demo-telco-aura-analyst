-- Telco Subscriber Experience Command Center Schema
-- Based on RTDM patterns, adapted for telco use case

-- Reference table: Market and network site information
CREATE ROWSTORE REFERENCE TABLE IF NOT EXISTS market_reference (
  market_id BIGINT NOT NULL PRIMARY KEY,
  market_name TEXT NOT NULL,
  region_name TEXT NOT NULL,
  latitude DOUBLE,
  longitude DOUBLE,
  urban_rural_flag ENUM('urban', 'rural') NOT NULL,
  population_density INT,

  KEY (region_name)
);

CREATE ROWSTORE REFERENCE TABLE IF NOT EXISTS cell_sites (
  cell_site_id BIGINT NOT NULL PRIMARY KEY,
  market_id BIGINT NOT NULL,
  site_name TEXT NOT NULL,
  site_type ENUM('macro', 'small_cell', 'indoor') NOT NULL,
  latitude DOUBLE NOT NULL,
  longitude DOUBLE NOT NULL,
  technology_types TEXT NOT NULL, -- JSON array: ["4G", "5G"]
  capacity_subscribers INT NOT NULL,

  KEY (market_id)
  -- Note: Foreign key removed for SingleStore Helios compatibility
);

-- Master subscriber dimension
CREATE ROWSTORE TABLE IF NOT EXISTS subscriber_master (
  subscriber_id BIGINT NOT NULL PRIMARY KEY,
  account_id BIGINT NOT NULL,
  line_type ENUM('postpaid', 'prepaid', 'enterprise') NOT NULL,
  tenure_days INT NOT NULL DEFAULT 0,
  plan_type TEXT NOT NULL,
  monthly_revenue DECIMAL(10,2) NOT NULL,
  device_model TEXT,
  device_os TEXT,
  home_market_id BIGINT,
  enterprise_account_id BIGINT,
  churn_risk_band ENUM('low', 'medium', 'high', 'critical') NOT NULL DEFAULT 'low',

  -- Derived fields updated periodically
  last_experience_score DECIMAL(5,2),
  lifetime_value DECIMAL(12,2),

  KEY (home_market_id),
  KEY (enterprise_account_id),
  KEY (churn_risk_band),
  KEY (line_type)
);

-- Time-series: subscriber usage summary (rolled up periodically)
CREATE TABLE IF NOT EXISTS subscriber_usage_summary (
  subscriber_id BIGINT NOT NULL,
  event_ts DATETIME(6) NOT NULL SERIES TIMESTAMP,
  market_id BIGINT NOT NULL,
  cell_site_id BIGINT,

  session_count INT NOT NULL DEFAULT 0,
  data_mb DECIMAL(12,2) NOT NULL DEFAULT 0,
  voice_minutes DECIMAL(10,2) NOT NULL DEFAULT 0,
  dropped_sessions INT NOT NULL DEFAULT 0,
  avg_session_latency_ms INT,
  qos_score DECIMAL(5,2), -- 0-100 quality of service score

  SHARD KEY (subscriber_id),
  SORT KEY (event_ts),
  KEY (market_id, event_ts) USING HASH
);

-- Time-series: network experience events (degradation, outages, etc)
CREATE TABLE IF NOT EXISTS network_experience_events (
  event_id BIGINT NOT NULL AUTO_INCREMENT,
  event_ts DATETIME(6) NOT NULL SERIES TIMESTAMP,
  subscriber_id BIGINT NOT NULL,
  cell_site_id BIGINT NOT NULL,
  market_id BIGINT NOT NULL,
  region_name TEXT NOT NULL,

  technology_type ENUM('4G', '5G', '3G') NOT NULL,
  event_type ENUM('high_latency', 'packet_loss', 'session_drop', 'no_service', 'slow_data') NOT NULL,
  severity ENUM('minor', 'major', 'critical') NOT NULL,
  duration_seconds INT,
  impacted_service TEXT, -- 'data', 'voice', 'sms'
  resolved_flag BOOLEAN NOT NULL DEFAULT FALSE,

  SHARD KEY (subscriber_id),
  SORT KEY (event_ts),
  KEY (event_id) USING HASH,
  KEY (market_id, event_ts) USING HASH,
  KEY (cell_site_id, event_ts) USING HASH
);

-- Time-series: care cases
CREATE TABLE IF NOT EXISTS care_cases (
  case_id BIGINT NOT NULL AUTO_INCREMENT,
  subscriber_id BIGINT NOT NULL,
  opened_ts DATETIME(6) NOT NULL SERIES TIMESTAMP,
  closed_ts DATETIME(6),

  channel ENUM('phone', 'chat', 'app', 'email', 'store') NOT NULL,
  issue_category TEXT NOT NULL,
  resolution_code TEXT,
  handle_time_seconds INT,
  escalation_flag BOOLEAN NOT NULL DEFAULT FALSE,
  csat_score INT, -- 1-5 customer satisfaction
  related_service_issue_flag BOOLEAN NOT NULL DEFAULT FALSE,

  SHARD KEY (subscriber_id),
  SORT KEY (opened_ts),
  KEY (case_id) USING HASH
);

-- Time-series: retention actions
CREATE TABLE IF NOT EXISTS retention_actions (
  action_id BIGINT NOT NULL AUTO_INCREMENT,
  subscriber_id BIGINT NOT NULL,
  action_ts DATETIME(6) NOT NULL SERIES TIMESTAMP,

  action_type ENUM('discount_offer', 'plan_upgrade', 'device_upgrade', 'loyalty_credit', 'service_credit') NOT NULL,
  channel ENUM('outbound_call', 'sms', 'email', 'in_app', 'care_agent') NOT NULL,
  reason_code TEXT NOT NULL, -- 'churn_risk', 'poor_experience', 'complaint_resolution'

  accepted_flag BOOLEAN NOT NULL DEFAULT FALSE,
  conversion_flag BOOLEAN NOT NULL DEFAULT FALSE, -- did they stay?
  revenue_impact DECIMAL(10,2), -- negative for discounts, positive for upgrades

  SHARD KEY (subscriber_id),
  SORT KEY (action_ts),
  KEY (action_id) USING HASH
);

-- Optional: Enterprise SLA tracking
CREATE ROWSTORE REFERENCE TABLE IF NOT EXISTS enterprise_accounts (
  enterprise_account_id BIGINT NOT NULL PRIMARY KEY,
  account_name TEXT NOT NULL,
  sla_tier ENUM('gold', 'silver', 'bronze') NOT NULL,
  contracted_latency_target_ms INT NOT NULL,
  contracted_uptime_pct DECIMAL(5,2) NOT NULL,
  monthly_incident_allowance INT NOT NULL,
  active_sites INT NOT NULL,

  KEY (sla_tier)
);

CREATE TABLE IF NOT EXISTS enterprise_sla_events (
  event_id BIGINT NOT NULL AUTO_INCREMENT,
  enterprise_account_id BIGINT NOT NULL,
  event_ts DATETIME(6) NOT NULL SERIES TIMESTAMP,

  breach_type ENUM('latency', 'uptime', 'incident_count') NOT NULL,
  actual_value DECIMAL(10,2) NOT NULL,
  target_value DECIMAL(10,2) NOT NULL,
  affected_subscribers INT NOT NULL,
  resolved_flag BOOLEAN NOT NULL DEFAULT FALSE,

  SHARD KEY (enterprise_account_id),
  SORT KEY (event_ts),
  KEY (event_id) USING HASH
);

-- Derived views for analytics
CREATE VIEW IF NOT EXISTS subscriber_experience_scores AS
SELECT
  s.subscriber_id,
  s.account_id,
  s.line_type,
  s.home_market_id,
  s.churn_risk_band,
  s.monthly_revenue,

  -- Calculate experience score from recent usage data
  COALESCE(AVG(u.qos_score), 75) as avg_qos_score,
  COALESCE(SUM(u.dropped_sessions), 0) as total_dropped_sessions,
  COALESCE(AVG(u.avg_session_latency_ms), 0) as avg_latency_ms,

  -- Count recent negative events
  (SELECT COUNT(*) FROM network_experience_events e
   WHERE e.subscriber_id = s.subscriber_id
   AND e.event_ts > NOW(6) - INTERVAL 7 DAY) as event_count_7d,

  -- Composite experience score (0-100, higher is better)
  GREATEST(0, LEAST(100,
    COALESCE(AVG(u.qos_score), 75) * 0.6 +
    (100 - LEAST(100, COALESCE(SUM(u.dropped_sessions) * 10, 0))) * 0.2 +
    (100 - LEAST(100, COALESCE(AVG(u.avg_session_latency_ms) / 10, 0))) * 0.2
  )) as experience_score

FROM subscriber_master s
LEFT JOIN subscriber_usage_summary u ON (
  s.subscriber_id = u.subscriber_id
  AND u.event_ts > NOW(6) - INTERVAL 7 DAY
)
GROUP BY s.subscriber_id, s.account_id, s.line_type, s.home_market_id,
         s.churn_risk_band, s.monthly_revenue;

CREATE VIEW IF NOT EXISTS market_degradation_summary AS
SELECT
  m.market_id,
  m.market_name,
  m.region_name,

  -- Count recent severe events
  COUNT(DISTINCT CASE WHEN e.severity IN ('major', 'critical') THEN e.event_id END) as severe_events_24h,
  COUNT(DISTINCT e.subscriber_id) as impacted_subscribers_24h,

  -- Average experience in market
  AVG(ses.experience_score) as avg_experience_score,

  -- Care pressure
  (SELECT COUNT(*) FROM care_cases c
   JOIN subscriber_master sm ON c.subscriber_id = sm.subscriber_id
   WHERE sm.home_market_id = m.market_id
   AND c.opened_ts > NOW(6) - INTERVAL 24 HOUR) as care_cases_24h,

  -- Market degradation index (0-100, higher is worse)
  LEAST(100,
    COUNT(DISTINCT CASE WHEN e.severity IN ('major', 'critical') THEN e.event_id END) * 2 +
    (100 - COALESCE(AVG(ses.experience_score), 75))
  ) as degradation_index

FROM market_reference m
LEFT JOIN network_experience_events e ON (
  m.market_id = e.market_id
  AND e.event_ts > NOW(6) - INTERVAL 24 HOUR
)
LEFT JOIN subscriber_experience_scores ses ON m.market_id = ses.home_market_id
GROUP BY m.market_id, m.market_name, m.region_name;

CREATE VIEW IF NOT EXISTS at_risk_high_value_subscribers AS
SELECT
  s.subscriber_id,
  s.account_id,
  s.line_type,
  s.monthly_revenue,
  s.home_market_id,
  m.market_name,
  s.churn_risk_band,
  ses.experience_score,

  -- Count interventions
  (SELECT COUNT(*) FROM retention_actions ra
   WHERE ra.subscriber_id = s.subscriber_id
   AND ra.action_ts > NOW(6) - INTERVAL 30 DAY) as interventions_30d,

  (SELECT COUNT(*) FROM retention_actions ra
   WHERE ra.subscriber_id = s.subscriber_id
   AND ra.action_ts > NOW(6) - INTERVAL 30 DAY
   AND ra.conversion_flag = TRUE) as successful_interventions_30d,

  -- Recent care interactions
  (SELECT COUNT(*) FROM care_cases cc
   WHERE cc.subscriber_id = s.subscriber_id
   AND cc.opened_ts > NOW(6) - INTERVAL 30 DAY) as care_cases_30d

FROM subscriber_master s
JOIN market_reference m ON s.home_market_id = m.market_id
LEFT JOIN subscriber_experience_scores ses ON s.subscriber_id = ses.subscriber_id
WHERE
  s.churn_risk_band IN ('high', 'critical')
  AND s.monthly_revenue >= 50 -- high-value threshold
  AND ses.experience_score < 60; -- poor experience

CREATE VIEW IF NOT EXISTS intervention_effectiveness AS
SELECT
  ra.action_type,
  ra.channel,
  ra.reason_code,
  sm.line_type,
  sm.churn_risk_band,

  COUNT(*) as total_actions,
  SUM(CASE WHEN ra.accepted_flag THEN 1 ELSE 0 END) as accepted_count,
  SUM(CASE WHEN ra.conversion_flag THEN 1 ELSE 0 END) as converted_count,

  (SUM(CASE WHEN ra.accepted_flag THEN 1 ELSE 0 END) * 100.0 / NULLIF(COUNT(*), 0)) as acceptance_rate,
  (SUM(CASE WHEN ra.conversion_flag THEN 1 ELSE 0 END) * 100.0 / NULLIF(COUNT(*), 0)) as conversion_rate,

  AVG(ra.revenue_impact) as avg_revenue_impact,
  SUM(ra.revenue_impact) as total_revenue_impact

FROM retention_actions ra
JOIN subscriber_master sm ON ra.subscriber_id = sm.subscriber_id
WHERE ra.action_ts > NOW(6) - INTERVAL 90 DAY
GROUP BY ra.action_type, ra.channel, ra.reason_code, sm.line_type, sm.churn_risk_band;
