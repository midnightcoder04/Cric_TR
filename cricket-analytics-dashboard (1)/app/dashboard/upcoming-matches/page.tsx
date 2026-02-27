"use client"

import { useState } from "react"
import { Card } from "@/components/ui/card"
import { upcomingMatches, getMatchesByFormat } from "@/lib/cricket-data"
import type { Format } from "@/lib/cricket-data"
import { Calendar, MapPin, Clock, TrendingUp } from "lucide-react"

export default function UpcomingMatchesPage() {
  const [selectedFormat, setSelectedFormat] = useState<Format>("ODI")

  const formats: Format[] = ["ODI", "T20", "Test"]
  const matchesByFormat = getMatchesByFormat(selectedFormat)

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground mb-2">Upcoming Matches</h1>
        <p className="text-foreground/60">View all scheduled matches for India's cricket teams.</p>
      </div>

      {/* Format Tabs */}
      <div className="flex gap-3 mb-8">
        {formats.map((format) => (
          <button
            key={format}
            onClick={() => setSelectedFormat(format)}
            className={`px-6 py-2 rounded-lg font-medium transition-all ${
              selectedFormat === format
                ? "bg-primary text-primary-foreground shadow-lg"
                : "bg-muted text-foreground hover:bg-muted/80"
            }`}
          >
            {format}
          </button>
        ))}
      </div>

      {/* Matches Grid */}
      {matchesByFormat.length > 0 ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {matchesByFormat.map((match) => (
            <Card
              key={match.id}
              className="p-6 border border-border hover:border-primary/50 transition hover:shadow-lg"
            >
              {/* Match Header */}
              <div className="flex items-start justify-between mb-4">
                <div>
                  <p className="text-sm font-medium text-foreground/60 mb-1">{match.series}</p>
                  <h2 className="text-2xl font-bold text-foreground">India vs {match.opponent}</h2>
                </div>
                <span className="px-3 py-1 bg-primary/20 text-primary rounded-full text-sm font-medium">
                  {match.format}
                </span>
              </div>

              {/* Match Details Grid */}
              <div className="grid grid-cols-2 gap-4 mb-4">
                {/* Date */}
                <div className="flex items-start gap-3">
                  <Calendar className="w-5 h-5 text-accent flex-shrink-0 mt-1" />
                  <div>
                    <p className="text-sm text-foreground/60">Date</p>
                    <p className="font-medium text-foreground">{match.date}</p>
                  </div>
                </div>

                {/* Time */}
                <div className="flex items-start gap-3">
                  <Clock className="w-5 h-5 text-accent flex-shrink-0 mt-1" />
                  <div>
                    <p className="text-sm text-foreground/60">Time</p>
                    <p className="font-medium text-foreground">{match.time}</p>
                  </div>
                </div>

                {/* Venue */}
                <div className="flex items-start gap-3 col-span-2">
                  <MapPin className="w-5 h-5 text-accent flex-shrink-0 mt-1" />
                  <div>
                    <p className="text-sm text-foreground/60">Venue</p>
                    <p className="font-medium text-foreground">{match.venue}</p>
                  </div>
                </div>
              </div>

              {/* Prediction Card */}
              <div className="bg-muted p-4 rounded-lg border border-border/50">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm font-medium text-foreground/60 flex items-center gap-2">
                    <TrendingUp className="w-4 h-4" />
                    India's Win Probability
                  </p>
                  <span className="text-2xl font-bold text-green-500">{match.prediction.winProbability}%</span>
                </div>
                <div className="w-full bg-background rounded-full h-2">
                  <div
                    className="bg-gradient-to-r from-accent to-primary h-2 rounded-full transition-all"
                    style={{ width: `${match.prediction.winProbability}%` }}
                  ></div>
                </div>
                <p className="text-sm text-foreground/60 mt-2">Expected Score: {match.prediction.expectedScore}</p>
              </div>

              {/* View Details Button */}
              <button className="w-full mt-4 px-4 py-2 bg-primary/10 text-primary hover:bg-primary/20 rounded-lg font-medium transition-all">
                View Match Analysis
              </button>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="p-12 text-center border border-border">
          <p className="text-foreground/60">No upcoming matches in {selectedFormat} format</p>
        </Card>
      )}

      {/* Stats Summary */}
      <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="p-6 border border-border">
          <p className="text-foreground/60 text-sm mb-2">Total Upcoming Matches</p>
          <p className="text-3xl font-bold text-foreground">{upcomingMatches.length}</p>
        </Card>
        <Card className="p-6 border border-border">
          <p className="text-foreground/60 text-sm mb-2">Matches in {selectedFormat}</p>
          <p className="text-3xl font-bold text-foreground">{matchesByFormat.length}</p>
        </Card>
        <Card className="p-6 border border-border">
          <p className="text-foreground/60 text-sm mb-2">Average Win Probability</p>
          <p className="text-3xl font-bold text-foreground">
            {matchesByFormat.length > 0
              ? Math.round(
                  matchesByFormat.reduce((sum, m) => sum + m.prediction.winProbability, 0) / matchesByFormat.length,
                )
              : 0}
            %
          </p>
        </Card>
      </div>
    </div>
  )
}
