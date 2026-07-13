# Telco Demo - Known Good Aura Analyst Prompts

These prompts are tested and designed to work reliably with the telco schema and Aura Analyst domain configuration.

## Executive / Market Health

### Recommended Opening Prompt
**"Which markets have the highest degradation today?"**
- Shows market_degradation_summary view
- Highlights Phoenix/other active scenario markets
- Good for transition into market drill-down

### Follow-up Prompts
- "Show me the top 5 markets by degradation index"
- "Which regions have the most critical network events?"
- "Compare degradation between urban and rural markets"

## Network Experience

### Device Analysis
**"Which device models are most overrepresented among recent complaint spikes?"**
- Demonstrates device cohort analysis
- Works well during device-specific scenarios
- Shows correlation between device type and care cases

### Event Investigation
- "What types of events are affecting Phoenix subscribers?"
- "Show me subscribers with 3+ network events in the last 7 days"
- "Which cell sites have the most congestion events today?"

## Retention & Churn

### High-Value At-Risk
**"Show me high-value subscribers with poor experience who haven't received retention actions"**
- Uses at_risk_high_value_subscribers view
- Demonstrates proactive intervention targeting
- Good for business impact discussion

### Intervention Effectiveness
**"Which retention actions had the highest conversion rate for prepaid users last week?"**
- Shows intervention_effectiveness by segment
- Demonstrates A/B testing insights
- Highlights channel performance differences

### Revenue at Risk
**"Which subscriber segments represent the most revenue at risk right now?"**
- Aggregates monthly_revenue by churn_risk_band
- Shows business impact of churn
- Good for executive audience

## Care Operations

### Service-Linked Cases
**"Which issue categories are linked to service degradation events?"**
- Correlates care_cases.issue_category with network_experience_events
- Shows operational impact of network issues
- Demonstrates causal data modeling

### Repeat Contacts
- "Show me subscribers with multiple care cases and no successful intervention"
- "What's the average handle time for network-related cases?"
- "Which markets have the highest care volume today?"

## Enterprise SLA (Optional)

### SLA Risk
**"Which enterprise accounts are at risk of SLA breach?"**
- Uses enterprise_sla_events table
- Shows latency/uptime vs contracted targets
- Good for B2B telco operators

### Account Health
- "Show me gold-tier accounts with incidents this month"
- "Compare actual vs target latency for enterprise accounts"

## Technical Demonstration Prompts

### Before/After Domain Context
Use this pair to show domain improvement:

**Before (generic):**
"Show me bad subscribers"
- Likely to fail or give poor results

**After (domain-aware):**
"Show me subscribers with poor experience scores"
- Works well, uses subscriber_experience_scores view
- Demonstrates domain semantics

### Chart Generation
**"Show regional trends in subscriber experience scores"**
- Generates time-series chart
- Demonstrates Aura's visualization capabilities

### Complex Join
**"What's the correlation between network events and care cases?"**
- Requires join across network_experience_events and care_cases
- Shows Aura's ability to understand implicit relationships

## Persona-Specific Prompts

### VP Customer Experience
- "What's the trend in churn risk over the past 7 days?"
- "Which markets need immediate attention?"
- "Show me intervention ROI by segment"

### Director of Care Operations
- "Which issue categories drive the most escalations?"
- "What's the average CSAT score for service-related cases?"
- "Show me repeat contact rates by market"

### Network Operations Leader
- "Which cell sites are experiencing congestion?"
- "Show me 5G vs 4G service quality metrics"
- "What's the impact of the Phoenix outage on subscribers?"

## Scenario-Specific Prompts

### During Phoenix Congestion Scenario
1. "Which markets have the highest degradation?"
   → Phoenix appears at top
2. "What's happening in Phoenix?"
   → Shows congestion events, high latency
3. "Show me affected high-value subscribers in Phoenix"
   → Targets for retention actions
4. "What's the conversion rate for congestion-related retention offers?"
   → Measures intervention effectiveness

### During Device Issue Scenario
1. "Which device models have the highest dropped session rates?"
   → Samsung devices show elevated issues
2. "Show me Samsung users with recent care cases"
   → Device-specific cohort
3. "How many subscribers are affected by the Samsung issue?"
   → Impact assessment

## Advanced / Edge Cases

### Aggregation
**"Show me average experience score by line type"**
- Groups by line_type (postpaid/prepaid/enterprise)
- Demonstrates segment comparison

### Time Windows
**"Compare retention effectiveness last week vs this week"**
- Uses time-based filtering
- Shows trend analysis capabilities

### Multi-Table Join
**"Show me subscribers in Atlanta with both poor experience and enterprise accounts"**
- Joins subscriber_master, subscriber_experience_scores, enterprise linkage
- Complex query construction

## Prompts to Avoid (Not Reliable Yet)

These may work but need testing or schema refinement:

- Geospatial queries (lat/long not fully utilized yet)
- Predictive churn modeling (no ML features in schema)
- Historical comparisons beyond 90 days (data retention not defined)
- Cross-scenario correlation (scenarios are independent)

## Demo Flow Recommendation

**5-Minute Executive Demo:**
1. Dashboard overview → KPIs visible
2. "Which markets have the highest degradation today?" → Phoenix
3. "What's happening in Phoenix?" → Congestion details
4. "Show me high-value subscribers who need intervention" → Action list
5. "What's the conversion rate for these retention actions?" → ROI

**15-Minute Deep Dive:**
- Start with executive flow
- Add device cohort analysis
- Show care operations view
- Demonstrate chart generation
- Show reasoning/query inspection
- Discuss governance (scoped access example)

## Notes for Demo Preparation

- Run simulator 5-10 minutes before demo to populate live data
- Check that at least one scenario is active
- Verify Aura Analyst endpoint is responsive
- Test 2-3 key prompts before presenting
- Have this doc open as a reference during demo
