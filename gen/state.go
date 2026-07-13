package gen

import (
	"math/rand"
)

// State holds the simulator state
type State struct {
	Rand       *rand.Rand
	PartitionId int

	// Subscriber tracking
	Subscribers []Subscriber

	// Market and cell site data
	Markets   []Market
	CellSites []CellSite

	// Scenario state
	CurrentScenario *Scenario
	ScenarioTick    int

	// Configuration
	SubscriberCount         int
	EventProbability        float64
	CareCaseProbability     float64
	RetentionActionProb     float64
}

type Market struct {
	ID                int64
	Name              string
	RegionName        string
	UrbanRural        string
	PopulationDensity int
}

type CellSite struct {
	ID           int64
	MarketID     int64
	SiteName     string
	SiteType     string
	Technology   string
	Capacity     int
}

type Subscriber struct {
	ID                 int64
	AccountID          int64
	LineType           string
	PlanType           string
	HomeMarketID       int64
	HomeCellSiteID     int64
	RegionName         string
	MonthlyRevenue     float64
	ChurnRiskBand      string
	DeviceModel        string

	// Runtime state for scenarios
	AffectedByScenario bool
	ExperienceScore    float64
}

type Scenario struct {
	Name              string
	Type              string // "congestion", "device_issue", "regional_outage"
	AffectedMarketIDs []int64
	AffectedDevices   []string
	Severity          string
	DurationTicks     int
	ImpactRate        float64
}
