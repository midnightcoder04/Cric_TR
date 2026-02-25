import pandas as pd
import sqlite3
from collections import defaultdict

# Connect to database
conn = sqlite3.connect('data/cricket.db')

# Define countries to extract (with possible name variations in the database)
countries = {
    'AUSTRALIA': ['Australia'],
    'ENGLAND': ['England'],
    'PAKISTAN': ['Pakistan'],
    'SOUTH_AFRICA': ['South Africa'],
    'NEW_ZEALAND': ['New Zealand'],
    'SRI_LANKA': ['Sri Lanka'],
    'BANGLADESH': ['Bangladesh'],
    'AFGHANISTAN': ['Afghanistan'],
    'WEST_INDIES': ['West Indies'],
    'ZIMBABWE': ['Zimbabwe'],
    'IRELAND': ['Ireland']
}

print("Analyzing players by country from player_matches table...\n")

# Get player stats from player_matches joined with players and matches
query = """
SELECT 
    p.canonical_name as player,
    pm.team,
    m.match_format,
    m.date,
    COUNT(DISTINCT pm.match_id) as match_count
FROM player_matches pm
JOIN players p ON pm.player_id = p.id
JOIN matches m ON pm.match_id = m.id
WHERE pm.team IS NOT NULL 
  AND m.date >= '2020-01-01'
GROUP BY p.canonical_name, pm.team, m.match_format
ORDER BY pm.team, match_count DESC
"""

player_stats = pd.read_sql(query, conn)

print(f"Total player-team records: {len(player_stats)}\n")

# Group players by country
country_players = defaultdict(lambda: defaultdict(int))

for _, row in player_stats.iterrows():
    team = row['team']
    player = row['player']
    matches = row['match_count']
    
    # Match team to country
    for country_code, team_names in countries.items():
        if team in team_names:
            country_players[country_code][player] += matches
            break

# Generate file for each country
for country_code in sorted(countries.keys()):
    print(f"\n{'='*70}")
    print(f"{country_code.replace('_', ' ')}")
    print('='*70)
    
    # Sort players by total matches
    players = country_players[country_code]
    
    if not players:
        print(f"⚠ No players found for this country")
        continue
        
    sorted_players = sorted(players.items(), key=lambda x: x[1], reverse=True)
    
    # Get top 20 for display
    top_players = sorted_players[:20]
    
    print(f"Top {len(top_players)} players (by matches since 2020):")
    for i, (player, count) in enumerate(top_players, 1):
        print(f"{i:2d}. {player:35s} ({count:4d} matches)")
    
    # Create file with top 15
    filename = f"../p_{country_code}.txt"
    with open(filename, 'w') as f:
        for player, _ in sorted_players[:15]:  # Top 15 for the file
            f.write(f"{player}\n")
    
    print(f"\n✓ Created {filename}")

conn.close()
print(f"\n{'='*70}")
print("All country player files created!")
print('='*70)
