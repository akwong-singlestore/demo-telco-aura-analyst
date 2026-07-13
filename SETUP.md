# Telco Subscriber Experience Command Center - Setup Guide

Complete setup instructions for the telco demo MVP.

## Prerequisites

- **SingleStore**: Managed Service cluster or local Docker instance
- **Go 1.21+**: For running the simulator
- **Node.js 16+**: For the web UI
- **MySQL client**: For loading schema

## Step 1: Database Setup (5 minutes)

### Create Database

```bash
mysql -u root -h <your-host> -p -e "CREATE DATABASE IF NOT EXISTS telco"
```

### Load Schema

```bash
# Core tables and views
mysql -u root -h <your-host> -p telco < sql/schema.sql

# Stored procedures for data processing
mysql -u root -h <your-host> -p telco < sql/procedures.sql

# Seed reference data (markets, cell sites, subscribers)
mysql -u root -h <your-host> -p telco < sql/seed.sql
```

### Verify Setup

```sql
-- Check tables
SHOW TABLES;

-- Should see:
-- subscriber_master, subscriber_usage_summary, network_experience_events
-- care_cases, retention_actions, market_reference, cell_sites
-- enterprise_accounts, enterprise_sla_events

-- Check seed data
SELECT COUNT(*) FROM market_reference;  -- Should be ~18 markets
SELECT COUNT(*) FROM cell_sites;  -- Should be ~30+ sites
SELECT COUNT(*) FROM subscriber_master;  -- Should be ~50,000 subscribers

-- Check views
SELECT * FROM market_degradation_summary LIMIT 5;
SELECT * FROM subscriber_experience_scores LIMIT 5;
```

## Step 2: Start Simulator (2 minutes)

The simulator generates causal event streams that create believable telco scenarios.

```bash
cd cmd/simulator

# Install Go dependencies
go mod download

# Run simulator
go run main.go \
  -dsn "root:password@tcp(your-host:3306)/telco" \
  -subscribers 1000 \
  -tick 5s
```

**Simulator Parameters:**
- `-dsn`: Database connection string
- `-subscribers`: How many subscribers to include in each tick (default 1000)
- `-tick`: How often to generate events (default 5s)

**What it does:**
- Randomly activates scenarios (Phoenix congestion, device issues, regional outages)
- Generates network_experience_events based on active scenarios
- Creates subscriber_usage_summary records
- Triggers care_cases when service quality degrades
- Executes retention_actions for at-risk subscribers
- Logs scenario transitions to stdout

**Expected output:**
```
Starting telco simulator
Loaded 18 markets, 34 cell sites, 50000 subscribers
Scenario: Phoenix Congestion activated
Tick: Generated 47 events, 22 care cases, 8 retention actions
```

Let it run for 5-10 minutes to populate data before opening the UI.

## Step 3: Web UI Setup (3 minutes)

### Install Dependencies

```bash
cd web
npm install
```

### Start Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

### First-Time Configuration

1. Go to home page → "Connect to SingleStoreDB"
2. Enter connection details:
   - **Host**: `http://your-host` or `http://127.0.0.1:9000` for local
   - **User**: `root` (or your user)
   - **Password**: Your password
   - **Database**: `telco`
3. Click "Connect"

You'll be redirected to `/dashboard` showing live metrics.

## Step 4: Aura Analyst Integration (Optional, 5 minutes)

### Configure Aura Analyst

1. Go to `/configure`
2. Scroll to "Aura Analyst" section
3. Enter:
   - **API Key**: Your Aura Analyst API key
   - **Endpoint URL**: `https://your-analyst-endpoint`
4. Click "Save Configuration"

### Test Aura Integration

1. Go back to `/dashboard`
2. Click the blue chat icon in bottom-right
3. Try a demo prompt:
   - "Which markets have the highest degradation today?"
   - "Show me high-value subscribers who need intervention"

You should see:
- Reasoning steps (collapsible)
- SQL queries executed
- Formatted results with tables/charts
- Follow-up question suggestions

