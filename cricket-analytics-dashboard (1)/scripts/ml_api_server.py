#!/usr/bin/env python3
"""
Cricket Team Recommendation ML API
Implements both Random Forest and XGBoost models for team selection
"""

import json
import pickle
import numpy as np
from datetime import datetime
from flask import Flask, request, jsonify
from flask_cors import CORS
import pandas as pd
from sklearn.ensemble import RandomForestClassifier
from sklearn.preprocessing import StandardScaler
from xgboost import XGBClassifier
import joblib
import os

app = Flask(__name__)
CORS(app)

# Global model instances
rf_model = None
xgb_model = None
scaler = None
rf_model_path = '/models/random_forest_model.pkl'
xgb_model_path = '/models/xgboost_model.pkl'
scaler_path = '/models/scaler.pkl'

class TeamRecommendationEngine:
    """Handles team recommendation using ML models"""
    
    def __init__(self):
        self.rf_model = None
        self.xgb_model = None
        self.scaler = None
        self.load_models()
    
    def load_models(self):
        """Load pre-trained models"""
        global rf_model, xgb_model, scaler
        try:
            if os.path.exists(rf_model_path):
                self.rf_model = joblib.load(rf_model_path)
                rf_model = self.rf_model
            if os.path.exists(xgb_model_path):
                self.xgb_model = joblib.load(xgb_model_path)
                xgb_model = self.xgb_model
            if os.path.exists(scaler_path):
                self.scaler = joblib.load(scaler_path)
                scaler = self.scaler
        except Exception as e:
            print(f"Error loading models: {e}")
    
    def train_random_forest(self, X_train, y_train):
        """Train Random Forest model"""
        self.rf_model = RandomForestClassifier(
            n_estimators=100,
            max_depth=15,
            min_samples_split=5,
            min_samples_leaf=2,
            random_state=42,
            n_jobs=-1,
            class_weight='balanced'
        )
        self.rf_model.fit(X_train, y_train)
        joblib.dump(self.rf_model, rf_model_path)
        return self.rf_model
    
    def train_xgboost(self, X_train, y_train):
        """Train XGBoost model"""
        self.xgb_model = XGBClassifier(
            n_estimators=100,
            max_depth=7,
            learning_rate=0.1,
            subsample=0.8,
            colsample_bytree=0.8,
            random_state=42,
            eval_metric='logloss'
        )
        self.xgb_model.fit(X_train, y_train)
        joblib.dump(self.xgb_model, xgb_model_path)
        return self.xgb_model
    
    def prepare_features(self, player_data, opposition_data):
        """Prepare feature vector for model prediction"""
        features = []
        
        # Player features
        features.append(float(player_data.get('average', 0)))
        features.append(float(player_data.get('strike_rate', 0)))
        features.append(float(player_data.get('form_score', 0)))
        features.append(float(player_data.get('recent_performance', 0)))
        features.append(1 if player_data.get('role') == 'Batsman' else 0)
        features.append(1 if player_data.get('role') == 'Bowler' else 0)
        features.append(1 if player_data.get('role') == 'All-rounder' else 0)
        
        # Opposition features
        for opp in opposition_data:
            features.append(float(opp.get('avg_score', 0)))
            features.append(float(opp.get('recent_form', 0)))
            break  # First opposition player for simplicity
        
        return np.array(features).reshape(1, -1)
    
    def predict_player_selection(self, player, opposition_players, model_type='both'):
        """Predict if a player should be selected against opposition"""
        try:
            features = self.prepare_features(player, opposition_players)
            
            if self.scaler:
                features = self.scaler.transform(features)
            
            predictions = {}
            
            if model_type in ['both', 'random_forest'] and self.rf_model:
                rf_pred = self.rf_model.predict_proba(features)[0][1]
                predictions['random_forest'] = float(rf_pred)
            
            if model_type in ['both', 'xgboost'] and self.xgb_model:
                xgb_pred = self.xgb_model.predict_proba(features)[0][1]
                predictions['xgboost'] = float(xgb_pred)
            
            # Ensemble prediction
            if len(predictions) > 1:
                ensemble_pred = np.mean(list(predictions.values()))
                predictions['ensemble'] = float(ensemble_pred)
            
            return predictions
        except Exception as e:
            print(f"Error in prediction: {e}")
            return {'error': str(e)}

