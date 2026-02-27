"use client"

import { useState } from "react"
import { Card } from "@/components/ui/card"
import type { Format } from "@/lib/cricket-data"
import { getPlayersByFormat } from "@/lib/cricket-data"

export default function FormatSelectionPage() {
  const [selectedFormat, setSelectedFormat] = useState<Format>("ODI")

  const formatInfo = {
    ODI: {
      name: "One Day Internationals",
      overs: "50 overs per side",
      description: "Classic format combining batting and bowling skills",
      color: "from-blue-500 to-cyan-500",
    },
    T20: {
      name: "Twenty20",
      overs: "20 overs per side",
      description: "Fast-paced, explosive cricket format",
      color: "from-purple-500 to-pink-500",
    },
    Test: {
      name: "Test Cricket",
      overs: "unlimited (5 days)",
      description: "Ultimate test of skill, endurance and strategy",
      color: "from-orange-500 to-red-500",
    },
  }

  const players = getPlayersByFormat(selectedFormat)

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground mb-2">Format Selection</h1>
        <p className="text-foreground/60">View India's squad and player stats by format</p>
      </div>

      {/* Format Selector */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {(Object.keys(formatInfo) as Format[]).map((format) => (
          <button
            key={format}
            onClick={() => setSelectedFormat(format)}
            className={`text-left transition-all ${selectedFormat === format ? "ring-2 ring-primary" : ""}`}
          >
            <Card
              className={`p-6 h-full cursor-pointer hover:border-primary/50 transition border ${
                selectedFormat === format ? "border-primary bg-primary/5" : "border-border"
              }`}
            >
              <div className={`bg-gradient-to-r ${formatInfo[format].color} p-4 rounded-lg mb-4 text-white`}>
                <h3 className="font-bold text-lg">{format}</h3>
              </div>
              <h2 className="text-xl font-bold text-foreground mb-2">{formatInfo[format].name}</h2>
              <p className="text-sm text-foreground/60 mb-2">{formatInfo[format].overs}</p>
              <p className="text-sm text-foreground/70">{formatInfo[format].description}</p>
            </Card>
          </button>
        ))}
      </div>

      {/* Players Table */}
      <Card className="border border-border p-6">
        <h2 className="text-2xl font-bold text-foreground mb-6">India's Squad - {selectedFormat}</h2>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left py-3 px-4 font-semibold text-foreground">Player</th>
                <th className="text-left py-3 px-4 font-semibold text-foreground">Role</th>
                <th className="text-center py-3 px-4 font-semibold text-foreground">Runs</th>
                <th className="text-center py-3 px-4 font-semibold text-foreground">Average</th>
                <th className="text-center py-3 px-4 font-semibold text-foreground">Wickets</th>
                <th className="text-center py-3 px-4 font-semibold text-foreground">Form</th>
              </tr>
            </thead>
            <tbody>
              {players.map((player) => {
                const stats = player.stats[selectedFormat]
                return (
                  <tr key={player.id} className="border-b border-border/50 hover:bg-muted/50 transition">
                    <td className="py-3 px-4 font-medium text-foreground">{player.name}</td>
                    <td className="py-3 px-4 text-foreground/70">{player.role}</td>
                    <td className="py-3 px-4 text-center text-foreground">{stats.runs}</td>
                    <td className="py-3 px-4 text-center text-foreground">{stats.average.toFixed(1)}</td>
                    <td className="py-3 px-4 text-center text-foreground">{stats.wickets}</td>
                    <td className="py-3 px-4 text-center">
                      <span
                        className={`px-3 py-1 rounded-full text-sm font-medium ${
                          player.form === "Excellent"
                            ? "bg-green-500/20 text-green-700"
                            : player.form === "Good"
                              ? "bg-blue-500/20 text-blue-700"
                              : player.form === "Average"
                                ? "bg-yellow-500/20 text-yellow-700"
                                : "bg-red-500/20 text-red-700"
                        }`}
                      >
                        {player.form}
                      </span>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  )
}