## Step 5: Verify End-to-End (2 minutes)

### Check Live Data Flow

Open dashboard and verify:
- **KPI cards** show non-zero values
- **Market table** has degradation scores
- **At-risk subscribers table** shows entries
- **Intervention performance** table has data

### Test Refresh

Data refreshes automatically:
- KPIs: every 10 seconds
- Market health: every 5 seconds
- Tables: every 10-15 seconds

Watch for updates (numbers should change slightly).

### Check Simulator Logs

Simulator should log:
```
Scenario: Samsung Device Issue activated
Tick: Generated 89 events, 45 care cases, 12 retention actions
```

Scenarios rotate every 5-15 minutes.

## Troubleshooting

### No data in dashboard

**Problem**: All zeros or "No data"
**Solution**:
- Verify simulator is running
- Check simulator logs for errors
- Query database directly: `SELECT COUNT(*) FROM network_experience_events`
- If zero, simulator may have connection issues

### Simulator crashes

**Problem**: "panic: connection refused"
**Solution**:
- Verify database is accessible: `mysql -u root -h <host> -p`
- Check DSN format: `user:pass@tcp(host:port)/database`
- For Managed Service, use correct port (usually 3306 or 3307)

### Can't connect to database in UI

**Problem**: "Connection failed" error
**Solution**:
- Check if host starts with `http://` or `https://`
- For Managed Service, use workspace HTTP endpoint
- Verify user has SELECT permissions on telco database
- Check browser console for CORS errors

### Aura Analyst not responding

**Problem**: Spinning forever or errors
**Solution**:
- Verify API key is correct
- Check endpoint URL format
- Look at browser Network tab for 401/403 errors
- Ensure endpoint has access to SingleStore database

### Views return empty results

**Problem**: `SELECT * FROM market_degradation_summary` returns no rows
**Solution**:
- Views need underlying data first
- Run simulator for 5+ minutes to generate events
- Check that NOW(6) function works (SingleStore feature)
- Try: `SELECT NOW(6), NOW(6) - INTERVAL 24 HOUR;`

## Production Deployment

### Build Web UI

```bash
cd web
npm run build
```

Output in `web/dist/` - serve with any static host.

### Run Simulator as Service

Use systemd, Docker, or supervisor to keep simulator running:

```bash
# Docker example
docker run -d --name telco-simulator \
  -e DSN="user:pass@tcp(db:3306)/telco" \
  your-go-image
```

### Database Considerations

- **Pipelines**: `sql/pipelines.sql` defines S3 ingestion (currently unused)
- **Archival**: No automatic cleanup - events accumulate
- **Retention**: Consider partitioning time-series tables by month
- **Scaling**: Increase `-subscribers` parameter for more load

## Next Steps

### Demo Preparation
1. Let simulator run for 10+ minutes
2. Open `DEMO_PROMPTS.md` for tested questions
3. Practice 2-3 Aura prompts
4. Note which scenario is currently active

### Customization
1. Add markets: Insert into `market_reference` table
2. Adjust scenarios: Edit `gen/scenarios.go`
3. Change KPIs: Modify `web/src/pages/Executive.tsx`
4. Add pages: Create new route in `App.tsx`

### Advanced Setup
- Configure S3 pipelines for production data ingestion
- Set up real-time alerting on degradation_index
- Integrate with actual telemetry systems
- Add authentication/RBAC for multi-user access

## Known Limitations (MVP)

- No user authentication (connect with root)
- Scenarios are random (not time-based)
- No historical archival strategy
- Churn risk scoring is simplified (not ML-based)
- Enterprise SLA tracking incomplete
- No geo-visualization (markets are point data only)

These are acceptable for demo purposes. Production deployment would need additional hardening.

## Support

Issues or questions:
- Check `IMPLEMENTATION.md` for architecture details
- Review `DEMO_PROMPTS.md` for working Aura queries
- See main `README.md` for feature overview
