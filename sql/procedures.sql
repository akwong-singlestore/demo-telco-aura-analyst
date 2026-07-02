-- Stored procedures for Telco Subscriber Experience Command Center
-- Based on RTDM patterns

DELIMITER //

-- Process incoming network experience events
CREATE OR REPLACE PROCEDURE process_network_events (
  _batch QUERY(
    subscriber_id BIGINT NOT NULL,
    cell_site_id BIGINT NOT NULL,
    technology_type TEXT NOT NULL,
    event_type TEXT NOT NULL,
    severity TEXT NOT NULL,
    duration_seconds INT,
    impacted_service TEXT
  )
) AS
BEGIN
  INSERT INTO network_experience_events (
    event_ts,
    subscriber_id,
    cell_site_id,
    market_id,
    region_name,
    technology_type,
    event_type,
    severity,
    duration_seconds,
    impacted_service,
    resolved_flag
  )
  SELECT
    NOW(6) as event_ts,
    b.subscriber_id,
    b.cell_site_id,
    cs.market_id,
    m.region_name,
    b.technology_type,
    b.event_type,
    b.severity,
    b.duration_seconds,
    b.impacted_service,
    FALSE as resolved_flag
  FROM _batch b
  JOIN cell_sites cs ON b.cell_site_id = cs.cell_site_id
  JOIN market_reference m ON cs.market_id = m.market_id;
END //

-- Process incoming usage summary updates
CREATE OR REPLACE PROCEDURE process_usage_summary (
  _batch QUERY(
    subscriber_id BIGINT NOT NULL,
    cell_site_id BIGINT NOT NULL,
    session_count INT NOT NULL,
    data_mb DECIMAL(12,2) NOT NULL,
    voice_minutes DECIMAL(10,2) NOT NULL,
    dropped_sessions INT NOT NULL,
    avg_session_latency_ms INT,
    qos_score DECIMAL(5,2)
  )
) AS
BEGIN
  INSERT INTO subscriber_usage_summary (
    subscriber_id,
    event_ts,
    market_id,
    cell_site_id,
    session_count,
    data_mb,
    voice_minutes,
    dropped_sessions,
    avg_session_latency_ms,
    qos_score
  )
  SELECT
    b.subscriber_id,
    NOW(6) as event_ts,
    cs.market_id,
    b.cell_site_id,
    b.session_count,
    b.data_mb,
    b.voice_minutes,
    b.dropped_sessions,
    b.avg_session_latency_ms,
    b.qos_score
  FROM _batch b
  JOIN cell_sites cs ON b.cell_site_id = cs.cell_site_id;
END //

-- Process care case creation
CREATE OR REPLACE PROCEDURE process_care_cases (
  _batch QUERY(
    subscriber_id BIGINT NOT NULL,
    channel TEXT NOT NULL,
    issue_category TEXT NOT NULL,
    related_service_issue_flag BOOLEAN NOT NULL
  )
) AS
BEGIN
  INSERT INTO care_cases (
    subscriber_id,
    opened_ts,
    channel,
    issue_category,
    resolution_code,
    handle_time_seconds,
    escalation_flag,
    csat_score,
    related_service_issue_flag
  )
  SELECT
    b.subscriber_id,
    NOW(6) as opened_ts,
    b.channel,
    b.issue_category,
    NULL as resolution_code,
    NULL as handle_time_seconds,
    FALSE as escalation_flag,
    NULL as csat_score,
    b.related_service_issue_flag
  FROM _batch b;
END //

-- Process retention actions
CREATE OR REPLACE PROCEDURE process_retention_actions (
  _batch QUERY(
    subscriber_id BIGINT NOT NULL,
    action_type TEXT NOT NULL,
    channel TEXT NOT NULL,
    reason_code TEXT NOT NULL,
    accepted_flag BOOLEAN NOT NULL,
    conversion_flag BOOLEAN NOT NULL,
    revenue_impact DECIMAL(10,2)
  )
) AS
BEGIN
  INSERT INTO retention_actions (
    subscriber_id,
    action_ts,
    action_type,
    channel,
    reason_code,
    accepted_flag,
    conversion_flag,
    revenue_impact
  )
  SELECT
    b.subscriber_id,
    NOW(6) as action_ts,
    b.action_type,
    b.channel,
    b.reason_code,
    b.accepted_flag,
    b.conversion_flag,
    b.revenue_impact
  FROM _batch b;
END //

-- Update churn risk scores (periodic batch job)
CREATE OR REPLACE PROCEDURE update_churn_risk_scores() AS
DECLARE
  _updated_count INT;
