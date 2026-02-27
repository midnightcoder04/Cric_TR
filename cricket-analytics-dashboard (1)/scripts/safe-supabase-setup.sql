-- Safe Supabase Setup - Can run multiple times without errors

-- Drop existing tables if needed (UNCOMMENT ONLY IF YOU WANT TO START FRESH)
-- DROP TABLE IF EXISTS model_metrics CASCADE;
-- DROP TABLE IF EXISTS team_recommendations CASCADE;
-- DROP TABLE IF EXISTS training_data CASCADE;
-- DROP TABLE IF EXISTS match_history CASCADE;
-- DROP TABLE IF EXISTS opposition_players CASCADE;
-- DROP TABLE IF EXISTS players_performance CASCADE;

-- Create players_performance table
CREATE TABLE IF NOT EXISTS public.players_performance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  player_name VARCHAR(255) NOT NULL,
  team VARCHAR(50) NOT NULL DEFAULT 'India',
  format VARCHAR(20) NOT NULL,
  role VARCHAR(50) NOT NULL,
  average NUMERIC(5,2),
  strike_rate NUMERIC(6,2),
  recent_performance NUMERIC(3,0),
  form_score NUMERIC(3,0),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create opposition_players table
CREATE TABLE IF NOT EXISTS public.opposition_players (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  player_name VARCHAR(255) NOT NULL,
  country VARCHAR(100) NOT NULL,
  role VARCHAR(50) NOT NULL,
  avg_score NUMERIC(5,2),
  strike_rate NUMERIC(6,2),
  strength VARCHAR(255),
  weakness VARCHAR(255),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create match_history table
CREATE TABLE IF NOT EXISTS public.match_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  match_date TIMESTAMP WITH TIME ZONE,
  opponent VARCHAR(100),
  format VARCHAR(20),
  india_score NUMERIC(4,0),
  opponent_score NUMERIC(4,0),
  india_won BOOLEAN,
  player_performance JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create training_data table
CREATE TABLE IF NOT EXISTS public.training_data (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  player_name VARCHAR(255),
  format VARCHAR(20),
  opposition VARCHAR(100),
  features JSONB,
  performance_label NUMERIC(3,2),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create team_recommendations table
CREATE TABLE IF NOT EXISTS public.team_recommendations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  match_id VARCHAR(255),
  selected_xi JSONB,
  confidence NUMERIC(3,2),
  model_used VARCHAR(100),
  opposition_team VARCHAR(100),
  format VARCHAR(20),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create model_metrics table
CREATE TABLE IF NOT EXISTS public.model_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  model_name VARCHAR(100),
  accuracy NUMERIC(5,4),
  precision NUMERIC(5,4),
  recall NUMERIC(5,4),
  f1_score NUMERIC(5,4),
  last_trained TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes safely
CREATE INDEX IF NOT EXISTS idx_players_performance_format ON public.players_performance(format);
CREATE INDEX IF NOT EXISTS idx_players_performance_player ON public.players_performance(player_name);
CREATE INDEX IF NOT EXISTS idx_opposition_country ON public.opposition_players(country);
CREATE INDEX IF NOT EXISTS idx_match_history_opponent ON public.match_history(opponent);
CREATE INDEX IF NOT EXISTS idx_training_data_format ON public.training_data(format);
CREATE INDEX IF NOT EXISTS idx_team_recommendations_format ON public.team_recommendations(format);

-- Insert sample data (only if tables are empty)
INSERT INTO public.players_performance (player_name, team, format, role, average, strike_rate, recent_performance, form_score)
SELECT * FROM (
  VALUES
  ('Virat Kohli', 'India', 'ODI', 'Batter', 48.5, 92.3, 85, 90),
  ('Rohit Sharma', 'India', 'ODI', 'Batter', 47.2, 94.1, 88, 95),
  ('Jasprit Bumrah', 'India', 'ODI', 'Bowler', 0, 0, 75, 85),
  ('KL Rahul', 'India', 'ODI', 'Batter', 45.3, 88.5, 78, 80),
  ('Hardik Pandya', 'India', 'ODI', 'All-rounder', 35.2, 107.3, 82, 85),
  ('Suryakumar Yadav', 'India', 'T20', 'Batter', 32.5, 142.3, 89, 90),
  ('Yuzvendra Chahal', 'India', 'T20', 'Bowler', 0, 0, 80, 85),
  ('Rishabh Pant', 'India', 'Test', 'Batter', 38.5, 82.1, 75, 80),
  ('Cheteshwar Pujara', 'India', 'Test', 'Batter', 42.1, 55.3, 70, 75),
  ('Ishant Sharma', 'India', 'Test', 'Bowler', 0, 0, 72, 78),
  ('Shubman Gill', 'India', 'Test', 'Batter', 39.2, 65.4, 84, 88),
  ('Siraj Mohammed', 'India', 'Test', 'Bowler', 0, 0, 79, 82),
  ('Ishan Kishan', 'India', 'T20', 'Batter', 28.3, 125.5, 76, 78),
  ('Ravichandran Ashwin', 'India', 'Test', 'All-rounder', 26.5, 62.1, 77, 80),
  ('Shreyas Iyer', 'India', 'ODI', 'Batter', 41.3, 85.2, 81, 83)
) AS t(player_name, team, format, role, average, strike_rate, recent_performance, form_score)
WHERE NOT EXISTS (SELECT 1 FROM public.players_performance WHERE player_name = t.player_name AND format = t.format);

INSERT INTO public.opposition_players (player_name, country, role, avg_score, strike_rate, strength, weakness)
SELECT * FROM (
  VALUES
  ('Steve Smith', 'Australia', 'Batter', 52.3, 92.1, 'Exceptional technique', 'Short ball'),
  ('Pat Cummins', 'Australia', 'Bowler', 0, 0, 'Excellent yorker', 'Slow pitches'),
  ('Joe Root', 'England', 'Batter', 48.7, 89.5, 'Versatile batting', 'Short ball tactics'),
  ('Jofra Archer', 'England', 'Bowler', 0, 0, 'Pace and yorkers', 'Control'),
  ('Babar Azam', 'Pakistan', 'Batter', 50.2, 88.3, 'Consistent scoring', 'Death overs'),
  ('Shaheen Afridi', 'Pakistan', 'Bowler', 0, 0, 'New ball bowling', 'Slow pitches'),
  ('Kane Williamson', 'New Zealand', 'Batter', 51.2, 85.4, 'Technical excellence', 'Short ball'),
  ('Trent Boult', 'New Zealand', 'Bowler', 0, 0, 'Swing expertise', 'Flat pitches')
) AS t(player_name, country, role, avg_score, strike_rate, strength, weakness)
WHERE NOT EXISTS (SELECT 1 FROM public.opposition_players WHERE player_name = t.player_name);

INSERT INTO public.model_metrics (model_name, accuracy, precision, recall, f1_score, last_trained)
SELECT * FROM (
  VALUES
  ('Random Forest', 0.8450, 0.8200, 0.8350, 0.8275, NOW()),
  ('XGBoost', 0.8620, 0.8450, 0.8550, 0.8500, NOW()),
  ('Ensemble', 0.8750, 0.8550, 0.8650, 0.8600, NOW())
) AS t(model_name, accuracy, precision, recall, f1_score, last_trained)
WHERE NOT EXISTS (SELECT 1 FROM public.model_metrics WHERE model_name = t.model_name);

-- Success message
SELECT 'Setup Complete! Tables exist with data.' as status;
