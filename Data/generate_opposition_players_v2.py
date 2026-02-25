import pandas as pd
import sqlite3
from collections import defaultdict

# Connect to database
conn = sqlite3.connect('data/cricket.db')

# Define countries to extract
countries = {
    'AUSTRALIA': 'Australia',
    'ENGLAND': 'England',
    'PAKISTAN': 'Pakistan',
    'SOUTH_AFRICA': 'South Africa',
    'NEW_ZEALAND': 'New Zealand',
    'SRI_LANKA': 'Sri Lanka',
    'BANGLADESH': 'Bangladesh',
    'AFGHANISTAN': 'Afghanistan',
    'WEST_INDIES': 'West Indies',
    'ZIMBABWE': 'Zimbabwe',
    'IRELAND': 'Ireland'
}

print("Analyzing players by country from deliveries...\n")

# For each country, get players who batted for that team
country_players = defaultdict(lambda: defaultdict(int))

for country_code, country_name in countries.items():
    print(f"Processing {country_name}...")
    
    # Get batters for this team using batting_team and batter_id
    query_batters = f"""
    SELECT 
        p.canonical_name as player,
        COUNT(DISTINCT d.match_id) as match_count,
        COUNT(*) as balls_faced
    FROM deliveries d
    JOIN matches m ON d.match_id = m.id
    JOIN players p ON d.batter_id = p.id
    WHERE d.batting_team = '{country_name}'
    AND m.date >= '2020-01-01'
    GROUP BY p.canonical_name
    ORDER BY match_count DESC, balls_faced DESC
    """
    
    batters = pd.read_sql(query_batters, conn)
    
    # Get bowlers for this team (bowlers when opposite team is batting)
    query_bowlers = f"""
    SELECT 
        p.canonical_name as player,
        COUNT(DISTINCT d.match_id) as match_count,
        COUNT(*) as balls_bowled
    FROM deliveries d
    JOIN matches m ON d.match_id = m.id
    JOIN players p ON d.bowler_id = p.id
    WHERE d.batting_team != '{country_name}'
    AND (m.team1 = '{country_name}' OR m.team2 = '{country_name}')
    AND m.date >= '2020-01-01'
    GROUP BY p.canonical_name
    ORDER BY match_count DESC, balls_bowled DESC
    """
    
    bowlers = pd.read_sql(query_bowlers, conn)
    
    # Combine batters and bowlers
    all_players = {}
    
    for _, row in batters.iterrows():
        player = row['player']
        all_players[player] = all_players.get(player, 0) + row['match_count']
    
    for _, row in bowlers.iterrows():
        player = row['player']
        all_players[player] = all_players.get(player, 0) + row['match_count']
    
    country_players[country_code] = all_players

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
    
    print(f"Top {len(top_players)} players (by match appearances since 2020):")
    for i, (player, count) in enumerate(top_players, 1):
        print(f"{i:2d}. {player:35s} ({count:4d} match appearances)")
    
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
