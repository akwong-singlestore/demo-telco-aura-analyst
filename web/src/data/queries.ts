import useSWR from "swr";
import { useRecoilValue } from "recoil";
import { connectionConfig, timeWindow } from "./recoil";
import { Query, QueryNoDb, ConnectionConfig, Row } from "./client";
import schemaStatements from "../../sql/schema.sql";
import seedStatements from "../../sql/seed.sql";
import { proceduresDDL } from "./proceduresDDL";
import { pipelinesDDL, startPipelines } from "./pipelinesDDL";

// Helper to convert time window string to SQL INTERVAL
const timeWindowToInterval = (window: string): string => {
  switch (window) {
    case "1h": return "1 HOUR";
    case "2h": return "2 HOUR";
    case "24h": return "24 HOUR";
    case "7d": return "7 DAY";
    default: return "2 HOUR";
  }
};

// Market health and degradation
export interface Market {
  market_id: number;
  market_name: string;
  region_name: string;
  severe_events_24h: number;
  impacted_subscribers_24h: number;
  avg_experience_score: number;
  care_cases_24h: number;
  degradation_index: number;
}

export const getMarketHealth = async (config: ConnectionConfig): Promise<Market[]> => {
  return await Query<Market>(
    config,
    `SELECT * FROM market_degradation_summary ORDER BY degradation_index DESC LIMIT 20`
  );
};

export const useMarketHealth = () => {
  const config = useRecoilValue(connectionConfig);
  return useSWR(["market_health", config], () => getMarketHealth(config), {
    refreshInterval: 5000,
  });
};

// Executive KPIs
export interface ExecutiveKPIs {
  total_subscribers: number;
  high_risk_subscribers: number;
  critical_risk_subscribers: number;
  avg_experience_score: number;
  care_cases_24h: number;
  open_care_cases: number;
  retention_actions_24h: number;
  conversion_rate: number;
}

export const getExecutiveKPIs = async (config: ConnectionConfig, window: string): Promise<ExecutiveKPIs> => {
  const interval = timeWindowToInterval(window);
  const result = await Query<ExecutiveKPIs>(
    config,
    `SELECT
      (SELECT COUNT(*) FROM subscriber_master) as total_subscribers,
      (SELECT COUNT(*) FROM subscriber_master WHERE churn_risk_band = 'high') as high_risk_subscribers,
      (SELECT COUNT(*) FROM subscriber_master WHERE churn_risk_band = 'critical') as critical_risk_subscribers,
      (SELECT AVG(experience_score) FROM subscriber_experience_scores) as avg_experience_score,
      (SELECT COUNT(*) FROM care_cases WHERE opened_ts > NOW(6) - INTERVAL ${interval}) as care_cases_24h,
      (SELECT COUNT(*) FROM care_cases WHERE closed_ts IS NULL) as open_care_cases,
      (SELECT COUNT(*) FROM retention_actions WHERE action_ts > NOW(6) - INTERVAL ${interval}) as retention_actions_24h,
      (SELECT AVG(conversion_rate) FROM intervention_effectiveness) as conversion_rate`
  );
  return result[0];
};

export const useExecutiveKPIs = () => {
  const config = useRecoilValue(connectionConfig);
  const window = useRecoilValue(timeWindow);
  return useSWR(["executive_kpis", config, window], () => getExecutiveKPIs(config, window), {
    refreshInterval: 10000,
  });
};

// At-risk subscribers
export interface AtRiskSubscriber {
  subscriber_id: number;
  account_id: number;
  line_type: string;
  monthly_revenue: number;
  home_market_id: number;
  market_name: string;
  churn_risk_band: string;
  experience_score: number;
  interventions_30d: number;
  successful_interventions_30d: number;
  care_cases_30d: number;
}

export const getAtRiskSubscribers = async (config: ConnectionConfig): Promise<AtRiskSubscriber[]> => {
  return await Query<AtRiskSubscriber>(
    config,
    `SELECT * FROM at_risk_high_value_subscribers
     WHERE interventions_30d = 0
     ORDER BY experience_score ASC, monthly_revenue DESC
     LIMIT 50`
  );
};

