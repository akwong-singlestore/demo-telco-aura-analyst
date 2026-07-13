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
END;


