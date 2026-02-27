"use client"

import { useState } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { upcomingMatches } from "@/lib/cricket-data"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts"
import { Calendar, MapPin, Trophy } from "lucide-react"

export default function WinProbabilityPage() {
  const [selectedFormat, setSelectedFormat] = useState<"All" | "ODI" | "T20" | "Test">("All")

  const formats = ["All", "ODI", "T20", "Test"]

  const filteredMatches =
    selectedFormat === "All" ? upcomingMatches : upcomingMatches.filter((match) => match.format === selectedFormat)

  // Prepare data for chart
  const chartData = filteredMatches.map((match) => ({
    name: match.opponent.substring(0, 3),
    winProbability: match.prediction?.winProbability || 0,
    format: match.format,
  }))

  // Calculate averages by format
  const formatStats = formats.slice(1).map((format) => {
    const formatMatches = upcomingMatches.filter((m) => m.format === format)
    const avgWinProb =
      formatMatches.length > 0
        ? (formatMatches.reduce((sum, m) => sum + (m.prediction?.winProbability || 0), 0) / formatMatches.length).toFixed(1)
        : 0
    return {
      format,
      matches: formatMatches.length,
      avgWinProbability: avgWinProb,
    }
  })

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground mb-2">Win Probability Analysis</h1>
        <p className="text-foreground/60">
          Upcoming matches with predicted win probability for India across all formats
        </p>
      </div>

      {/* Format Filter */}
      <div className="mb-8 flex gap-2 flex-wrap">
        {formats.map((format) => (
          <Button
            key={format}
            variant={selectedFormat === format ? "default" : "outline"}
            onClick={() => setSelectedFormat(format as any)}
          >
            {format}
          </Button>
        ))}
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {formatStats.map((stat) => (
          <Card key={stat.format} className="p-6 border border-border">
            <h3 className="text-sm font-semibold text-foreground/60 mb-2">{stat.format} Format</h3>
            <div className="space-y-2">
              <div>
                <p className="text-2xl font-bold text-primary">{stat.avgWinProbability}%</p>
                <p className="text-sm text-foreground/60">Avg Win Probability</p>
              </div>
              <div>
                <p className="text-lg font-semibold text-foreground">{stat.matches}</p>
                <p className="text-sm text-foreground/60">Upcoming Matches</p>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Chart */}
      {chartData.length > 0 && (
        <Card className="p-6 border border-border mb-8">
          <h2 className="text-lg font-bold text-foreground mb-4">Win Probability by Match</h2>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip formatter={(value) => `${value}%`} />
              <Legend />
              <Bar dataKey="winProbability" fill="var(--color-chart-1)" name="Win Probability %" />
            </BarChart>
          </ResponsiveContainer>
        </Card>
      )}

      {/* Matches List */}
      <div className="space-y-4">
        <h2 className="text-lg font-bold text-foreground">All Matches</h2>
        {filteredMatches.length > 0 ? (
          filteredMatches.map((match, i) => (
            <Card key={i} className="p-6 border border-border hover:border-primary/50 transition">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Match Info */}
                <div>
                  <div className="flex items-center gap-2 mb-4">
                    <Trophy className="w-5 h-5 text-primary" />
                    <span className="font-semibold text-foreground">{match.format}</span>
                  </div>
                  <h3 className="text-lg font-bold text-foreground mb-2">India vs {match.opponent}</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2 text-foreground/60">
                      <Calendar className="w-4 h-4" />
                      {match.date}
                    </div>
                    <div className="flex items-center gap-2 text-foreground/60">
                      <MapPin className="w-4 h-4" />
                      {match.venue}
                    </div>
                    <div className="mt-2">
                      <p className="text-foreground/60 text-xs mb-1">Series</p>
                      <p className="font-medium text-foreground">{match.series}</p>
                    </div>
                  </div>
                </div>

                  {/* Win Probability */}
                <div className="flex flex-col justify-between">
                  <div>
                    <p className="text-sm text-foreground/60 mb-2">India Win Probability</p>
                    <div className="relative h-12 bg-muted rounded-lg overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-primary to-accent flex items-center justify-center transition-all duration-300"
                        style={{ width: `${match.prediction?.winProbability || 0}%` }}
                      >
                        <span className="text-white font-bold text-lg">{match.prediction?.winProbability || 0}%</span>
                      </div>
                    </div>
                  </div>

                  {/* Expected Score */}
                  <div className="mt-4 p-4 bg-muted rounded-lg">
                    <p className="text-sm text-foreground/60 mb-2">Expected Score Range</p>
                    <p className="text-lg font-bold text-primary">
                      {match.prediction?.expectedScore || "N/A"}
                    </p>
                  </div>
                </div>
              </div>
            </Card>
          ))
        ) : (
          <Card className="p-8 border border-border text-center">
            <p className="text-foreground/60">No matches found for {selectedFormat} format</p>
          </Card>
        )}
      </div>
    </div>
  )
}
