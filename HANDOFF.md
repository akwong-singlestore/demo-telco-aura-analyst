# Telco MVP - Handoff Document

## Deliverables Summary

All files are in `/tmp/telco-demo/` and packaged in `telco-mvp.tar.gz`.

### Core SQL (Complete ✅)
- **sql/schema.sql** - 7 tables + 5 views, ~500 lines
- **sql/seed.sql** - Reference data + 50K subscriber generation
- **sql/procedures.sql** - 8 stored procedures for ingestion & analytics
- **sql/pipelines.sql** - Pipeline definitions (stubbed for S3)

### Go Simulator (Complete ✅)
- **gen/state.go** - State management, data structures
- **gen/subscribers.go** - Subscriber init, reference data
- **gen/scenarios.go** - 5 causal scenario templates
- **gen/events.go** - Event generation with causality
- **cmd/simulator/main.go** - Main loop, DB insertion
- **go.mod** - Dependencies

### Documentation (Complete ✅)
- **README.md** - Quick start guide
- **IMPLEMENTATION.md** - Detailed status, what works, what's stubbed
- **doc/AURA_ANALYST_DOMAIN.md** - Domain config, prompts, integration guide

## What You Can Test Right Now

### 1. Database Setup (5 minutes)
```bash
mysql -u root -h <host> -p -e "CREATE DATABASE telco"
mysql -u root -h <host> -p telco < sql/schema.sql
mysql -u root -h <host> -p telco < sql/procedures.sql
mysql -u root -h <host> -p telco < sql/seed.sql
```

### 2. Run Simulator (1 minute)
```bash
cd cmd/simulator
go run main.go -dsn "root:pass@tcp(host:3306)/telco"
```

Watch logs for scenario transitions.

### 3. Query Dashboard Metrics (immediate)
```sql
-- Market health
SELECT market_name, degradation_index, severe_events_24h, impacted_subscribers_24h
FROM market_degradation_summary
ORDER BY degradation_index DESC LIMIT 5;

-- At-risk subscribers
SELECT COUNT(*), churn_risk_band, 
  AVG(monthly_revenue) as avg_revenue
FROM at_risk_high_value_subscribers
GROUP BY churn_risk_band;

-- Intervention performance
SELECT action_type, line_type,
  acceptance_rate, conversion_rate
FROM intervention_effectiveness
WHERE total_actions > 10
ORDER BY conversion_rate DESC;

-- Live events
SELECT event_ts, market_id, event_type, severity, 
  COUNT(*) as event_count
FROM network_experience_events
WHERE event_ts > NOW() - INTERVAL 10 MINUTE
GROUP BY event_ts, market_id, event_type, severity
ORDER BY event_ts DESC;
```

## What Still Needs Building

### Web UI (Priority 1)
**Effort**: 2-3 days

Port RTDM web structure:
1. Copy `web/` directory structure
2. Replace components:
   - Dashboard.tsx → TelcoExecutive.tsx
   - Analytics.tsx → NetworkExperience.tsx, RetentionView.tsx, CareOps.tsx
3. Update data/queries.ts with telco queries
4. Replace RTDM terminology with telco terms
5. Theme: blue/teal colors, telco iconography

**Key charts needed**:
- Market degradation heatmap (table or regional viz)
- Churn risk trend line
- Care volume by issue category
- Intervention conversion funnel
- Real-time event feed

### Aura Analyst Integration (Priority 2)
**Effort**: 1 day

1. Copy AnalystChat.tsx component
2. Update recoil atoms for telco DB connection
3. Wire suggested prompts from AURA_ANALYST_DOMAIN.md
4. Add page-aware context (different prompts per view)
5. Test with demo questions

### Polish (Priority 3)
**Effort**: 1 day

- Loading states
- Error handling
- Telco branding
- Demo mode toggle
- Scenario indicator in UI

## Copy to Repo

Since direct git access failed, manually copy these files to `https://github.com/singlestore-labs/demo-telco-aura-analyst`:

```
/sql/*.sql
/gen/*.go
/cmd/simulator/main.go
/doc/AURA_ANALYST_DOMAIN.md
/go.mod
/README.md
/IMPLEMENTATION.md
```

