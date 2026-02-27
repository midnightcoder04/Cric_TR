-- Create players_performance table
CREATE TABLE IF NOT EXISTS public.players_performance (
  id BIGSERIAL PRIMARY KEY,
  player_id VARCHAR(100),
  player_name VARCHAR(255) NOT NULL,
  player_role VARCHAR(50) NOT NULL,
  country VARCHAR(100) DEFAULT 'India',
  format VARCHAR(20) NOT NULL,
  matches_played INT,
  runs INT,
  average FLOAT,
  strike_rate FLOAT,
  wickets INT,
  economy FLOAT,
  catch_count INT,
  form_score INT,
  recent_performance FLOAT,
  recent_form_json JSONB,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create match_history table
CREATE TABLE IF NOT EXISTS public.match_history (
  id BIGSERIAL PRIMARY KEY,
  match_date TIMESTAMP,
  india_team VARCHAR(100),
  india_players TEXT[],
  opposition_team VARCHAR(100),
  opposition_players TEXT[],
  format VARCHAR(20),
  result VARCHAR(20),
  india_runs INT,
  opposition_runs INT,
  player_performances JSONB,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create opposition_players table
CREATE TABLE IF NOT EXISTS public.opposition_players (
  id BIGSERIAL PRIMARY KEY,
  opposition_team VARCHAR(100),
  player_name VARCHAR(255) NOT NULL,
  player_role VARCHAR(50) NOT NULL,
  country VARCHAR(100) NOT NULL,
  format VARCHAR(20),
  avg_score FLOAT,
  strike_rate FLOAT,
  bowling_average FLOAT,
  economy FLOAT,
  strength_vs_india TEXT,
  weakness_vs_india TEXT,
  recent_form INT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create team_recommendations table
CREATE TABLE IF NOT EXISTS public.team_recommendations (
  id BIGSERIAL PRIMARY KEY,
  opposition_team VARCHAR(100) NOT NULL,
  opposition_players TEXT[] NOT NULL,
  format VARCHAR(20) NOT NULL,
  selected_xi TEXT[] NOT NULL,
  model_type VARCHAR(50),
  confidence_score FLOAT,
  win_probability FLOAT,
  expected_score_min INT,
  expected_score_max INT,
  reasoning TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  expires_at TIMESTAMP
);

-- Create model_metrics table
CREATE TABLE IF NOT EXISTS public.model_metrics (
  id BIGSERIAL PRIMARY KEY,
  model_type VARCHAR(50),
  format VARCHAR(20),
  accuracy FLOAT,
  precision FLOAT,
  recall FLOAT,
  f1_score FLOAT,
  training_samples INT,
  last_trained TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create training_data table
CREATE TABLE IF NOT EXISTS public.training_data (
  id BIGSERIAL PRIMARY KEY,
  player_name VARCHAR(255),
  player_id VARCHAR(100),
  opposition VARCHAR(100),
  opposition_player_id VARCHAR(100),
  format VARCHAR(20),
  strength_match INT,
  weakness_match INT,
  result INT,
  selected_in_xi BOOLEAN,
  performance_score FLOAT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_players_performance_player_name_format ON public.players_performance(player_name, format);
CREATE INDEX IF NOT EXISTS idx_players_performance_player_id ON public.players_performance(player_id);
CREATE INDEX IF NOT EXISTS idx_players_performance_format ON public.players_performance(format);
CREATE INDEX IF NOT EXISTS idx_match_history_opposition_date ON public.match_history(opposition_team, match_date);
CREATE INDEX IF NOT EXISTS idx_match_history_date ON public.match_history(match_date);
CREATE INDEX IF NOT EXISTS idx_opposition_players_team ON public.opposition_players(opposition_team);
CREATE INDEX IF NOT EXISTS idx_opposition_players_country ON public.opposition_players(country);
CREATE INDEX IF NOT EXISTS idx_recommendation_date ON public.team_recommendations(created_at);
CREATE INDEX IF NOT EXISTS idx_training_data_player ON public.training_data(player_name);
CREATE INDEX IF NOT EXISTS idx_players_performance_recent_json ON public.players_performance USING gin (recent_form_json);
CREATE INDEX IF NOT EXISTS idx_team_recommendations_created_at ON public.team_recommendations(created_at);

-- Insert sample players_performance rows
INSERT INTO public.players_performance (
  player_name, player_role, format, matches_played, runs, average, strike_rate, wickets, economy, catch_count, form_score, recent_performance
) VALUES
  ('Virat Kohli', 'Batsman', 'ODI', 300, 13200, 59.2, 93.8, 0, NULL, 48, 92, 88),
  ('Jasprit Bumrah', 'Bowler', 'ODI', 150, 0, 0, 0, 125, 4.4, 6, 95, 92),
  ('Shubman Gill', 'Batsman', 'ODI', 45, 2800, 48.3, 95.2, 0, NULL, 14, 88, 90),
  ('Suryakumar Yadav', 'Batsman', 'T20', 80, 3200, 42.5, 145.2, 0, NULL, 14, 90, 87),
  ('Hardik Pandya', 'All-rounder', 'T20', 95, 1950, 38.1, 142.3, 95, 8.5, 15, 85, 80);

-- Insert additional player performance data for ML training
INSERT INTO public.players_performance (
  player_id, player_name, player_role, format, matches_played, average, strike_rate, wickets, economy, recent_form_json, created_at
) VALUES
  ('IND_001', 'Rohit Sharma', 'Batsman', 'ODI', 150, 48.5, 92.3, 0, 0.0, '["75","82","68","91","77"]'::jsonb, NOW()),
  ('IND_002', 'Virat Kohli', 'Batsman', 'ODI', 295, 59.2, 90.1, 0, 0.0, '["88","92","78","85","91"]'::jsonb, NOW()),
  ('IND_003', 'KL Rahul', 'Batsman', 'ODI', 89, 45.3, 89.5, 0, 0.0, '["65","72","58","81","69"]'::jsonb, NOW()),
  ('IND_004', 'Suryakumar Yadav', 'Batsman', 'T20', 45, 38.2, 165.4, 0, 0.0, '["42","56","48","63","51"]'::jsonb, NOW()),
  ('IND_005', 'Jasprit Bumrah', 'Bowler', 'ODI', 128, 0.0, 0.0, 187, 4.75, '["2","3","1","2","3"]'::jsonb, NOW()),
  ('IND_006', 'Mohammed Shami', 'Bowler', 'ODI', 105, 0.0, 0.0, 164, 5.12, '["1","2","2","1","2"]'::jsonb, NOW()),
  ('IND_007', 'Hardik Pandya', 'All-rounder', 'ODI', 78, 35.8, 108.2, 68, 6.23, '["45","52","38","61","48"]'::jsonb, NOW()),
  ('IND_008', 'Ravindra Jadeja', 'All-rounder', 'Test', 62, 38.5, 72.3, 267, 2.85, '["62","58","71","64","69"]'::jsonb, NOW()),
  ('IND_009', 'Kuldeep Yadav', 'Bowler', 'ODI', 34, 0.0, 0.0, 41, 5.45, '["2","1","3","2","1"]'::jsonb, NOW()),
  ('IND_010', 'Yuzvendra Chahal', 'Bowler', 'T20', 78, 0.0, 0.0, 84, 7.82, '["1","2","1","2","2"]'::jsonb, NOW());

-- Insert opposition team player data
INSERT INTO public.opposition_players (
  opposition_team, player_name, player_role, country, avg_score, strike_rate, weakness_vs_india, strength_vs_india, created_at
) VALUES
  ('Australia', 'Steve Smith', 'Batsman', 'Australia', 52.3, 92.1, 'Short ball outside off stump', 'Exceptional technique against spin', NOW()),
  ('Australia', 'Pat Cummins', 'Bowler', 'Australia', NULL, NULL, 'Struggles on slow pitches', 'Excellent yorker at death', NOW()),
  ('Australia', 'David Warner', 'Batsman', 'Australia', 48.5, 95.2, 'Yorkers early in innings', 'Aggressive batting in powerplay', NOW()),
  ('England', 'Joe Root', 'Batsman', 'England', 48.7, 89.5, 'Aggressive short ball tactics', 'Versatile against all bowling types', NOW()),
  ('England', 'Ben Stokes', 'All-rounder', 'England', 44.2, 91.8, 'Pace bowling at death', 'Aggressive counter-attacking play', NOW()),
  ('England', 'Jofra Archer', 'Bowler', 'England', NULL, NULL, 'Control on flat pitches', 'Pace and yorkers at death', NOW()),
  ('Pakistan', 'Babar Azam', 'Batsman', 'Pakistan', 50.2, 88.3, 'Slower deliveries in death overs', 'Consistent scoring in powerplay', NOW()),
  ('Pakistan', 'Shaheen Afridi', 'Bowler', 'Pakistan', NULL, NULL, 'Limited death bowling', 'Excellent new ball bowling', NOW()),
  ('Pakistan', 'Mohammad Rizwan', 'Batsman', 'Pakistan', 46.8, 90.2, 'Against short pitch strategy', 'Patient accumulation', NOW()),
  ('South Africa', 'Aiden Markram', 'Batsman', 'South Africa', 49.5, 87.3, 'Pace bowling on bouncy pitches', 'Technical batting against spin', NOW()),
  ('New Zealand', 'Kane Williamson', 'Batsman', 'New Zealand', 51.2, 85.4, 'Aggressive short ball tactics', 'Technical excellence in all conditions', NOW()),
  ('Sri Lanka', 'Dhananjaya de Silva', 'Batsman', 'Sri Lanka', 43.2, 80.5, 'Pace on bouncy pitches', 'Test cricket technique', NOW()),
  ('West Indies', 'Jason Holder', 'All-rounder', 'West Indies', 35.2, 78.5, 'Spin bowling', 'Experience and leadership', NOW()),
  ('Bangladesh', 'Mushfiqur Rahim', 'Batsman', 'Bangladesh', 38.5, 82.1, 'Pace bowling', 'Experience and technique', NOW());

-- Insert match history data
INSERT INTO public.match_history (
  match_date, india_team, opposition_team, format, result, india_runs, opposition_runs, created_at
) VALUES
  (NOW() - INTERVAL '30 days', 'India', 'Australia', 'ODI', 'Won', 287, 245, NOW()),
  (NOW() - INTERVAL '25 days', 'India', 'England', 'Test', 'Won', 416, 364, NOW()),
  (NOW() - INTERVAL '20 days', 'India', 'Pakistan', 'T20', 'Won', 182, 156, NOW()),
  (NOW() - INTERVAL '15 days', 'India', 'South Africa', 'ODI', 'Lost', 268, 289, NOW()),
  (NOW() - INTERVAL '10 days', 'India', 'New Zealand', 'Test', 'Draw', 345, 342, NOW()),
  (NOW() - INTERVAL '5 days', 'India', 'Sri Lanka', 'ODI', 'Won', 298, 261, NOW());

-- Insert training data
INSERT INTO public.training_data (
  player_name, player_id, opposition, format, selected_in_xi, performance_score, result, created_at
) VALUES
  ('Virat Kohli', NULL, 'Australia', 'ODI', TRUE, 88.5, 1, NOW()),
  ('Rohit Sharma', NULL, 'Australia', 'ODI', TRUE, 82.3, 1, NOW()),
  ('Jasprit Bumrah', NULL, 'Australia', 'ODI', TRUE, 91.2, 1, NOW()),
  ('KL Rahul', NULL, 'Australia', 'ODI', FALSE, 45.6, 1, NOW()),
  ('Joe Root', NULL, 'England', 'Test', TRUE, 78.9, 1, NOW()),
  ('Ben Stokes', NULL, 'England', 'Test', TRUE, 72.4, 1, NOW()),
  ('Babar Azam', NULL, 'Pakistan', 'T20', TRUE, 85.3, 1, NOW()),
  ('Shaheen Afridi', NULL, 'Pakistan', 'T20', TRUE, 88.7, 1, NOW());

-- Display summary
SELECT 'Setup Complete!' as status, 'All tables created with sample data' as message;
