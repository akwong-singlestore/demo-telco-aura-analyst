-- Pipelines for Telco Subscriber Experience Command Center
-- Pattern based on RTDM but adapted for telco data streams

-- Note: These pipelines expect data to be available in S3 or similar
-- For MVP, we'll use local JSON ingestion via simulator

CREATE OR REPLACE PIPELINE network_events_pipeline
AS LOAD DATA S3 'singlestore-telco-demo/${SCALE_FACTOR}/network_events.*'
CREDENTIALS '{}'
CONFIG '{ "region": "us-east-1" }'
MAX_PARTITIONS_PER_BATCH ${PARTITIONS}
INTO PROCEDURE process_network_events FORMAT JSON (
  subscriber_id <- subscriber_id,
  cell_site_id <- cell_site_id,
  technology_type <- technology_type,
  event_type <- event_type,
  severity <- severity,
  duration_seconds <- duration_seconds,
  impacted_service <- impacted_service
)
SKIP CONSTRAINT ERRORS;

CREATE OR REPLACE PIPELINE usage_summary_pipeline
AS LOAD DATA S3 'singlestore-telco-demo/${SCALE_FACTOR}/usage_summary.*'
CREDENTIALS '{}'
CONFIG '{ "region": "us-east-1" }'
MAX_PARTITIONS_PER_BATCH ${PARTITIONS}
INTO PROCEDURE process_usage_summary FORMAT JSON (
  subscriber_id <- subscriber_id,
  cell_site_id <- cell_site_id,
  session_count <- session_count,
  data_mb <- data_mb,
  voice_minutes <- voice_minutes,
  dropped_sessions <- dropped_sessions,
  avg_session_latency_ms <- avg_session_latency_ms,
  qos_score <- qos_score
)
SKIP CONSTRAINT ERRORS;

CREATE OR REPLACE PIPELINE care_cases_pipeline
AS LOAD DATA S3 'singlestore-telco-demo/${SCALE_FACTOR}/care_cases.*'
CREDENTIALS '{}'
CONFIG '{ "region": "us-east-1" }'
MAX_PARTITIONS_PER_BATCH ${PARTITIONS}
INTO PROCEDURE process_care_cases FORMAT JSON (
  subscriber_id <- subscriber_id,
  channel <- channel,
  issue_category <- issue_category,
  related_service_issue_flag <- related_service_issue_flag
)
SKIP CONSTRAINT ERRORS;

CREATE OR REPLACE PIPELINE retention_actions_pipeline
AS LOAD DATA S3 'singlestore-telco-demo/${SCALE_FACTOR}/retention_actions.*'
CREDENTIALS '{}'
CONFIG '{ "region": "us-east-1" }'
MAX_PARTITIONS_PER_BATCH ${PARTITIONS}
INTO PROCEDURE process_retention_actions FORMAT JSON (
  subscriber_id <- subscriber_id,
  action_type <- action_type,
  channel <- channel,
  reason_code <- reason_code,
  accepted_flag <- accepted_flag,
  conversion_flag <- conversion_flag,
  revenue_impact <- revenue_impact
)
SKIP CONSTRAINT ERRORS;

-- Note: For MVP demo, we'll use simulator to directly insert data
-- rather than S3 pipelines, to keep setup simple
-- These pipeline definitions are included for completeness
