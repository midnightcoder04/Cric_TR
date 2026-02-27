"use client"

import { useState } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts"
import { TrendingUp, Target, CheckCircle } from "lucide-react"

interface Prediction {
  id: number
  player: string
  role: string
  metric: string
  predicted: number
  confidence: number
  trend: "up" | "down" | "stable"
  reasoning: string
}

interface MatchPrediction {
  id: number
  match: string
  date: string
  teamA: string
  teamB: string
  winProbability: number
  predictedScore: string
  keyFactors: string[]
}

const playerPredictions: Prediction[] = [
  {
    id: 1,
    player: "Virat Kohli",
    role: "Batter",
    metric: "Runs in Next Match",
    predicted: 68,
    confidence: 89,
    trend: "up",
    reasoning: "Strong recent form, favorable pitch conditions, weak opposition bowling",
  },
  {
    id: 2,
    player: "Jasprit Bumrah",
    role: "Bowler",
    metric: "Wickets in Next Match",
    predicted: 2.5,
    confidence: 85,
    trend: "stable",
    reasoning: "Consistent performance, good death bowling record, opposition batting weakness",
  },
  {
    id: 3,
    player: "Hardik Pandya",
    role: "All-rounder",
    metric: "Fantasy Points",
    predicted: 78,
    confidence: 82,
    trend: "up",
    reasoning: "Recent match-winning performances, all-round contribution expected",
  },
  {
    id: 4,
    player: "Yuzvendra Chahal",
    role: "Bowler",
    metric: "Wickets in Next Match",
    predicted: 1.8,
    confidence: 78,
    trend: "down",
    reasoning: "Slight dip in recent form, but strong against left-handers in opposition",
  },
]

const matchPredictions: MatchPrediction[] = [
  {
    id: 1,
    match: "India vs Australia",
    date: "Oct 25, 2025",
    teamA: "India",
    teamB: "Australia",
    winProbability: 62,
    predictedScore: "168-175",
    keyFactors: ["Strong batting lineup", "Favorable pitch conditions", "Experience advantage"],
  },
  {
    id: 2,
    match: "India vs England",
    date: "Oct 28, 2025",
    teamA: "India",
    teamB: "England",
    winProbability: 58,
    predictedScore: "162-170",
    keyFactors: ["Balanced team composition", "Weather uncertainty", "Recent form"],
  },
]

const performanceData = [
  { match: "Match 1", predicted: 165, actual: 168 },
  { match: "Match 2", predicted: 152, actual: 148 },
  { match: "Match 3", predicted: 175, actual: 172 },
  { match: "Match 4", predicted: 158, actual: 162 },
  { match: "Match 5", predicted: 170, actual: 175 },
]

const playerFormData = [
  { week: "Week 1", kohli: 45, bumrah: 2, pandya: 35 },
  { week: "Week 2", kohli: 52, bumrah: 2.5, pandya: 42 },
  { week: "Week 3", kohli: 48, bumrah: 2, pandya: 38 },
  { week: "Week 4", kohli: 68, bumrah: 2.5, pandya: 45 },
]