BEGIN
  -- Simplified churn risk scoring based on recent experience and care activity
  UPDATE subscriber_master sm
  SET churn_risk_band = CASE
    WHEN (
      -- Recent severe events
      (SELECT COUNT(*) FROM network_experience_events e
       WHERE e.subscriber_id = sm.subscriber_id
       AND e.event_ts > NOW(6) - INTERVAL 7 DAY
       AND e.severity IN ('major', 'critical')) >= 3
      OR
      -- Multiple care cases
      (SELECT COUNT(*) FROM care_cases c
       WHERE c.subscriber_id = sm.subscriber_id
       AND c.opened_ts > NOW(6) - INTERVAL 30 DAY) >= 3
      OR
      -- Poor recent experience score
      (SELECT AVG(qos_score) FROM subscriber_usage_summary u
       WHERE u.subscriber_id = sm.subscriber_id
       AND u.event_ts > NOW(6) - INTERVAL 7 DAY) < 40
    ) THEN 'critical'

    WHEN (
      (SELECT COUNT(*) FROM network_experience_events e
       WHERE e.subscriber_id = sm.subscriber_id
       AND e.event_ts > NOW(6) - INTERVAL 14 DAY
       AND e.severity IN ('major', 'critical')) >= 2
      OR
      (SELECT COUNT(*) FROM care_cases c
       WHERE c.subscriber_id = sm.subscriber_id
       AND c.opened_ts > NOW(6) - INTERVAL 30 DAY) >= 2
      OR
      (SELECT AVG(qos_score) FROM subscriber_usage_summary u
       WHERE u.subscriber_id = sm.subscriber_id
       AND u.event_ts > NOW(6) - INTERVAL 14 DAY) < 50
    ) THEN 'high'

    WHEN (
      (SELECT COUNT(*) FROM network_experience_events e
       WHERE e.subscriber_id = sm.subscriber_id
       AND e.event_ts > NOW(6) - INTERVAL 30 DAY) >= 1
      OR
      (SELECT COUNT(*) FROM care_cases c
       WHERE c.subscriber_id = sm.subscriber_id
       AND c.opened_ts > NOW(6) - INTERVAL 60 DAY) >= 1
    ) THEN 'medium'

    ELSE 'low'
  END
  WHERE sm.subscriber_id IN (
    -- Only update subscribers with recent activity
    SELECT DISTINCT subscriber_id FROM (
      SELECT subscriber_id FROM network_experience_events
      WHERE event_ts > NOW(6) - INTERVAL 30 DAY
      UNION
      SELECT subscriber_id FROM care_cases
      WHERE opened_ts > NOW(6) - INTERVAL 60 DAY
      UNION
      SELECT subscriber_id FROM subscriber_usage_summary
      WHERE event_ts > NOW(6) - INTERVAL 7 DAY
    ) as active_subs
  );

  _updated_count = ROW_COUNT();

  ECHO SELECT _updated_count as subscribers_updated;
END //

-- Generate retention actions for at-risk subscribers (automated intervention trigger)
CREATE OR REPLACE PROCEDURE trigger_retention_actions(
  _limit INT DEFAULT 100
) AS
DECLARE
  _actions_created INT;
BEGIN
  -- Identify at-risk subscribers who haven't received recent interventions
  INSERT INTO retention_actions (
    subscriber_id,
    action_ts,
    action_type,
    channel,
    reason_code,
    accepted_flag,
    conversion_flag,
    revenue_impact
  )
  SELECT
    ars.subscriber_id,
    NOW(6) as action_ts,
    CASE
      WHEN ars.monthly_revenue >= 100 THEN 'plan_upgrade'
      WHEN ars.line_type = 'prepaid' THEN 'loyalty_credit'
      ELSE 'discount_offer'
    END as action_type,
    'outbound_call' as channel,
    'churn_risk' as reason_code,
    (RAND() < 0.35) as accepted_flag, -- 35% acceptance rate
    (RAND() < 0.25) as conversion_flag, -- 25% conversion rate
    CASE
      WHEN RAND() < 0.35 THEN -15.00 -- discount
      ELSE -10.00 -- smaller credit
    END as revenue_impact
  FROM at_risk_high_value_subscribers ars
  WHERE NOT EXISTS (
    -- No recent interventions
    SELECT 1 FROM retention_actions ra
    WHERE ra.subscriber_id = ars.subscriber_id
    AND ra.action_ts > NOW(6) - INTERVAL 30 DAY
  )
  LIMIT _limit;

  _actions_created = ROW_COUNT();

  ECHO SELECT _actions_created as actions_created;
END //

-- Resolve network events (simulated resolution)
CREATE OR REPLACE PROCEDURE resolve_network_events(
  _max_age_minutes INT DEFAULT 60
) AS
DECLARE
  _resolved_count INT;
BEGIN
  UPDATE network_experience_events
  SET resolved_flag = TRUE
  WHERE
    resolved_flag = FALSE
    AND event_ts < NOW(6) - INTERVAL _max_age_minutes MINUTE
    AND RAND() < 0.8; -- 80% get resolved automatically

  _resolved_count = ROW_COUNT();

  ECHO SELECT _resolved_count as events_resolved;
END //

-- Close care cases (simulated resolution)
CREATE OR REPLACE PROCEDURE close_care_cases(
  _max_age_minutes INT DEFAULT 120
) AS
DECLARE
  _closed_count INT;
BEGIN
  UPDATE care_cases
  SET
    closed_ts = NOW(6),
    resolution_code = CASE FLOOR(RAND() * 4)
      WHEN 0 THEN 'resolved_service_issue'
      WHEN 1 THEN 'provided_troubleshooting'
      WHEN 2 THEN 'escalated_to_technical'
      ELSE 'account_adjustment'
    END,
    handle_time_seconds = FLOOR(300 + RAND() * 1800), -- 5-35 minutes
    csat_score = CASE
      WHEN RAND() < 0.15 THEN 1
      WHEN RAND() < 0.30 THEN 2
      WHEN RAND() < 0.50 THEN 3
      WHEN RAND() < 0.75 THEN 4
      ELSE 5
    END
  WHERE
    closed_ts IS NULL
    AND opened_ts < NOW(6) - INTERVAL _max_age_minutes MINUTE
    AND RAND() < 0.7; -- 70% get closed

  _closed_count = ROW_COUNT();

  ECHO SELECT _closed_count as cases_closed;
END //

DELIMITER ;
