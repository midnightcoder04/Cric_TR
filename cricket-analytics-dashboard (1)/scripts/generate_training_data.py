#!/usr/bin/env python3
"""
Generate training data for ML models
This script creates synthetic match data based on Indian player performance patterns
"""

import json
import numpy as np
from datetime import datetime, timedelta
import random

def generate_training_data(num_matches=500):
    """Generate synthetic training data for model training"""
    
    # Indian players sample data
    indian_players = {
        'Virat Kohli': {'role': 'Batsman', 'avg': 59.2, 'sr': 93.8, 'form': 92},
        'Jasprit Bumrah': {'role': 'Bowler', 'avg': 0, 'sr': 0, 'form': 95},
        'Shubman Gill': {'role': 'Batsman', 'avg': 48.3, 'sr': 95.2, 'form': 88},
        'Suryakumar Yadav': {'role': 'Batsman', 'avg': 42.5, 'sr': 145.2, 'form': 90},
        'Hardik Pandya': {'role': 'All-rounder', 'avg': 38.1, 'sr': 142.3, 'form': 85},
        'KL Rahul': {'role': 'Batsman', 'avg': 45.2, 'sr': 88.5, 'form': 82},
        'Mohammed Siraj': {'role': 'Bowler', 'avg': 0, 'sr': 0, 'form': 80},
        'Yuzvendra Chahal': {'role': 'Bowler', 'avg': 0, 'sr': 0, 'form': 78},
    }
    
    # Opposition players sample data
    opposition_players = {
        'Steve Smith': {'role': 'Batsman', 'avg': 52.3, 'weakness': 'Spin'},
        'Pat Cummins': {'role': 'Bowler', 'avg': 0, 'strength': 'Death Bowling'},
        'Joe Root': {'role': 'Batsman', 'avg': 48.7, 'weakness': 'Short Ball'},
        'Babar Azam': {'role': 'Batsman', 'avg': 50.2, 'weakness': 'Slower Balls'},
        'Jofra Archer': {'role': 'Bowler', 'avg': 0, 'strength': 'Pace'},
        'Kane Williamson': {'role': 'Batsman', 'avg': 51.2, 'weakness': 'Aggression'},
    }
    
    X_train = []  # Features
    y_train = []  # Labels (1 = selected/won, 0 = not selected/lost)
    
    print(f"Generating {num_matches} training samples...")
    
    for match_num in range(num_matches):
        # Randomly select Indian and Opposition players
        ind_players = random.sample(list(indian_players.items()), k=random.randint(3, 5))
        opp_players = random.sample(list(opposition_players.items()), k=random.randint(2, 4))
        
        # For each Indian player, create a training sample
        for ind_name, ind_data in ind_players:
            for opp_name, opp_data in opp_players:
                # Create feature vector
                features = []
                
                # Indian player features
                features.append(ind_data['avg'] / 100)  # Normalize average
                features.append(ind_data['sr'] / 150)   # Normalize strike rate
                features.append(ind_data['form'] / 100) # Form score
                features.append(1 if ind_data['role'] == 'Batsman' else 0)
                features.append(1 if ind_data['role'] == 'Bowler' else 0)
                features.append(1 if ind_data['role'] == 'All-rounder' else 0)
                
                # Opposition features
                features.append(opp_data['avg'] / 100 if opp_data['avg'] > 0 else 0)
                features.append(1 if 'strength' in opp_data else 0)
                features.append(1 if 'weakness' in opp_data else 0)
                
                # Matchup quality score
                matchup_score = np.random.random()
                
                # Create label: 1 if player was selected (simulated)
                # More likely to be selected if:
                # - High form score
                # - High average/strike rate
                # - Good matchup against opposition
                probability = (
                    ind_data['form'] / 100 * 0.4 +
                    min(ind_data['avg'] / 100, 1) * 0.3 +
                    matchup_score * 0.3
                )
                
                label = 1 if random.random() < probability else 0
                
                X_train.append(features)
                y_train.append(label)
        
        if (match_num + 1) % 100 == 0:
            print(f"  Generated {match_num + 1} samples...")
    
    return np.array(X_train), np.array(y_train)

def save_training_data(X_train, y_train, filename='training_data.json'):
    """Save training data to JSON file"""
    data = {
        'X_train': X_train.tolist(),
        'y_train': y_train.tolist(),
        'models': ['random_forest', 'xgboost'],
        'generated_at': datetime.now().isoformat(),
        'num_samples': len(X_train),
        'num_features': X_train.shape[1],
    }
    
    with open(filename, 'w') as f:
        json.dump(data, f, indent=2)
    
    print(f"\nTraining data saved to {filename}")
    print(f"  Samples: {len(X_train)}")
    print(f"  Features: {X_train.shape[1]}")
    print(f"  Positive samples: {sum(y_train)}")
    print(f"  Negative samples: {len(y_train) - sum(y_train)}")

def send_to_ml_api(X_train, y_train, ml_api_url='http://localhost:5000'):
    """Send training data to ML API for model training"""
    import requests
    
    print(f"\nSending training data to ML API at {ml_api_url}...")
    
    payload = {
        'X_train': X_train.tolist(),
        'y_train': y_train.tolist(),
        'models': ['random_forest', 'xgboost']
    }
    
    try:
        response = requests.post(f'{ml_api_url}/train', json=payload, timeout=300)
        
        if response.status_code == 200:
            result = response.json()
            print("✓ Models trained successfully!")
            print(f"  Status: {result.get('status')}")
            print(f"  Samples: {result.get('samples')}")
            print(f"  Models trained: {result.get('models_trained')}")
            return True
        else:
            print(f"✗ Failed to train models: {response.status_code}")
            print(response.text)
            return False
    except requests.exceptions.ConnectionError:
        print(f"✗ Could not connect to ML API at {ml_api_url}")
        print("  Make sure ML server is running: python ml_api_server.py")
        return False
    except Exception as e:
        print(f"✗ Error: {e}")
        return False

if __name__ == '__main__':
    import sys
    
    # Generate training data
    X_train, y_train = generate_training_data(num_matches=500)
    
    # Save to file
    save_training_data(X_train, y_train)
    
    # Try to send to API if available
    ml_api_url = sys.argv[1] if len(sys.argv) > 1 else 'http://localhost:5000'
    send_to_ml_api(X_train, y_train, ml_api_url)
