# Complete ML Pipeline Setup Guide

This guide walks through setting up the Random Forest + XGBoost cricket team recommendation system end-to-end.

## Prerequisites

- Node.js 18+ and npm
- Python 3.8+ and pip
- Supabase account (free tier OK)
- Vercel account for deployment

## Step 1: Database Setup (Supabase)

### 1.1 Create Supabase Project
1. Go to https://supabase.com and create a new project
2. Note your Supabase URL and API keys
3. Wait for database to be ready

### 1.2 Initialize Database Schema

```bash
# Get your Postgres connection string from Supabase dashboard
export DATABASE_URL="postgresql://user:password@host:5432/database"

# Execute schema setup
psql $DATABASE_URL -f scripts/setup-supabase-schema.sql
```

### 1.3 Update Environment Variables

Create/update `.env.local`:
```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
POSTGRES_URL=postgresql://user:password@host:5432/database

# ML API (set after deploying Python server)
ML_API_URL=http://localhost:5000  # Local development
# ML_API_URL=https://your-ml-api.herokuapp.com  # Production
```

## Step 2: Python ML Server Setup

### 2.1 Local Development

```bash
# Create virtual environment
python3 -m venv ml_env
source ml_env/bin/activate  # On Windows: ml_env\Scripts\activate

# Install dependencies
pip install -r scripts/ml_requirements.txt

# Run ML server
python scripts/ml_api_server.py
```

Server will start on `http://localhost:5000`

### 2.2 Health Check

```bash
curl http://localhost:5000/health
```

Expected response:
```json
{
  "status": "healthy",
  "models_loaded": {
    "random_forest": false,
    "xgboost": false,
    "scaler": false
  }
}
```

## Step 3: Train ML Models

### 3.1 Prepare Training Data

Generate sample training data:
```bash
# From your Next.js project root
node scripts/generate-training-data.js
```

This creates training data from:
- Historical player performances
- Opposition player data
- Match outcomes

### 3.2 Train Models via API

```bash
curl -X POST http://localhost:5000/train \
  -H "Content-Type: application/json" \
  -d '{
    "X_train": [[1, 2, 3, ...], ...],
    "y_train": [1, 0, 1, ...],
    "models": ["random_forest", "xgboost"]
  }'
```

Or use the script:
```bash
python scripts/train_models.py
```

### 3.3 Verify Models are Trained

```bash
curl http://localhost:5000/model-info
```

Expected response should show `loaded: true` for both models.

## Step 4: Next.js Application Setup

### 4.1 Install Dependencies

```bash
npm install
```

### 4.2 Run Development Server

```bash
npm run dev
```

Application runs on `http://localhost:3000`

### 4.3 Test ML Integration

1. Navigate to http://localhost:3000/dashboard/recommendations
2. Select format (ODI/T20/Test)
3. Select player groups
4. Choose Indian players
5. Add opposition team
6. Click "Generate AI Recommendations"
7. Check console for ML API responses

## Step 5: Production Deployment

### 5.1 Deploy Python ML Server

#### Option A: Heroku
```bash
# Create app
heroku create your-cricket-ml-api

# Add buildpack
heroku buildpacks:add heroku/python

# Deploy
git subtree push --prefix scripts heroku main

# Verify
heroku open /health
```

#### Option B: AWS Lambda with Docker
```bash
# Build Docker image
docker build -t cricket-ml-api -f scripts/Dockerfile .

# Push to ECR and deploy to Lambda
aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin YOUR_ACCOUNT_ID.dkr.ecr.us-east-1.amazonaws.com

docker tag cricket-ml-api:latest YOUR_ACCOUNT_ID.dkr.ecr.us-east-1.amazonaws.com/cricket-ml-api:latest
docker push YOUR_ACCOUNT_ID.dkr.ecr.us-east-1.amazonaws.com/cricket-ml-api:latest
```

#### Option C: Railway.app (Recommended)
```bash
# Deploy directly from GitHub
# 1. Connect your repo to railway.app
# 2. Create new project
# 3. Select Python service
# 4. Set start command: python scripts/ml_api_server.py
# 5. Deploy
```

### 5.2 Update Next.js Environment Variables

```bash
vercel env add ML_API_URL
# Enter your deployed ML API URL
```

### 5.3 Deploy Next.js to Vercel

```bash
vercel deploy
```

## Step 6: Monitoring & Maintenance

### 6.1 Check Model Performance

```bash
curl http://your-ml-api.com/model-info
```

### 6.2 Monitor Predictions

Check logs for:
- Prediction latency
- API errors
- Model drift (if predictions are worse over time)

### 6.3 Retrain Models

Run monthly with new match data:
```bash
python scripts/train_models.py --force-retrain
```

## Troubleshooting

### ML API Connection Issues
- Verify `ML_API_URL` is correct
- Check Python server is running: `curl $ML_API_URL/health`
- Look for CORS issues in browser console
- Verify firewall allows connections

### Models Not Loading
- Check model files exist: `ls -la /models/`
- Retrain models: `curl -X POST $ML_API_URL/train`
- Check Python error logs

### Predictions Are Off
- Verify training data quality
- Check feature scaling
- Increase training data size
- Adjust model hyperparameters

### Database Connection Error
- Verify `POSTGRES_URL` is correct
- Check network access in Supabase dashboard
- Test connection: `psql $POSTGRES_URL -c "SELECT version();"`

## Performance Tips

1. **Cache Predictions**: Store in Supabase `team_recommendations` table
2. **Batch Predictions**: Send multiple players at once
3. **Use GPU**: Deploy on GPU instance for faster inference
4. **Model Quantization**: Convert models to ONNX for faster serving
5. **Load Balancing**: Use multiple ML API instances

## Next Steps

1. Add more historical data to improve model accuracy
2. Implement A/B testing for model comparison
3. Add SHAP values for prediction explanability
4. Create admin dashboard for model monitoring
5. Set up automated retraining pipelines

## Support

For issues with:
- **Supabase**: https://supabase.com/docs
- **scikit-learn**: https://scikit-learn.org/
- **XGBoost**: https://xgboost.readthedocs.io/
- **Flask**: https://flask.palletsprojects.com/
- **Vercel**: https://vercel.com/docs
