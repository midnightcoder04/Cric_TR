-- Insert Indian Players Performance Data
INSERT INTO players_performance (player_name, format, average, strike_rate, recent_form, role)
VALUES
  ('Virat Kohli', 'ODI', 52.3, 94.2, 'Excellent', 'Batsman'),
  ('Rohit Sharma', 'ODI', 48.5, 91.8, 'Good', 'Batsman'),
  ('Jasprit Bumrah', 'ODI', 0, 0, 'Excellent', 'Bowler'),
  ('Mohammed Shami', 'ODI', 0, 0, 'Good', 'Bowler'),
  ('KL Rahul', 'ODI', 45.2, 89.3, 'Average', 'Batsman'),
  ('Rishabh Pant', 'ODI', 42.1, 112.5, 'Good', 'Batsman'),
  ('Hardik Pandya', 'ODI', 38.5, 115.2, 'Good', 'All-rounder'),
  ('Yuzvendra Chahal', 'ODI', 0, 0, 'Good', 'Bowler'),
  ('Shubman Gill', 'ODI', 52.8, 90.1, 'Excellent', 'Batsman'),
  ('Arjun Tendulkar', 'ODI', 35.2, 85.3, 'Average', 'All-rounder'),
  ('Steve Smith', 'ODI', 52.3, 92.1, 'Excellent', 'Batsman'),
  ('Pat Cummins', 'ODI', 0, 0, 'Good', 'Bowler'),
  ('David Warner', 'ODI', 48.5, 95.2, 'Good', 'Batsman'),
  ('Joe Root', 'ODI', 48.7, 89.5, 'Good', 'Batsman'),
  ('Ben Stokes', 'ODI', 44.2, 91.8, 'Excellent', 'All-rounder')
ON CONFLICT (player_name, format) DO NOTHING;

-- Insert Opposition Players
INSERT INTO opposition_players (player_name, team, role, strengths, weaknesses)
VALUES
  ('Steve Smith', 'Australia', 'Batsman', 'Technique,Spin', 'Short ball'),
  ('David Warner', 'Australia', 'Batsman', 'Aggressive,Pace', 'Yorkers'),
  ('Pat Cummins', 'Australia', 'Bowler', 'Yorker,Death', 'Slow pitches'),
  ('Joe Root', 'England', 'Batsman', 'Technique,Versatility', 'Short ball'),
  ('Ben Stokes', 'England', 'All-rounder', 'Aggressive,Experience', 'Pace'),
  ('Jofra Archer', 'England', 'Bowler', 'Pace,Yorker', 'Control'),
  ('Babar Azam', 'Pakistan', 'Batsman', 'Technique,Consistency', 'Slower balls'),
  ('Shaheen Afridi', 'Pakistan', 'Bowler', 'Pace,New ball', 'Slow pitches'),
  ('Mohammad Rizwan', 'Pakistan', 'Batsman', 'Patience,Technique', 'Short pitch'),
  ('Aiden Markram', 'South Africa', 'Batsman', 'Technique,Spin', 'Pace'),
  ('Kagiso Rabada', 'South Africa', 'Bowler', 'Pace,Aggression', 'Flat tracks'),
  ('Kane Williamson', 'New Zealand', 'Batsman', 'Technique,All-conditions', 'Short ball'),
  ('Trent Boult', 'New Zealand', 'Bowler', 'Swing,New ball', 'Flat pitches'),
  ('Dhananjaya de Silva', 'Sri Lanka', 'Batsman', 'Technique,Test', 'Pace')
ON CONFLICT (player_name, team) DO NOTHING;

-- Insert Match History
INSERT INTO match_history (team_1, team_2, format, winner, location)
VALUES
  ('India', 'Australia', 'ODI', 'India', 'Delhi'),
  ('India', 'England', 'Test', 'India', 'Bangalore'),
  ('India', 'Pakistan', 'T20', 'India', 'Dubai'),
  ('India', 'South Africa', 'ODI', 'South Africa', 'Johannesburg'),
  ('India', 'New Zealand', 'Test', 'India', 'Mumbai'),
  ('India', 'Sri Lanka', 'ODI', 'India', 'Colombo')
ON CONFLICT DO NOTHING;

-- Insert Training Data
INSERT INTO training_data (player_name, format, avg_score, strike_rate, opposition, prediction)
VALUES
  ('Virat Kohli', 'ODI', 52.3, 94.2, 'Australia', 0.85),
  ('Rohit Sharma', 'ODI', 48.5, 91.8, 'Australia', 0.78),
  ('Rishabh Pant', 'ODI', 42.1, 112.5, 'England', 0.82),
  ('KL Rahul', 'ODI', 45.2, 89.3, 'Pakistan', 0.76),
  ('Hardik Pandya', 'ODI', 38.5, 115.2, 'South Africa', 0.80),
  ('Shubman Gill', 'ODI', 52.8, 90.1, 'New Zealand', 0.88),
  ('Jasprit Bumrah', 'ODI', 0, 0, 'Australia', 0.92),
  ('Mohammed Shami', 'ODI', 0, 0, 'England', 0.88)
ON CONFLICT DO NOTHING;

-- Insert Model Metrics
INSERT INTO model_metrics (model_name, format, accuracy, precision, recall, f1_score)
VALUES
  ('Random Forest', 'ODI', 0.87, 0.85, 0.88, 0.86),
  ('XGBoost', 'ODI', 0.89, 0.88, 0.90, 0.89),
  ('Ensemble', 'ODI', 0.91, 0.90, 0.92, 0.91)
ON CONFLICT DO NOTHING;

-- Verify Data
SELECT 'Players Performance' as table_name, COUNT(*) as row_count FROM players_performance
UNION ALL
SELECT 'Opposition Players', COUNT(*) FROM opposition_players
UNION ALL
SELECT 'Match History', COUNT(*) FROM match_history
UNION ALL
SELECT 'Training Data', COUNT(*) FROM training_data
UNION ALL
SELECT 'Model Metrics', COUNT(*) FROM model_metrics;
