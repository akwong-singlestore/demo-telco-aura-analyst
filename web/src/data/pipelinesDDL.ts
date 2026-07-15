// S3 Pipeline definitions for Telco demo
// Points to public S3 bucket with pre-generated demo data

export const pipelinesDDL = [
  {
    name: "network_events_pipeline",
    sql: `CREATE PIPELINE IF NOT EXISTS network_events_pipeline
AS LOAD DATA S3 's2-telco-aura-demo/v1/1k-2p/network_events.*'
CONFIG '{"region": "us-east-1"}'
FORMAT PARQUET
INTO PROCEDURE process_network_events;`
  },
  {
    name: "usage_summary_pipeline",
    sql: `CREATE PIPELINE IF NOT EXISTS usage_summary_pipeline
AS LOAD DATA S3 's2-telco-aura-demo/v1/1k-2p/usage_summary.*'
CONFIG '{"region": "us-east-1"}'
FORMAT PARQUET
INTO PROCEDURE process_usage_summary;`
  },
  {
    name: "care_cases_pipeline",
    sql: `CREATE PIPELINE IF NOT EXISTS care_cases_pipeline
AS LOAD DATA S3 's2-telco-aura-demo/v1/1k-2p/care_cases.*'
CONFIG '{"region": "us-east-1"}'
FORMAT PARQUET
INTO PROCEDURE process_care_cases;`
  },
  {
    name: "retention_actions_pipeline",
    sql: `CREATE PIPELINE IF NOT EXISTS retention_actions_pipeline
AS LOAD DATA S3 's2-telco-aura-demo/v1/1k-2p/retention_actions.*'
CONFIG '{"region": "us-east-1"}'
FORMAT PARQUET
INTO PROCEDURE process_retention_actions;`
  }
];

export const startPipelines = [
  "START PIPELINE network_events_pipeline;",
  "START PIPELINE usage_summary_pipeline;",
  "START PIPELINE care_cases_pipeline;",
  "START PIPELINE retention_actions_pipeline;"
];
