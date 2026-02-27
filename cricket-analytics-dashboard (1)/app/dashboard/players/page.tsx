"use client"

import { useState } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Search, Filter, TrendingUp, Award } from "lucide-react"

interface Player {
  id: number
  name: string
  role: string
  matches: number
  runs: number
  average: number
  strikeRate: number
  wickets: number
  economy: number
  form: "excellent" | "good" | "average" | "poor"
}

const players: Player[] = [
  {
    id: 1,
    name: "Virat Kohli",
    role: "Batter",
    matches: 45,
    runs: 2150,
    average: 52.4,
    strikeRate: 94.2,
    wickets: 0,
    economy: 0,
    form: "excellent",
  },
  {
    id: 2,
    name: "Rohit Sharma",
    role: "Batter",
    matches: 42,
    runs: 1980,
    average: 48.3,
    strikeRate: 96.5,
    wickets: 0,
    economy: 0,
    form: "excellent",
  },
  {
    id: 3,
    name: "Jasprit Bumrah",
    role: "Bowler",
    matches: 38,
    runs: 0,
    average: 0,
    strikeRate: 0,
    wickets: 52,
    economy: 6.8,
    form: "good",
  },
  {
    id: 4,
    name: "Hardik Pandya",
    role: "All-rounder",
    matches: 40,
    runs: 1250,
    average: 35.7,
    strikeRate: 128.3,
    wickets: 28,
    economy: 7.2,
    form: "good",
  },
  {
    id: 5,
    name: "KL Rahul",
    role: "Batter",
    matches: 38,
    runs: 1680,
    average: 46.2,
    strikeRate: 91.5,
    wickets: 0,
    economy: 0,
    form: "average",
  },
  {
    id: 6,
    name: "Yuzvendra Chahal",
    role: "Bowler",
    matches: 35,
    runs: 0,
    average: 0,
    strikeRate: 0,
    wickets: 48,
    economy: 7.5,
    form: "good",
  },
]

export default function PlayersPage() {
  const [searchTerm, setSearchTerm] = useState("")
  const [roleFilter, setRoleFilter] = useState<string | null>(null)
  const [selectedPlayer, setSelectedPlayer] = useState<Player | null>(null)

  const filteredPlayers = players.filter((player) => {
    const matchesSearch = player.name.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesRole = !roleFilter || player.role === roleFilter
    return matchesSearch && matchesRole
  })

  const roles = ["Batter", "Bowler", "All-rounder"]

  const getFormColor = (form: string) => {
    switch (form) {
      case "excellent":
        return "bg-green-500/20 text-green-700 dark:text-green-400"
      case "good":
        return "bg-blue-500/20 text-blue-700 dark:text-blue-400"
      case "average":
        return "bg-yellow-500/20 text-yellow-700 dark:text-yellow-400"
      case "poor":
        return "bg-red-500/20 text-red-700 dark:text-red-400"
      default:
        return ""
    }
  }

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground mb-2">Player Statistics</h1>
        <p className="text-foreground/60">View detailed performance metrics for all players</p>
      </div>

      {/* Search and Filters */}
      <div className="mb-6 space-y-4">
        <div className="flex gap-4 flex-col md:flex-row">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-3 w-5 h-5 text-foreground/40" />
            <Input
              placeholder="Search players..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <div className="flex gap-2">
            <Button
              variant={roleFilter === null ? "default" : "outline"}
              onClick={() => setRoleFilter(null)}
              className="gap-2"
            >
              <Filter className="w-4 h-4" />
              All
            </Button>
            {roles.map((role) => (
              <Button
                key={role}
                variant={roleFilter === role ? "default" : "outline"}
                onClick={() => setRoleFilter(role)}
              >
                {role}
              </Button>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Players List */}
        <div className="lg:col-span-2">
          <Card className="border border-border overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-muted border-b border-border">
                  <tr>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-foreground">Player</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-foreground">Role</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-foreground">Matches</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-foreground">Avg</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-foreground">Form</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {filteredPlayers.map((player) => (
                    <tr
                      key={player.id}
                      className="hover:bg-muted/50 cursor-pointer transition"
                      onClick={() => setSelectedPlayer(player)}
                    >
                      <td className="px-6 py-4 text-sm font-medium text-foreground">{player.name}</td>
                      <td className="px-6 py-4 text-sm text-foreground/60">{player.role}</td>
                      <td className="px-6 py-4 text-sm text-foreground">{player.matches}</td>
                      <td className="px-6 py-4 text-sm text-foreground">
                        {player.role === "Batter" ? player.average.toFixed(1) : player.economy.toFixed(1)}
                      </td>
                      <td className="px-6 py-4 text-sm">
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-medium capitalize ${getFormColor(player.form)}`}
                        >
                          {player.form}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </div>

        {/* Player Details */}
        <div>
          {selectedPlayer ? (
            <Card className="p-6 border border-border sticky top-8">
              <div className="mb-6">
                <h2 className="text-2xl font-bold text-foreground mb-2">{selectedPlayer.name}</h2>
                <p className="text-foreground/60 mb-3">{selectedPlayer.role}</p>
                <span
                  className={`inline-block px-3 py-1 rounded-full text-sm font-medium capitalize ${getFormColor(selectedPlayer.form)}`}
                >
                  {selectedPlayer.form}
                </span>
              </div>

              <div className="space-y-4">
                {selectedPlayer.role === "Batter" || selectedPlayer.role === "All-rounder" ? (
                  <>
                    <div className="p-3 bg-muted rounded-lg">
                      <p className="text-xs text-foreground/60 mb-1">Total Runs</p>
                      <p className="text-2xl font-bold text-foreground">{selectedPlayer.runs}</p>
                    </div>
                    <div className="p-3 bg-muted rounded-lg">
                      <p className="text-xs text-foreground/60 mb-1">Average</p>
                      <p className="text-2xl font-bold text-foreground">{selectedPlayer.average.toFixed(1)}</p>
                    </div>
                    <div className="p-3 bg-muted rounded-lg">
                      <p className="text-xs text-foreground/60 mb-1">Strike Rate</p>
                      <p className="text-2xl font-bold text-foreground">{selectedPlayer.strikeRate.toFixed(1)}</p>
                    </div>
                  </>
                ) : null}

                {selectedPlayer.role === "Bowler" || selectedPlayer.role === "All-rounder" ? (
                  <>
                    <div className="p-3 bg-muted rounded-lg">
                      <p className="text-xs text-foreground/60 mb-1">Wickets</p>
                      <p className="text-2xl font-bold text-foreground">{selectedPlayer.wickets}</p>
                    </div>
                    <div className="p-3 bg-muted rounded-lg">
                      <p className="text-xs text-foreground/60 mb-1">Economy Rate</p>
                      <p className="text-2xl font-bold text-foreground">{selectedPlayer.economy.toFixed(1)}</p>
                    </div>
                  </>
                ) : null}

                <div className="p-3 bg-muted rounded-lg">
                  <p className="text-xs text-foreground/60 mb-1">Matches Played</p>
                  <p className="text-2xl font-bold text-foreground">{selectedPlayer.matches}</p>
                </div>
              </div>

              <Button className="w-full mt-6 gap-2">
                <Award className="w-4 h-4" />
                View Full Profile
              </Button>
            </Card>
          ) : (
            <Card className="p-6 border border-border text-center">
              <TrendingUp className="w-12 h-12 text-foreground/20 mx-auto mb-4" />
              <p className="text-foreground/60">Select a player to view detailed statistics</p>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