export const useAtRiskSubscribers = () => {
  const config = useRecoilValue(connectionConfig);
  return useSWR(["at_risk_subscribers", config], () => getAtRiskSubscribers(config), {
    refreshInterval: 10000,
  });
};

// Intervention effectiveness
export interface InterventionPerformance {
  action_type: string;
  channel: string;
  reason_code: string;
  line_type: string;
  churn_risk_band: string;
  total_actions: number;
  accepted_count: number;
  converted_count: number;
  acceptance_rate: number;
  conversion_rate: number;
  avg_revenue_impact: number;
  total_revenue_impact: number;
}

export const getInterventionPerformance = async (config: ConnectionConfig): Promise<InterventionPerformance[]> => {
  return await Query<InterventionPerformance>(
    config,
    `SELECT * FROM intervention_effectiveness
     WHERE total_actions > 5
     ORDER BY conversion_rate DESC
     LIMIT 20`
  );
};

export const useInterventionPerformance = () => {
  const config = useRecoilValue(connectionConfig);
  return useSWR(["intervention_performance", config], () => getInterventionPerformance(config), {
    refreshInterval: 15000,
  });
};

// Churn risk trend (last 7 days)
export interface ChurnRiskTrend {
  date: string;
  low_count: number;
  medium_count: number;
  high_count: number;
  critical_count: number;
}

export const getChurnRiskTrend = async (config: ConnectionConfig): Promise<ChurnRiskTrend[]> => {
  return await Query<ChurnRiskTrend>(
    config,
    `SELECT
      DATE(event_ts) as date,
      COUNT(DISTINCT CASE WHEN severity = 'minor' THEN subscriber_id END) as low_count,
      COUNT(DISTINCT CASE WHEN severity = 'major' THEN subscriber_id END) as medium_count,
      COUNT(DISTINCT CASE WHEN severity = 'major' THEN subscriber_id END) * 0.3 as high_count,
      COUNT(DISTINCT CASE WHEN severity = 'critical' THEN subscriber_id END) as critical_count
     FROM network_experience_events
     WHERE event_ts > NOW(6) - INTERVAL 7 DAY
     GROUP BY DATE(event_ts)
     ORDER BY date ASC
     LIMIT 7`
  );
};

export const useChurnRiskTrend = () => {
  const config = useRecoilValue(connectionConfig);
  return useSWR(["churn_risk_trend", config], () => getChurnRiskTrend(config), {
    refreshInterval: 30000,
  });
};

// Recent network events
export interface NetworkEvent {
  event_id: number;
  event_ts: string;
  subscriber_id: number;
  cell_site_id: number;
  market_id: number;
  region_name: string;
  technology_type: string;
  event_type: string;
  severity: string;
  duration_seconds: number;
  impacted_service: string;
  resolved_flag: boolean;
}

export const getRecentNetworkEvents = async (config: ConnectionConfig, window: string, limit: number = 100): Promise<NetworkEvent[]> => {
  const interval = timeWindowToInterval(window);
  return await Query<NetworkEvent>(
    config,
    `SELECT * FROM network_experience_events
     WHERE event_ts > NOW(6) - INTERVAL ${interval}
     ORDER BY event_ts DESC
     LIMIT ?`,
    limit
  );
};

export const useRecentNetworkEvents = (limit: number = 100) => {
  const config = useRecoilValue(connectionConfig);
  const window = useRecoilValue(timeWindow);
  return useSWR(["recent_network_events", config, window, limit], () => getRecentNetworkEvents(config, window, limit), {
    refreshInterval: 5000,
  });
};

// Care volume by issue category
export interface CareVolumeByIssue {
  issue_category: string;
  case_count: number;
  avg_handle_time_seconds: number;
  escalation_rate: number;
  avg_csat_score: number;
}

