# Telco Subscriber Experience Command Center

Real-time subscriber experience monitoring and churn prevention for communications service providers. Built on SingleStore with Aura Analyst integration.

**🔗 Live Demo:** https://akwong-singlestore.github.io/demo-telco-aura-analyst/

## Quick Start

### Prerequisites
- SingleStore workspace ([create one free](https://portal.singlestore.com))
- MySQL client
- Go 1.21+ (optional, for local simulator)

### 1. Setup Database (Required)

**⚠️ Important:** You must create and populate the database before connecting the web UI.

```bash
# Connect to your SingleStore workspace
mysql -u admin -h <your-workspace-host> -p

# Create and populate the database
CREATE DATABASE telco;
USE telco;
SOURCE sql/schema.sql;
SOURCE sql/seed.sql;
SOURCE sql/procedures.sql;
```

Or use the SingleStore Portal SQL Editor to run the contents of each file.

### 2. Connect Web UI

Visit https://akwong-singlestore.github.io/demo-telco-aura-analyst/ and enter your connection details:

- **Host:** Your SingleStore workspace URL (e.g., `svc-xxxx.aws-virginia-1.svc.singlestore.com`)
- **User:** `admin` (or your username)
- **Password:** Your workspace password
- **Database:** `telco`

### 3. Generate Data (Optional)

The seed data provides static subscribers. For live simulation:

**Option A: S3 Pipeline (Recommended)**
```bash
# Generate Parquet files
go run cmd/simulator-s3/main.go -iterations=10 -subscribers=1000

# Upload to your S3 bucket
aws s3 sync /tmp/telco-data/ s3://your-bucket/

# Create pipelines (see sql/pipelines.sql)
```

**Option B: Direct Insert**
```bash
go run cmd/simulator/main.go -dsn "admin:password@tcp(your-host:3306)/telco"
```

### Local Development

```bash
cd web
npm install
npm run dev
```

Open http://localhost:5173 and connect to your database.

## Architecture

- **Schema**: 7 core tables + 5 analytical views
- **Simulator**: Go-based event generator with causal scenarios
- **Analytics**: Derived metrics for experience scoring, churn risk, market degradation
- **UI**: React/TypeScript dashboard (TODO: port from RTDM)
- **AI**: Aura Analyst integration for conversational analytics

## Key Metrics

- **Subscriber Experience Score**: 0-100 composite of QoS, latency, dropped sessions
- **Churn Risk Band**: low/medium/high/critical based on recent experience
- **Market Degradation Index**: Regional service quality indicator
- **Intervention Effectiveness**: Acceptance and conversion rates for retention actions

## Demo Scenarios

The simulator runs causal scenarios that create believable operational stories:

1. **Phoenix Congestion Spike** - Cell site overload, care pressure, retention actions
2. **Device-Specific Issues** - Samsung or iOS degradation across markets
3. **Regional Outage** - Multi-market service disruption, SLA impacts
4. **Prepaid Churn Wave** - Market-specific prepaid risk event

## Sample Queries

```sql
-- Markets with highest degradation
SELECT * FROM market_degradation_summary ORDER BY degradation_index DESC LIMIT 10;

-- At-risk high-value subscribers
SELECT * FROM at_risk_high_value_subscribers WHERE interventions_30d = 0;

-- Retention effectiveness
SELECT * FROM intervention_effectiveness ORDER BY conversion_rate DESC;
```

## Project Status

**Phase**: MVP Complete (Backend + Frontend)
- ✅ Schema and stored procedures
- ✅ Seed data generation
- ✅ Event simulator with scenarios
- ✅ Web UI with Executive dashboard
- ✅ Aura Analyst integration with telco-specific prompts

See SETUP.md for complete setup instructions.

## License

Apache 2.0 - SingleStore Labs
