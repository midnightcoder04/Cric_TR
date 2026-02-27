// Ensemble Manager - Combines Random Forest + XGBoost predictions
import { RandomForest } from './random-forest'
import { XGBoost } from './xgboost'

export interface EnsembleModel {
  randomForest: InstanceType<typeof RandomForest>
  xgboost: InstanceType<typeof XGBoost>
  rfWeight: number
  xgbWeight: number
}

export class EnsembleManager {
  private randomForest: InstanceType<typeof RandomForest>
  private xgboost: InstanceType<typeof XGBoost>
  private rfWeight: number = 0.5
  private xgbWeight: number = 0.5

  constructor() {
    this.randomForest = new RandomForest()
    this.xgboost = new XGBoost()
  }

  // Train both models on the same data
  train(playerData: Array<{
    average: number
    strikeRate: number
    recentPerformance: number
    formScore: number
    selected: boolean
  }>): void {
    console.log('[v0] Training Random Forest...')
    this.randomForest.train(playerData, 50)
    const rfAccuracy = this.randomForest.getAccuracy()
    console.log(`[v0] Random Forest Accuracy: ${rfAccuracy.toFixed(2)}%`)

    console.log('[v0] Training XGBoost...')
    this.xgboost.train(playerData, 50, 7)
    const xgbAccuracy = this.xgboost.getAccuracy()
    console.log(`[v0] XGBoost Accuracy: ${xgbAccuracy.toFixed(2)}%`)

    // Adjust weights based on accuracy
    const totalAccuracy = rfAccuracy + xgbAccuracy
    this.rfWeight = rfAccuracy / totalAccuracy
    this.xgbWeight = xgbAccuracy / totalAccuracy

    console.log(
      `[v0] Ensemble Weights - RF: ${(this.rfWeight * 100).toFixed(1)}%, XGB: ${(this.xgbWeight * 100).toFixed(1)}%`
    )
  }

  // Get ensemble prediction (weighted average)
  predict(features: {
    average: number
    strikeRate: number
    recentPerformance: number
    formScore: number
  }): {
    score: number
    rfScore: number
    xgbScore: number
    confidence: number
  } {
    const rfScore = this.randomForest.predict(features)
    const xgbScore = this.xgboost.predict(features)

    // Weighted ensemble prediction
    const ensembleScore = this.rfWeight * rfScore + this.xgbWeight * xgbScore

    // Confidence is based on agreement between models
    const agreement = 1 - Math.abs(rfScore - xgbScore)
    const confidence = (agreement + ensembleScore) / 2

    return {
      score: ensembleScore,
      rfScore,
      xgbScore,
      confidence: Math.min(1, confidence),
    }
  }

  // Get model details for transparency
  getModelDetails(): {
    randomForestAccuracy: number
    xgboostAccuracy: number
    rfWeight: number
    xgbWeight: number
    featureImportance: Record<string, number>
  } {
    return {
      randomForestAccuracy: this.randomForest.getAccuracy(),
      xgboostAccuracy: this.xgboost.getAccuracy(),
      rfWeight: this.rfWeight,
      xgbWeight: this.xgbWeight,
      featureImportance: this.randomForest.getFeatureImportance(),
    }
  }
}