export const getCareVolumeByIssue = async (config: ConnectionConfig, window: string): Promise<CareVolumeByIssue[]> => {
  const interval = timeWindowToInterval(window);
  return await Query<CareVolumeByIssue>(
    config,
    `SELECT
      issue_category,
      COUNT(*) as case_count,
      AVG(handle_time_seconds) as avg_handle_time_seconds,
      SUM(CASE WHEN escalation_flag THEN 1 ELSE 0 END) * 100.0 / COUNT(*) as escalation_rate,
      AVG(csat_score) as avg_csat_score
     FROM care_cases
     WHERE opened_ts > NOW(6) - INTERVAL ${interval}
     GROUP BY issue_category
     ORDER BY case_count DESC
     LIMIT 10`
  );
};

export const useCareVolumeByIssue = () => {
  const config = useRecoilValue(connectionConfig);
  const window = useRecoilValue(timeWindow);
  return useSWR(["care_volume_by_issue", config, window], () => getCareVolumeByIssue(config, window), {
    refreshInterval: 15000,
  });
};

// Schema management
export const isConnected = async (config: ConnectionConfig): Promise<boolean> => {
  try {
    await QueryNoDb(config, "SELECT 1");
    return true;
  } catch {
    return false;
  }
};

export const schemaObjects = async (config: ConnectionConfig): Promise<{ [key: string]: boolean }> => {
  try {
    // Check if database exists
    const dbResult = await QueryNoDb(config, `SHOW DATABASES LIKE '${config.database}'`);
    if (dbResult.length === 0) {
      return {};
    }

    // Check for key tables
    const tables = await Query<{ table_name: string }>(
      config,
      `SELECT table_name FROM information_schema.tables
       WHERE table_schema = '${config.database}'
       AND table_type = 'BASE TABLE'`
    );

    const views = await Query<{ table_name: string }>(
      config,
      `SELECT table_name FROM information_schema.tables
       WHERE table_schema = '${config.database}'
       AND table_type = 'VIEW'`
    );

    const procedures = await Query<{ routine_name: string }>(
      config,
      `SELECT routine_name FROM information_schema.routines
       WHERE routine_schema = '${config.database}'
       AND routine_type = 'PROCEDURE'`
    );

    const result: { [key: string]: boolean } = {};

    // Expected tables
    ['subscriber_master', 'network_experience_events', 'care_cases', 'retention_actions', 'subscriber_usage_summary'].forEach(table => {
      result[table] = tables.some(t => t.table_name === table);
    });

    // Expected views
    ['subscriber_experience_scores', 'market_degradation_summary', 'at_risk_high_value_subscribers', 'intervention_effectiveness'].forEach(view => {
      result[view] = views.some(v => v.table_name === view);
    });

    // Expected procedures
    ['process_network_events', 'process_usage_summary', 'process_care_cases', 'process_retention_actions'].forEach(proc => {
      result[proc] = procedures.some(p => p.routine_name === proc);
    });

    return result;
  } catch (error) {
    console.error("Error checking schema objects:", error);
    return {};
  }
};

