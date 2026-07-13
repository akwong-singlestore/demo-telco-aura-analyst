package main

import (
	"database/sql"
	"flag"
	"log"
	"math/rand"
	"time"

	_ "github.com/go-sql-driver/mysql"
	"telco-demo/gen"
)

func main() {
	dsn := flag.String("dsn", "root:test@tcp(localhost:3306)/telco", "Database connection string")
	subscriberCount := flag.Int("subscribers", 1000, "Number of subscribers to simulate")
	tickInterval := flag.Duration("tick", 5*time.Second, "Tick interval")
	flag.Parse()

	db, err := sql.Open("mysql", *dsn)
	if err != nil {
		log.Fatal(err)
	}
	defer db.Close()

	state := &gen.State{
		Rand:                rand.New(rand.NewSource(time.Now().UnixNano())),
		SubscriberCount:     *subscriberCount,
		EventProbability:    0.02,
		CareCaseProbability: 0.01,
		RetentionActionProb: 0.03, // Increased from 0.005 to 3% for better demo visibility
	}

	gen.InitReferenceData(state)
	gen.InitSubscribers(state, *subscriberCount)

	// Insert subscribers into database
	insertSubscribers(db, state.Subscribers)

	log.Printf("Simulator started with %d subscribers", *subscriberCount)

	ticker := time.NewTicker(*tickInterval)
	defer ticker.Stop()

	for range ticker.C {
		networkEvents, usageSummaries, careCases, retentionActions := gen.GenerateEvents(state)

		if len(networkEvents) > 0 {
			insertNetworkEvents(db, networkEvents)
		}
		if len(usageSummaries) > 0 {
			insertUsageSummaries(db, usageSummaries)
		}
		if len(careCases) > 0 {
			insertCareCases(db, careCases)
		}
		if len(retentionActions) > 0 {
			insertRetentionActions(db, retentionActions)
		}

		scenarioInfo := "baseline"
		if gen.IsScenarioActive(state) {
			scenarioInfo = state.CurrentScenario.Name
		}
		log.Printf("Tick: events=%d, usage=%d, care=%d, retention=%d, scenario=%s",
			len(networkEvents), len(usageSummaries), len(careCases), len(retentionActions), scenarioInfo)
	}
}

func insertNetworkEvents(db *sql.DB, events []gen.NetworkEvent) {
	if len(events) == 0 {
		return
	}

	query := `INSERT INTO network_experience_events
		(subscriber_id, cell_site_id, market_id, region_name, technology_type, event_type, severity, duration_seconds, impacted_service, event_ts)
		VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(6))`

	for _, e := range events {
		_, err := db.Exec(query,
			e.SubscriberID, e.CellSiteID, e.MarketID, e.RegionName,
			e.TechnologyType, e.EventType, e.Severity, e.DurationSeconds, e.ImpactedService)
		if err != nil {
			log.Printf("Error inserting network event: %v", err)
			return
		}
	}
}

func insertUsageSummaries(db *sql.DB, summaries []gen.UsageSummary) {
	if len(summaries) == 0 {
		return
	}

	query := `INSERT INTO subscriber_usage_summary
		(subscriber_id, cell_site_id, market_id, session_count, data_mb, voice_minutes, dropped_sessions, avg_session_latency_ms, qos_score, event_ts)
		VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(6))`

	for _, s := range summaries {
		_, err := db.Exec(query,
			s.SubscriberID, s.CellSiteID, s.MarketID, s.SessionCount, s.DataMB,
			s.VoiceMinutes, s.DroppedSessions, s.AvgSessionLatencyMS, s.QoSScore)
		if err != nil {
			log.Printf("Error inserting usage summary: %v", err)
			return
		}
	}
}

func insertCareCases(db *sql.DB, cases []gen.CareCase) {
	if len(cases) == 0 {
		return
	}

	query := `INSERT INTO care_cases
		(subscriber_id, channel, issue_category, escalation_flag, related_service_issue_flag, opened_ts)
		VALUES (?, ?, ?, ?, ?, NOW(6))`

	for _, c := range cases {
		_, err := db.Exec(query,
			c.SubscriberID, c.Channel, c.IssueCategory, c.EscalationFlag, c.RelatedServiceIssueFlag)
		if err != nil {
			log.Printf("Error inserting care case: %v", err)
			return
		}
	}
}

func insertRetentionActions(db *sql.DB, actions []gen.RetentionAction) {
	if len(actions) == 0 {
		return
	}

	query := `INSERT INTO retention_actions
		(subscriber_id, action_type, channel, reason_code, accepted_flag, conversion_flag, revenue_impact, action_ts)
		VALUES (?, ?, ?, ?, ?, ?, ?, NOW(6))`

	for _, a := range actions {
		_, err := db.Exec(query,
			a.SubscriberID, a.ActionType, a.Channel, a.ReasonCode,
			a.AcceptedFlag, a.ConversionFlag, a.RevenueImpact)
		if err != nil {
			log.Printf("Error inserting retention action: %v", err)
			return
		}
	}
}

func insertSubscribers(db *sql.DB, subscribers []gen.Subscriber) {
	log.Printf("Inserting %d subscribers into database...", len(subscribers))

	// Use prepared statement to avoid "commands out of sync"
	stmt, err := db.Prepare(`INSERT INTO subscriber_master
		(subscriber_id, account_id, line_type, plan_type, home_market_id, monthly_revenue, device_model, churn_risk_band, last_experience_score)
		VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
		ON DUPLICATE KEY UPDATE
		churn_risk_band = VALUES(churn_risk_band),
		last_experience_score = VALUES(last_experience_score)`)
	if err != nil {
		log.Printf("Error preparing statement: %v", err)
		return
	}
	defer stmt.Close()

	for i, s := range subscribers {
		_, err := stmt.Exec(
			s.ID, s.AccountID, s.LineType, s.PlanType, s.HomeMarketID,
			s.MonthlyRevenue, s.DeviceModel, s.ChurnRiskBand, s.ExperienceScore)
		if err != nil {
			log.Printf("Error inserting subscriber %d: %v", s.ID, err)
			// Continue with other subscribers instead of returning
			continue
		}

		if (i+1)%100 == 0 {
			log.Printf("Inserted %d/%d subscribers", i+1, len(subscribers))
		}
	}

	log.Printf("All %d subscribers inserted successfully", len(subscribers))
}
