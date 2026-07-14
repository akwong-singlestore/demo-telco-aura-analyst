package main

import (
	"context"
	"flag"
	"log"
	"math/rand"
	"time"

	"telco-demo/gen"
	"telco-demo/output"
)

func main() {
	outputDir := flag.String("output", "/tmp/telco-data", "Output directory for Parquet files")
	prefix := flag.String("prefix", "v1/1k-2p", "Data prefix (e.g., v1/1k-2p)")
	subscriberCount := flag.Int("subscribers", 1000, "Number of subscribers to simulate")
	iterations := flag.Int("iterations", 10, "Number of iterations to generate")
	tickInterval := flag.Duration("tick", 5*time.Second, "Tick interval")
	partition := flag.Int("partition", 0, "Partition ID for parallel runs")
	flag.Parse()

	ctx := context.Background()

	state := &gen.State{
		Rand:                rand.New(rand.NewSource(time.Now().UnixNano())),
		PartitionId:         *partition,
		SubscriberCount:     *subscriberCount,
		EventProbability:    0.02,
		CareCaseProbability: 0.01,
		RetentionActionProb: 0.03,
	}

	gen.InitReferenceData(state)
	gen.InitSubscribers(state, *subscriberCount)

	log.Printf("Starting Parquet simulator: output=%s, prefix=%s, subscribers=%d, iterations=%d",
		*outputDir, *prefix, *subscriberCount, *iterations)

	writer := output.NewParquetWriter(*outputDir, *prefix, *partition)

	for i := 0; i < *iterations; i++ {
		networkEvents, usageSummaries, careCases, retentionActions := gen.GenerateEvents(state)

		// Write to S3 in parallel
		errChan := make(chan error, 4)

		go func() {
			errChan <- writer.WriteNetworkEvents(ctx, networkEvents)
		}()
		go func() {
			errChan <- writer.WriteUsageSummaries(ctx, usageSummaries)
		}()
		go func() {
			errChan <- writer.WriteCareCases(ctx, careCases)
		}()
		go func() {
			errChan <- writer.WriteRetentionActions(ctx, retentionActions)
		}()

		// Check for errors
		for j := 0; j < 4; j++ {
			if err := <-errChan; err != nil {
				log.Printf("Error writing to S3: %v", err)
			}
		}

		scenarioInfo := "baseline"
		if gen.IsScenarioActive(state) {
			scenarioInfo = state.CurrentScenario.Name
		}

		log.Printf("Iteration %d/%d: events=%d, usage=%d, care=%d, retention=%d, scenario=%s",
			i+1, *iterations, len(networkEvents), len(usageSummaries), len(careCases), len(retentionActions), scenarioInfo)

		if i < *iterations-1 {
			time.Sleep(*tickInterval)
		}
	}

	log.Printf("Completed %d iterations. Files written to %s/%s/", *iterations, *outputDir, *prefix)
	log.Println("Next steps:")
	log.Println("1. Upload files to S3: aws s3 sync", *outputDir, "s3://s2-telco-aura-demo/")
	log.Println("2. Create SingleStore pipelines to ingest from S3")
	log.Println("3. Start the pipelines to load data into your database")
}
