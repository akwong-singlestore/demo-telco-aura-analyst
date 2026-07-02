# Aura Analyst Domain Configuration for Telco

## Domain Instructions

```
You are analyzing data for a telecommunications service provider's subscriber experience command center.

Key business context:
- Poor experience = QoS score < 60, multiple network events, or high latency
- High-value subscriber = monthly revenue >= $50
- Churn risk bands: low (good standing) → medium → high → critical (immediate intervention needed)
- Successful intervention = retention action that converts (subscriber stays)

Measurement windows:
- Real-time = last 1-24 hours
- Recent = last 7 days
- Historical = last 30-90 days

Common joins:
- subscriber_master is the anchor for subscriber attributes
- Join network_experience_events ON subscriber_id to see service issues
- Join care_cases ON subscriber_id to see complaint patterns
- Join retention_actions ON subscriber_id to see intervention attempts
- Join market_reference via home_market_id for geographic context

Preferred views (use these instead of manual joins):
- subscriber_experience_scores: current experience metrics per subscriber
- market_degradation_summary: regional service quality indicators
- at_risk_high_value_subscribers: priority intervention targets
- intervention_effectiveness: retention action performance by type/segment

Time-series tables to aggregate:
- subscriber_usage_summary: roll up by time period for trends
- network_experience_events: group by market, event_type, severity
- care_cases: count by issue_category, time period

When asked about "problems" or "issues":
- Focus on severity='major' or 'critical' network_experience_events
- Look for patterns: same market, device model, or technology type
- Correlate with care case spikes

When asked about "retention" or "churn":
- Filter by churn_risk_band IN ('high', 'critical')
- Check if retention actions were attempted
- Calculate conversion rates: converted_count / total_actions
- Segment by line_type (prepaid behaves differently than postpaid)

When asked about "markets":
- Use market_degradation_summary for quick insights
- Join to cell_sites for site-level detail
- Urban vs rural context matters (urban_rural_flag)

Geographic queries:
- Markets have latitude/longitude for mapping
- Cell sites are children of markets
- Use region_name for multi-market analysis

Enterprise context:
- enterprise_account_id links subscribers to corporate accounts
- enterprise_accounts table has SLA tiers and targets
- SLA breaches are in enterprise_sla_events

Avoid:
- Don't scan full time-series tables without date filters
- Don't join all tables at once (use views)
- Don't return raw subscriber IDs without context (add revenue, market, etc.)
```

## Suggested Prompts by Page

### Executive Dashboard
- "Which markets have the most at-risk subscribers today?"
- "What's the trend in churn risk over the past 7 days?"
- "Show me intervention conversion rates by subscriber segment"
- "Which regions have the highest care volume today?"

### Network Experience View
- "What are the top causes of poor experience in Phoenix?"
- "Show me device models with the highest complaint rates"
- "Which cell sites have had the most critical events this week?"
- "Compare 4G vs 5G service quality metrics"

### Retention & Churn View
- "Which high-value subscribers have poor experience but no retention actions?"
- "What's the best performing retention action type for prepaid users?"
- "Show me subscribers with multiple care cases and no successful intervention"
- "Compare conversion rates across different channels"

### Care Operations View
- "Which issue categories are linked to service degradation events?"
- "Show me repeat contact rates by market"
- "What's the average handle time for network-related cases?"
- "Which markets have the longest case resolution times?"

### Enterprise SLA View
- "Which enterprise accounts are at risk of SLA breach?"
- "Show me accounts with the most incidents this month"
- "What's the average uptime across gold-tier accounts?"
- "Compare latency performance to contracted targets"

## Sample Domain Setup (SQL)

```sql
-- Create Aura Analyst domain (placeholder for actual domain creation)
-- This shows the tables to grant access to

GRANT SELECT ON telco.subscriber_master TO 'analyst_user';
GRANT SELECT ON telco.subscriber_usage_summary TO 'analyst_user';
GRANT SELECT ON telco.network_experience_events TO 'analyst_user';
GRANT SELECT ON telco.care_cases TO 'analyst_user';
GRANT SELECT ON telco.retention_actions TO 'analyst_user';
GRANT SELECT ON telco.market_reference TO 'analyst_user';
GRANT SELECT ON telco.cell_sites TO 'analyst_user';
GRANT SELECT ON telco.enterprise_accounts TO 'analyst_user';
GRANT SELECT ON telco.enterprise_sla_events TO 'analyst_user';

-- Grant view access (recommended over raw tables)
GRANT SELECT ON telco.subscriber_experience_scores TO 'analyst_user';
GRANT SELECT ON telco.market_degradation_summary TO 'analyst_user';
GRANT SELECT ON telco.at_risk_high_value_subscribers TO 'analyst_user';
GRANT SELECT ON telco.intervention_effectiveness TO 'analyst_user';
```

## Integration Pattern

Follow RTDM AnalystChat.tsx pattern:

1. Copy AnalystChat component
2. Update Recoil atoms to point to telco database
3. Replace suggested prompts with telco-specific ones
4. Add page context awareness (different prompts per dashboard page)
5. Style with telco branding (blues/teals instead of purple)

## Demo Flow

1. Show executive dashboard
2. Ask: "Which markets have the highest degradation today?"
3. Aura shows Phoenix with congestion issues
4. Navigate to Network Experience view
5. Ask: "What types of events are affecting Phoenix subscribers?"
6. Drill into retention view
7. Ask: "Show me affected high-value subscribers who need intervention"
8. Demonstrate retention action effectiveness query
