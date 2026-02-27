-- Insert sample player performance data for ML training
-- Run this in Supabase SQL Editor

-- Insert Indian players performance data
INSERT INTO public.players_performance (
  player_id,
  player_name,
  role,
  format,
  matches_played,
  average_score,
  strike_rate,
  wickets,
  economy_rate,
  recent_form,
  created_at
) VALUES
  ('IND_001', 'Rohit Sharma', 'Batter', 'ODI', 150, 48.5, 92.3, 0, 0.0, '[75, 82, 68, 91, 77]'::jsonb, NOW()),
  ('IND_002', 'Virat Kohli', 'Batter', 'ODI', 295, 59.2, 90.1, 0, 0.0, '[88, 92, 78, 85, 91]'::jsonb, NOW()),
  ('IND_003', 'KL Rahul', 'Batter', 'ODI', 89, 45.3, 89.5, 0, 0.0, '[65, 72, 58, 81, 69]'::jsonb, NOW()),
  ('IND_004', 'Suryakumar Yadav', 'Batter', 'T20', 45, 38.2, 165.4, 0, 0.0, '[42, 56, 48, 63, 51]'::jsonb, NOW()),
  ('IND_005', 'Jasprit Bumrah', 'Bowler', 'ODI', 128, 0.0, 0.0, 187, 4.75, '[2, 3, 1, 2, 3]'::jsonb, NOW()),
  ('IND_006', 'Mohammed Shami', 'Bowler', 'ODI', 105, 0.0, 0.0, 164, 5.12, '[1, 2, 2, 1, 2]'::jsonb, NOW()),
  ('IND_007', 'Hardik Pandya', 'All-rounder', 'ODI', 78, 35.8, 108.2, 68, 6.23, '[45, 52, 38, 61, 48]'::jsonb, NOW()),
  ('IND_008', 'Ravindra Jadeja', 'All-rounder', 'Test', 62, 38.5, 72.3, 267, 2.85, '[62, 58, 71, 64, 69]'::jsonb, NOW()),
  ('IND_009', 'Kuldeep Yadav', 'Bowler', 'ODI', 34, 0.0, 0.0, 41, 5.45, '[2, 1, 3, 2, 1]'::jsonb, NOW()),
  ('IND_010', 'Yuzvendra Chahal', 'Bowler', 'T20', 78, 0.0, 0.0, 84, 7.82, '[1, 2, 1, 2, 2]'::jsonb, NOW());

-- Insert opposition team player data
INSERT INTO public.opposition_players (
  opposition_team,
  player_name,
  role,
  avg_score,
  strike_rate,
  weakness,
  strength,
  created_at
) VALUES
  ('Australia', 'Steve Smith', 'Batter', 52.3, 92.1, 'Short ball outside off stump', 'Exceptional technique against spin', NOW()),
  ('Australia', 'Pat Cummins', 'Bowler', 0.0, 0.0, 'Struggles on slow pitches', 'Excellent yorker at death', NOW()),
  ('Australia', 'David Warner', 'Batter', 48.5, 95.2, 'Yorkers early in innings', 'Aggressive batting in powerplay', NOW()),
  ('England', 'Joe Root', 'Batter', 48.7, 89.5, 'Aggressive short ball tactics', 'Versatile against all bowling types', NOW()),
  ('England', 'Ben Stokes', 'All-rounder', 44.2, 91.8, 'Pace bowling at death', 'Aggressive counter-attacking play', NOW()),
  ('England', 'Jofra Archer', 'Bowler', 0.0, 0.0, 'Control on flat pitches', 'Pace and yorkers at death', NOW()),
  ('Pakistan', 'Babar Azam', 'Batter', 50.2, 88.3, 'Slower deliveries in death overs', 'Consistent scoring in powerplay', NOW()),
  ('Pakistan', 'Shaheen Afridi', 'Bowler', 0.0, 0.0, 'Limited death bowling', 'Excellent new ball bowling', NOW()),
  ('Pakistan', 'Mohammad Rizwan', 'Batter', 46.8, 90.2, 'Against short pitch strategy', 'Patient accumulation', NOW()),
  ('South Africa', 'Aiden Markram', 'Batter', 49.5, 87.3, 'Pace bowling on bouncy pitches', 'Technical batting against spin', NOW()),
  ('New Zealand', 'Kane Williamson', 'Batter', 51.2, 85.4, 'Aggressive short ball tactics', 'Technical excellence in all conditions', NOW()),
  ('Sri Lanka', 'Dhananjaya de Silva', 'Batter', 43.2, 80.5, 'Pace on bouncy pitches', 'Test cricket technique', NOW()),
  ('West Indies', 'Jason Holder', 'All-rounder', 35.2, 78.5, 'Spin bowling', 'Experience and leadership', NOW()),
  ('Bangladesh', 'Mushfiqur Rahim', 'Batter', 38.5, 82.1, 'Pace bowling', 'Experience and technique', NOW());

