# Manual Test Checklist

Complete this checklist to verify all acceptance criteria before approving the PR.

## Setup
- [ ] Branch checked out: `demo-polish/subscriber-experience`
- [ ] Database connected and schema loaded
- [ ] Frontend running at http://localhost:5173
- [ ] Simulator running in demo mode with seed=12345

---

## Task 1: Real-time streaming visible

### Live indicator
- [ ] Green "LIVE" badge appears in header (top left of dashboard)
- [ ] Badge has pulsing green dot animation
- [ ] "Last updated: HH:MM:SS" text appears next to badge
- [ ] Timestamp updates every ~5 seconds without manual refresh
- [ ] Timestamp shows current time (not frozen)

### Events counter
- [ ] "Events ingested (60s):" text appears in header
- [ ] Counter shows non-zero number (e.g., "245")
- [ ] Events/sec rate appears in parentheses (e.g., "(4.1/sec)")
- [ ] Counter updates every ~5 seconds
- [ ] Number changes when simulator is active

### Time windows
- [ ] Time Window dropdown includes "Last 5 minutes"
- [ ] Time Window dropdown includes "Last 15 minutes"
- [ ] Can select and switch between all time windows
- [ ] Dashboard data updates when switching windows

---

## Task 2: Time-bounded queries

### Short time windows
- [ ] Select "Last 5 minutes" from Time Window filter
- [ ] Dashboard shows data (not all zeros)
- [ ] KPI values change compared to "Last 2 hours"
- [ ] Select "Last 15 minutes"
- [ ] Data updates to reflect 15min window

### Aura Analyst 5-minute query
- [ ] Open Aura Analyst panel (right sidebar button)
- [ ] Type: "Show me the subscribers impacted in the last 5 minutes, grouped by market and technology"
- [ ] Press Enter and wait for response
- [ ] Query returns results (not empty)
- [ ] Results include Phoenix market
- [ ] Results show technology breakdown (4G/5G)
- [ ] No timeout error

---

## Task 3: No empty/zero data

### Market Degradation Summary table
- [ ] Table has 6 columns: Market, Region, Degradation Index, Severe Events, Impacted Subs, Care Cases
- [ ] "Impacted Subs" column has non-zero values (at least in some rows)
- [ ] "Care Cases" column has non-zero values (at least in some rows)
- [ ] No column shows all zeros in every row

### Charts
- [ ] "Churn Risk Trend (7 Days)" chart renders with line graph
- [ ] Chart shows data points (not "No trend data available")
- [ ] "Retention Action Performance" table has rows
- [ ] "Top At-Risk Segments" card has populated rows (not empty)

---

## Task 4: Top At-Risk Segments populated

### Card content
- [ ] Card title: "Top At-Risk Segments"
- [ ] At least 3-5 rows visible
- [ ] Not showing "No at-risk segments found" message

### Column 1: Segment
- [ ] Shows format like "Phoenix postpaid" or "Dallas prepaid"
- [ ] Market name is visible
- [ ] Line type is visible in gray text

### Column 2: Risk %
- [ ] Shows percentage badge (e.g., "42%")
- [ ] Badge is colored (orange or red)
- [ ] Percentage is reasonable (0-100%)

### Column 3: $ at Risk
- [ ] Shows currency format (e.g., "$12.3K" or "$450")
- [ ] Values are bold/semibold
- [ ] Values make sense (not all same number)

### Sorting
- [ ] Rows are sorted by revenue (highest at top)
- [ ] Top row has highest "$ at Risk" value

### Filters
- [ ] Select region filter → card updates
- [ ] Select line type filter → card updates appropriately
- [ ] Segments match selected filters

---

## Task 5: Market Degradation visual

### Chart
- [ ] Horizontal bar chart appears above the table
- [ ] Chart shows ~10 bars (markets)
- [ ] Bars are oriented horizontally (markets on Y-axis)
- [ ] X-axis labeled "Degradation Index" with range 0-100

### Color coding
- [ ] Bars are color-coded
- [ ] Green bars for low degradation (<25)
- [ ] Orange bars for medium degradation (25-50)
- [ ] Red bars for high degradation (>50)
- [ ] Phoenix bar is likely red or orange (if demo mode active)

### Table
- [ ] Table appears below chart
- [ ] Table has max-height and scrolls if needed
- [ ] Table doesn't dominate full screen height
- [ ] Can scroll through table rows

### Interactivity
- [ ] Hover over bar → tooltip shows market name and value
- [ ] Chart updates when region filter changes
- [ ] Chart updates when time window changes

---

## Task 6: Degradation Index defined

### Tooltip
- [ ] Find "Degradation Index" column header in table
- [ ] Small info icon (ℹ️) appears next to text
- [ ] Hover over icon → tooltip appears
- [ ] Tooltip text includes "Composite score (0-100)"
- [ ] Tooltip explains "based on severe network events, impacted subscribers, and experience scores"
- [ ] Tooltip says "Higher values indicate worse service quality"
- [ ] Tooltip has arrow pointing to icon

---

## Task 7: Reproducible demo scenario

### Simulator logs
- [ ] Simulator terminal shows "DEMO MODE: Forcing Phoenix congestion scenario"
- [ ] Simulator logs show "Using deterministic seed: 12345"
- [ ] Logs show events being generated each tick

### Phoenix scenario active
- [ ] Select "Last 5 minutes" time window
- [ ] Phoenix market appears in Market Degradation table
- [ ] Phoenix is in top 3-5 markets (high degradation)
- [ ] Phoenix shows elevated "Severe Events (24h)" count
- [ ] Phoenix has non-zero "Impacted Subs"

### Aura question 1
- [ ] Ask: "Show me the subscribers impacted in the last 5 minutes, grouped by market and technology."
- [ ] Query completes without timeout (< 30 seconds)
- [ ] Results include Phoenix market
- [ ] Results show technology types (5G, 4G LTE, Wi-Fi)
- [ ] Results show subscriber counts

### Aura question 2
- [ ] Ask: "Which markets have both elevated care volume and high churn risk in the last 15 minutes?"
- [ ] Query completes without timeout
- [ ] Results mention Phoenix
- [ ] Results mention care volume or churn metrics

### Aura question 3
- [ ] Ask: "For Phoenix market, which subscriber segments have the most churn risk and revenue at risk?"
- [ ] Query completes without timeout
- [ ] Results show breakdown by line_type (postpaid/prepaid/enterprise)
- [ ] Results include revenue figures or counts

### Reproducibility
- [ ] Stop simulator (Ctrl+C)
- [ ] Clear database events: `TRUNCATE TABLE network_experience_events;`
- [ ] Restart simulator with same seed: `-demo-mode -seed=12345`
- [ ] Phoenix scenario activates again
- [ ] Dashboard shows similar patterns (Phoenix elevated)

---

## Cross-browser check (optional but recommended)

- [ ] Test in Chrome
- [ ] Test in Safari or Firefox
- [ ] Live badge animates in both browsers
- [ ] Charts render correctly in both browsers

---

## Final approval criteria

- [ ] All checkboxes above are checked ✓
- [ ] No console errors in browser DevTools
- [ ] No obvious visual glitches or broken layouts
- [ ] Dashboard looks professional and credible
- [ ] Real-time story is visibly demonstrated
- [ ] Can rehearse and repeat demo questions successfully

---

## Notes / Issues found

[Add any notes or issues discovered during testing here]
