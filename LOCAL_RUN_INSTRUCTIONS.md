# Local Run Instructions

## Prerequisites

- SingleStore workspace ([create free](https://portal.singlestore.com))
- Go 1.21+
- Node.js 16+
- MySQL client (optional, for manual queries)

## Step-by-Step Local Verification

### 1. Set up database

Connect to your SingleStore workspace and create the database:

```bash
mysql -u admin -h <your-workspace-host> -p
```

In MySQL prompt:
```sql
CREATE DATABASE IF NOT EXISTS telco;
USE telco;
SOURCE sql/schema.sql;
SOURCE sql/seed.sql;
SOURCE sql/procedures.sql;
```

Or use the web UI to set up automatically (it will run these commands).

### 2. Start the frontend

```bash
cd web
npm install
npm run dev
```

Open http://localhost:5173

**Connect to your database:**
- Host: `svc-xxxx.aws-virginia-1.svc.singlestore.com`
- User: `admin`
- Password: [your password]
- Database: `telco`

Click "Connect" and wait for schema setup to complete (~30 seconds).

### 3. Start the data simulator (demo mode)

In a new terminal:

```bash
# From repo root
go run cmd/simulator/main.go \
  -dsn "admin:YOUR_PASSWORD@tcp(YOUR_HOST:3306)/telco" \
  -demo-mode \
  -seed=12345 \
  -subscribers=1000 \
  -tick=3s
```

**Wait 30-60 seconds** for events to accumulate in the "last 5 minutes" window.

### 4. Verify each acceptance criterion

#### Task 1 — Real-time streaming visible
- [ ] Live badge is pulsing (green dot animates)
- [ ] "Last updated" timestamp advances every ~5 seconds without manual refresh
- [ ] "Events ingested (60s)" counter shows non-zero value and updates
- [ ] Counter shows events/sec rate (e.g., "245 (4.1/sec)")

#### Task 2 — Time-bounded queries
- [ ] Time Window filter includes "Last 5 minutes" and "Last 15 minutes"
- [ ] Select "Last 5 minutes" → dashboard updates with fresh data
- [ ] KPI numbers are different from "Last 2 hours" view

#### Task 3 — No empty/zero data
- [ ] Market Degradation Summary table has no all-zero columns
- [ ] Top At-Risk Segments card shows populated rows (not empty)
- [ ] Churn Risk Trend chart renders with data points
- [ ] No "No data available" placeholders visible

#### Task 4 — Top At-Risk Segments populated
- [ ] Card shows segment names (e.g., "Phoenix postpaid")
- [ ] Shows churn risk % (e.g., "42%") with color badges
- [ ] Shows revenue at risk (e.g., "$12.3K")
- [ ] At least 3-5 rows visible
- [ ] Sorted by revenue (highest at top)

#### Task 5 — Market Degradation visual
- [ ] Horizontal bar chart appears above the table
- [ ] Chart shows top ~10 markets
- [ ] Bars are color-coded (green/orange/red)
- [ ] Chart updates when filters change
- [ ] Table scrolls below chart (not full-height)

#### Task 6 — Degradation Index defined
- [ ] Hover over "Degradation Index" column header
- [ ] Info icon (ℹ️) appears next to label
- [ ] Tooltip explains: "Composite score (0-100)..." with formula

#### Task 7 — Demo mode works
- [ ] Simulator logs "DEMO MODE: Forcing Phoenix congestion scenario"
- [ ] Phoenix market appears in top 3 of degradation table
- [ ] Select "Last 5 minutes" → Phoenix shows elevated events

**Test Aura questions:**

Open Aura Analyst panel (right sidebar button) and ask:

1. "Show me the subscribers impacted in the last 5 minutes, grouped by market and technology."
   - [ ] Returns populated chart/table
   - [ ] Phoenix market appears with 4G/5G breakdown

2. "Which markets have both elevated care volume and high churn risk in the last 15 minutes?"
   - [ ] Returns results mentioning Phoenix
   - [ ] No timeout or error

3. "For Phoenix market, which subscriber segments have the most churn risk and revenue at risk?"
   - [ ] Returns breakdown by line_type (postpaid/prepaid)
   - [ ] Shows revenue figures

---

## Tuning for Recording

### Faster updates (more visible streaming)

```bash
# Frontend: Set poll interval to 3 seconds
cd web
echo "VITE_POLL_INTERVAL_MS=3000" > .env.local
npm run dev
```

```bash
# Simulator: Generate events every 2 seconds
go run cmd/simulator/main.go -dsn "..." -demo-mode -seed=12345 -tick=2s
```

### Slower updates (lower database load)

```bash
# Frontend: 10 second polls
echo "VITE_POLL_INTERVAL_MS=10000" > .env.local
npm run dev
```

```bash
# Simulator: 5 second ticks (default)
go run cmd/simulator/main.go -dsn "..." -demo-mode -seed=12345 -tick=5s
```

---

## Troubleshooting

**"Events ingested (60s): 0"**
→ Simulator isn't running or not connected. Check simulator terminal for errors.

**"Last 5 minutes" shows no data**
→ Need 30-60s warm-up after simulator starts. Events are generated every tick and backfilled timestamps are within 5min window.

**Phoenix not in top markets**
→ Verify `-demo-mode` flag is set. Check simulator logs for "DEMO MODE" message.

**Aura questions timing out**
→ Use shorter time windows ("last 5 minutes" not "today"). Narrow scope to one market.

**Dashboard not updating**
→ Check browser console for API errors. Verify connection credentials are correct.

---

## Stopping Everything

```bash
# Stop simulator: Ctrl+C in simulator terminal
# Stop frontend: Ctrl+C in web terminal
# Database: remains running in SingleStore cloud
```

---

## Alternative: S3 Pipeline Mode

For production-like architecture:

```bash
# Generate Parquet files
go run cmd/simulator-s3/main.go -demo-mode -seed=12345 -iterations=20 -output=/tmp/telco-demo

# Upload to S3
aws s3 sync /tmp/telco-demo/ s3://your-bucket/telco-demo/

# Create pipelines (see PIPELINE_SETUP.md)
# Data will stream into database via pipelines
```

Dashboard connects the same way (no difference from direct insert mode).
