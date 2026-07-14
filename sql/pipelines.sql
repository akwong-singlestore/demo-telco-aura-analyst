-- SingleStore Pipelines for Telco Subscriber Experience Demo
-- These pipelines continuously ingest Parquet data from S3

-- Note: Replace ${AWS_ACCESS_KEY_ID} and ${AWS_SECRET_ACCESS_KEY} with your actual credentials
-- Or use IAM role-based authentication for production

-- Pipeline for network experience events
CREATE OR REPLACE PIPELINE network_events_pipeline
AS LOAD DATA S3 's2-telco-aura-demo/v1/1k-2p/network_events.*'
CONFIG '{"region": "us-east-1"}'
CREDENTIALS '{"aws_access_key_id": "${AWS_ACCESS_KEY_ID}", "aws_secret_access_key": "${AWS_SECRET_ACCESS_KEY}"}'
INTO PROCEDURE process_network_events
FORMAT PARQUET (
  subscriber_id <- subscriber_id,
  cell_site_id <- cell_site_id,
  market_id <- market_id,
  region_name <- region_name,
  technology_type <- technology_type,
  event_type <- event_type,
  severity <- severity,
  duration_seconds <- duration_seconds,
  impacted_service <- impacted_service
);

-- Pipeline for usage summaries
CREATE OR REPLACE PIPELINE usage_summary_pipeline
AS LOAD DATA S3 's2-telco-aura-demo/v1/1k-2p/usage_summary.*'
CONFIG '{"region": "us-east-1"}'
CREDENTIALS '{"aws_access_key_id": "${AWS_ACCESS_KEY_ID}", "aws_secret_access_key": "${AWS_SECRET_ACCESS_KEY}"}'
INTO PROCEDURE process_usage_summary
FORMAT PARQUET (
  subscriber_id <- subscriber_id,
  cell_site_id <- cell_site_id,
  market_id <- market_id,
  session_count <- session_count,
  data_mb <- data_mb,
  voice_minutes <- voice_minutes,
  dropped_sessions <- dropped_sessions,
  avg_session_latency_ms <- avg_session_latency_ms,
  qos_score <- qos_score
);

-- Pipeline for care cases
CREATE OR REPLACE PIPELINE care_cases_pipeline
AS LOAD DATA S3 's2-telco-aura-demo/v1/1k-2p/care_cases.*'
CONFIG '{"region": "us-east-1"}'
CREDENTIALS '{"aws_access_key_id": "${AWS_ACCESS_KEY_ID}", "aws_secret_access_key": "${AWS_SECRET_ACCESS_KEY}"}'
INTO PROCEDURE process_care_cases
FORMAT PARQUET (
  subscriber_id <- subscriber_id,
  channel <- channel,
  issue_category <- issue_category,
  escalation_flag <- escalation_flag,
  related_service_issue_flag <- related_service_issue_flag
);

-- Pipeline for retention actions
CREATE OR REPLACE PIPELINE retention_actions_pipeline
AS LOAD DATA S3 's2-telco-aura-demo/v1/1k-2p/retention_actions.*'
CONFIG '{"region": "us-east-1"}'
CREDENTIALS '{"aws_access_key_id": "${AWS_ACCESS_KEY_ID}", "aws_secret_access_key": "${AWS_SECRET_ACCESS_KEY}"}'
INTO PROCEDURE process_retention_actions
FORMAT PARQUET (
  subscriber_id <- subscriber_id,
  action_type <- action_type,
  channel <- channel,
  reason_code <- reason_code,
  accepted_flag <- accepted_flag,
  conversion_flag <- conversion_flag,
  revenue_impact <- revenue_impact
);

-- Start all pipelines
START PIPELINE network_events_pipeline;
START PIPELINE usage_summary_pipeline;
START PIPELINE care_cases_pipeline;
START PIPELINE retention_actions_pipeline;
