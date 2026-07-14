-- Seed data for Telco Subscriber Experience Command Center
-- Helios-compatible (no DELIMITER needed)

-- Seed markets (major US metro areas)
INSERT INTO market_reference (market_id, market_name, region_name, latitude, longitude, urban_rural_flag, population_density) VALUES
(1, 'Phoenix', 'Southwest', 33.4484, -112.0740, 'urban', 3200),
(2, 'Dallas', 'South', 32.7767, -96.7970, 'urban', 3800),
(3, 'Atlanta', 'Southeast', 33.7490, -84.3880, 'urban', 3600),
(4, 'Seattle', 'Northwest', 47.6062, -122.3321, 'urban', 8400),
(5, 'Miami', 'Southeast', 25.7617, -80.1918, 'urban', 12100),
(6, 'Denver', 'Mountain', 39.7392, -104.9903, 'urban', 4700),
(7, 'Boston', 'Northeast', 42.3601, -71.0589, 'urban', 14400),
(8, 'Las Vegas', 'Southwest', 36.1699, -115.1398, 'urban', 4600),
(9, 'Portland', 'Northwest', 45.5152, -122.6784, 'urban', 4900),
(10, 'Austin', 'South', 30.2672, -97.7431, 'urban', 3100),
(11, 'Charlotte', 'Southeast', 35.2271, -80.8431, 'urban', 2900),
(12, 'San Diego', 'West', 32.7157, -117.1611, 'urban', 4400),
(13, 'Kansas City', 'Central', 39.0997, -94.5786, 'urban', 2400),
(14, 'Columbus', 'Central', 39.9612, -82.9988, 'urban', 4100),
(15, 'Indianapolis', 'Central', 39.7684, -86.1581, 'urban', 2400),
(16, 'Rural Arizona', 'Southwest', 34.5, -111.5, 'rural', 45),
(17, 'Rural Texas', 'South', 31.5, -99.5, 'rural', 38),
(18, 'Rural Georgia', 'Southeast', 32.5, -83.5, 'rural', 52);

-- Seed cell sites (3-5 per market)
INSERT INTO cell_sites (cell_site_id, market_id, site_name, site_type, latitude, longitude, technology_types, capacity_subscribers) VALUES
-- Phoenix sites
(101, 1, 'PHX-Downtown-1', 'macro', 33.4484, -112.0740, '["4G","5G"]', 5000),
(102, 1, 'PHX-Scottsdale-1', 'macro', 33.4942, -111.9261, '["4G","5G"]', 4500),
(103, 1, 'PHX-Tempe-1', 'small_cell', 33.4255, -111.9400, '["4G","5G"]', 2000),
(104, 1, 'PHX-Airport-1', 'indoor', 33.4352, -112.0101, '["4G","5G"]', 3000),

-- Dallas sites
(201, 2, 'DAL-Downtown-1', 'macro', 32.7767, -96.7970, '["4G","5G"]', 5500),
(202, 2, 'DAL-Plano-1', 'macro', 33.0198, -96.6989, '["4G","5G"]', 4000),
(203, 2, 'DAL-FortWorth-1', 'macro', 32.7555, -97.3308, '["4G"]', 3500),

-- Atlanta sites
(301, 3, 'ATL-Downtown-1', 'macro', 33.7490, -84.3880, '["4G","5G"]', 6000),
(302, 3, 'ATL-Buckhead-1', 'macro', 33.8490, -84.3671, '["4G","5G"]', 4500),
(303, 3, 'ATL-Airport-1', 'indoor', 33.6407, -84.4277, '["4G","5G"]', 5000),

-- Seattle sites
(401, 4, 'SEA-Downtown-1', 'macro', 47.6062, -122.3321, '["4G","5G"]', 5000),
(402, 4, 'SEA-Bellevue-1', 'macro', 47.6101, -122.2015, '["4G","5G"]', 4000),
(403, 4, 'SEA-Capitol-1', 'small_cell', 47.6205, -122.3212, '["4G","5G"]', 2500),

-- Miami sites
(501, 5, 'MIA-Downtown-1', 'macro', 25.7617, -80.1918, '["4G","5G"]', 6500),
(502, 5, 'MIA-Beach-1', 'macro', 25.7907, -80.1300, '["4G","5G"]', 5500),
(503, 5, 'MIA-Airport-1', 'indoor', 25.7932, -80.2906, '["4G","5G"]', 4500),

-- Other markets (simplified - 2 sites each)
(601, 6, 'DEN-Downtown-1', 'macro', 39.7392, -104.9903, '["4G","5G"]', 4500),
(602, 6, 'DEN-Suburbs-1', 'macro', 39.8611, -104.6731, '["4G"]', 3000),

(701, 7, 'BOS-Downtown-1', 'macro', 42.3601, -71.0589, '["4G","5G"]', 5500),
(702, 7, 'BOS-Cambridge-1', 'macro', 42.3736, -71.1097, '["4G","5G"]', 4000),

(801, 8, 'LV-Strip-1', 'macro', 36.1147, -115.1729, '["4G","5G"]', 7000),
(802, 8, 'LV-Downtown-1', 'macro', 36.1699, -115.1398, '["4G"]', 4000),

(901, 9, 'PDX-Downtown-1', 'macro', 45.5152, -122.6784, '["4G","5G"]', 4000),
(902, 9, 'PDX-Pearl-1', 'small_cell', 45.5272, -122.6806, '["4G","5G"]', 2000),

(1001, 10, 'AUS-Downtown-1', 'macro', 30.2672, -97.7431, '["4G","5G"]', 4500),
(1002, 10, 'AUS-Campus-1', 'macro', 30.2849, -97.7341, '["4G","5G"]', 3500);

-- Seed enterprise accounts
INSERT INTO enterprise_accounts (enterprise_account_id, account_name, sla_tier, contracted_latency_target_ms, contracted_uptime_pct, monthly_incident_allowance, active_sites) VALUES
(1000, 'HealthCorp Medical Centers', 'gold', 50, 99.95, 1, 45),
(1001, 'RetailChain Inc', 'silver', 100, 99.5, 3, 120),
(1002, 'Finance Group LLC', 'gold', 40, 99.99, 0, 28),
(1003, 'Manufacturing Corp', 'bronze', 150, 99.0, 5, 85),
(1004, 'Education District', 'silver', 80, 99.5, 2, 65);

-- Add some initial usage summary data (last 7 days)
INSERT INTO subscriber_usage_summary (
  subscriber_id,
  event_ts,
  market_id,
  cell_site_id,
  session_count,
  data_mb,
  voice_minutes,
  dropped_sessions,
  avg_session_latency_ms,
  qos_score
)
SELECT
  sm.subscriber_id,
  NOW(6) - INTERVAL FLOOR(RAND() * 7) DAY,
  sm.home_market_id,
  cs.cell_site_id,
  FLOOR(10 + RAND() * 50),
  FLOOR(500 + RAND() * 5000),
  FLOOR(30 + RAND() * 180),
  FLOOR(RAND() * 5),
  FLOOR(20 + RAND() * 200),
  50 + (RAND() * 50)
FROM subscriber_master sm
JOIN cell_sites cs ON sm.home_market_id = cs.market_id
WHERE RAND() < 0.3 -- 30% of subscribers have recent usage
LIMIT 15000;