-- Insert match history data
INSERT INTO public.match_history (
  match_date,
  india_team,
  opposition,
  format,
  result,
  india_runs,
  opposition_runs,
  created_at
) VALUES
  (NOW() - INTERVAL '30 days', 'India', 'Australia', 'ODI', 'Won', 287, 245, NOW()),
  (NOW() - INTERVAL '25 days', 'India', 'England', 'Test', 'Won', 416, 364, NOW()),
  (NOW() - INTERVAL '20 days', 'India', 'Pakistan', 'T20', 'Won', 182, 156, NOW()),
  (NOW() - INTERVAL '15 days', 'India', 'South Africa', 'ODI', 'Lost', 268, 289, NOW()),
  (NOW() - INTERVAL '10 days', 'India', 'New Zealand', 'Test', 'Draw', 345, 342, NOW()),
  (NOW() - INTERVAL '5 days', 'India', 'Sri Lanka', 'ODI', 'Won', 298, 261, NOW());

-- Insert training data
INSERT INTO public.training_data (
  player_name,
  opposition,
  format,
  selected_in_xi,
  performance_score,
  match_result,
  created_at
) VALUES
  ('Virat Kohli', 'Australia', 'ODI', true, 88.5, 'Won', NOW()),
  ('Rohit Sharma', 'Australia', 'ODI', true, 82.3, 'Won', NOW()),
  ('Jasprit Bumrah', 'Australia', 'ODI', true, 91.2, 'Won', NOW()),
  ('KL Rahul', 'Australia', 'ODI', false, 45.6, 'Won', NOW()),
  ('Joe Root', 'England', 'Test', true, 78.9, 'Won', NOW()),
  ('Ben Stokes', 'England', 'Test', true, 72.4, 'Won', NOW()),
  ('Babar Azam', 'Pakistan', 'T20', true, 85.3, 'Won', NOW()),
  ('Shaheen Afridi', 'Pakistan', 'T20', true, 88.7, 'Won', NOW());

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_players_performance_player_id ON public.players_performance(player_id);
CREATE INDEX IF NOT EXISTS idx_players_performance_format ON public.players_performance(format);
CREATE INDEX IF NOT EXISTS idx_opposition_players_team ON public.opposition_players(opposition_team);
CREATE INDEX IF NOT EXISTS idx_match_history_date ON public.match_history(match_date);
CREATE INDEX IF NOT EXISTS idx_training_data_player ON public.training_data(player_name);

-- Display inserted data summary
SELECT 'Players Performance Inserted' as table_name, COUNT(*) as count FROM public.players_performance
UNION ALL
SELECT 'Opposition Players Inserted', COUNT(*) FROM public.opposition_players
UNION ALL
SELECT 'Match History Inserted', COUNT(*) FROM public.match_history
UNION ALL
SELECT 'Training Data Inserted', COUNT(*) FROM public.training_data;
