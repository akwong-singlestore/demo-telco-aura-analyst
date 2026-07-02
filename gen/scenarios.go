package gen

import (
	"math/rand"
)

// SelectNextScenario picks a scenario to run
func SelectNextScenario(state *State) {
	scenarios := []Scenario{
		{
			Name:              "Phoenix Congestion Spike",
			Type:              "congestion",
			AffectedMarketIDs: []int64{1}, // Phoenix
			AffectedDevices:   []string{},
			Severity:          "major",
			DurationTicks:     10,
			ImpactRate:        0.4, // 40% of subscribers in market affected
		},
		{
			Name:              "Samsung Galaxy Device Issue",
			Type:              "device_issue",
			AffectedMarketIDs: []int64{}, // all markets
			AffectedDevices:   []string{"Samsung Galaxy S23", "Samsung Galaxy A54"},
			Severity:          "minor",
			DurationTicks:     15,
			ImpactRate:        0.25,
		},
		{
			Name:              "Southeast Regional Outage",
			Type:              "regional_outage",
			AffectedMarketIDs: []int64{3, 5}, // Atlanta, Miami
			AffectedDevices:   []string{},
			Severity:          "critical",
			DurationTicks:     5,
			ImpactRate:        0.6,
		},
		{
			Name:              "Denver Prepaid Churn Risk",
			Type:              "prepaid_churn",
			AffectedMarketIDs: []int64{6}, // Denver
			AffectedDevices:   []string{},
			Severity:          "major",
			DurationTicks:     12,
			ImpactRate:        0.35,
		},
		{
			Name:              "iOS Update Latency Spike",
			Type:              "device_issue",
			AffectedMarketIDs: []int64{},
			AffectedDevices:   []string{"iPhone 14", "iPhone 13"},
			Severity:          "minor",
			DurationTicks:     8,
			ImpactRate:        0.20,
		},
	}

	// Pick random scenario
	state.CurrentScenario = &scenarios[state.Rand.Intn(len(scenarios))]
	state.ScenarioTick = 0

	// Mark affected subscribers
	for i := range state.Subscribers {
		sub := &state.Subscribers[i]
		sub.AffectedByScenario = false

		// Check if subscriber is affected
		if state.CurrentScenario.Type == "congestion" || state.CurrentScenario.Type == "regional_outage" || state.CurrentScenario.Type == "prepaid_churn" {
			// Market-based
			for _, marketID := range state.CurrentScenario.AffectedMarketIDs {
				if sub.HomeMarketID == marketID && state.Rand.Float64() < state.CurrentScenario.ImpactRate {
					sub.AffectedByScenario = true
					break
				}
			}

			// Special handling for prepaid churn
			if state.CurrentScenario.Type == "prepaid_churn" && sub.LineType != "prepaid" {
				sub.AffectedByScenario = false
			}
		} else if state.CurrentScenario.Type == "device_issue" {
			// Device-based
			for _, device := range state.CurrentScenario.AffectedDevices {
				if sub.DeviceModel == device && state.Rand.Float64() < state.CurrentScenario.ImpactRate {
					sub.AffectedByScenario = true
					break
				}
			}
		}
	}
}

// IsScenarioActive returns whether a scenario is currently running
func IsScenarioActive(state *State) bool {
	if state.CurrentScenario == nil {
		return false
	}
	return state.ScenarioTick < state.CurrentScenario.DurationTicks
}

// AdvanceScenario moves the scenario forward
func AdvanceScenario(state *State) {
	if state.CurrentScenario != nil {
		state.ScenarioTick++

		if state.ScenarioTick >= state.CurrentScenario.DurationTicks {
			// Scenario ended, reset affected flags
			for i := range state.Subscribers {
				state.Subscribers[i].AffectedByScenario = false
			}
			state.CurrentScenario = nil
		}
	}
}
