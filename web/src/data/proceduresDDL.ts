// Stored procedures for Telco demo
// Embedded as TypeScript to avoid complex SQL parsing

export const proceduresDDL = [
  {
    name: "process_network_events",
    sql: `CREATE OR REPLACE PROCEDURE process_network_events (
  _batch QUERY(
    subscriber_id BIGINT NOT NULL,
    cell_site_id BIGINT NOT NULL,
    market_id BIGINT NOT NULL,
    region_name TEXT NOT NULL,
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
    b.market_id,
    b.region_name,
    b.technology_type,
    b.event_type,
    b.severity,
    b.duration_seconds,
    b.impacted_service,
    FALSE as resolved_flag
  FROM _batch b;
END;`
  },
  {
    name: "process_usage_summary",
    sql: `CREATE OR REPLACE PROCEDURE process_usage_summary (
  _batch QUERY(
    subscriber_id BIGINT NOT NULL,
    cell_site_id BIGINT NOT NULL,
    market_id BIGINT NOT NULL,
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
    b.market_id,
    b.cell_site_id,
    b.session_count,
    b.data_mb,
    b.voice_minutes,
    b.dropped_sessions,
    b.avg_session_latency_ms,
    b.qos_score
  FROM _batch b;
END;`
  },
  {
    name: "process_care_cases",
    sql: `CREATE OR REPLACE PROCEDURE process_care_cases (
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
END;`
  },
  {
    name: "process_retention_actions",
    sql: `CREATE OR REPLACE PROCEDURE process_retention_actions (
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
END;`
  }
];