# Initialize engine
engine = TeamRecommendationEngine()

@app.route('/health', methods=['GET'])
def health():
    """Health check endpoint"""
    return jsonify({
        'status': 'healthy',
        'models_loaded': {
            'random_forest': engine.rf_model is not None,
            'xgboost': engine.xgb_model is not None,
            'scaler': engine.scaler is not None
        }
    })

@app.route('/predict-player', methods=['POST'])
def predict_player():
    """
    Predict player selection score
    Request: {
        "player": {player_data},
        "opposition": [opposition_players],
        "model_type": "both|random_forest|xgboost"
    }
    """
    try:
        data = request.json
        player = data.get('player')
        opposition = data.get('opposition', [])
        model_type = data.get('model_type', 'both')
        
        if not player:
            return jsonify({'error': 'Player data required'}), 400
        
        predictions = engine.predict_player_selection(player, opposition, model_type)
        
        return jsonify({
            'player_name': player.get('name'),
            'predictions': predictions,
            'timestamp': datetime.now().isoformat()
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/predict-team', methods=['POST'])
def predict_team():
    """
    Predict best XI using both models
    Request: {
        "available_players": [players],
        "opposition": [opposition_players],
        "format": "ODI|T20|Test"
    }
    """
    try:
        data = request.json
        available_players = data.get('available_players', [])
        opposition = data.get('opposition', [])
        format_type = data.get('format', 'ODI')
        
        # Score each player using both models
        player_scores = {}
        for player in available_players:
            predictions = engine.predict_player_selection(player, opposition, 'both')
            player_scores[player.get('name')] = predictions
        
        # Sort by ensemble score
        sorted_players = sorted(
            player_scores.items(),
            key=lambda x: x[1].get('ensemble', 0),
            reverse=True
        )
        
        # Select XI (11 players)
        selected_xi = [name for name, _ in sorted_players[:11]]
        avg_score = np.mean([score.get('ensemble', 0) for _, score in sorted_players[:11]])
        
        return jsonify({
            'selected_xi': selected_xi,
            'player_scores': player_scores,
            'average_confidence': float(avg_score),
            'format': format_type,
            'opposition_count': len(opposition),
            'timestamp': datetime.now().isoformat()
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/train', methods=['POST'])
def train_models():
    """
    Train both models with provided data
    Request: {
        "X_train": [...],
        "y_train": [...],
        "models": ["random_forest", "xgboost"]
    }
    """
    try:
        data = request.json
        X_train = np.array(data.get('X_train', []))
        y_train = np.array(data.get('y_train', []))
        models_to_train = data.get('models', ['random_forest', 'xgboost'])
        
        if X_train.size == 0 or y_train.size == 0:
            return jsonify({'error': 'Training data required'}), 400
        
        # Scale features
        engine.scaler = StandardScaler()
        X_train_scaled = engine.scaler.fit_transform(X_train)
        joblib.dump(engine.scaler, scaler_path)
        
        results = {}
        
        if 'random_forest' in models_to_train:
            engine.train_random_forest(X_train_scaled, y_train)
            results['random_forest'] = 'trained'
        
        if 'xgboost' in models_to_train:
            engine.train_xgboost(X_train_scaled, y_train)
            results['xgboost'] = 'trained'
        
        return jsonify({
            'status': 'success',
            'models_trained': results,
            'samples': len(X_train),
            'timestamp': datetime.now().isoformat()
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/model-info', methods=['GET'])
def model_info():
    """Get information about loaded models"""
    return jsonify({
        'random_forest': {
            'loaded': engine.rf_model is not None,
            'type': 'RandomForestClassifier',
            'n_estimators': 100 if engine.rf_model else None
        },
        'xgboost': {
            'loaded': engine.xgb_model is not None,
            'type': 'XGBClassifier',
            'n_estimators': 100 if engine.xgb_model else None
        },
        'timestamp': datetime.now().isoformat()
    })

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=False)
