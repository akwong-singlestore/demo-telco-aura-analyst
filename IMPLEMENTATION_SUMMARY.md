# Demo Polish Implementation Summary

Branch: `demo-polish/subscriber-experience`  
Commits: 6 grouped commits (one per task)

## Task 1 — Make real-time streaming visible ✅

**What changed:**
- Added pulsing "LIVE" badge in dashboard header
- Added "Last updated: HH:MM:SS" timestamp that updates on each poll
- Added "Events ingested (60s): X (Y/sec)" counter showing real-time ingestion rate
- Added configurable `VITE_POLL_INTERVAL_MS` environment variable (default: 5000ms)
- Reduced KPI and market polling intervals to 5s (configurable)
- Added 5-minute and 15-minute time window options

**Files modified:**
- `web/src/data/queries.ts` - Added `useIngestionRate()`, `POLL_INTERVAL_MS` constant, updated `timeWindowToInterval()` with 5m/15m cases
- `web/src/pages/ExecutiveDashboard.tsx` - Added Live indicator header, timestamp state, events counter display
- `web/.env.example` - Documented `VITE_POLL_INTERVAL_MS` configuration

**Root cause:** N/A (new feature)

---

## Task 2 — Support tight, time-bounded queries ✅

**What changed:**
- Covered by Task 1 (5min and 15min options added to time window filter)

**Files modified:**
- Already handled in Task 1 commits

**Root cause:** N/A

---

## Task 3 — Fix empty and zero-value data ✅

**What changed:**
- Added extra-fresh event generation in the last 5 minutes during `resetSchema()`
- Now generates 10 events per minute for minutes 0-4, ensuring immediate data in short windows

**Files modified:**
- `web/src/data/queries.ts` - Added loop generating events for last 5 minutes with higher granularity

**Root cause:** Seed data was spread evenly over 7 days. When selecting "Last 5 minutes" immediately after setup, queries returned empty/zero because no events existed in that narrow window. Fixed by backfilling last 5 minutes with fresh events.

---

## Task 4 — Populate Top At-Risk Segments with business impact ✅

**What changed:**
- Created new `getAtRiskSegments()` query that aggregates by market + line_type
- Displays segment name (e.g., "Phoenix postpaid"), churn risk %, and revenue at risk
- Sorted by revenue_at_risk descending to show highest-impact segments first

**Files modified:**
- `web/src/data/queries.ts` - Added `AtRiskSegment` interface, `getAtRiskSegments()`, `useAtRiskSegments()`
- `web/src/pages/ExecutiveDashboard.tsx` - Updated card to use aggregated segments query, display revenue at risk

**Root cause:** Original card showed individual subscribers (not segments) and displayed monthly revenue per subscriber (not aggregated revenue at risk). Fixed by aggregating via `GROUP BY market_name, line_type` and calculating `SUM(monthly_revenue WHERE churn_risk IN ('high','critical'))`.

**Derivation documented:**
- `revenue_at_risk = SUM(monthly_revenue WHERE churn_risk_band IN ('high', 'critical'))`
- `churn_risk_percent = (high_risk_count + critical_risk_count) / subscriber_count * 100`

---

## Task 5 — Add visual to Market Degradation section ✅

**What changed:**
- Added horizontal bar chart (Plotly) showing top 10 markets by degradation index
- Color-coded bars: green (<25), orange (25-50), red (>50)
- Chart displays above table for visual prominence
- Limited table to max-height 400px with scroll

**Files modified:**
- `web/src/pages/ExecutiveDashboard.tsx` - Added `<Plot>` component with horizontal bar chart, wrapped table + chart in `<VStack>`

**Root cause:** Table was static and dominated the screen. Chart provides visual "where is this happening" answer at a glance.

---

## Task 6 — Define and label the Degradation Index ✅

**What changed:**
- Added info icon (MdInfoOutline) with Tooltip next to "Degradation Index" column header
- Tooltip text: "Composite score (0-100) based on severe network events, impacted subscribers, and experience scores. Higher values indicate worse service quality."

**Files modified:**
- `web/src/pages/ExecutiveDashboard.tsx` - Added Tooltip import, icon + tooltip in table header

**Root cause:** Metric was undefined, reducing credibility. Fixed with inline explanation.

---

## Task 7 — Reproducible demo scenario ✅

**What changed:**
- Added `-demo-mode` flag to both simulators (cmd/simulator, cmd/simulator-s3)
- Added `-seed` flag for deterministic random generation
- Demo mode forces "Phoenix Congestion Spike" scenario continuously
- Added `ForcePhoenixScenario()` function in `gen/scenarios.go`
- Created `DEMO_MODE.md` with complete usage guide and rehearsed questions

**Files modified:**
- `cmd/simulator/main.go` - Added flags, seed logic, demo mode setup
- `cmd/simulator-s3/main.go` - Added flags, seed logic, demo mode setup
- `gen/scenarios.go` - Added `ForcePhoenixScenario()` function
- `DEMO_MODE.md` - Complete documentation

**Root cause:** Randomized scenarios made rehearsal impossible. Fixed with deterministic seed and forced scenario.

**Recommended command:**
```bash
go run cmd/simulator/main.go -dsn "admin:password@tcp(host:3306)/telco" -demo-mode -seed=12345 -tick=3s
```

**Rehearsed questions guaranteed to work:**
1. "Show me the subscribers impacted in the last 5 minutes, grouped by market and technology."
2. "Which markets have both elevated care volume and high churn risk in the last 15 minutes?"
3. "For Phoenix market, which subscriber segments have the most churn risk and revenue at risk?"

---

## Summary Statistics

**Total files modified:** 7  
**Total lines added:** ~450  
**Total lines removed:** ~10  
**New files created:** 2 (`.env.example`, `DEMO_MODE.md`)

**No changes to:**
- Authentication / credentials
- Deployment configuration
- Database schema
- Branding / theme / colors
- Overall layout structure (changes were additive/refinements)
