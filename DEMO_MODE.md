# Demo Mode — Reproducible Scenario Guide

This guide explains how to run the Subscriber Experience Command Center in demo mode with a reproducible, rehearsed scenario.

## What is Demo Mode?

Demo mode forces a **Phoenix Congestion Spike** scenario that:
- Affects 50% of subscribers in the Phoenix market
- Generates higher event rates and care volume
- Runs continuously (auto-restarts when scenario ends)
- Uses a deterministic random seed for reproducibility

This allows you to rehearse specific Aura Analyst questions and guarantee populated, interpretable results.

## Quick Start

### Option 1: Direct Database Insert (Fast, for local testing)

```bash
go run cmd/simulator/main.go \
  -dsn "admin:password@tcp(your-host:3306)/telco" \
  -demo-mode \
  -seed=12345 \
  -subscribers=1000 \
  -tick=3s
```

### Option 2: S3 Pipeline (Production-like)

```bash
go run cmd/simulator-s3/main.go \
  -demo-mode \
  -seed=12345 \
  -subscribers=1000 \
  -iterations=20 \
  -tick=3s \
  -output=/tmp/telco-demo \
  -prefix=demo/phoenix-spike

# Upload to S3
aws s3 sync /tmp/telco-demo/ s3://your-bucket/

# Pipelines will automatically ingest
```

## Demo Scenario Details

**Scenario:** Phoenix Congestion Spike  
**Duration:** 20 ticks (continuous in demo mode)  
**Impact:** 50% of Phoenix market subscribers affected  
**Symptoms:**
- High latency events (major severity)
- Elevated care volume (3% probability vs 1% baseline)
- Increased retention actions for at-risk subscribers

**Markets affected:** Phoenix (market_id = 1)  
**Technologies:** All (4G, 5G, Wi-Fi)  
**Subscriber types:** All line types

## Rehearsed Aura Questions

With demo mode running, these questions return populated results:

### 1. Time-bounded freshness (HTAP proof)
```
Show me the subscribers impacted in the last 5 minutes, grouped by market and technology.
```
**Expected result:** Phoenix market with 4G/5G breakdowns, subscriber counts

### 2. Cross-domain correlation
```
Which markets have both elevated care volume and high churn risk in the last 15 minutes?
```
**Expected result:** Phoenix appears with care + churn correlation

### 3. Revenue impact analysis
```
For Phoenix market, which subscriber segments have the most churn risk and revenue at risk?
```
**Expected result:** Breakdown by line_type (postpaid/prepaid/enterprise) with revenue figures

## Parameters

| Flag | Default | Description |
|------|---------|-------------|
| `-demo-mode` | `false` | Enable Phoenix congestion scenario |
| `-seed` | `0` (random) | Deterministic random seed. Use same value for reproducibility |
| `-subscribers` | `1000` | Number of subscribers to simulate |
| `-tick` | `5s` | Time between data generation cycles |
| `-iterations` | `10` (S3 only) | Number of data batches to generate |

## Recommended Recording Setup

1. **Start database** and ensure schema is loaded
2. **Start simulator** with demo mode:
   ```bash
   go run cmd/simulator/main.go -dsn "..." -demo-mode -seed=12345 -tick=3s
   ```
3. **Wait 30 seconds** for warm-up (events accumulate in last 5 min window)
4. **Open dashboard** at http://localhost:5173 or deployed URL
5. **Verify**:
   - Live badge is pulsing
   - Events ingested counter is increasing
   - Select "Last 5 minutes" time window
   - Phoenix market shows high degradation index
6. **Ask rehearsed questions** in Aura Analyst

## Performance Notes

- **3-second tick interval** generates ~20 events/sec (good for visible streaming)
- **5-second tick interval** (default) is more conservative
- **Seed=12345** produces consistent Phoenix impact; other seeds vary slightly
- Dashboard polls every 5 seconds by default (configurable via `VITE_POLL_INTERVAL_MS`)

## Troubleshooting

**No data in "Last 5 minutes"?**
- Simulator needs 30s-1min warm-up for events to accumulate
- Check simulator logs for "DEMO MODE: Forcing Phoenix congestion scenario"

**Aura questions timing out?**
- Narrow time window: use "last 5 minutes" or "last 15 minutes"
- Limit scope: ask about one market or one metric at a time
- Avoid open-ended questions like "analyze everything today"

**Phoenix not showing in top markets?**
- Verify seed is deterministic (`-seed=12345`)
- Check dashboard time window matches simulator runtime (last 5 min vs last 24h)

## Non-Demo Mode Behavior

Without `-demo-mode`, the simulator:
- Randomly selects scenarios (Phoenix, Atlanta, iOS issues, etc.)
- Uses lower event rates (2% baseline)
- Scenarios expire after 5-15 ticks
- Results are less predictable but more realistic for exploratory demos

## What Changed vs. Production

Demo mode **only affects the data generator**. The dashboard and database are unchanged. You can switch between demo and production mode by restarting the simulator.

**Changes in demo mode:**
- Phoenix scenario is forced (normally random)
- Event probability: 5% (normally 2%)
- Care case probability: 3% (normally 1%)
- Scenario duration: 20 ticks (normally 10)
- Impact rate: 50% (normally 40%)
- Scenario loops continuously (normally ends and picks new random scenario)

---

**Ready to demo?** Run the quick start command, wait 30s, and ask the rehearsed questions!
