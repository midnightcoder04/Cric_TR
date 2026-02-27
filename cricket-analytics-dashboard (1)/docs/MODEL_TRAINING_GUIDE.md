# ML Ensemble Model Training Guide

## Overview

Your cricket team recommendation system now includes both **Random Forest** and **XGBoost** models trained on Supabase data. This guide shows you how to train and deploy these models.

## 📊 What Gets Trained

### Random Forest Model
- **50 Decision Trees**
- **Features Used:**
  - Player Average (35% importance)
  - Strike Rate (25% importance)
  - Recent Performance (25% importance)
  - Form Score (15% importance)
- **Training Method:** Bootstrap aggregating (bagging)
- **Output:** Feature importance weights

### XGBoost Model
- **50 Gradient-Boosted Estimators**
- **Learning Rate:** 0.1
- **Features:** Same as Random Forest
- **Training Method:** Sequential tree building with residual fitting
- **Output:** Gradient boosted predictions

### Ensemble Prediction
- **Method:** Averaging both model predictions
- **Confidence:** Combined accuracy score
- **Usage:** All team recommendations use ensemble predictions

## 🚀 How to Train Models

### Method 1: Via Dashboard (Easiest) ✅

1. Go to your app: `/dashboard/ml-training`
2. Click **"Train Ensemble Models"** button
3. Wait for training to complete (usually 10-30 seconds)
4. See accuracy metrics:
   - Random Forest Accuracy
   - XGBoost Accuracy
   - Ensemble Accuracy (combined)

### Method 2: Via API (Programmatic)

```bash
curl -X POST http://localhost:3000/api/ml/train-models \
  -H "Content-Type: application/json"
```

Response:
```json
{
  "success": true,
  "message": "Ensemble models trained successfully",
  "stats": {
    "totalSamples": 50,
    "rfAccuracy": 0.8234,
    "xgbAccuracy": 0.7956,
    "ensembleAccuracy": 0.8095,
    "trainedAt": "2026-02-19T12:00:00Z"
  }
}
```

### Method 3: Via Node.js Script

```bash
node scripts/train-models.mjs
```

Requires environment variables:
```
NEXT_PUBLIC_SUPABASE_URL=your_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_key
```

## 📈 Training Data Requirements

Your Supabase database needs:

### `players_performance` table
- `player_name` - Player's name
- `format` - ODI, T20, or Test
- `average` - Batting average
- `strike_rate` - Strike rate
- `recent_performance` - Recent score/performance
- `form` - Excellent, Good, or Average

### `training_data` table
- `average` - Sample average
- `strike_rate` - Sample strike rate
- `recent_performance` - Sample recent performance
- `form_score` - Numeric form score
- `label` - Binary classification (0 or 1)

### Minimum Data
- **At least 10 player records** in `players_performance`
- **At least 5 training samples** in `training_data`

## 🔄 Training Process

1. **Data Collection**
   - Fetches all player performance records from Supabase
   - Fetches training data samples
   - Combines into single dataset

2. **Random Forest Training**
   - Creates 50 bootstrap samples
   - Builds decision tree for each sample
   - Calculates feature importance
   - Result: Weighted feature scoring

3. **XGBoost Training**
   - Initializes with 0.5 prediction
   - Builds 50 sequential estimators
   - Each estimator corrects previous residuals
   - Result: Gradient-boosted scores

4. **Ensemble Assembly**
   - Averages RF and XGBoost predictions
   - Calculates combined accuracy
   - Stores to Supabase `model_metrics` table

5. **Model Persistence**
   - Saves configuration to `model_metrics` table
   - Used for all future predictions
   - Automatic fallback if models not found

## 📊 Model Metrics

After training, check your model performance:

1. Go to Supabase Dashboard → Table Editor
2. Click `model_metrics` table
3. See:
   - `accuracy` - Overall accuracy (0-1)
   - `precision` - True positive rate
   - `recall` - False negative rate
   - `trained_at` - Training timestamp
   - `config` - Full model configuration

## 🎯 Using Trained Models

### In Team Recommendations
1. User selects players and opposition
2. System fetches trained model from Supabase
3. Calculates scores using:
   - Random Forest feature importance
   - XGBoost residuals
   - Ensemble averaging
4. Returns optimized XI with confidence score

### Fallback Behavior
If trained models not found:
- System uses rule-based scoring
- Feature defaults applied
- Full functionality maintained
- No errors thrown

## 🔧 Retraining Models

You should retrain models when:
- Adding 20+ new player records
- Updating player statistics
- Changing format strategies
- At least monthly for fresh data

To retrain:
1. Add new data to Supabase
2. Go to `/dashboard/ml-training`
3. Click "Train Ensemble Models"
4. Old models replaced with new ones

## 🐛 Troubleshooting

### Error: "No training data available"
- Check Supabase `players_performance` table has data
- Check `training_data` table has records
- Run `scripts/insert-data-only.sql` to add sample data

### Error: "Failed to train models"
- Check Supabase connection in environment variables
- Verify table names match exactly
- Check data types in tables

### Models not improving accuracy
- Add more training samples
- Add diverse player data across formats
- Include both high and low performers
- Update `form` field for recent matches

## 📝 Files Involved

- `app/dashboard/ml-training/page.tsx` - Training dashboard UI
- `app/api/ml/train-models/route.ts` - Training API endpoint
- `app/api/ml/predict-team/route.ts` - Prediction using trained models
- `lib/models/model-config.json` - Model configuration storage
- `scripts/train-models.mjs` - Standalone training script

## 🎓 Advanced: Customizing Models

### Increase Model Complexity
Edit `app/api/ml/train-models/route.ts`:
```typescript
// Random Forest: Change numTrees from 50 to 100
const rfModel = trainRandomForest(allData) // Change 50 to 100

// XGBoost: Change numEstimators from 50 to 100
const xgbModel = trainXGBoost(allData) // Change 50 to 100
```

### Adjust Learning Rate
```typescript
xgbModel.learningRate = 0.05 // Lower = slower learning, higher accuracy
```

### Change Feature Weights
```typescript
// In RandomForest training:
featureImportance.average += f.average * 0.40 // Increase from 0.35
```

## 📞 Support

- Check `/dashboard/ml-training` for real-time status
- View model metrics in Supabase dashboard
- See training logs in browser console
- Check Supabase SQL Editor for queries

---

**Happy training!** 🚀
