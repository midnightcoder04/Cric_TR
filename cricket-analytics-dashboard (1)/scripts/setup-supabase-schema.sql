-- Cricket Team Recommendation ML Database Schema

-- Create players_performance table
CREATE TABLE IF NOT EXISTS players_performance (
  id BIGSERIAL PRIMARY KEY,
  player_name VARCHAR(255) NOT NULL,
  player_role VARCHAR(50) NOT NULL,
  country VARCHAR(100) DEFAULT 'India',
  format VARCHAR(20) NOT NULL, -- ODI, T20, Test
  matches_played INT,
  runs INT,
  average FLOAT,
  strike_rate FLOAT,
  wickets INT,
  economy FLOAT,
  catch_count INT,
  form_score INT, -- 1-100
  recent_performance FLOAT, -- Average of last 5 matches
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create match_history table
CREATE TABLE IF NOT EXISTS match_history (
  id BIGSERIAL PRIMARY KEY,
  match_date TIMESTAMP,
  india_players TEXT[], -- Array of player names
  opposition_team VARCHAR(100),
  opposition_players TEXT[], -- Array of opposition player names
  format VARCHAR(20),
  result VARCHAR(20), -- Won, Lost, Draw
  india_score INT,
  opposition_score INT,
  player_performances JSONB, -- Player-wise performance data
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create opposition_players table
CREATE TABLE IF NOT EXISTS opposition_players (
  id BIGSERIAL PRIMARY KEY,
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
  recent_form INT, -- 1-100
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create team_recommendations table (for storing ML predictions)
CREATE TABLE IF NOT EXISTS team_recommendations (
  id BIGSERIAL PRIMARY KEY,
  opposition_team VARCHAR(100) NOT NULL,
  opposition_players TEXT[] NOT NULL,
  format VARCHAR(20) NOT NULL,
  selected_xi TEXT[] NOT NULL,
  model_type VARCHAR(50), -- 'random_forest' or 'xgboost'
  confidence_score FLOAT,
  win_probability FLOAT,
  expected_score_min INT,
  expected_score_max INT,
  reasoning TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  expires_at TIMESTAMP
);

-- Create model_metrics table (for tracking model performance)
CREATE TABLE IF NOT EXISTS model_metrics (
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
CREATE TABLE IF NOT EXISTS training_data (
  id BIGSERIAL PRIMARY KEY,
  indian_player_id VARCHAR(100),
  opposition_player_id VARCHAR(100),
  format VARCHAR(20),
  strength_match INT, -- 1 if Indian strength vs opposition weakness, 0 otherwise
  weakness_match INT, -- 1 if Indian weakness vs opposition strength, 0 otherwise
  result INT, -- 1 if win, 0 if loss/draw
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better query performance
CREATE INDEX idx_player_format ON players_performance(player_name, format);
CREATE INDEX idx_match_opposition ON match_history(opposition_team, match_date);
CREATE INDEX idx_opposition_country ON opposition_players(country);
CREATE INDEX idx_recommendation_date ON team_recommendations(created_at);

-- Insert sample training data (Indian players vs opposition)
INSERT INTO players_performance (player_name, player_role, format, matches_played, runs, average, strike_rate, wickets, economy, catch_count, form_score, recent_performance)
VALUES
  ('Virat Kohli', 'Batsman', 'ODI', 300, 13200, 59.2, 93.8, 0, 0, 48, 92, 88),
  ('Jasprit Bumrah', 'Bowler', 'ODI', 150, 0, 0, 0, 125, 4.4, 6, 95, 92),
  ('Shubman Gill', 'Batsman', 'ODI', 45, 2800, 48.3, 95.2, 0, 0, 14, 88, 90),
  ('Suryakumar Yadav', 'Batsman', 'T20', 80, 3200, 42.5, 145.2, 0, 0, 14, 90, 87),
  ('Hardik Pandya', 'All-rounder', 'T20', 95, 1950, 38.1, 142.3, 95, 8.5, 15, 85, 80);

INSERT INTO opposition_players (player_name, player_role, country, format, avg_score, strike_rate, bowling_average, economy, strength_vs_india, weakness_vs_india, recent_form)
VALUES
  ('Steve Smith', 'Batsman', 'Australia', 'ODI', 52.3, 92.1, 0, 0, 'Technique vs Spin', 'Short Ball', 85),
  ('Pat Cummins', 'Bowler', 'Australia', 'ODI', 0, 0, 25.5, 4.8, 'Pace at Death', 'Slow Pitches', 82),
  ('Joe Root', 'Batsman', 'England', 'ODI', 48.7, 89.5, 0, 0, 'Versatility', 'Aggressive Tactics', 78),
  ('Babar Azam', 'Batsman', 'Pakistan', 'ODI', 50.2, 88.3, 0, 0, 'Consistency', 'Slower Balls', 80);