export default function PredictionsPage() {
  const [selectedPrediction, setSelectedPrediction] = useState<Prediction | null>(playerPredictions[0])

  const getTrendIcon = (trend: string) => {
    if (trend === "up") return <TrendingUp className="w-4 h-4 text-green-500" />
    if (trend === "down") return <TrendingUp className="w-4 h-4 text-red-500 rotate-180" />
    return <TrendingUp className="w-4 h-4 text-yellow-500" />
  }

  const getTrendColor = (trend: string) => {
    if (trend === "up") return "text-green-600 dark:text-green-400"
    if (trend === "down") return "text-red-600 dark:text-red-400"
    return "text-yellow-600 dark:text-yellow-400"
  }

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <Target className="w-8 h-8 text-primary" />
          <h1 className="text-3xl font-bold text-foreground">Performance Prediction</h1>
        </div>
        <p className="text-foreground/60">AI-powered predictions for player and team performance in upcoming matches</p>
      </div>

      {/* Match Predictions */}
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-foreground mb-4">Upcoming Match Predictions</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {matchPredictions.map((match) => (
            <Card key={match.id} className="p-6 border border-border">
              <div className="mb-4">
                <h3 className="text-lg font-bold text-foreground mb-1">{match.match}</h3>
                <p className="text-sm text-foreground/60">{match.date}</p>
              </div>

              <div className="mb-4 p-4 bg-primary/10 rounded-lg border border-primary/20">
                <p className="text-xs text-foreground/60 mb-1">Win Probability</p>
                <div className="flex items-end gap-3">
                  <p className="text-3xl font-bold text-primary">{match.winProbability}%</p>
                  <p className="text-foreground/60 text-sm mb-1">for {match.teamA}</p>
                </div>
              </div>

              <div className="mb-4 p-3 bg-muted rounded-lg">
                <p className="text-xs text-foreground/60 mb-1">Predicted Score Range</p>
                <p className="text-xl font-bold text-foreground">{match.predictedScore}</p>
              </div>

              <div>
                <p className="text-sm font-semibold text-foreground mb-2">Key Factors</p>
                <ul className="space-y-1">
                  {match.keyFactors.map((factor, i) => (
                    <li key={i} className="flex items-center gap-2 text-sm text-foreground/70">
                      <CheckCircle className="w-3 h-3 text-green-500" />
                      {factor}
                    </li>
                  ))}
                </ul>
              </div>
            </Card>
          ))}
        </div>
      </div>

      {/* Player Predictions */}
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-foreground mb-4">Player Performance Predictions</h2>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Predictions List */}
          <div className="lg:col-span-2 space-y-3">
            {playerPredictions.map((pred) => (
              <Card
                key={pred.id}
                className={`p-4 border cursor-pointer transition ${
                  selectedPrediction?.id === pred.id
                    ? "border-primary bg-primary/5"
                    : "border-border hover:border-primary/50"
                }`}
                onClick={() => setSelectedPrediction(pred)}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="font-semibold text-foreground">{pred.player}</h3>
                    <p className="text-sm text-foreground/60">{pred.metric}</p>
                  </div>
                  <div className="text-right">
                    <div className="flex items-center gap-2 justify-end mb-1">
                      {getTrendIcon(pred.trend)}
                      <span className={`text-lg font-bold ${getTrendColor(pred.trend)}`}>{pred.predicted}</span>
                    </div>
                    <p className="text-xs text-foreground/60">{pred.confidence}% confidence</p>
                  </div>
                </div>
              </Card>
            ))}
          </div>

          {/* Selected Prediction Details */}
          <div>
            {selectedPrediction && (
              <Card className="p-6 border border-border sticky top-8">
                <h3 className="text-xl font-bold text-foreground mb-4">{selectedPrediction.player}</h3>

                <div className="space-y-4">
                  <div className="p-3 bg-primary/10 rounded-lg border border-primary/20">
                    <p className="text-xs text-foreground/60 mb-1">Predicted Value</p>
                    <p className="text-3xl font-bold text-primary">{selectedPrediction.predicted}</p>
                  </div>

                  <div className="p-3 bg-accent/10 rounded-lg border border-accent/20">
                    <p className="text-xs text-foreground/60 mb-1">Confidence Score</p>
                    <p className="text-2xl font-bold text-accent">{selectedPrediction.confidence}%</p>
                  </div>

                  <div className="p-3 bg-muted rounded-lg">
                    <p className="text-xs text-foreground/60 mb-2">Trend</p>
                    <div className="flex items-center gap-2">
                      {getTrendIcon(selectedPrediction.trend)}
                      <span className={`font-semibold capitalize ${getTrendColor(selectedPrediction.trend)}`}>
                        {selectedPrediction.trend}
                      </span>
                    </div>
                  </div>

                  <div className="p-3 bg-muted rounded-lg">
                    <p className="text-xs text-foreground/60 mb-2">AI Reasoning</p>
                    <p className="text-sm text-foreground">{selectedPrediction.reasoning}</p>
                  </div>
                </div>

                <Button className="w-full mt-6">View Full Analysis</Button>
              </Card>
            )}
          </div>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Prediction Accuracy */}
        <Card className="p-6 border border-border">
          <h3 className="text-lg font-bold text-foreground mb-4">Prediction Accuracy</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={performanceData}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
              <XAxis stroke="var(--color-foreground)" />
              <YAxis stroke="var(--color-foreground)" />
              <Tooltip
                contentStyle={{
                  backgroundColor: "var(--color-card)",
                  border: "1px solid var(--color-border)",
                  borderRadius: "8px",
                }}
              />
              <Legend />
              <Line type="monotone" dataKey="predicted" stroke="var(--color-primary)" strokeWidth={2} />
              <Line type="monotone" dataKey="actual" stroke="var(--color-accent)" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </Card>

        {/* Player Form Trend */}
        <Card className="p-6 border border-border">
          <h3 className="text-lg font-bold text-foreground mb-4">Player Form Trend</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={playerFormData}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
              <XAxis stroke="var(--color-foreground)" />
              <YAxis stroke="var(--color-foreground)" />
              <Tooltip
                contentStyle={{
                  backgroundColor: "var(--color-card)",
                  border: "1px solid var(--color-border)",
                  borderRadius: "8px",
                }}
              />
              <Legend />
              <Bar dataKey="kohli" fill="var(--color-primary)" />
              <Bar dataKey="bumrah" fill="var(--color-accent)" />
              <Bar dataKey="pandya" fill="var(--color-secondary)" />
            </BarChart>
          </ResponsiveContainer>
        </Card>
      </div>
    </div>
  )
}