export const resetSchema = async (config: ConnectionConfig): Promise<void> => {
  // Create database if it doesn't exist
  await QueryNoDb(config, `CREATE DATABASE IF NOT EXISTS ${config.database}`);

  // Drop existing tables/views/procedures to ensure clean slate
  try {
    const tables = await Query<{ table_name: string }>(
      config,
      `SELECT table_name FROM information_schema.tables
       WHERE table_schema = '${config.database}'`
    );

    for (const table of tables) {
      await Query(config, `DROP TABLE IF EXISTS ${table.table_name}`);
      await Query(config, `DROP VIEW IF EXISTS ${table.table_name}`);
    }

    const procedures = await Query<{ routine_name: string }>(
      config,
      `SELECT routine_name FROM information_schema.routines
       WHERE routine_schema = '${config.database}'
       AND routine_type = 'PROCEDURE'`
    );

    for (const proc of procedures) {
      await Query(config, `DROP PROCEDURE IF EXISTS ${proc.routine_name}`);
    }
  } catch (error) {
    console.warn("Error dropping existing objects:", error);
  }

  // Execute schema statements
  for (const stmt of schemaStatements) {
    if (stmt.statement.trim()) {
      await Query(config, stmt.statement);
    }
  }

  // Execute seed data
  for (const stmt of seedStatements) {
    if (stmt.statement.trim()) {
      await Query(config, stmt.statement);
    }
  }

  // Execute procedures (now embedded in TypeScript, no parsing needed)
  for (const proc of proceduresDDL) {
    try {
      console.log(`Creating procedure: ${proc.name}`);
      await Query(config, proc.sql);
    } catch (error) {
      console.error(`Failed to create procedure ${proc.name}:`, error);
      const errorMsg = error instanceof Error ? error.message : String(error);
      throw new Error(`Failed to create procedure ${proc.name}: ${errorMsg}`);
    }
  }

  // Generate some static demo data for immediate dashboard visualization
  try {
    console.log('Generating demo subscriber data...');

    // Create 1000 demo subscribers
    await Query(config, `
      INSERT INTO subscriber_master (subscriber_id, account_id, line_type, tenure_days, plan_type, monthly_revenue, device_model, device_os, home_market_id, enterprise_account_id, churn_risk_band)
      SELECT
        1000000 + seq AS subscriber_id,
        1000000 + seq AS account_id,
        CASE WHEN RAND() < 0.6 THEN 'postpaid' WHEN RAND() < 0.9 THEN 'prepaid' ELSE 'enterprise' END AS line_type,
        FLOOR(RAND() * 3650) AS tenure_days,
        CASE WHEN RAND() < 0.3 THEN 'Unlimited Premium' WHEN RAND() < 0.6 THEN 'Unlimited Plus' ELSE 'Unlimited Basic' END AS plan_type,
        45.00 + (RAND() * 155.00) AS monthly_revenue,
        CASE FLOOR(RAND() * 5) WHEN 0 THEN 'iPhone 14' WHEN 1 THEN 'iPhone 13' WHEN 2 THEN 'Samsung Galaxy S23' WHEN 3 THEN 'Google Pixel 7' ELSE 'Samsung Galaxy A54' END AS device_model,
        CASE FLOOR(RAND() * 2) WHEN 0 THEN 'iOS' ELSE 'Android' END AS device_os,
        1 + FLOOR(RAND() * 15) AS home_market_id,
        NULL AS enterprise_account_id,
        CASE WHEN RAND() < 0.65 THEN 'low' WHEN RAND() < 0.90 THEN 'medium' WHEN RAND() < 0.97 THEN 'high' ELSE 'critical' END AS churn_risk_band
      FROM TABLE(GENERATOR(ROWCOUNT => 1000)) AS seq;
    `);

    // Generate network events for last 7 days
    await Query(config, `
      INSERT INTO network_experience_events (event_ts, subscriber_id, cell_site_id, market_id, region_name, technology_type, event_type, severity, duration_seconds, impacted_service, resolved_flag)
      SELECT
        NOW(6) - INTERVAL FLOOR(RAND() * 168) HOUR AS event_ts,
        1000000 + FLOOR(RAND() * 1000) AS subscriber_id,
        1000 + FLOOR(RAND() * 50) AS cell_site_id,
        1 + FLOOR(RAND() * 15) AS market_id,
        m.region_name,
        CASE FLOOR(RAND() * 3) WHEN 0 THEN '5G' WHEN 1 THEN '4G LTE' ELSE 'Wi-Fi' END AS technology_type,
        CASE FLOOR(RAND() * 5) WHEN 0 THEN 'call_drop' WHEN 1 THEN 'slow_data' WHEN 2 THEN 'no_service' WHEN 3 THEN 'high_latency' ELSE 'poor_quality' END AS event_type,
        CASE FLOOR(RAND() * 4) WHEN 0 THEN 'minor' WHEN 1 THEN 'major' WHEN 2 THEN 'critical' ELSE 'minor' END AS severity,
        60 + FLOOR(RAND() * 600) AS duration_seconds,
        CASE FLOOR(RAND() * 3) WHEN 0 THEN 'voice' WHEN 1 THEN 'data' ELSE 'messaging' END AS impacted_service,
        RAND() < 0.8 AS resolved_flag
      FROM TABLE(GENERATOR(ROWCOUNT => 500)) AS seq
      CROSS JOIN market_reference m
      WHERE m.market_id = 1 + FLOOR(RAND() * 15)
      LIMIT 500;
    `);

    // Generate care cases for last 30 days
    await Query(config, `
      INSERT INTO care_cases (subscriber_id, opened_ts, closed_ts, channel, issue_category, resolution_code, handle_time_seconds, escalation_flag, csat_score, related_service_issue_flag)
      SELECT
        1000000 + FLOOR(RAND() * 1000) AS subscriber_id,
        NOW(6) - INTERVAL FLOOR(RAND() * 720) HOUR AS opened_ts,
        CASE WHEN RAND() < 0.7 THEN NOW(6) - INTERVAL FLOOR(RAND() * 600) HOUR ELSE NULL END AS closed_ts,
        CASE FLOOR(RAND() * 4) WHEN 0 THEN 'phone' WHEN 1 THEN 'chat' WHEN 2 THEN 'email' ELSE 'store' END AS channel,
        CASE FLOOR(RAND() * 5) WHEN 0 THEN 'network_quality' WHEN 1 THEN 'billing' WHEN 2 THEN 'device_support' WHEN 3 THEN 'plan_change' ELSE 'technical_support' END AS issue_category,
        CASE WHEN RAND() < 0.7 THEN CASE FLOOR(RAND() * 3) WHEN 0 THEN 'resolved_service_issue' WHEN 1 THEN 'provided_troubleshooting' ELSE 'account_adjustment' END ELSE NULL END AS resolution_code,
        300 + FLOOR(RAND() * 1800) AS handle_time_seconds,
        RAND() < 0.1 AS escalation_flag,
        CASE WHEN RAND() < 0.7 THEN 1 + FLOOR(RAND() * 5) ELSE NULL END AS csat_score,
        RAND() < 0.3 AS related_service_issue_flag
      FROM TABLE(GENERATOR(ROWCOUNT => 200)) AS seq;
    `);

    // Generate retention actions for last 30 days
    await Query(config, `
      INSERT INTO retention_actions (subscriber_id, action_ts, action_type, channel, reason_code, accepted_flag, conversion_flag, revenue_impact)
      SELECT
        1000000 + FLOOR(RAND() * 1000) AS subscriber_id,
        NOW(6) - INTERVAL FLOOR(RAND() * 720) HOUR AS action_ts,
        CASE FLOOR(RAND() * 4) WHEN 0 THEN 'discount_offer' WHEN 1 THEN 'plan_upgrade' WHEN 2 THEN 'loyalty_credit' ELSE 'retention_call' END AS action_type,
        CASE FLOOR(RAND() * 3) WHEN 0 THEN 'outbound_call' WHEN 1 THEN 'email' ELSE 'sms' END AS channel,
        CASE FLOOR(RAND() * 3) WHEN 0 THEN 'churn_risk' WHEN 1 THEN 'competitive_offer' ELSE 'service_complaint' END AS reason_code,
        RAND() < 0.35 AS accepted_flag,
        RAND() < 0.25 AS conversion_flag,
        -10.00 - (RAND() * 15.00) AS revenue_impact
      FROM TABLE(GENERATOR(ROWCOUNT => 100)) AS seq;
    `);

    console.log('Demo data generated successfully');
  } catch (error) {
    console.warn('Failed to generate demo data:', error);
    // Don't throw - this is optional
  }

  // Skip S3 pipelines - they can be created manually if needed
  // See PIPELINE_SETUP.md for instructions
  console.log('Setup complete. To enable S3 pipeline ingestion, see PIPELINE_SETUP.md');
};

export const connectToDB = async (config: ConnectionConfig): Promise<boolean> => {
  return isConnected(config);
};

export const updateSessions = async (config: ConnectionConfig): Promise<void> => {
  // Not implemented for telco demo
};

export const setSessionController = async (config: ConnectionConfig, enabled: boolean): Promise<void> => {
  // Simulator control not implemented in web UI
};
