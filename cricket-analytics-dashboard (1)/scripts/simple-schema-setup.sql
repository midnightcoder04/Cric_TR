-- Create Players Performance Table
CREATE TABLE IF NOT EXISTS players_performance (
  id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  player_name VARCHAR NOT NULL,
  format VARCHAR NOT NULL,
  average FLOAT DEFAULT 0,
  strike_rate FLOAT DEFAULT 0,
  recent_form INT DEFAULT 0,
  opposition VARCHAR DEFAULT '',
  runs_scored INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create Match History Table
CREATE TABLE IF NOT EXISTS match_history (
  id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  match_date DATE NOT NULL,
  india_team TEXT NOT NULL,
  opposition VARCHAR NOT NULL,
  format VARCHAR NOT NULL,
  result VARCHAR DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create Opposition Players Table
CREATE TABLE IF NOT EXISTS opposition_players (
  id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  name VARCHAR NOT NULL,
  team VARCHAR NOT NULL,
  role VARCHAR NOT NULL,
  strength TEXT DEFAULT '',
  weakness TEXT DEFAULT '',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create Training Data Table
CREATE TABLE IF NOT EXISTS training_data (
  id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  player_id INT NOT NULL,
  features JSONB NOT NULL,
  target_output INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create Team Recommendations Table
CREATE TABLE IF NOT EXISTS team_recommendations (
  id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  format VARCHAR NOT NULL,
  selected_team TEXT NOT NULL,
  confidence FLOAT DEFAULT 0.75,
  model_used VARCHAR DEFAULT 'ensemble',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create Model Metrics Table
CREATE TABLE IF NOT EXISTS model_metrics (
  id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  model_name VARCHAR NOT NULL,
  accuracy FLOAT DEFAULT 0,
  precision FLOAT DEFAULT 0,
  recall FLOAT DEFAULT 0,
  f1_score FLOAT DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insert Sample Player Performance Data
INSERT INTO players_performance (player_name, format, average, strike_rate, recent_form, opposition) VALUES
('Virat Kohli', 'ODI', 52.3, 92.1, 85, 'Australia'),
('Rohit Sharma', 'ODI', 50.2, 91.5, 82, 'England'),
('Jasprit Bumrah', 'ODI', 0, 0, 88, 'Pakistan'),
('KL Rahul', 'T20', 35.4, 145.2, 79, 'South Africa'),
('Hardik Pandya', 'T20', 28.5, 156.3, 81, 'Australia'),
('Yuzvendra Chahal', 'T20', 0, 0, 76, 'England'),
('Ravichandran Ashwin', 'Test', 0, 0, 84, 'New Zealand'),
('Rishabh Pant', 'Test', 42.1, 78.5, 80, 'Sri Lanka'),
('Shubman Gill', 'Test', 45.6, 72.3, 77, 'West Indies'),
('Mohammed Shami', 'ODI', 0, 0, 79, 'Bangladesh');

-- Insert Sample Opposition Players
INSERT INTO opposition_players (name, team, role, strength, weakness) VALUES
('Steve Smith', 'Australia', 'Batter', 'Technique', 'Short ball'),
('Pat Cummins', 'Australia', 'Bowler', 'Pace', 'Slow pitches'),
('Joe Root', 'England', 'Batter', 'Versatility', 'Aggressive bowling'),
('Ben Stokes', 'England', 'All-rounder', 'All-round play', 'Death bowling'),
('Babar Azam', 'Pakistan', 'Batter', 'Consistency', 'Slow deliveries'),
('Shaheen Afridi', 'Pakistan', 'Bowler', 'New ball', 'Flat pitches'),
('Aiden Markram', 'South Africa', 'Batter', 'Technique', 'Pace'),
('Kagiso Rabada', 'South Africa', 'Bowler', 'Death bowling', 'Slow tracks');

-- Insert Sample Model Metrics
INSERT INTO model_metrics (model_name, accuracy, precision, recall, f1_score) VALUES
('Random Forest', 0.85, 0.84, 0.86, 0.85),
('XGBoost', 0.87, 0.86, 0.88, 0.87),
('Ensemble', 0.89, 0.88, 0.90, 0.89);
