# How to Add Data to Supabase for Cricket ML System

This guide covers 4 different methods to add data to Supabase for training the Random Forest and XGBoost models.

## Method 1: SQL Script (Fastest - Recommended for Initial Setup)

### Step 1: Access Supabase SQL Editor
1. Go to [Supabase Dashboard](https://app.supabase.com)
2. Select your project
3. Click **SQL Editor** in the left sidebar
4. Click **New Query**

### Step 2: Run the SQL Script
1. Copy the entire content from `scripts/insert-sample-data.sql`
2. Paste into the SQL Editor
3. Click **Run** button
4. You'll see confirmation showing records inserted

**Data Inserted:**
- 10 Indian players performance records
- 14 Opposition players data
- 6 Match history records
- 8 Training data records

This method inserts pre-configured sample data in seconds.

---

## Method 2: Supabase Dashboard UI (Manual - Best for Adding Individual Records)

### Step 1: Add Players Performance Data
1. Go to Supabase Dashboard → **Table Editor**
2. Click on `players_performance` table
3. Click **Insert Row** button
4. Fill in the fields:
   - `player_id`: e.g., "IND_001"
   - `player_name`: e.g., "Rohit Sharma"
   - `role`: Select "Batter", "Bowler", or "All-rounder"
   - `format`: Select "ODI", "T20", or "Test"
   - `matches_played`: e.g., 150
   - `average_score`: e.g., 48.5
   - `strike_rate`: e.g., 92.3
   - `recent_form`: Enter JSON array like `[75, 82, 68, 91, 77]`
5. Click **Save** to insert

### Step 2: Add Opposition Players
1. Go to `opposition_players` table
2. Click **Insert Row**
3. Fill in:
   - `opposition_team`: e.g., "Australia"
   - `player_name`: e.g., "Steve Smith"
   - `role`: e.g., "Batter"
   - `avg_score`: e.g., 52.3
   - `strike_rate`: e.g., 92.1
   - `weakness`: e.g., "Short ball outside off stump"
   - `strength`: e.g., "Exceptional technique against spin"
4. Click **Save**

### Step 3: Add Match History
1. Go to `match_history` table
2. Click **Insert Row**
3. Fill in:
   - `match_date`: Pick a date
   - `india_team`: "India"
   - `opposition`: e.g., "Australia"
   - `format`: "ODI", "T20", or "Test"
   - `result`: "Won", "Lost", or "Draw"
   - `india_runs`: e.g., 287
   - `opposition_runs`: e.g., 245
4. Click **Save**

---

## Method 3: API Route from App (Programmatic - Best for Dynamic Data)

### Step 1: Add Player Data via API

**Using cURL:**
```bash
curl -X POST http://localhost:3000/api/data/add-player-performance \
  -H "Content-Type: application/json" \
  -d '{
    "playerName": "Virat Kohli",
    "role": "Batter",
    "format": "ODI",
    "matchesPlayed": 295,
    "averageScore": 59.2,
    "strikeRate": 90.1,
    "recentForm": [88, 92, 78, 85, 91]
  }'
```

**Using JavaScript/fetch:**
```javascript
const response = await fetch('/api/data/add-player-performance', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    playerName: 'Virat Kohli',
    role: 'Batter',
    format: 'ODI',
    matchesPlayed: 295,
    averageScore: 59.2,
    strikeRate: 90.1,
    recentForm: [88, 92, 78, 85, 91],
  }),
})

const data = await response.json()
console.log('Player added:', data)
```

### Step 2: Retrieve All Player Data

**Using fetch:**
```javascript
const response = await fetch('/api/data/add-player-performance')
const players = await response.json()
console.log('All players:', players.data)
```

---

## Method 4: Python Script (For ML Training Data)

We have `scripts/generate_training_data.py` that creates synthetic training data for model training.

### Step 1: Install Dependencies
```bash
pip install -r scripts/ml_requirements.txt
```

### Step 2: Run Training Data Generator
```bash
python scripts/generate_training_data.py
```

This will:
- Generate 500+ training records
- Insert them into `training_data` table
- Create realistic performance scores
- Train Random Forest and XGBoost models

---

## Database Schema Reference

### `players_performance` Table
```sql
- player_id (TEXT, Primary Key)
- player_name (TEXT)
- role (TEXT): "Batter", "Bowler", "All-rounder"
- format (TEXT): "ODI", "T20", "Test"
- matches_played (INTEGER)
- average_score (DECIMAL)
- strike_rate (DECIMAL)
- wickets (INTEGER, optional for bowlers)
- economy_rate (DECIMAL, optional for bowlers)
- recent_form (JSONB): Array of last 5 scores
- created_at (TIMESTAMP)
```

### `opposition_players` Table
```sql
- id (UUID, Primary Key)
- opposition_team (TEXT)
- player_name (TEXT)
- role (TEXT)
- avg_score (DECIMAL)
- strike_rate (DECIMAL)
- weakness (TEXT)
- strength (TEXT)
- created_at (TIMESTAMP)
```

### `match_history` Table
```sql
- id (UUID, Primary Key)
- match_date (TIMESTAMP)
- india_team (TEXT)
- opposition (TEXT)
- format (TEXT): "ODI", "T20", "Test"
- result (TEXT): "Won", "Lost", "Draw"
- india_runs (INTEGER)
- opposition_runs (INTEGER)
- created_at (TIMESTAMP)
```

### `training_data` Table
```sql
- id (UUID, Primary Key)
- player_name (TEXT)
- opposition (TEXT)
- format (TEXT)
- selected_in_xi (BOOLEAN)
- performance_score (DECIMAL)
- match_result (TEXT)
- created_at (TIMESTAMP)
```

---

## Data Entry Best Practices

### 1. **For Cricket Statistics**
- **Average Score**: Range 20-60 for batters (higher = better)
- **Strike Rate**: Range 75-150 (higher = more aggressive)
- **Recent Form**: Array of 5 recent match scores (0-100)
- **Wickets/Economy**: For bowlers (lower economy = better)

### 2. **For Opposition Weaknesses & Strengths**
- Be specific: "Struggles against left-arm spinners on turning pitches"
- Not generic: "Weak against spin"
- Examples of good weakness descriptions:
  - "Short ball outside off stump"
  - "Yorkers at death"
  - "Pace bowling on bouncy pitches"
  - "Slow balls in middle overs"

### 3. **For Match Results**
- Enter actual match data when available
- Use historical data to train models
- Format consistency is important for ML training

---

## Verify Data was Added

### In Supabase Dashboard:
1. Go to **Table Editor**
2. Click any table
3. See the row count increase
4. Review data in the table grid

### Using API:
```bash
curl http://localhost:3000/api/data/add-player-performance
```

You'll get JSON response showing all stored player data.

---

## Tips for ML Model Training

The models work best with:
- **At least 100+ training records** (more = better)
- **Balanced data** (equal representation of formats)
- **Consistent metrics** (use same ranges for scores)
- **Recent data** (matches from last 1-2 years)
- **Complete player info** (all fields filled, no nulls)

Once you have 100+ training records in `training_data` table, the ML models will be highly accurate!

---

## Troubleshooting

### Error: "players_performance table doesn't exist"
→ Run the setup SQL script first: `scripts/setup-supabase-schema.sql`

### Error: "Invalid JSON in recent_form"
→ Format must be: `[75, 82, 68, 91, 77]` (array of numbers)

### Error: "Column 'created_at' is missing"
→ Supabase auto-generates timestamps, but ensure field is `TIMESTAMP DEFAULT now()`

### Data not appearing in table
→ Check you're viewing the correct project and table
→ Refresh the page (browser cache issue)
→ Check Row Level Security (RLS) policies aren't blocking inserts

---

For more help, check the ML implementation docs at `docs/ML_IMPLEMENTATION_SUMMARY.md`
