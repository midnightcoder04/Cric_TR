# Prediction Script Usage Guide

## Quick Start

The prediction script (`08_predict.py`) now uses player list files instead of demo data.

### Simple Usage (Edit Configuration Variables)

1. **Edit the configuration at the top of `08_predict.py`:**

```python
# Match Format
MATCH_FORMAT = "t20"      # Options: "t20", "odi", "test"

# Teams (player list files)
TEAM1_FILE = "p_T20.txt"           # Your team
TEAM2_FILE = "p_AUSTRALIA.txt"     # Opponent team

# Venue
VENUE = "Wankhede Stadium"

# Pitch Type
PITCH_TYPE = "flat"        # Options: "flat", "spin", "seam", "pace", "balanced"

# Team Names (for display)
TEAM1_NAME = "India"
TEAM2_NAME = "Australia"
```

2. **Run the script:**
```bash
python 08_predict.py
```

---

## Available Player List Files

Place these files in the parent directory (`/Users/abq/Documents/Github/Freelance/24_CricketTR/`):

### Your Team (India)
- `p_T20.txt` - Indian T20 squad (30 players)
- `p_ODI.txt` - Indian ODI squad (33 players)
- `p_TEST.txt` - Indian Test squad (26 players)

### Opponent Teams
- `p_AUSTRALIA.txt` (15 players)
- `p_ENGLAND.txt` (15 players)
- `p_PAKISTAN.txt` (15 players)
- `p_SOUTH_AFRICA.txt` (15 players)
- `p_NEW_ZEALAND.txt` (15 players)
- `p_SRI_LANKA.txt` (15 players)
- `p_BANGLADESH.txt` (15 players)
- `p_WEST_INDIES.txt` (15 players)
- `p_ZIMBABWE.txt` (15 players)
- `p_IRELAND.txt` (15 players)

**File Location:** The script searches for these files in `Data/players/` subdirectory (or parent directory).

---

## Command Line Usage (Alternative)

You can also override the configuration using command-line arguments:

```bash
python 08_predict.py \
  --team1-file p_ODI.txt \
  --team2-file p_PAKISTAN.txt \
  --venue "Eden Gardens" \
  --pitch spin \
  --format odi
```

### Command Line Arguments

- `--team1-file` - Path to Team 1 player list file
- `--team2-file` - Path to Team 2 player list file
- `--venue` - Venue name
- `--pitch` - Pitch type (flat/spin/seam/pace/balanced)
- `--format` - Match format (t20/odi/test)
- `--team1` - Team 1 display name (optional)
- `--team2` - Team 2 display name (optional)
- `--overseas` - Comma-separated overseas player names (optional)

---

## Example Scenarios

### Example 1: India vs Australia T20 at Wankhede
```python
MATCH_FORMAT = "t20"
TEAM1_FILE = "p_T20.txt"
TEAM2_FILE = "p_AUSTRALIA.txt"
VENUE = "Wankhede Stadium"
PITCH_TYPE = "flat"
```

### Example 2: India vs Pakistan ODI at Eden Gardens
```python
MATCH_FORMAT = "odi"
TEAM1_FILE = "p_ODI.txt"
TEAM2_FILE = "p_PAKISTAN.txt"
VENUE = "Eden Gardens"
PITCH_TYPE = "spin"
```

### Example 3: India vs England Test at Lord's
```python
MATCH_FORMAT = "test"
TEAM1_FILE = "p_TEST.txt"
TEAM2_FILE = "p_ENGLAND.txt"
VENUE = "Lord's Cricket Ground"
PITCH_TYPE = "seam"
```

---

## Pitch Type Guidelines

- **flat** - High-scoring, batting-friendly (e.g., Wankhede, Chinnaswamy)
- **spin** - Assists spinners (e.g., Chepauk, Eden Gardens, Feroz Shah Kotla)
- **seam** - Assists seam bowling (e.g., Headingley, Lord's, The Oval)
- **pace** - Assists pace bowling (e.g., MCG, WACA, SuperSport Park)
- **balanced** - Even contest between bat and ball (e.g., SCG)

---

## Venue Suggestions

### India
- Wankhede Stadium (Mumbai) - flat
- Eden Gardens (Kolkata) - flat/spin
- Chepauk (Chennai) - spin
- Chinnaswamy Stadium (Bengaluru) - flat
- Feroz Shah Kotla (Delhi) - spin

### England
- Lord's Cricket Ground - seam
- The Oval - seam
- Headingley - seam
- Old Trafford - balanced

### Australia
- Melbourne Cricket Ground (MCG) - pace
- Sydney Cricket Ground (SCG) - balanced
- WACA (Perth) - pace
- Adelaide Oval - balanced

### Other
- SuperSport Park (South Africa) - pace
- Newlands (South Africa) - pace
- Sharjah Cricket Stadium (UAE) - flat/spin

---

## Output

The script will generate:

1. **Playing XI Selection** - Top 11 players optimized for the match
2. **Predicted Impact Scores** - Expected contribution (0-100) for each player
3. **Confidence Intervals** - Range of expected performance
4. **Justifications** - Why each player was selected based on:
   - Recent form
   - Career statistics
   - Venue/pitch-specific performance
   - Head-to-head records vs opponent
5. **Full Squad Rankings** - All players ranked by predicted impact

---

## Troubleshooting

### Error: "Player list file not found"
- Ensure the `.txt` files are in the parent directory
- Check the filename matches exactly (case-sensitive)

### Error: "Missing xgb_model.pkl"
- Run the full pipeline first:
  ```bash
  python 01_download_data.py
  python 02_setup_database.py
  python 03_clean_data.py
  python 04_feature_engineering.py
  python 05_build_feature_matrix.py
  python 06_train_models.py
  ```

### Low Prediction Quality
- Ensure player names in `.txt` files match database names exactly
- Use `check_players.py` to verify player name matching
- Check that players have sufficient historical data for the format

---

## Notes

- The script selects the best XI from Team 1's squad
- Team 2 information is used for opponent-specific features (head-to-head stats)
- Player names must match the database canonical names exactly
- Use the same format (T20/ODI/Test) for both player lists and match format setting
