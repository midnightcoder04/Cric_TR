"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from "recharts"

const performanceData = [
  { match: "M1", runs: 45, wickets: 0, rating: 7.2 },
  { match: "M2", runs: 78, wickets: 0, rating: 8.1 },
  { match: "M3", runs: 92, wickets: 0, rating: 8.8 },
  { match: "M4", runs: 34, wickets: 0, rating: 6.5 },
  { match: "M5", runs: 156, wickets: 0, rating: 9.2 },
  { match: "M6", runs: 67, wickets: 0, rating: 7.8 },
]

const predictionData = [
  { scenario: "vs Pace", probability: 78 },
  { scenario: "vs Spin", probability: 72 },
  { scenario: "Home", probability: 85 },
  { scenario: "Away", probability: 68 },
  { scenario: "Day Match", probability: 75 },
  { scenario: "Night Match", probability: 80 },
]

export default function PerformancePage() {
  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground">Performance Prediction</h1>
        <p className="text-foreground/60 mt-1">Individual and team performance forecasts with confidence intervals</p>
      </div>

      {/* Performance Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          { label: "Avg Runs/Match", value: "78.7", trend: "+5.2" },
          { label: "Strike Rate", value: "92.3", trend: "+2.1" },
          { label: "Consistency Index", value: "8.4/10", trend: "+0.3" },
        ].map((metric, i) => (
          <Card key={i} className="border-border">
            <CardContent className="pt-6">
              <p className="text-sm text-foreground/60">{metric.label}</p>
              <div className="flex items-end justify-between mt-2">
                <p className="text-2xl font-bold text-foreground">{metric.value}</p>
                <p className="text-sm text-accent">{metric.trend}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Performance */}
        <Card className="border-border">
          <CardHeader>
            <CardTitle>Recent Match Performance</CardTitle>
            <CardDescription>Last 6 matches analysis</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={performanceData}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                <XAxis stroke="var(--color-foreground)" />
                <YAxis stroke="var(--color-foreground)" />
                <Tooltip
                  contentStyle={{ backgroundColor: "var(--color-card)", border: "1px solid var(--color-border)" }}
                />
                <Area
                  type="monotone"
                  dataKey="runs"
                  fill="var(--color-chart-1)"
                  stroke="var(--color-chart-1)"
                  fillOpacity={0.3}
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Scenario Probabilities */}
        <Card className="border-border">
          <CardHeader>
            <CardTitle>Performance Probability</CardTitle>
            <CardDescription>Success rate in different scenarios</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={predictionData}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                <XAxis stroke="var(--color-foreground)" />
                <YAxis stroke="var(--color-foreground)" />
                <Tooltip
                  contentStyle={{ backgroundColor: "var(--color-card)", border: "1px solid var(--color-border)" }}
                />
                <Bar dataKey="probability" fill="var(--color-chart-2)" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Prediction Details */}
      <Card className="border-border">
        <CardHeader>
          <CardTitle>Next Match Prediction</CardTitle>
          <CardDescription>Forecasted performance metrics</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { label: "Expected Runs", value: "65-85", confidence: "82%" },
              { label: "Strike Rate", value: "88-96", confidence: "78%" },
              { label: "Boundary Count", value: "4-6", confidence: "85%" },
              { label: "Success Probability", value: "79%", confidence: "88%" },
            ].map((pred, i) => (
              <div key={i} className="p-4 rounded-lg border border-border">
                <p className="text-sm text-foreground/60">{pred.label}</p>
                <p className="text-xl font-bold text-foreground mt-2">{pred.value}</p>
                <p className="text-xs text-accent mt-1">Confidence: {pred.confidence}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
