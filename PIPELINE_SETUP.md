# Setting Up S3 Pipelines for Telco Demo

This demo uses the **S3 → SingleStore Pipelines** pattern for data ingestion, following the same architecture as the RTDM demo.

## Architecture

```
Simulator → Parquet Files → S3 Bucket → SingleStore Pipelines → Database
```

## Quick Start

### 1. Generate Data (Already Done!)

Data has been pre-generated and uploaded to `s3://s2-telco-aura-demo/v1/1k-2p/`:
- 10 network_events files
- 10 usage_summary files  
- 10 care_cases files
- 9 retention_actions files

### 2. Set Up Your Database

```sql
-- Create database
CREATE DATABASE IF NOT EXISTS telco;
USE telco;

-- Run schema setup (in order)
SOURCE schema.sql;
SOURCE seed.sql;
SOURCE procedures.sql;
```

### 3. Create Pipelines with Your AWS Credentials

Replace `YOUR_ACCESS_KEY_ID` and `YOUR_SECRET_KEY` with your AWS credentials:

```sql
-- Network Events Pipeline
CREATE OR REPLACE PIPELINE network_events_pipeline
AS LOAD DATA S3 's2-telco-aura-demo/v1/1k-2p/network_events.*'
CONFIG '{"region": "us-east-1"}'
CREDENTIALS '{"aws_access_key_id": "YOUR_ACCESS_KEY_ID", "aws_secret_access_key": "YOUR_SECRET_KEY"}'
INTO PROCEDURE process_network_events
FORMAT PARQUET;

-- Usage Summary Pipeline
CREATE OR REPLACE PIPELINE usage_summary_pipeline
AS LOAD DATA S3 's2-telco-aura-demo/v1/1k-2p/usage_summary.*'
CONFIG '{"region": "us-east-1"}'
CREDENTIALS '{"aws_access_key_id": "YOUR_ACCESS_KEY_ID", "aws_secret_access_key": "YOUR_SECRET_KEY"}'
INTO PROCEDURE process_usage_summary
FORMAT PARQUET;

-- Care Cases Pipeline  
CREATE OR REPLACE PIPELINE care_cases_pipeline
AS LOAD DATA S3 's2-telco-aura-demo/v1/1k-2p/care_cases.*'
CONFIG '{"region": "us-east-1"}'
CREDENTIALS '{"aws_access_key_id": "YOUR_ACCESS_KEY_ID", "aws_secret_access_key": "YOUR_SECRET_KEY"}'
INTO PROCEDURE process_care_cases
FORMAT PARQUET;

-- Retention Actions Pipeline
CREATE OR REPLACE PIPELINE retention_actions_pipeline
AS LOAD DATA S3 's2-telco-aura-demo/v1/1k-2p/retention_actions.*'
CONFIG '{"region": "us-east-1"}'
CREDENTIALS '{"aws_access_key_id": "YOUR_ACCESS_KEY_ID", "aws_secret_access_key": "YOUR_SECRET_KEY"}'
INTO PROCEDURE process_retention_actions
FORMAT PARQUET;
```

### 4. Start the Pipelines

```sql
START PIPELINE network_events_pipeline;
START PIPELINE usage_summary_pipeline;
START PIPELINE care_cases_pipeline;
START PIPELINE retention_actions_pipeline;
```

### 5. Verify Data is Loading

```sql
-- Check pipeline status
SELECT * FROM information_schema.PIPELINES 
WHERE database_name = 'telco';

-- Check loaded data
SELECT COUNT(*) FROM network_experience_events;
SELECT COUNT(*) FROM subscriber_usage_summary;
SELECT COUNT(*) FROM care_cases;
SELECT COUNT(*) FROM retention_actions;

-- View recent network events
SELECT * FROM network_experience_events 
ORDER BY event_ts DESC LIMIT 10;
```

## Generating New Data

To generate fresh data with different scenarios:

```bash
# Generate to local directory
go run cmd/simulator-s3/main.go -iterations=10 -subscribers=1000

# Upload to S3
aws s3 sync /tmp/telco-data/ s3://s2-telco-aura-demo/

# Pipelines will automatically pick up new files
```

## Benefits of S3 Pipeline Pattern

✅ **No multi-aggregate sync issues** - No direct database connections  
✅ **Replayable** - Generate once, ingest many times  
✅ **Scalable** - Run multiple simulators in parallel  
✅ **Production-ready** - Industry standard architecture  
✅ **Decoupled** - Simulator can run independently  

## Troubleshooting

**Pipeline not loading data?**
```sql
-- Check for errors
SELECT * FROM information_schema.PIPELINES_ERRORS 
WHERE pipeline_name LIKE '%telco%';

-- Test pipeline
TEST PIPELINE network_events_pipeline LIMIT 1;
```

**Access denied errors?**
- Verify AWS credentials are correct
- Check S3 bucket permissions
- Ensure bucket is in us-east-1 region

**No data appearing?**
```sql
-- Verify procedures exist
SHOW PROCEDURE STATUS WHERE Db = 'telco';

-- Check if files are in S3
-- aws s3 ls s3://s2-telco-aura-demo/v1/1k-2p/
```

## Next Steps

1. **View Dashboard**: https://akwong-singlestore.github.io/demo-telco-aura-analyst/
2. **Connect** to your SingleStore database
3. **Watch** real-time data flow through pipelines
4. **Query** with Aura Analyst AI
