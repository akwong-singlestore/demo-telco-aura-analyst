package gen

// InitSubscribers initializes the subscriber population
func InitSubscribers(state *State, count int) {
	state.Subscribers = make([]Subscriber, count)
	offset := count * state.PartitionId

	_ = []string{"postpaid", "prepaid", "enterprise"} // lineTypes (kept for reference but not used)
	deviceModels := []string{
		"iPhone 14", "iPhone 13", "Samsung Galaxy S23",
		"Google Pixel 7", "Samsung Galaxy A54",
	}
	_ = []string{"low", "medium", "high", "critical"} // churnBands (kept for reference but not used)

	for i := 0; i < count; i++ {
		subscriberID := int64(1000000 + offset + i)

		// Pick random market and cell site
		marketIdx := state.Rand.Intn(len(state.Markets))
		market := state.Markets[marketIdx]

		// Find cell sites in this market
		var marketCellSites []CellSite
		for _, cs := range state.CellSites {
			if cs.MarketID == market.ID {
				marketCellSites = append(marketCellSites, cs)
			}
		}

		var cellSiteID int64 = 101 // default
		if len(marketCellSites) > 0 {
			cellSiteID = marketCellSites[state.Rand.Intn(len(marketCellSites))].ID
		}

		// Determine line type
		lineTypeRand := state.Rand.Float64()
		var lineType, planType string
		var monthlyRevenue float64
		if lineTypeRand < 0.6 {
			lineType = "postpaid"
			planType = []string{"Unlimited Plus", "Premium 5G", "Standard Postpaid"}[state.Rand.Intn(3)]
			monthlyRevenue = 45.0 + state.Rand.Float64()*155.0
		} else if lineTypeRand < 0.9 {
			lineType = "prepaid"
			planType = []string{"Prepaid Basic", "Prepaid Data", "Pay As You Go"}[state.Rand.Intn(3)]
			monthlyRevenue = 25.0 + state.Rand.Float64()*50.0
		} else {
			lineType = "enterprise"
			planType = []string{"Business Unlimited", "Enterprise Premium", "Corporate Plan"}[state.Rand.Intn(3)]
			monthlyRevenue = 65.0 + state.Rand.Float64()*135.0
		}

		// Churn risk (most are low, some are higher)
		churnDist := state.Rand.Float64()
		var churnBand string
		if churnDist < 0.65 {
			churnBand = "low"
		} else if churnDist < 0.90 {
			churnBand = "medium"
		} else if churnDist < 0.97 {
			churnBand = "high"
		} else {
			churnBand = "critical"
		}

		state.Subscribers[i] = Subscriber{
			ID:                 subscriberID,
			AccountID:          subscriberID,
			LineType:           lineType,
			PlanType:           planType,
			HomeMarketID:       market.ID,
			HomeCellSiteID:     cellSiteID,
			RegionName:         market.RegionName,
			MonthlyRevenue:     monthlyRevenue,
			ChurnRiskBand:      churnBand,
			DeviceModel:        deviceModels[state.Rand.Intn(len(deviceModels))],
			AffectedByScenario: false,
			ExperienceScore:    60.0 + state.Rand.Float64()*35.0, // 60-95 baseline
		}
	}
}

// InitReferenceData initializes markets and cell sites
func InitReferenceData(state *State) {
	// Initialize markets (subset from seed data)
	state.Markets = []Market{
		{ID: 1, Name: "Phoenix", RegionName: "Southwest", UrbanRural: "urban", PopulationDensity: 3200},
		{ID: 2, Name: "Dallas", RegionName: "South", UrbanRural: "urban", PopulationDensity: 3800},
		{ID: 3, Name: "Atlanta", RegionName: "Southeast", UrbanRural: "urban", PopulationDensity: 3600},
		{ID: 4, Name: "Seattle", RegionName: "Northwest", UrbanRural: "urban", PopulationDensity: 8400},
		{ID: 5, Name: "Miami", RegionName: "Southeast", UrbanRural: "urban", PopulationDensity: 12100},
		{ID: 6, Name: "Denver", RegionName: "Mountain", UrbanRural: "urban", PopulationDensity: 4700},
		{ID: 7, Name: "Boston", RegionName: "Northeast", UrbanRural: "urban", PopulationDensity: 14400},
		{ID: 8, Name: "Las Vegas", RegionName: "Southwest", UrbanRural: "urban", PopulationDensity: 4600},
	}

	// Initialize cell sites (simplified)
	state.CellSites = []CellSite{
		{ID: 101, MarketID: 1, SiteName: "PHX-Downtown-1", SiteType: "macro", Technology: "5G", Capacity: 5000},
		{ID: 102, MarketID: 1, SiteName: "PHX-Scottsdale-1", SiteType: "macro", Technology: "5G", Capacity: 4500},
		{ID: 201, MarketID: 2, SiteName: "DAL-Downtown-1", SiteType: "macro", Technology: "5G", Capacity: 5500},
		{ID: 202, MarketID: 2, SiteName: "DAL-Plano-1", SiteType: "macro", Technology: "5G", Capacity: 4000},
		{ID: 301, MarketID: 3, SiteName: "ATL-Downtown-1", SiteType: "macro", Technology: "5G", Capacity: 6000},
		{ID: 302, MarketID: 3, SiteName: "ATL-Buckhead-1", SiteType: "macro", Technology: "5G", Capacity: 4500},
		{ID: 401, MarketID: 4, SiteName: "SEA-Downtown-1", SiteType: "macro", Technology: "5G", Capacity: 5000},
		{ID: 402, MarketID: 4, SiteName: "SEA-Bellevue-1", SiteType: "macro", Technology: "5G", Capacity: 4000},
		{ID: 501, MarketID: 5, SiteName: "MIA-Downtown-1", SiteType: "macro", Technology: "5G", Capacity: 6500},
		{ID: 502, MarketID: 5, SiteName: "MIA-Beach-1", SiteType: "macro", Technology: "5G", Capacity: 5500},
		{ID: 601, MarketID: 6, SiteName: "DEN-Downtown-1", SiteType: "macro", Technology: "5G", Capacity: 4500},
		{ID: 701, MarketID: 7, SiteName: "BOS-Downtown-1", SiteType: "macro", Technology: "5G", Capacity: 5500},
		{ID: 801, MarketID: 8, SiteName: "LV-Strip-1", SiteType: "macro", Technology: "5G", Capacity: 7000},
	}
}
