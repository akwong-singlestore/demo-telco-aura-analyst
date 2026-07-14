package output

import (
	"context"
	"fmt"
	"os"
	"path/filepath"
	"time"

	"github.com/xitongsys/parquet-go-source/local"
	"github.com/xitongsys/parquet-go/writer"
	"telco-demo/gen"
)

// NetworkEventParquet represents network event for Parquet output
type NetworkEventParquet struct {
	SubscriberID    int64  `parquet:"name=subscriber_id, type=INT64"`
	CellSiteID      int64  `parquet:"name=cell_site_id, type=INT64"`
	MarketID        int64  `parquet:"name=market_id, type=INT64"`
	RegionName      string `parquet:"name=region_name, type=BYTE_ARRAY, convertedtype=UTF8"`
	TechnologyType  string `parquet:"name=technology_type, type=BYTE_ARRAY, convertedtype=UTF8"`
	EventType       string `parquet:"name=event_type, type=BYTE_ARRAY, convertedtype=UTF8"`
	Severity        string `parquet:"name=severity, type=BYTE_ARRAY, convertedtype=UTF8"`
	DurationSeconds int32  `parquet:"name=duration_seconds, type=INT32"`
	ImpactedService string `parquet:"name=impacted_service, type=BYTE_ARRAY, convertedtype=UTF8"`
}

// UsageSummaryParquet represents usage summary for Parquet output
type UsageSummaryParquet struct {
	SubscriberID        int64   `parquet:"name=subscriber_id, type=INT64"`
	CellSiteID          int64   `parquet:"name=cell_site_id, type=INT64"`
	MarketID            int64   `parquet:"name=market_id, type=INT64"`
	SessionCount        int32   `parquet:"name=session_count, type=INT32"`
	DataMB              float64 `parquet:"name=data_mb, type=DOUBLE"`
	VoiceMinutes        float64 `parquet:"name=voice_minutes, type=DOUBLE"`
	DroppedSessions     int32   `parquet:"name=dropped_sessions, type=INT32"`
	AvgSessionLatencyMS int32   `parquet:"name=avg_session_latency_ms, type=INT32"`
	QoSScore            float64 `parquet:"name=qos_score, type=DOUBLE"`
}

// CareCaseParquet represents care case for Parquet output
type CareCaseParquet struct {
	SubscriberID            int64  `parquet:"name=subscriber_id, type=INT64"`
	Channel                 string `parquet:"name=channel, type=BYTE_ARRAY, convertedtype=UTF8"`
	IssueCategory           string `parquet:"name=issue_category, type=BYTE_ARRAY, convertedtype=UTF8"`
	EscalationFlag          bool   `parquet:"name=escalation_flag, type=BOOLEAN"`
	RelatedServiceIssueFlag bool   `parquet:"name=related_service_issue_flag, type=BOOLEAN"`
}

// RetentionActionParquet represents retention action for Parquet output
type RetentionActionParquet struct {
	SubscriberID   int64   `parquet:"name=subscriber_id, type=INT64"`
	ActionType     string  `parquet:"name=action_type, type=BYTE_ARRAY, convertedtype=UTF8"`
	Channel        string  `parquet:"name=channel, type=BYTE_ARRAY, convertedtype=UTF8"`
	ReasonCode     string  `parquet:"name=reason_code, type=BYTE_ARRAY, convertedtype=UTF8"`
	AcceptedFlag   bool    `parquet:"name=accepted_flag, type=BOOLEAN"`
	ConversionFlag bool    `parquet:"name=conversion_flag, type=BOOLEAN"`
	RevenueImpact  float64 `parquet:"name=revenue_impact, type=DOUBLE"`
}

// ParquetWriter handles writing telco data to Parquet files
type ParquetWriter struct {
	outputDir string
	prefix    string
	partition int
}

// NewParquetWriter creates a new Parquet writer
func NewParquetWriter(outputDir, prefix string, partition int) *ParquetWriter {
	return &ParquetWriter{
		outputDir: outputDir,
		prefix:    prefix,
		partition: partition,
	}
}

// WriteNetworkEvents writes network events to Parquet
func (pw *ParquetWriter) WriteNetworkEvents(ctx context.Context, events []gen.NetworkEvent) error {
	if len(events) == 0 {
		return nil
	}

	timestamp := time.Now().Format("2006-01-02.150405.000000000")
	filename := fmt.Sprintf("%s/%s/network_events.%s.%04d.parquet", pw.outputDir, pw.prefix, timestamp, pw.partition)

	// Ensure directory exists
	if err := os.MkdirAll(filepath.Dir(filename), 0755); err != nil {
		return fmt.Errorf("failed to create directory: %w", err)
	}

	fw, err := local.NewLocalFileWriter(filename)
	if err != nil {
		return fmt.Errorf("failed to create file writer: %w", err)
	}
	defer fw.Close()

	pw_writer, err := writer.NewParquetWriter(fw, new(NetworkEventParquet), 4)
	if err != nil {
		return fmt.Errorf("failed to create Parquet writer: %w", err)
	}
	defer pw_writer.WriteStop()

	for _, e := range events {
		if err := pw_writer.Write(NetworkEventParquet{
			SubscriberID:    e.SubscriberID,
			CellSiteID:      e.CellSiteID,
			MarketID:        e.MarketID,
			RegionName:      e.RegionName,
			TechnologyType:  e.TechnologyType,
			EventType:       e.EventType,
			Severity:        e.Severity,
			DurationSeconds: int32(e.DurationSeconds),
			ImpactedService: e.ImpactedService,
		}); err != nil {
			return fmt.Errorf("failed to write event: %w", err)
		}
	}

	return nil
}

