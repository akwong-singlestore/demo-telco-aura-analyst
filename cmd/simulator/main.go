package main

import (
	"database/sql"
	"encoding/json"
	"flag"
	"fmt"
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
		Rand:                    rand.New(rand.NewSource(time.Now().UnixNano())),
		SubscriberCount:         *subscriberCount,
		EventProbability:        0.02,
		CareCaseProbability:     0.01,
		RetentionActionProb:     0.005,
	}

	gen.InitReferenceData(state)
	gen.InitSubscribers(state, *subscriberCount)

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
	data, _ := json.Marshal(events)
	query := fmt.Sprintf("CALL process_network_events(%s)", string(data))
	_, err := db.Exec(query)
	if err != nil {
		log.Printf("Error inserting network events: %v", err)
	}
}

func insertUsageSummaries(db *sql.DB, summaries []gen.UsageSummary) {
	data, _ := json.Marshal(summaries)
	query := fmt.Sprintf("CALL process_usage_summary(%s)", string(data))
	_, err := db.Exec(query)
	if err != nil {
		log.Printf("Error inserting usage summaries: %v", err)
	}
}

func insertCareCases(db *sql.DB, cases []gen.CareCase) {
	data, _ := json.Marshal(cases)
	query := fmt.Sprintf("CALL process_care_cases(%s)", string(data))
	_, err := db.Exec(query)
	if err != nil {
		log.Printf("Error inserting care cases: %v", err)
	}
}

func insertRetentionActions(db *sql.DB, actions []gen.RetentionAction) {
	data, _ := json.Marshal(actions)
	query := fmt.Sprintf("CALL process_retention_actions(%s)", string(data))
	_, err := db.Exec(query)
	if err != nil {
		log.Printf("Error inserting retention actions: %v", err)
	}
}
