"use client"

import { useState, Suspense } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { indiaSquad } from "@/lib/cricket-data"
import { Search } from "lucide-react"

function AllPlayersContent() {
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedGroup, setSelectedGroup] = useState<string>("All")
  const [selectedRole, setSelectedRole] = useState<string>("All")

  const groups = ["All", "Group A", "Group B", "Group C"]
  const roles = ["All", "Batsman", "Bowler", "All-rounder", "Wicket-keeper"]

  const filteredPlayers = indiaSquad.filter((player) => {
    const matchesSearch = player.name.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesGroup = selectedGroup === "All" || player.group === selectedGroup
    const matchesRole = selectedRole === "All" || player.role === selectedRole
    return matchesSearch && matchesGroup && matchesRole
  })

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground mb-2">Indian Cricket Team Squad</h1>
        <p className="text-foreground/60">Complete roster of 50 Indian players across all formats (Group A, B, C)</p>
      </div>

      {/* Search and Filters */}
      <div className="mb-8 space-y-4">
        <div className="flex gap-4 flex-col lg:flex-row">
          {/* Search */}
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-3 w-5 h-5 text-foreground/40" />
            <input
              type="text"
              placeholder="Search players..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-border rounded-lg bg-card focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          {/* Group Filter */}
          <div className="flex gap-2 flex-wrap">
            {groups.map((group) => (
              <Button
                key={group}
                variant={selectedGroup === group ? "default" : "outline"}
                onClick={() => setSelectedGroup(group)}
                size="sm"
              >
                {group}
              </Button>
            ))}
          </div>

          {/* Role Filter */}
          <div className="flex gap-2 flex-wrap">
            {roles.map((role) => (
              <Button
                key={role}
                variant={selectedRole === role ? "default" : "outline"}
                onClick={() => setSelectedRole(role)}
                size="sm"
              >
                {role}
              </Button>
            ))}
          </div>
        </div>

        <div className="text-sm text-foreground/60">
          Showing {filteredPlayers.length} of {indiaSquad.length} players
        </div>
      </div>

      {/* Players Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredPlayers.map((player) => (
          <Card key={player.id} className="p-6 border border-border hover:border-primary/50 transition">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="text-lg font-bold text-foreground">{player.name}</h3>
                <p className="text-sm text-foreground/60">
                  {player.role} • {player.group}
                </p>
              </div>
              <div className="text-2xl font-bold text-primary">{player.number}</div>
            </div>

            {/* Format Availability */}
            <div className="mb-4 flex gap-2">
              {Object.entries(player.formatAvailability).map(([format, available]) => (
                <span
                  key={format}
                  className={`px-2 py-1 text-xs rounded-full font-medium ${
                    available
                      ? "bg-green-500/20 text-green-700 dark:text-green-400"
                      : "bg-red-500/20 text-red-700 dark:text-red-400"
                  }`}
                >
                  {format} {available ? "✓" : "✗"}
                </span>
              ))}
            </div>

            {/* Stats Summary */}
            <div className="mb-4 space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-foreground/60">Form:</span>
                <span className="font-medium text-foreground">{player.form}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-foreground/60">Recent Avg:</span>
                <span className="font-medium text-foreground">
                  {(player.recentForm.reduce((a, b) => a + b) / player.recentForm.length).toFixed(1)}
                </span>
              </div>
            </div>

            {/* Strengths & Weaknesses */}
            <div className="space-y-3">
              <div>
                <p className="text-xs font-semibold text-green-600 dark:text-green-400 mb-1">Strengths</p>
                <div className="flex flex-wrap gap-1">
                  {player.strengths.map((s, i) => (
                    <span
                      key={i}
                      className="px-2 py-1 text-xs bg-green-500/20 text-green-700 dark:text-green-400 rounded"
                    >
                      {s}
                    </span>
                  ))}
                </div>
              </div>
              <div>
                <p className="text-xs font-semibold text-red-600 dark:text-red-400 mb-1">Weaknesses</p>
                <div className="flex flex-wrap gap-1">
                  {player.weaknesses.map((w, i) => (
                    <span key={i} className="px-2 py-1 text-xs bg-red-500/20 text-red-700 dark:text-red-400 rounded">
                      {w}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {filteredPlayers.length === 0 && (
        <div className="text-center py-12">
          <p className="text-foreground/60 mb-4">No players found matching your filters</p>
          <Button
            variant="outline"
            onClick={() => {
              setSearchTerm("")
              setSelectedGroup("All")
              setSelectedRole("All")
            }}
          >
            Reset Filters
          </Button>
        </div>
      )}
    </div>
  )
}

export default function AllPlayersPage() {
  return (
    <Suspense
      fallback={
        <div className="p-8">
          <p className="text-foreground/60">Loading players...</p>
        </div>
      }
    >
      <AllPlayersContent />
    </Suspense>
  )
}
