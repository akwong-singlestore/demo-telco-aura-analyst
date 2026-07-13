package gen

type NetworkEvent struct {
	SubscriberID     int64  `json:"subscriber_id"`
	CellSiteID       int64  `json:"cell_site_id"`
	MarketID         int64  `json:"market_id"`
	RegionName       string `json:"region_name"`
	TechnologyType   string `json:"technology_type"`
	EventType        string `json:"event_type"`
	Severity         string `json:"severity"`
	DurationSeconds  int    `json:"duration_seconds"`
	ImpactedService  string `json:"impacted_service"`
}

type UsageSummary struct {
	SubscriberID        int64   `json:"subscriber_id"`
	CellSiteID          int64   `json:"cell_site_id"`
	MarketID            int64   `json:"market_id"`
	SessionCount        int     `json:"session_count"`
	DataMB              float64 `json:"data_mb"`
	VoiceMinutes        float64 `json:"voice_minutes"`
	DroppedSessions     int     `json:"dropped_sessions"`
	AvgSessionLatencyMS int     `json:"avg_session_latency_ms"`
	QoSScore            float64 `json:"qos_score"`
}

type CareCase struct {
	SubscriberID             int64  `json:"subscriber_id"`
	Channel                  string `json:"channel"`
	IssueCategory            string `json:"issue_category"`
	EscalationFlag           bool   `json:"escalation_flag"`
	RelatedServiceIssueFlag  bool   `json:"related_service_issue_flag"`
}

type RetentionAction struct {
	SubscriberID    int64   `json:"subscriber_id"`
	ActionType      string  `json:"action_type"`
	Channel         string  `json:"channel"`
	ReasonCode      string  `json:"reason_code"`
	AcceptedFlag    bool    `json:"accepted_flag"`
	ConversionFlag  bool    `json:"conversion_flag"`
	RevenueImpact   float64 `json:"revenue_impact"`
}

// GenerateEvents creates events for this tick
func GenerateEvents(state *State) ([]NetworkEvent, []UsageSummary, []CareCase, []RetentionAction) {
	var networkEvents []NetworkEvent
	var usageSummaries []UsageSummary
	var careCases []CareCase
	var retentionActions []RetentionAction

	// If no active scenario, maybe start one
	if !IsScenarioActive(state) && state.Rand.Float64() < 0.15 {
		SelectNextScenario(state)
	}

	// Process each subscriber
	for _, sub := range state.Subscribers {
		// Generate usage summary periodically
		if state.Rand.Float64() < 0.05 { // 5% per tick
			usageSummaries = append(usageSummaries, generateUsageSummary(state, &sub))
		}

		// Generate network events
		if sub.AffectedByScenario {
			// Higher event rate for affected subscribers
			if state.Rand.Float64() < 0.3 {
				networkEvents = append(networkEvents, generateNetworkEvent(state, &sub, true))
			}

			// Higher care case rate
			if state.Rand.Float64() < 0.08 {
				careCases = append(careCases, generateCareCase(state, &sub, true))
			}

			// Trigger retention actions for at-risk
			if sub.ChurnRiskBand == "high" || sub.ChurnRiskBand == "critical" {
				if state.Rand.Float64() < 0.04 {
					retentionActions = append(retentionActions, generateRetentionAction(state, &sub))
				}
			}
		} else {
			// Baseline event rates
			if state.Rand.Float64() < state.EventProbability {
				networkEvents = append(networkEvents, generateNetworkEvent(state, &sub, false))
			}

			if state.Rand.Float64() < state.CareCaseProbability {
				careCases = append(careCases, generateCareCase(state, &sub, false))
			}

			if (sub.ChurnRiskBand == "high" || sub.ChurnRiskBand == "critical") && state.Rand.Float64() < state.RetentionActionProb {
				retentionActions = append(retentionActions, generateRetentionAction(state, &sub))
			}
		}
	}

	// Advance scenario
	AdvanceScenario(state)

	return networkEvents, usageSummaries, careCases, retentionActions
}

