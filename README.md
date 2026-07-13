# Telco Subscriber Experience Command Center

Real-time subscriber experience monitoring and churn prevention for communications service providers. Built on SingleStore with Aura Analyst integration.

## Quick Start

### Prerequisites
- SingleStore cluster (local or cloud)
- Go 1.21+ (for simulator)
- MySQL client

### Setup Database

```bash
# Create database
mysql -u root -h <host> -p -e "CREATE DATABASE telco"

# Load schema
mysql -u root -h <host> -p telco < sql/schema.sql
mysql -u root -h <host> -p telco < sql/procedures.sql
mysql -u root -h <host> -p telco < sql/seed.sql
```

### Run Simulator

```bash
cd cmd/simulator
go mod download
go run main.go -dsn "root:password@tcp(localhost:3306)/telco" -subscribers 1000 -tick 5s
```

### Run Web UI

```bash
cd web
npm install
npm run dev
```

Open http://localhost:3000 and connect to your SingleStore database.

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
