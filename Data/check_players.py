import pandas as pd
import sqlite3
from difflib import SequenceMatcher

def similarity(a, b):
    """Calculate similarity ratio between two strings."""
    return SequenceMatcher(None, a.lower(), b.lower()).ratio()

# Read the player names from the file
with open('IND_players.txt', 'r') as f:
    players = [line.strip() for line in f if line.strip()]

# Remove duplicates
players = sorted(set(players))

print(f"Total unique players to check: {len(players)}\n")

# Connect to database
conn = sqlite3.connect('data/cricket.db')

# Get all player names from database
db_players = pd.read_sql("SELECT id, canonical_name, name_variants FROM players", conn)

found = []
not_found = []
fuzzy_matches = []

for player in players:
    # Check if player exists in canonical_name or name_variants
    match = db_players[
        (db_players['canonical_name'].str.contains(player, case=False, na=False)) |
        (db_players['name_variants'].str.contains(player, case=False, na=False))
    ]
    
    if len(match) > 0:
        found.append((player, match.iloc[0]['canonical_name']))
    else:
        # Try fuzzy matching on canonical names
        similarities = []
        for idx, row in db_players.iterrows():
            canonical = row['canonical_name']
            # Check similarity with full name
            sim = similarity(player, canonical)
            # Also check if last name matches
            player_parts = player.lower().split()
            canonical_parts = canonical.lower().split()
            if player_parts and canonical_parts:
                last_name_match = player_parts[-1] == canonical_parts[-1]
                if last_name_match:
                    sim = max(sim, 0.7)  # Boost score for last name match
            
            if sim > 0.6:  # Threshold for similarity
                similarities.append((canonical, sim))
        
        if similarities:
            # Sort by similarity
            similarities.sort(key=lambda x: x[1], reverse=True)
            fuzzy_matches.append((player, similarities[:5]))  # Top 5 matches
            not_found.append(player)
        else:
            not_found.append(player)

print("=" * 70)
print("PLAYERS FOUND IN DATABASE (EXACT MATCH):")
print("=" * 70)
for orig, canonical in found:
    print(f"✓ {orig:30s} → {canonical}")

print(f"\n{'=' * 70}")
print(f"PLAYERS NOT FOUND - POSSIBLE MATCHES:")
print("=" * 70)
for player, matches in fuzzy_matches:
    print(f"\n✗ {player}")
    for match_name, score in matches:
        print(f"   → {match_name:40s} (similarity: {score:.2f})")

# Check if any players have no matches at all
no_matches = [p for p in not_found if p not in [fm[0] for fm in fuzzy_matches]]
if no_matches:
    print(f"\n{'=' * 70}")
    print("PLAYERS WITH NO SIMILAR MATCHES:")
    print("=" * 70)
    for player in no_matches:
        print(f"✗ {player}")

print(f"\n{'=' * 70}")
print(f"Summary: {len(found)}/{len(players)} exact matches, {len(fuzzy_matches)} with similar names")
print("=" * 70)

conn.close()
