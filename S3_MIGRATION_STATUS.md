# S3 Migration Status

## Goal
Convert simulator from direct DB inserts → Parquet → S3 → SingleStore Pipelines

## Completed
✅ Created S3 bucket: `s2-telco-aura-demo`  
✅ Created `/output` package structure  
✅ Created `/cmd/simulator-s3` entrypoint  
✅ Added Parquet dependencies to go.mod  

## In Progress
⏳ Fixing Parquet writer (output/parquet.go) - had API compatibility issues with xitongsys/parquet-go-source

## Next Steps

### 1. Fix Parquet Writer
The `output/parquet.go` file needs to be rewritten to use local filesystem:
- Use `github.com/xitongsys/parquet-go-source/local` for file writing
- Generate files to `/tmp/telco-data/v1/1k-2p/`
- Then upload to S3 manually

### 2. Test Local Generation
```bash
go run cmd/simulator-s3/main.go -iterations=10 -subscribers=1000
# Should generate files in /tmp/telco-data/v1/1k-2p/
ls -lh /tmp/telco-data/v1/1k-2p/
```

### 3. Upload to S3
```bash
aws s3 sync /tmp/telco-data/ s3://s2-telco-aura-demo/
```

### 4. Create SingleStore Pipelines
Create pipelines similar to RTDM:
```sql
CREATE PIPELINE network_events
AS LOAD DATA S3 's2-telco-aura-demo/v1/1k-2p/network_events.*'
CREDENTIALS '{"aws_access_key_id": "...", "aws_secret_access_key": "..."}'
INTO PROCEDURE process_network_events
FORMAT PARQUET;

START PIPELINE network_events;
```

### 5. Create Stored Procedures
Need to create procedures that match RTDM pattern:
- `process_network_events()` - inserts into `network_experience_events`
- `process_usage_summary()` - inserts into `subscriber_usage_summary`
- `process_care_cases()` - inserts into `care_cases`
- `process_retention_actions()` - inserts into `retention_actions`

## Reference
- RTDM bucket: `s3://singlestore-realtime-digital-marketing/v2/100k-4p/`
- RTDM pattern: `{table}.{date}.{timestamp}.{iteration}.{partition}.parquet`
- Our pattern: `{table}.{timestamp}.{partition}.parquet`

## Benefits of S3 Pattern
1. No multi-aggregate sync issues
2. Replayable data (generate once, use many times)
3. Production-ready architecture
4. Decoupled simulator from database
5. Scalable (multiple simulators can write to S3)
