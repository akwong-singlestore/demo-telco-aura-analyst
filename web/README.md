# Telco Command Center - Web UI

Real-time subscriber experience monitoring and churn prevention dashboard for telecommunications service providers.

## Quick Start

### Prerequisites
- Node.js 16+ and npm
- SingleStore database with telco schema loaded (see `/sql` directory)
- Simulator running (optional, for live data)

### Installation

```bash
cd web
npm install
```

### Configuration

Create `.env` file or configure via the UI:

```bash
# Database connection (configure in UI at /configure)
VITE_DB_HOST=http://127.0.0.1
VITE_DB_USER=admin
VITE_DB_PASSWORD=your-password
VITE_DB_DATABASE=telco

# Aura Analyst (optional, configure in UI)
VITE_ANALYST_API_KEY=your-api-key
VITE_ANALYST_ENDPOINT=https://your-analyst-endpoint
```

### Development

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

### Production Build

```bash
npm run build
npm run preview
```

## Features

### Executive Dashboard (`/dashboard`)
- **KPI Cards**: Total subscribers, high-risk subscribers, avg experience score, open care cases
- **Market Degradation Summary**: Real-time market health with degradation index
- **At-Risk Subscribers**: High-value subscribers needing intervention
- **Retention Performance**: Intervention effectiveness by action type

### Aura Analyst Integration
Conversational analytics with domain-aware prompts:
- Market health and degradation analysis
- Subscriber churn risk investigation
- Retention action effectiveness
- Network event correlation

## Demo Prompts

Use these prompts to demonstrate Aura Analyst capabilities:

### Market & Network
- "Which markets have the highest concentration of poor-experience subscribers today?"
- "What types of events are affecting Phoenix subscribers?"
- "Which device models are most overrepresented among recent complaint spikes?"

### Retention & Churn
- "Which retention actions had the highest conversion rate for prepaid users last week?"
- "Show me high-value subscribers with poor experience who haven't received retention actions"
- "Which subscriber segments represent the most revenue at risk right now?"

### Care Operations
- "Which issue categories are linked to service degradation events?"
- "What's the correlation between network events and care cases?"

## Architecture

### Tech Stack
- **Frontend**: React 17, TypeScript, Chakra UI
- **State**: Recoil for global state management
- **Data Fetching**: SWR for real-time data updates
- **Charts**: Plotly.js for Aura-generated visualizations
- **Routing**: React Router v6

### Data Layer (`src/data/`)
- `queries.ts`: SWR hooks for real-time metrics
- `client.ts`: SingleStore HTTP API client
- `analystClient.ts`: Aura Analyst integration
- `recoil.ts`: Global state atoms and selectors

### Key Components
- `Executive.tsx`: Main dashboard with KPIs and tables
- `AnalystChat.tsx`: Aura Analyst panel with streaming responses
- `Configure.tsx`: Database and Analyst configuration

## Known Good Queries

These queries are tested and work reliably with the telco schema:

```sql
-- Market degradation
SELECT * FROM market_degradation_summary 
ORDER BY degradation_index DESC LIMIT 10;

-- At-risk subscribers
SELECT * FROM at_risk_high_value_subscribers 
WHERE interventions_30d = 0 
ORDER BY experience_score ASC LIMIT 20;

-- Intervention performance
SELECT * FROM intervention_effectiveness 
WHERE total_actions > 5 
ORDER BY conversion_rate DESC;
```

## Troubleshooting

### "Cannot connect to database"
- Verify database is running and accessible
- Check connection settings in Configure page
- Ensure SingleStore HTTP API is enabled

### "No data showing"
- Run simulator to generate data: `cd cmd/simulator && go run main.go`
- Verify schema is loaded: `mysql -u root -p telco < sql/schema.sql`
- Check browser console for errors

### Aura Analyst not responding
- Configure API key and endpoint in `/configure`
- Verify endpoint is reachable
- Check browser network tab for API errors

## Customization

### Add New Metrics
1. Add query function to `src/data/queries.ts`
2. Create SWR hook with `useSWR`
3. Add component to dashboard page
4. Update refresh interval as needed

### Telco Branding
Color scheme uses blue/teal instead of purple:
- Primary: `blue.600` / `#0C7BDC`
- Accent: `blue.400` / `#2A9DF4`

To rebrand:
- Update theme in `App.tsx` welcome toast
- Change button `colorScheme` props
- Update Aura Analyst header color

## License

Apache 2.0 - SingleStore Labs
