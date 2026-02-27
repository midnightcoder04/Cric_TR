-- Minimal SQL Insert Script
-- This script only inserts data without creating tables
-- Tables must already exist in Supabase

-- Insert Indian Players Performance Data
INSERT INTO public.players_performance (player_name, format, average, strike_rate, recent_performance, form)
VALUES
('Virat Kohli', 'ODI', 50.5, 92.3, 85, 'Excellent'),
('Rohit Sharma', 'ODI', 48.2, 95.1, 88, 'Excellent'),
('Shubman Gill', 'ODI', 45.3, 88.5, 82, 'Good'),
('KL Rahul', 'ODI', 42.1, 85.2, 78, 'Good'),
('Rishabh Pant', 'ODI', 38.5, 110.2, 92, 'Excellent'),
('Hardik Pandya', 'ODI', 36.2, 105.8, 80, 'Good'),
('Ravindra Jadeja', 'ODI', 32.1, 95.5, 75, 'Good'),
('Mohammed Shami', 'ODI', 0, 0, 72, 'Good'),
('Jasprit Bumrah', 'ODI', 0, 0, 88, 'Excellent'),
('Yuzvendra Chahal', 'ODI', 0, 0, 70, 'Average')
ON CONFLICT (player_name, format) DO NOTHING;

INSERT INTO public.players_performance (player_name, format, average, strike_rate, recent_performance, form)
VALUES
('Virat Kohli', 'T20', 48.5, 135.2, 82, 'Excellent'),
('Suryakumar Yadav', 'T20', 42.3, 140.5, 88, 'Excellent'),
('Hardik Pandya', 'T20', 38.2, 155.8, 90, 'Excellent'),
('Rishabh Pant', 'T20', 35.8, 152.1, 85, 'Good'),
('Ravindra Jadeja', 'T20', 28.5, 125.3, 72, 'Good')
ON CONFLICT (player_name, format) DO NOTHING;

-- Insert Opposition Players
INSERT INTO public.opposition_players (player_name, team, role, average, strike_rate, weakness, strength)
VALUES
('Steve Smith', 'Australia', 'Batter', 52.3, 92.1, 'Short ball outside off', 'Exceptional technique'),
('David Warner', 'Australia', 'Batter', 48.5, 95.2, 'Yorkers early innings', 'Aggressive powerplay'),
('Pat Cummins', 'Australia', 'Bowler', 0, 0, 'Slow pitches', 'Excellent yorker'),
('Joe Root', 'England', 'Batter', 48.7, 89.5, 'Aggressive short balls', 'Versatile bowling'),
('Ben Stokes', 'England', 'All-rounder', 44.2, 91.8, 'Pace at death', 'Counter-attacking'),
('Jofra Archer', 'England', 'Bowler', 0, 0, 'Control flat pitches', 'Pace and yorkers'),
('Babar Azam', 'Pakistan', 'Batter', 50.2, 88.3, 'Slowers at death', 'Powerplay scoring'),
('Shaheen Afridi', 'Pakistan', 'Bowler', 0, 0, 'Limited death bowling', 'New ball excellence'),
('Aiden Markram', 'South Africa', 'Batter', 49.5, 87.3, 'Pace on bouncy', 'Technique vs spin')
ON CONFLICT (player_name, team) DO NOTHING;

-- View what was inserted
SELECT 'Players Performance' as table_name, COUNT(*) as row_count FROM public.players_performance
UNION ALL
SELECT 'Opposition Players' as table_name, COUNT(*) as row_count FROM public.opposition_players;