// WriteUsageSummaries writes usage summaries to Parquet
func (pw *ParquetWriter) WriteUsageSummaries(ctx context.Context, summaries []gen.UsageSummary) error {
	if len(summaries) == 0 {
		return nil
	}

	timestamp := time.Now().Format("2006-01-02.150405.000000000")
	filename := fmt.Sprintf("%s/%s/usage_summary.%s.%04d.parquet", pw.outputDir, pw.prefix, timestamp, pw.partition)

	if err := os.MkdirAll(filepath.Dir(filename), 0755); err != nil {
		return fmt.Errorf("failed to create directory: %w", err)
	}

	fw, err := local.NewLocalFileWriter(filename)
	if err != nil {
		return fmt.Errorf("failed to create file writer: %w", err)
	}
	defer fw.Close()

	pw_writer, err := writer.NewParquetWriter(fw, new(UsageSummaryParquet), 4)
	if err != nil {
		return fmt.Errorf("failed to create Parquet writer: %w", err)
	}
	defer pw_writer.WriteStop()

	for _, s := range summaries {
		if err := pw_writer.Write(UsageSummaryParquet{
			SubscriberID:        s.SubscriberID,
			CellSiteID:          s.CellSiteID,
			MarketID:            s.MarketID,
			SessionCount:        int32(s.SessionCount),
			DataMB:              s.DataMB,
			VoiceMinutes:        s.VoiceMinutes,
			DroppedSessions:     int32(s.DroppedSessions),
			AvgSessionLatencyMS: int32(s.AvgSessionLatencyMS),
			QoSScore:            s.QoSScore,
		}); err != nil {
			return fmt.Errorf("failed to write summary: %w", err)
		}
	}

	return nil
}

// WriteCareCases writes care cases to Parquet
func (pw *ParquetWriter) WriteCareCases(ctx context.Context, cases []gen.CareCase) error {
	if len(cases) == 0 {
		return nil
	}

	timestamp := time.Now().Format("2006-01-02.150405.000000000")
	filename := fmt.Sprintf("%s/%s/care_cases.%s.%04d.parquet", pw.outputDir, pw.prefix, timestamp, pw.partition)

	if err := os.MkdirAll(filepath.Dir(filename), 0755); err != nil {
		return fmt.Errorf("failed to create directory: %w", err)
	}

	fw, err := local.NewLocalFileWriter(filename)
	if err != nil {
		return fmt.Errorf("failed to create file writer: %w", err)
	}
	defer fw.Close()

	pw_writer, err := writer.NewParquetWriter(fw, new(CareCaseParquet), 4)
	if err != nil {
		return fmt.Errorf("failed to create Parquet writer: %w", err)
	}
	defer pw_writer.WriteStop()

	for _, c := range cases {
		if err := pw_writer.Write(CareCaseParquet{
			SubscriberID:            c.SubscriberID,
			Channel:                 c.Channel,
			IssueCategory:           c.IssueCategory,
			EscalationFlag:          c.EscalationFlag,
			RelatedServiceIssueFlag: c.RelatedServiceIssueFlag,
		}); err != nil {
			return fmt.Errorf("failed to write care case: %w", err)
		}
	}

	return nil
}

// WriteRetentionActions writes retention actions to Parquet
func (pw *ParquetWriter) WriteRetentionActions(ctx context.Context, actions []gen.RetentionAction) error {
	if len(actions) == 0 {
		return nil
	}

	timestamp := time.Now().Format("2006-01-02.150405.000000000")
	filename := fmt.Sprintf("%s/%s/retention_actions.%s.%04d.parquet", pw.outputDir, pw.prefix, timestamp, pw.partition)

	if err := os.MkdirAll(filepath.Dir(filename), 0755); err != nil {
		return fmt.Errorf("failed to create directory: %w", err)
	}

	fw, err := local.NewLocalFileWriter(filename)
	if err != nil {
		return fmt.Errorf("failed to create file writer: %w", err)
	}
	defer fw.Close()

	pw_writer, err := writer.NewParquetWriter(fw, new(RetentionActionParquet), 4)
	if err != nil {
		return fmt.Errorf("failed to create Parquet writer: %w", err)
	}
	defer pw_writer.WriteStop()

	for _, a := range actions {
		if err := pw_writer.Write(RetentionActionParquet{
			SubscriberID:   a.SubscriberID,
			ActionType:     a.ActionType,
			Channel:        a.Channel,
			ReasonCode:     a.ReasonCode,
			AcceptedFlag:   a.AcceptedFlag,
			ConversionFlag: a.ConversionFlag,
			RevenueImpact:  a.RevenueImpact,
		}); err != nil {
			return fmt.Errorf("failed to write retention action: %w", err)
		}
	}

	return nil
}
