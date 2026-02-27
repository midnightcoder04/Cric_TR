'use client'

import { useState } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Activity, Zap, BarChart3, CheckCircle, AlertCircle, Loader } from 'lucide-react'

interface TrainingStats {
  totalSamples: number
  rfAccuracy: string
  xgbAccuracy: string
  ensembleAccuracy: string
  trainedAt: string
}

interface TrainingResult {
  success: boolean
  message: string
  stats?: TrainingStats
  error?: string
}

export default function MLTrainingPage() {
  const [isTraining, setIsTraining] = useState(false)
  const [trainingResult, setTrainingResult] = useState<TrainingResult | null>(null)
  const [trainingProgress, setTrainingProgress] = useState(0)

  const handleTrainModels = async () => {
    setIsTraining(true)
    setTrainingResult(null)
    setTrainingProgress(0)

    try {
      // Simulate progress
      const progressInterval = setInterval(() => {
        setTrainingProgress((prev) => Math.min(prev + Math.random() * 30, 95))
      }, 500)

      const response = await fetch('/api/ml/train-models', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      })

      clearInterval(progressInterval)
      setTrainingProgress(100)

      if (!response.ok) {
        throw new Error('Failed to train models')
      }

      const data: TrainingResult = await response.json()
      setTrainingResult(data)
      console.log('[v0] Training result:', data)
    } catch (error) {
      console.error('[v0] Training error:', error)
      setTrainingResult({
        success: false,
        message: 'Training failed',
        error: String(error),
      })
    } finally {
      setIsTraining(false)
      setTrainingProgress(0)
    }
  }

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-foreground mb-2">ML Model Training</h1>
          <p className="text-foreground/60">Train Random Forest and XGBoost ensemble models</p>
        </div>

        {/* Training Controls */}
        <Card className="p-6 mb-8 border-border">
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-semibold text-foreground mb-4">Ensemble Models</h2>
              <p className="text-sm text-foreground/60 mb-4">
                Click the button below to train both Random Forest and XGBoost models on your Supabase data.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="p-4 bg-primary/10 rounded-lg border border-primary/20">
                <div className="flex items-center gap-2 mb-2">
                  <Zap className="w-5 h-5 text-primary" />
                  <h3 className="font-semibold text-foreground">Random Forest</h3>
                </div>
                <p className="text-sm text-foreground/70">50 trees • Feature-based</p>
              </div>

              <div className="p-4 bg-accent/10 rounded-lg border border-accent/20">
                <div className="flex items-center gap-2 mb-2">
                  <BarChart3 className="w-5 h-5 text-accent" />
                  <h3 className="font-semibold text-foreground">XGBoost</h3>
                </div>
                <p className="text-sm text-foreground/70">50 estimators • Gradient boosted</p>
              </div>
            </div>

            {isTraining && (
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Loader className="w-5 h-5 text-primary animate-spin" />
                  <span className="text-sm font-medium text-foreground">Training in progress...</span>
                </div>
                <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-primary to-accent transition-all duration-300"
                    style={{ width: `${trainingProgress}%` }}
                  />
                </div>
                <p className="text-xs text-foreground/50">{Math.round(trainingProgress)}%</p>
              </div>
            )}

            <Button
              onClick={handleTrainModels}
              disabled={isTraining}
              className="w-full bg-primary hover:bg-primary/90 text-white font-semibold py-3"
            >
              {isTraining ? (
                <>
                  <Loader className="w-4 h-4 mr-2 animate-spin" />
                  Training Models...
                </>
              ) : (
                <>
                  <Activity className="w-4 h-4 mr-2" />
                  Train Ensemble Models
                </>
              )}
            </Button>
          </div>
        </Card>

        {/* Results */}
        {trainingResult && (
          <Card
            className={`p-6 border-2 ${
              trainingResult.success ? 'border-green-500/50 bg-green-500/5' : 'border-red-500/50 bg-red-500/5'
            }`}
          >
            <div className="flex items-start gap-4">
              {trainingResult.success ? (
                <CheckCircle className="w-6 h-6 text-green-500 flex-shrink-0 mt-1" />
              ) : (
                <AlertCircle className="w-6 h-6 text-red-500 flex-shrink-0 mt-1" />
              )}
              <div className="flex-1">
                <h3
                  className={`font-semibold mb-2 ${
                    trainingResult.success ? 'text-green-700 dark:text-green-400' : 'text-red-700 dark:text-red-400'
                  }`}
                >
                  {trainingResult.message}
                </h3>

                {trainingResult.stats && (
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
                    <div className="p-3 bg-background rounded border border-border">
                      <p className="text-xs text-foreground/60 mb-1">Total Samples</p>
                      <p className="text-lg font-bold text-foreground">{trainingResult.stats.totalSamples}</p>
                    </div>

                    <div className="p-3 bg-background rounded border border-border">
                      <p className="text-xs text-foreground/60 mb-1">Random Forest</p>
                      <p className="text-lg font-bold text-primary">{trainingResult.stats.rfAccuracy}</p>
                    </div>

                    <div className="p-3 bg-background rounded border border-border">
                      <p className="text-xs text-foreground/60 mb-1">XGBoost</p>
                      <p className="text-lg font-bold text-accent">{trainingResult.stats.xgbAccuracy}</p>
                    </div>

                    <div className="p-3 bg-background rounded border border-border">
                      <p className="text-xs text-foreground/60 mb-1">Ensemble</p>
                      <p className="text-lg font-bold text-green-600">{trainingResult.stats.ensembleAccuracy}</p>
                    </div>
                  </div>
                )}

                {trainingResult.error && (
                  <p className="text-sm text-red-600 dark:text-red-400 mt-2">{trainingResult.error}</p>
                )}

                {trainingResult.stats && (
                  <p className="text-xs text-foreground/50 mt-4">
                    Trained at: {new Date(trainingResult.stats.trainedAt).toLocaleString()}
                  </p>
                )}
              </div>
            </div>
          </Card>
        )}

        {/* Information */}
        <Card className="p-6 mt-8 bg-muted/50 border-border">
          <h3 className="font-semibold text-foreground mb-3">How It Works</h3>
          <ul className="space-y-2 text-sm text-foreground/70">
            <li className="flex gap-2">
              <span className="font-bold text-primary">1.</span>
              <span>Fetches all player data from your Supabase database</span>
            </li>
            <li className="flex gap-2">
              <span className="font-bold text-primary">2.</span>
              <span>Trains Random Forest model with 50 decision trees</span>
            </li>
            <li className="flex gap-2">
              <span className="font-bold text-primary">3.</span>
              <span>Trains XGBoost model with 50 gradient-boosted estimators</span>
            </li>
            <li className="flex gap-2">
              <span className="font-bold text-primary">4.</span>
              <span>Calculates ensemble predictions by averaging both models</span>
            </li>
            <li className="flex gap-2">
              <span className="font-bold text-primary">5.</span>
              <span>Saves trained models and metrics to Supabase</span>
            </li>
            <li className="flex gap-2">
              <span className="font-bold text-primary">6.</span>
              <span>Uses trained models for all future team recommendations</span>
            </li>
          </ul>
        </Card>
      </div>
    </div>
  )
}
