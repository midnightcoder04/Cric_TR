# Cricket Team Recommendation ML Pipeline

This document describes the implementation of Random Forest and XGBoost models for AI-powered cricket team recommendations using Supabase and a Python ML API.

## Architecture

```
┌─────────────────────┐
│   Next.js Frontend  │
│  (Recommendations)  │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────────────────────┐
│   Next.js API Routes                │
│  /api/ml/predict-team               │
│  /api/ml/predict-player             │
└──────────┬──────────────────────────┘
           │
           ▼
┌─────────────────────────────────────┐
│   Python ML API Server (Flask)      │
│  - Random Forest Classifier         │
│  - XGBoost Classifier               │
│  - Ensemble Predictions             │
└──────────┬──────────────────────────┘
           │
           ▼
┌─────────────────────────────────────┐
│   Supabase PostgreSQL Database      │
│  - Players Performance Data         │
│  - Match History                    │
│  - Opposition Players Data          │
│  - Training Data                    │
│  - Model Metrics                    │
└─────────────────────────────────────┘
```

## Models Implemented

### 1. Random Forest Classifier
- **Estimators**: 100 trees
- **Max Depth**: 15
- **Purpose**: Handles non-linear relationships in player performance
- **Features Used**:
  - Player statistics (average, strike rate, economy)
  - Form score (recent performance)
  - Player role encoding
  - Opposition player metrics
  - Format-specific adaptability

### 2. XGBoost Classifier
- **Estimators**: 100 boosting rounds
- **Max Depth**: 7
- **Learning Rate**: 0.1
- **Purpose**: Gradient-based optimization for faster convergence
- **Features Used**: Same as Random Forest
- **Advantages**:
  - Handles imbalanced data better
  - Faster prediction times
  - Better feature importance analysis

### 3. Ensemble Method
- Combines predictions from both models
- Average ensemble: `(RF_score + XGB_score) / 2`
- Increases robustness and reliability of predictions

## Feature Engineering

Each player is represented by the following features:

### Batting Features
- Average runs per match
- Strike rate
- Form score (0-100)
- Recent performance average (last 5 matches)
- Role encoding (batsman/bowler/all-rounder)

### Bowling Features
- Economy rate
- Wickets taken
- Form score
- Recent performance
- Role encoding

### Opposition Context
- Opposition player average score
- Opposition recent form
- Match format (ODI/T20/Test)
- Opposition team strength

## Database Schema

### players_performance
Stores Indian players' historical performance data
- player_name, role, format
- runs, average, strike_rate
- wickets, economy, catch_count
- form_score, recent_performance

### match_history
Stores past matches and their outcomes
- match_date, india_players, opposition_team
- india_score, opposition_score
- player_performances (JSONB)

### opposition_players
Stores opposition teams' player data
- player_name, role, country
- avg_score, strike_rate, bowling_average
- strength_vs_india, weakness_vs_india
- recent_form

### training_data
Stores labeled data for model training
- indian_player_id, opposition_player_id
- strength_match, weakness_match
- result (1=win, 0=loss/draw)

### team_recommendations
Caches ML predictions
- opposition_team, format
- selected_xi, model_type
- confidence_score, win_probability

## Setup & Deployment

### 1. Set up Supabase Database

```bash
# Execute the schema setup script
psql $DATABASE_URL < scripts/setup-supabase-schema.sql
```

Update your `.env.local`:
```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
ML_API_URL=http://localhost:5000  # Local development
# or
ML_API_URL=https://your-ml-api.herokuapp.com  # Production
```

### 2. Deploy Python ML API

#### Local Development
```bash
cd scripts
pip install -r ml_requirements.txt
python ml_api_server.py
# Server runs on http://localhost:5000
```

#### Production Deployment (Heroku)
```bash
# Create Heroku app
heroku create your-cricket-ml-api
heroku buildpacks:add heroku/python

# Deploy
git push heroku main

# Set environment variables
heroku config:set ML_API_URL=https://your-cricket-ml-api.herokuapp.com
```

#### AWS Lambda / Google Cloud Functions
See `scripts/serverless_deployment.md` for containerized deployment options.

### 3. Train Models

#### Initial Training
Send training data to the API:
```bash
curl -X POST http://localhost:5000/train \
  -H "Content-Type: application/json" \
  -d @training_data.json
```

#### Automated Retraining
Models should be retrained monthly with new match data using a scheduled job.

## API Endpoints

### POST /api/ml/predict-team
Predicts the best XI against a given opposition using ensemble of RF + XGBoost

**Request**:
```json
{
  "availablePlayers": [...],
  "oppositionTeam": "Australia",
  "format": "ODI"
}
```

**Response**:
```json
{
  "selected_xi": ["Player1", "Player2", ...],
  "player_scores": {...},
  "confidence": 0.78,
  "model_used": "ensemble",
  "opposition_team": "Australia"
}
```

### POST /api/ml/predict-player
Predicts selection score for a specific player

**Request**:
```json
{
  "player": {...},
  "opposition": [...],
  "format": "T20"
}
```

**Response**:
```json
{
  "player_name": "Virat Kohli",
  "predictions": {
    "random_forest": 0.85,
    "xgboost": 0.82,
    "ensemble": 0.835
  },
  "confidence": 0.835
}
```

### GET /health
Health check endpoint

### GET /model-info
Returns information about loaded models

## Model Performance Metrics

The system tracks:
- **Accuracy**: Percentage of correct predictions
- **Precision**: Correct positive predictions out of all positive predictions
- **Recall**: Correct positive predictions out of all actual positives
- **F1-Score**: Harmonic mean of precision and recall

These metrics are stored in the `model_metrics` table for monitoring.

## Updating the Recommendation Page

The `/dashboard/recommendations` page now uses ML predictions:

```typescript
// Uses both RF and XGBoost models via API
const teamRecommendations = await fetch('/api/ml/predict-team', {
  method: 'POST',
  body: JSON.stringify({
    availablePlayers,
    oppositionTeam,
    format
  })
})
```

## Best Practices

1. **Data Quality**: Ensure training data is clean and representative
2. **Regular Retraining**: Retrain models monthly with new match data
3. **Fallback Strategy**: Application falls back to rule-based matching if ML API is unavailable
4. **Feature Scaling**: Input features are automatically scaled using StandardScaler
5. **Model Versioning**: Keep track of model versions in the database
6. **Monitoring**: Track prediction accuracy and model drift over time

## Troubleshooting

**ML API not responding**
- Check if Flask server is running: `http://localhost:5000/health`
- Verify `ML_API_URL` environment variable is correct
- Check application logs for errors

**Models not loaded**
- Ensure models are trained before making predictions
- Check if model files exist in `/models/` directory
- Run training endpoint to create models

**Low prediction accuracy**
- Increase training data size
- Adjust model hyperparameters
- Perform feature engineering analysis
- Check for data quality issues

## Future Enhancements

1. Add neural network models (TensorFlow)
2. Implement real-time prediction updates
3. Add model explainability (SHAP values)
4. Deploy on Vercel serverless functions
5. Add A/B testing framework for model comparisons