func generateNetworkEvent(state *State, sub *Subscriber, isAffected bool) NetworkEvent {
	eventTypes := []string{"high_latency", "packet_loss", "session_drop", "no_service", "slow_data"}
	_ = []string{"minor", "major", "critical"} // severities (kept for reference but not used)
	impactedServices := []string{"data", "voice", "sms"}
	technologies := []string{"4G", "5G"}

	var severity string
	if isAffected && state.CurrentScenario != nil {
		severity = state.CurrentScenario.Severity
	} else {
		// Normal distribution: mostly minor
		sevRand := state.Rand.Float64()
		if sevRand < 0.7 {
			severity = "minor"
		} else if sevRand < 0.95 {
			severity = "major"
		} else {
			severity = "critical"
		}
	}

	var eventType string
	if isAffected && state.CurrentScenario != nil {
		if state.CurrentScenario.Type == "congestion" {
			eventType = "high_latency"
		} else if state.CurrentScenario.Type == "regional_outage" {
			eventType = "no_service"
		} else {
			eventType = "session_drop"
		}
	} else {
		eventType = eventTypes[state.Rand.Intn(len(eventTypes))]
	}

	return NetworkEvent{
		SubscriberID:    sub.ID,
		CellSiteID:      sub.HomeCellSiteID,
		MarketID:        sub.HomeMarketID,
		RegionName:      sub.RegionName,
		TechnologyType:  technologies[state.Rand.Intn(len(technologies))],
		EventType:       eventType,
		Severity:        severity,
		DurationSeconds: 10 + state.Rand.Intn(300),
		ImpactedService: impactedServices[state.Rand.Intn(len(impactedServices))],
	}
}

func generateUsageSummary(state *State, sub *Subscriber) UsageSummary {
	baseQos := sub.ExperienceScore

	// Degrade QoS if affected by scenario
	if sub.AffectedByScenario {
		baseQos = baseQos * 0.6 // significant degradation
	}

	droppedSessions := 0
	if sub.AffectedByScenario {
		droppedSessions = state.Rand.Intn(5) + 1
	} else if state.Rand.Float64() < 0.2 {
		droppedSessions = state.Rand.Intn(2)
	}

	latency := 20 + state.Rand.Intn(100)
	if sub.AffectedByScenario && state.CurrentScenario != nil && state.CurrentScenario.Type == "congestion" {
		latency = 150 + state.Rand.Intn(300)
	}

	return UsageSummary{
		SubscriberID:        sub.ID,
		CellSiteID:          sub.HomeCellSiteID,
		MarketID:            sub.HomeMarketID,
		SessionCount:        10 + state.Rand.Intn(50),
		DataMB:              500.0 + state.Rand.Float64()*5000.0,
		VoiceMinutes:        30.0 + state.Rand.Float64()*150.0,
		DroppedSessions:     droppedSessions,
		AvgSessionLatencyMS: latency,
		QoSScore:            baseQos + (state.Rand.Float64()*10.0 - 5.0), // +/- 5
	}
}

func generateCareCase(state *State, sub *Subscriber, isAffected bool) CareCase {
	channels := []string{"phone", "chat", "app", "email"}
	issueCategories := []string{
		"network_quality",
		"billing_question",
		"device_troubleshooting",
		"service_outage",
		"plan_change_request",
		"technical_support",
	}

	var issueCategory string
	var relatedToService bool

	if isAffected {
		// More likely to be service-related
		relatedToService = true
		if state.CurrentScenario != nil {
			if state.CurrentScenario.Type == "congestion" || state.CurrentScenario.Type == "regional_outage" {
				issueCategory = "service_outage"
			} else {
				issueCategory = "network_quality"
			}
		} else {
			issueCategory = "network_quality"
		}
	} else {
		relatedToService = state.Rand.Float64() < 0.3
		issueCategory = issueCategories[state.Rand.Intn(len(issueCategories))]
	}

	return CareCase{
		SubscriberID:            sub.ID,
		Channel:                 channels[state.Rand.Intn(len(channels))],
		IssueCategory:           issueCategory,
		EscalationFlag:          state.Rand.Float64() < 0.1,
		RelatedServiceIssueFlag: relatedToService,
	}
}

func generateRetentionAction(state *State, sub *Subscriber) RetentionAction {
	actionTypes := []string{"discount_offer", "plan_upgrade", "device_upgrade", "loyalty_credit", "service_credit"}
	channels := []string{"outbound_call", "sms", "email", "in_app"}
	reasonCodes := []string{"churn_risk", "poor_experience", "complaint_resolution"}

	acceptanceRate := 0.35
	conversionRate := 0.25

	if sub.LineType == "prepaid" {
		acceptanceRate = 0.25
		conversionRate = 0.18
	} else if sub.MonthlyRevenue > 100 {
		acceptanceRate = 0.45
		conversionRate = 0.35
	}

	accepted := state.Rand.Float64() < acceptanceRate
	converted := accepted && (state.Rand.Float64() < conversionRate)

	revenueImpact := -15.0 - state.Rand.Float64()*20.0 // discounts
	if converted {
		revenueImpact = -10.0 // successful retention costs less
	}

	return RetentionAction{
		SubscriberID:   sub.ID,
		ActionType:     actionTypes[state.Rand.Intn(len(actionTypes))],
		Channel:        channels[state.Rand.Intn(len(channels))],
		ReasonCode:     reasonCodes[state.Rand.Intn(len(reasonCodes))],
		AcceptedFlag:   accepted,
		ConversionFlag: converted,
		RevenueImpact:  revenueImpact,
	}
}
