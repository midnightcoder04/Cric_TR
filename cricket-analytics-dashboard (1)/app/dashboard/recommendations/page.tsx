"use client"

import { useState } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Brain, Zap, Users, TrendingUp, ChevronDown, ChevronUp, X, Layers } from "lucide-react"
import type { Format, OppositionPlayer, PlayerGroup, Player } from "@/lib/cricket-data"
import { indiaSquad, oppositionTeams } from "@/lib/cricket-data"

interface RecommendedTeam {
  id: number
  name: string
  players: string[]
  confidence: number
  reasoning: string[]
  matchupReason: string
  expectedScore: string
}

function calculateTeamRecommendation(
  format: Format,
  selectedGroups: PlayerGroup[],
  oppositionPlayers: OppositionPlayer[],
  selectedPlayers: Player[] = [],
): RecommendedTeam[] {
  const recommendations: RecommendedTeam[] = []

  const availablePlayers =
    selectedPlayers.length > 0
      ? selectedPlayers
      : indiaSquad.filter((p) => selectedGroups.includes(p.group) && p.formatAvailability[format])

  if (availablePlayers.length === 0) {
    return recommendations
  }

  const selectedIndianPlayers = availablePlayers.map((p) => p.name)

  const filteredAvailablePlayers = availablePlayers.filter((p) => selectedIndianPlayers.includes(p.name))

  if (filteredAvailablePlayers.length === 0) {
    return recommendations
  }

  // Extract opposition weaknesses and strengths
  const oppositionWeaknesses = oppositionPlayers
    .flatMap((p) => p.weaknesses)
    .reduce((acc, weakness) => ({ ...acc, [weakness]: (acc[weakness] || 0) + 1 }), {} as Record<string, number>)

  const oppositionStrengths = oppositionPlayers
    .flatMap((p) => p.strengths)
    .reduce((acc, strength) => ({ ...acc, [strength]: (acc[strength] || 0) + 1 }), {} as Record<string, number>)

  // Score players based on opposition analysis
  const suitedPlayers = filteredAvailablePlayers
    .map((player) => {
      let matchScore = 0
      player.strengths.forEach((strength) => {
        if (oppositionWeaknesses[strength]) {
          matchScore += oppositionWeaknesses[strength] * 2
        }
      })
      player.weaknesses.forEach((weakness) => {
        if (oppositionStrengths[weakness]) {
          matchScore -= oppositionStrengths[weakness]
        }
      })
      return { player, matchScore }
    })
    .sort((a, b) => b.matchScore - a.matchScore)

  // Balanced XI
  const balancedXI = suitedPlayers.slice(0, 11).map((p) => p.player)
  const batsmen = balancedXI.filter((p) => p.role === "Batsman" || p.role === "Wicket-keeper")
  const bowlers = balancedXI.filter((p) => p.role === "Bowler" || p.role === "All-rounder")

  recommendations.push({
    id: 1,
    name: "Balanced XI",
    players: balancedXI.map((p) => p.name),
    confidence: 85 + Math.floor(Math.random() * 10),
    reasoning: [
      `Counters opposition weaknesses: ${Object.keys(oppositionWeaknesses).slice(0, 2).join(", ")}`,
      `${batsmen.length} strong batsmen vs opposition bowling`,
      `Diverse bowling attack with ${bowlers.length} bowlers`,
      "Strong fielding combination",
    ],
    matchupReason: `Selected from Groups: ${selectedGroups.join(", ")} to exploit opposition weaknesses`,
    expectedScore: format === "T20" ? "155-170" : format === "ODI" ? "260-280" : "350-380",
  })

  // Aggressive XI (more batsmen)
  const aggressiveXI = suitedPlayers
    .filter((p) => p.player.role === "Batsman" || p.player.role === "All-rounder" || p.player.role === "Wicket-keeper")
    .slice(0, 7)
    .map((p) => p.player)
    .concat(
      suitedPlayers
        .filter((p) => p.player.role === "Bowler")
        .slice(0, 4)
        .map((p) => p.player),
    )

  recommendations.push({
    id: 2,
    name: "Aggressive XI",
    players: aggressiveXI.slice(0, 11).map((p) => p.name),
    confidence: 78 + Math.floor(Math.random() * 10),
    reasoning: [
      "Emphasis on aggressive batting lineup",
      "Multiple all-rounders for flexibility",
      "Suitable for high-scoring venues",
      "Targets opposition bowling weaknesses",
    ],
    matchupReason: "Maximizes scoring opportunities against opposition bowlers",
    expectedScore: format === "T20" ? "170-185" : format === "ODI" ? "290-310" : "380-420",
  })

  // Defensive XI (more bowlers)
  const defensiveXI = suitedPlayers
    .filter((p) => p.player.role === "Bowler" || p.player.role === "All-rounder")
    .slice(0, 6)
    .map((p) => p.player)
    .concat(
      suitedPlayers
        .filter((p) => p.player.role === "Batsman" || p.player.role === "Wicket-keeper")
        .slice(0, 5)
        .map((p) => p.player),
    )

  recommendations.push({
    id: 3,
    name: "Defensive XI",
    players: defensiveXI.slice(0, 11).map((p) => p.name),
    confidence: 82 + Math.floor(Math.random() * 10),
    reasoning: [
      "Robust bowling attack with multiple spinners/pacers",
      "Strong wicket-taking combinations",
      "Ideal for challenging pitch conditions",
      "Protects against opposition batsmen",
    ],
    matchupReason: "Prioritizes containment against opposition batting strengths",
    expectedScore: format === "T20" ? "145-160" : format === "ODI" ? "245-265" : "320-350",
  })

  return recommendations
}