Or extract `telco-mvp.tar.gz` directly into repo root.

## Demo Script (Once UI is Ready)

### Opening (Executive View)
"This is a real-time subscriber experience command center for a telecom provider. We're monitoring 50K active subscribers across 15 markets."

**Ask Aura**: "Which markets have the highest degradation today?"

### Drill-Down (Network View)
"Phoenix is showing elevated network issues. Let's investigate."

**Ask Aura**: "What types of events are affecting Phoenix subscribers?"

**Response**: "Congestion scenario - high latency on downtown cell sites affecting 40% of subscribers."

### Retention Response (Retention View)
"We need to identify at-risk subscribers for intervention."

**Ask Aura**: "Show me high-value subscribers in Phoenix with poor experience who haven't received retention actions."

**Action**: "System has automatically triggered discount offers for top 50."

### Outcome Analysis (Care View)
"Let's see how effective our interventions are."

**Ask Aura**: "What's the conversion rate for retention actions targeting congestion-affected subscribers?"

**Insight**: "35% acceptance, 25% conversion - aligns with historical performance."

## Known Good Demo Prompts

Copy these for testing:

1. "Which markets have the most critical network events today?"
2. "Show me subscribers with 3+ care cases in the last 30 days"
3. "What device models have the highest dropped session rates?"
4. "Compare retention effectiveness for prepaid vs postpaid users"
5. "Which enterprise accounts are approaching SLA breach?"
6. "Show regional trends in subscriber experience scores"
7. "What's the correlation between network events and care cases?"
8. "Which cell sites need capacity upgrades based on congestion patterns?"

## Scenario Descriptions for Live Demo

### Scenario 1: Congestion Event
"Phoenix downtown experiences congestion during peak hours. Cell site 101 hits capacity. Subscribers see 200ms+ latency. QoS scores drop to 40-50 range. Care cases spike with 'network quality' complaints. System flags 150 high-value subscribers as at-risk. Retention team sends targeted offers. 35 accept, preventing $1,500/month in churn."

### Scenario 2: Device Issue
"Samsung Galaxy devices across all markets experience session drops due to software bug. 25% of Samsung users affected. Device-specific pattern emerges in analytics. Aura identifies the cohort. Network team escalates to vendor. Care provides proactive outreach. Issue resolved in 8 hours."

### Scenario 3: Regional Outage
"Southeast region (Atlanta + Miami) hit by fiber cut. 60% service loss. Critical severity events flood in. Enterprise SLA breaches trigger alerts. Care volume 5x normal. All hands response. Services restored in 45 minutes. Post-mortem analysis via Aura shows impact concentration and recovery timeline."

## Comparison to RTDM

**Similarities** (intentional reuse):
- Schema patterns (rowstore reference, time-series fact tables)
- Stored procedure ingestion pattern
- Simulator architecture (state, update loop, causal scenarios)
- Web UI structure (configure → dashboard → analytics)
- Aura Analyst integration approach

**Differences** (telco domain):
- Business metrics (experience scores, churn risk vs campaign ROI)
- Entity model (subscribers, cell sites, care cases vs campaigns, offers)
- Geospatial (market regions vs individual lat/long dots)
- Analytics focus (retention, service quality vs ad performance)
- Time windows (minutes/hours for service issues vs days for campaigns)

## Next Steps

1. **Immediate**: Copy files to GitHub repo
2. **Day 1**: Build basic web UI shell with 3-4 key charts
3. **Day 2**: Integrate Aura Analyst panel
4. **Day 3**: Polish and demo testing
5. **Launch**: Internal demo ready, customer-facing polish can iterate

## Questions to Resolve

- S3 bucket for production pipelines?
- Preferred SingleStore deployment (Managed Service, Docker, existing cluster)?
- Target demo audience (technical, business, executive)?
- Need real customer logo/branding?
- Integration with actual telco test data or stay synthetic?

## Files Location

All implementation files: `/tmp/telco-demo/`
Package: `/tmp/telco-demo/telco-mvp.tar.gz`

**Ready for repo commit and UI development phase.**