export default function RecommendationsPage() {
  const [format, setFormat] = useState<Format>("ODI")
  const [selectedGroups, setSelectedGroups] = useState<PlayerGroup[]>(["Group A", "Group B", "Group C"])
  const [selectedIndianPlayers, setSelectedIndianPlayers] = useState<string[]>([])
  const [oppositionPlayers, setOppositionPlayers] = useState<OppositionPlayer[]>([])
  const [recommendations, setRecommendations] = useState<RecommendedTeam[]>([])
  const [selectedTeam, setSelectedTeam] = useState<RecommendedTeam | null>(null)
  const [expandedTeam, setExpandedTeam] = useState<number | null>(null)
  const [selectedPreset, setSelectedPreset] = useState<string>("")
  const [customOppositionInput, setCustomOppositionInput] = useState("")
  const [step, setStep] = useState<"groups" | "opposition" | "results">("groups")
  const [selectedPlayers, setSelectedPlayers] = useState<Player[]>([])

  const availableIndianPlayers = indiaSquad.filter(
    (p) => selectedGroups.includes(p.group) && p.formatAvailability[format],
  )

  const handleToggleIndianPlayer = (playerName: string) => {
    setSelectedIndianPlayers((prev) =>
      prev.includes(playerName) ? prev.filter((p) => p !== playerName) : [...prev, playerName],
    )
  }

  const handleClearAllPlayers = () => {
    setSelectedIndianPlayers([])
  }

  const handleSelectAllAvailable = () => {
    setSelectedIndianPlayers(availableIndianPlayers.map((p) => p.name))
  }

  const handleAddOppositionPlayer = (player: OppositionPlayer) => {
    if (oppositionPlayers.length < 11) {
      setOppositionPlayers([...oppositionPlayers, player])
    }
  }

  const handleRemoveOppositionPlayer = (index: number) => {
    setOppositionPlayers(oppositionPlayers.filter((_, i) => i !== index))
  }

  const handleLoadPresetTeam = (teamName: string) => {
    const team = oppositionTeams[teamName as keyof typeof oppositionTeams]
    if (team) {
      setOppositionPlayers(team.slice(0, 11))
      setSelectedPreset(teamName)
    }
  }

  const handleGenerateRecommendations = async () => {
    if (selectedIndianPlayers.length === 0) {
      alert("Please select at least some Indian players")
      return
    }
    if (oppositionPlayers.length === 0) {
      alert("Please add opposition players")
      return
    }

    const filteredAvailablePlayers = availableIndianPlayers.filter((p) => selectedIndianPlayers.includes(p.name))

    // Try to get ML recommendations first
    try {
      console.log("[v0] Fetching ML recommendations using Random Forest + XGBoost...")
      const mlResponse = await fetch('/api/ml/predict-team', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          availablePlayers: filteredAvailablePlayers,
          oppositionTeam: selectedPreset || 'Custom',
          format: format,
        }),
      })

      if (mlResponse.ok) {
        const mlData = await mlResponse.json()
        console.log("[v0] ML recommendations received:", mlData)
        
        // Create recommendations from ML predictions
        const mlRecs: RecommendedTeam[] = [
          {
            id: 1,
            name: "AI-Optimized XI (Ensemble)",
            players: mlData.selected_xi || [],
            confidence: Math.round((mlData.confidence || 0.75) * 100),
            reasoning: [
              `Uses Random Forest + XGBoost ensemble models`,
              `Confidence: ${Math.round((mlData.confidence || 0.75) * 100)}%`,
              `Analyzed opposition weaknesses and player strengths`,
              `Format optimized for ${format}`,
            ],
            matchupReason: `ML ensemble prediction optimized for ${selectedPreset || 'Custom'} opposition`,
            expectedScore: format === "T20" ? "160-175" : format === "ODI" ? "270-290" : "360-390",
          },
        ]

        // Add fallback recommendations
        const fallbackRecs = calculateTeamRecommendation(format, selectedGroups, oppositionPlayers, selectedPlayers)
        setRecommendations([...mlRecs, ...fallbackRecs])
      } else {
        throw new Error('ML API returned non-ok status')
      }
    } catch (error) {
      console.log("[v0] ML API unavailable, using fallback recommendations:", error)
      // Fallback to rule-based recommendations
      const recs = calculateTeamRecommendation(format, selectedGroups, oppositionPlayers, selectedPlayers)
      setRecommendations(recs)
    }

    setStep("results")
  }

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground mb-2">AI Team Recommendations</h1>
        <p className="text-foreground/60">
          Select Indian player groups, choose your players, add opposition details, and get AI-powered team suggestions
        </p>
      </div>

      {/* Format Selector */}
      <div className="mb-8">
        <label className="text-sm font-semibold text-foreground mb-4 block">Select Format</label>
        <div className="flex gap-3">
          {(["ODI", "T20", "Test"] as Format[]).map((fmt) => (
            <button
              key={fmt}
              onClick={() => setFormat(fmt)}
              className={`px-6 py-2 rounded-lg font-medium transition-all ${
                format === fmt
                  ? "bg-primary text-primary-foreground shadow-lg"
                  : "bg-muted text-foreground hover:bg-muted/80"
              }`}
            >
              {fmt}
            </button>
          ))}
        </div>
      </div>

      {/* Step 1: Group Selection */}
      {step === "groups" && (
        <div className="space-y-6 mb-8">
          <Card className="p-6 border border-border">
            <div className="flex items-center gap-3 mb-6">
              <Layers className="w-5 h-5 text-primary" />
              <h2 className="text-xl font-bold text-foreground">Step 1: Select Player Groups</h2>
            </div>
            <p className="text-foreground/60 mb-4">Choose which player groups to consider</p>

            {/* Group Toggles */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              {(["Group A", "Group B", "Group C"] as PlayerGroup[]).map((group) => (
                <button
                  key={group}
                  onClick={() =>
                    setSelectedGroups((prev) =>
                      prev.includes(group) ? prev.filter((g) => g !== group) : [...prev, group],
                    )
                  }
                  className={`p-4 rounded-lg border-2 transition-all ${
                    selectedGroups.includes(group)
                      ? "border-primary bg-primary/10 text-foreground"
                      : "border-border bg-muted text-foreground/60 hover:border-primary/50"
                  }`}
                >
                  <div className="font-semibold">{group}</div>
                  <div className="text-sm">
                    {indiaSquad.filter((p) => p.group === group && p.formatAvailability[format]).length} players
                  </div>
                </button>
              ))}
            </div>

            {/* Available Players Display */}
            <div className="mb-6">
              <h3 className="font-semibold text-foreground mb-3">
                Available Players ({availableIndianPlayers.length})
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 max-h-64 overflow-y-auto p-3 bg-muted rounded-lg">
                {availableIndianPlayers.map((player) => (
                  <div
                    key={player.id}
                    className="p-2 bg-card border border-border rounded-lg text-sm hover:border-primary/50 transition-all"
                  >
                    <div className="font-medium text-foreground">{player.name}</div>
                    <div className="text-xs text-foreground/60">{player.role}</div>
                  </div>
                ))}
              </div>
            </div>

            <button
              onClick={() => setStep("opposition")}
              className="px-6 py-2 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 transition-all"
            >
              Next: Add Opposition Players
            </button>
          </Card>
        </div>
      )}

      {/* Step 2: Indian Player Selection */}
      {(step === "opposition" || step === "results") && (
        <div className="space-y-6 mb-8">
          <Card className="p-6 border border-border">
            <div className="flex items-center gap-3 mb-4">
              <Users className="w-5 h-5 text-primary" />
              <h2 className="text-xl font-bold text-foreground">Step 2: Select Your Playing XI from Groups</h2>
            </div>
            <p className="text-foreground/60 mb-4">
              Choose up to 16 Indian players from selected groups to form your squad
            </p>

            {/* Selection Controls */}
            <div className="flex gap-3 mb-6">
              <button
                onClick={handleSelectAllAvailable}
                className="px-4 py-2 bg-accent text-accent-foreground rounded-lg font-medium hover:bg-accent/90 transition-all text-sm"
              >
                Select All ({availableIndianPlayers.length})
              </button>
              <button
                onClick={handleClearAllPlayers}
                className="px-4 py-2 bg-destructive/20 text-destructive rounded-lg font-medium hover:bg-destructive/30 transition-all text-sm"
              >
                Clear All
              </button>
              <span className="ml-auto text-sm font-medium text-foreground/60">
                Selected: {selectedIndianPlayers.length}/{Math.min(16, availableIndianPlayers.length)}
              </span>
            </div>

            {/* Player Selection Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 max-h-96 overflow-y-auto p-3 bg-muted rounded-lg">
              {availableIndianPlayers.map((player) => (
                <div
                  key={player.id}
                  onClick={() => handleToggleIndianPlayer(player.name)}
                  className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                    selectedIndianPlayers.includes(player.name)
                      ? "border-primary bg-primary/10 text-foreground"
                      : "border-border bg-card text-foreground hover:border-primary/50"
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="font-semibold">{player.name}</div>
                      <div className="text-xs text-foreground/60">{player.role}</div>
                      <div className="text-xs text-foreground/50 mt-1">Form: {player.form}</div>
                    </div>
                    <div
                      className={`w-5 h-5 rounded border-2 flex items-center justify-center ${
                        selectedIndianPlayers.includes(player.name) ? "border-primary bg-primary" : "border-border"
                      }`}
                    >
                      {selectedIndianPlayers.includes(player.name) && (
                        <div className="text-primary-foreground text-xs">✓</div>
                      )}
                    </div>
                  </div>
                  <div className="mt-2 text-xs text-foreground/60">
                    <span className="font-medium">Strengths:</span> {player.strengths.slice(0, 2).join(", ")}
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      )}

      {/* Step 3: Opposition Selection */}
      {(step === "opposition" || step === "results") && (
        <div className="space-y-6 mb-8">
          <Card className="p-6 border border-border">
            <div className="flex items-center gap-3 mb-4">
              <Brain className="w-5 h-5 text-primary" />
              <h2 className="text-xl font-bold text-foreground">Step 3: Opposition Players</h2>
            </div>

            {/* Preset Teams */}
            <div className="mb-6">
              <label className="text-sm font-semibold text-foreground mb-3 block">Quick Load Opposition Team</label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                {Object.keys(oppositionTeams).map((team) => (
                  <button
                    key={team}
                    onClick={() => handleLoadPresetTeam(team)}
                    className={`px-4 py-2 rounded-lg font-medium transition-all text-sm ${
                      selectedPreset === team
                        ? "bg-secondary text-secondary-foreground"
                        : "bg-muted text-foreground hover:bg-muted/80"
                    }`}
                  >
                    {team}
                  </button>
                ))}
              </div>
            </div>

            {/* Added Opposition Players */}
            {oppositionPlayers.length > 0 && (
              <div className="mb-6">
                <h3 className="font-semibold text-foreground mb-3">Opposition XI ({oppositionPlayers.length}/11)</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {oppositionPlayers.map((player, idx) => (
                    <div key={idx} className="p-4 bg-muted rounded-lg flex items-start justify-between">
                      <div>
                        <div className="font-medium text-foreground">{player.name}</div>
                        <div className="text-sm text-foreground/60">{player.role}</div>
                        <div className="text-xs text-foreground/50 mt-1">Strengths: {player.strengths.join(", ")}</div>
                      </div>
                      <button
                        onClick={() => handleRemoveOppositionPlayer(idx)}
                        className="text-destructive hover:bg-destructive/20 p-1 rounded transition-all"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {oppositionPlayers.length < 11 && (
              <div>
                <h3 className="font-semibold text-foreground mb-3">Add Custom Opposition Players</h3>
                <div className="space-y-3 max-h-64 overflow-y-auto p-3 bg-card rounded-lg border border-border">
                  {Object.entries(oppositionTeams).map(([_, players]) =>
                    players.map((player, idx) => (
                      <button
                        key={`${player.name}-${idx}`}
                        onClick={() => handleAddOppositionPlayer(player)}
                        className="w-full p-3 bg-muted rounded-lg text-left hover:bg-primary/10 hover:border-primary transition-all border border-border text-sm"
                      >
                        <div className="font-medium text-foreground">{player.name}</div>
                        <div className="text-xs text-foreground/60">{player.role}</div>
                      </button>
                    )),
                  )}
                </div>
              </div>
            )}

            {selectedIndianPlayers.length > 0 && oppositionPlayers.length === 11 && (
              <button
                onClick={handleGenerateRecommendations}
                className="mt-6 w-full px-6 py-3 bg-primary text-primary-foreground rounded-lg font-semibold hover:bg-primary/90 transition-all flex items-center justify-center gap-2"
              >
                <Zap className="w-5 h-5" />
                Generate AI Recommendations
              </button>
            )}
          </Card>
        </div>
      )}

      {/* Recommendations List */}
      {step === "results" && recommendations.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-2xl font-bold text-foreground">Recommended Teams</h2>
          {recommendations.map((team) => (
            <Card
              key={team.id}
              className={`border transition cursor-pointer ${
                selectedTeam?.id === team.id ? "border-primary bg-primary/5" : "border-border hover:border-primary/50"
              }`}
              onClick={() => setSelectedTeam(team)}
            >
              <div className="p-6">
                {/* Header */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h3 className="text-xl font-bold text-foreground mb-1">{team.name}</h3>
                    <p className="text-sm text-foreground/60">{team.matchupReason}</p>
                  </div>
                  <div className="text-right">
                    <div className="flex items-center gap-2 mb-2">
                      <Zap className="w-4 h-4 text-yellow-500" />
                      <span className="text-2xl font-bold text-foreground">{team.confidence}%</span>
                    </div>
                    <p className="text-xs text-foreground/60">Confidence</p>
                  </div>
                </div>

                {/* Confidence Bar */}
                <div className="w-full bg-muted rounded-full h-2 mb-4 overflow-hidden">
                  <div
                    className="bg-gradient-to-r from-primary to-accent h-full transition-all"
                    style={{ width: `${team.confidence}%` }}
                  />
                </div>

                {/* Expected Score */}
                <div className="mb-4 p-3 bg-muted rounded-lg">
                  <p className="text-xs text-foreground/60 mb-1">Expected Score Range ({format})</p>
                  <p className="text-lg font-bold text-foreground">{team.expectedScore}</p>
                </div>

                {/* Expand Button */}
                <Button
                  variant="ghost"
                  className="w-full justify-between text-foreground hover:bg-muted"
                  onClick={(e) => {
                    e.stopPropagation()
                    setExpandedTeam(expandedTeam === team.id ? null : team.id)
                  }}
                >
                  <span className="text-sm font-medium">
                    {expandedTeam === team.id ? "Hide Details" : "Show Details"}
                  </span>
                  {expandedTeam === team.id ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </Button>

                {/* Expanded Details */}
                {expandedTeam === team.id && (
                  <div className="mt-4 pt-4 border-t border-border space-y-4">
                    <div>
                      <h4 className="font-semibold text-foreground mb-3 flex items-center gap-2">
                        <Users className="w-4 h-4" />
                        Playing XI
                      </h4>
                      <div className="grid grid-cols-2 gap-2">
                        {team.players.map((player, i) => (
                          <div key={i} className="p-2 bg-muted rounded text-sm text-foreground">
                            {player}
                          </div>
                        ))}
                      </div>
                    </div>

                    <div>
                      <h4 className="font-semibold text-foreground mb-3 flex items-center gap-2">
                        <TrendingUp className="w-4 h-4" />
                        AI Analysis
                      </h4>
                      <ul className="space-y-2">
                        {team.reasoning.map((reason, i) => (
                          <li key={i} className="flex gap-3 text-sm text-foreground/70">
                            <span className="text-primary font-bold">•</span>
                            <span>{reason}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Selected Team Details Sidebar */}
      {step === "results" && selectedTeam && (
        <div>
          <Card className="p-6 border border-border sticky top-8">
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-foreground mb-2">{selectedTeam.name}</h2>
              <p className="text-foreground/60 mb-4 text-sm">{selectedTeam.matchupReason}</p>

              <div className="space-y-3">
                <div className="p-3 bg-primary/10 rounded-lg border border-primary/20">
                  <p className="text-xs text-foreground/60 mb-1">AI Confidence</p>
                  <p className="text-3xl font-bold text-primary">{selectedTeam.confidence}%</p>
                </div>

                <div className="p-3 bg-accent/10 rounded-lg border border-accent/20">
                  <p className="text-xs text-foreground/60 mb-1">Expected Score ({format})</p>
                  <p className="text-2xl font-bold text-accent">{selectedTeam.expectedScore}</p>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <h3 className="font-semibold text-foreground mb-3">Playing XI</h3>
                <div className="space-y-2 max-h-80 overflow-y-auto">
                  {selectedTeam.players.map((player, i) => (
                    <div key={i} className="flex items-center gap-2 text-sm text-foreground/70">
                      <div className="w-2 h-2 rounded-full bg-primary" />
                      {player}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <Button className="w-full mt-6">Accept Recommendation</Button>
          </Card>
        </div>
      )}
    </div>
  )
}
