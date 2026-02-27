"use client"

import { useState } from "react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts"
import { Eye, TrendingUp, Shield, ChevronRight } from "lucide-react"

interface OppositionTeam {
  id: number
  name: string
  strength: number
  recentForm: string
  keyPlayers: string[]
  weaknesses: string[]
  strengths: string[]
  headToHead: { wins: number; losses: number; draws: number }
}

interface OppositionPlayer {
  id: number
  name: string
  team: string
  role: string
  avgScore: number
  strikeRate: number
  weakness: string
  strength: string
}

const oppositionTeams: OppositionTeam[] = [
  {
    id: 1,
    name: "Australia",
    strength: 82,
    recentForm: "Excellent",
    keyPlayers: ["Steve Smith", "David Warner", "Pat Cummins"],
    weaknesses: ["Spin bowling vulnerability", "Death bowling inconsistency"],
    strengths: ["Strong batting lineup", "Aggressive fielding", "Experienced bowlers"],
    headToHead: { wins: 12, losses: 8, draws: 2 },
  },
  {
    id: 2,
    name: "England",
    strength: 78,
    recentForm: "Good",
    keyPlayers: ["Joe Root", "Ben Stokes", "Jofra Archer"],
    weaknesses: ["Inconsistent middle order", "Pace bowling on flat pitches"],
    strengths: ["All-round batting depth", "Aggressive approach", "Quality fast bowlers"],
    headToHead: { wins: 10, losses: 9, draws: 1 },
  },
  {
    id: 3,
    name: "Pakistan",
    strength: 75,
    recentForm: "Average",
    keyPlayers: ["Babar Azam", "Shaheen Afridi", "Mohammad Rizwan"],
    weaknesses: ["Inconsistent batting form", "Death bowling issues"],
    strengths: ["Excellent pace attack", "Strong captaincy", "Fielding intensity"],
    headToHead: { wins: 15, losses: 6, draws: 3 },
  },
  {
    id: 4,
    name: "South Africa",
    strength: 80,
    recentForm: "Excellent",
    keyPlayers: ["Aiden Markram", "Kagiso Rabada", "Reeza Hendricks"],
    weaknesses: ["Pressure situations", "Middle order consistency"],
    strengths: ["Strong pace attack", "All-round depth", "Test cricket expertise"],
    headToHead: { wins: 9, losses: 7, draws: 1 },
  },
  {
    id: 5,
    name: "New Zealand",
    strength: 76,
    recentForm: "Good",
    keyPlayers: ["Kane Williamson", "Trent Boult", "Tim Southee"],
    weaknesses: ["Batting depth", "Spin bowling quality"],
    strengths: ["Consistent Test cricket", "Swing bowling expertise", "Team cohesion"],
    headToHead: { wins: 8, losses: 11, draws: 2 },
  },
  {
    id: 6,
    name: "Sri Lanka",
    strength: 72,
    recentForm: "Average",
    keyPlayers: ["Dhananjaya de Silva", "Wanindu Hasaranga", "Pathum Nissanka"],
    weaknesses: ["Inconsistency", "Death bowling"],
    strengths: ["Spin bowling variety", "Youth potential", "T20 expertise"],
    headToHead: { wins: 14, losses: 4, draws: 1 },
  },
  {
    id: 7,
    name: "West Indies",
    strength: 70,
    recentForm: "Average",
    keyPlayers: ["Jason Holder", "Kyle Mayers", "Nicholas Pooran"],
    weaknesses: ["Bowling consistency", "Middle order"],
    strengths: ["Power hitting", "Pace attack", "Experience"],
    headToHead: { wins: 11, losses: 3, draws: 1 },
  },
  {
    id: 8,
    name: "Bangladesh",
    strength: 68,
    recentForm: "Improving",
    keyPlayers: ["Mushfiqur Rahim", "Mehidy Hasan Miraz", "Taskin Ahmed"],
    weaknesses: ["Inconsistent batting", "Pace bowling"],
    strengths: ["Team spirit", "Developing talent", "Spin options"],
    headToHead: { wins: 7, losses: 2, draws: 0 },
  },
]

const oppositionPlayers: OppositionPlayer[] = [
  // Australia
  { id: 1, name: "Steve Smith", team: "Australia", role: "Batter", avgScore: 52.3, strikeRate: 92.1, weakness: "Short ball outside off stump", strength: "Exceptional technique against spin" },
  { id: 2, name: "Pat Cummins", team: "Australia", role: "Bowler", avgScore: 0, strikeRate: 0, weakness: "Struggles on slow pitches", strength: "Excellent yorker at death" },
  { id: 3, name: "David Warner", team: "Australia", role: "Batter", avgScore: 48.5, strikeRate: 95.2, weakness: "Yorkers early in innings", strength: "Aggressive batting in powerplay" },
  
  // England
  { id: 4, name: "Joe Root", team: "England", role: "Batter", avgScore: 48.7, strikeRate: 89.5, weakness: "Aggressive short ball tactics", strength: "Versatile against all bowling types" },
  { id: 5, name: "Ben Stokes", team: "England", role: "All-rounder", avgScore: 44.2, strikeRate: 91.8, weakness: "Pace bowling at death", strength: "Aggressive counter-attacking play" },
  { id: 6, name: "Jofra Archer", team: "England", role: "Bowler", avgScore: 0, strikeRate: 0, weakness: "Control on flat pitches", strength: "Pace and yorkers at death" },
  
  // Pakistan
  { id: 7, name: "Babar Azam", team: "Pakistan", role: "Batter", avgScore: 50.2, strikeRate: 88.3, weakness: "Slower deliveries in death overs", strength: "Consistent scoring in powerplay" },
  { id: 8, name: "Shaheen Afridi", team: "Pakistan", role: "Bowler", avgScore: 0, strikeRate: 0, weakness: "Limited death bowling", strength: "Excellent new ball bowling" },
  { id: 9, name: "Mohammad Rizwan", team: "Pakistan", role: "Batter", avgScore: 46.8, strikeRate: 90.2, weakness: "Against short pitch strategy", strength: "Patient accumulation" },
  
  // South Africa
  { id: 10, name: "Aiden Markram", team: "South Africa", role: "Batter", avgScore: 49.5, strikeRate: 87.3, weakness: "Pace bowling on bouncy pitches", strength: "Technical batting against spin" },
  { id: 11, name: "Kagiso Rabada", team: "South Africa", role: "Bowler", avgScore: 0, strikeRate: 0, weakness: "Slow pitches and flat tracks", strength: "Pace and aggression at death" },
  { id: 12, name: "Reeza Hendricks", team: "South Africa", role: "Batter", avgScore: 47.3, strikeRate: 88.6, weakness: "Spin bowling", strength: "Opening partnership establishment" },
  
  // New Zealand
  { id: 13, name: "Kane Williamson", team: "New Zealand", role: "Batter", avgScore: 51.2, strikeRate: 85.4, weakness: "Aggressive short ball tactics", strength: "Technical excellence in all conditions" },
  { id: 14, name: "Trent Boult", team: "New Zealand", role: "Bowler", avgScore: 0, strikeRate: 0, weakness: "Flat pitches", strength: "Swing and new ball expertise" },
  { id: 15, name: "Ross Taylor", team: "New Zealand", role: "Batter", avgScore: 45.8, strikeRate: 83.2, weakness: "Pace bowling", strength: "Experience and composure" },
  
  // Sri Lanka
  { id: 16, name: "Dhananjaya de Silva", team: "Sri Lanka", role: "Batter", avgScore: 43.2, strikeRate: 80.5, weakness: "Pace on bouncy pitches", strength: "Test cricket technique" },
  { id: 17, name: "Wanindu Hasaranga", team: "Sri Lanka", role: "All-rounder", avgScore: 38.5, strikeRate: 125.3, weakness: "Pace bowling", strength: "Leg-spin variations" },
  { id: 18, name: "Pathum Nissanka", team: "Sri Lanka", role: "Batter", avgScore: 42.1, strikeRate: 82.3, weakness: "Short ball tactics", strength: "Opening consistency" },
  
  // West Indies
  { id: 19, name: "Jason Holder", team: "West Indies", role: "All-rounder", avgScore: 35.2, strikeRate: 78.5, weakness: "Spin bowling", strength: "Experience and leadership" },
  { id: 20, name: "Nicholas Pooran", team: "West Indies", role: "Batter", avgScore: 41.3, strikeRate: 132.4, weakness: "Pace bowling", strength: "Power hitting and aggression" },
  { id: 21, name: "Kyle Mayers", team: "West Indies", role: "Batter", avgScore: 39.8, strikeRate: 89.2, weakness: "Short ball", strength: "All-format potential" },
  
  // Bangladesh  
  { id: 22, name: "Mushfiqur Rahim", team: "Bangladesh", role: "Batter", avgScore: 38.5, strikeRate: 82.1, weakness: "Pace bowling", strength: "Experience and technique" },
  { id: 23, name: "Mehidy Hasan Miraz", team: "Bangladesh", role: "All-rounder", avgScore: 32.4, strikeRate: 75.2, weakness: "Pace", strength: "Off-spin bowling" },
  { id: 24, name: "Taskin Ahmed", team: "Bangladesh", role: "Bowler", avgScore: 0, strikeRate: 0, weakness: "Control on flat pitches", strength: "Pace and bounce" },
]

const teamStrengthData = [
  { category: "Batting", Australia: 85, England: 82, Pakistan: 78 },
  { category: "Bowling", Australia: 88, England: 80, Pakistan: 85 },
  { category: "Fielding", Australia: 82, England: 78, Pakistan: 75 },
  { category: "Experience", Australia: 80, England: 85, Pakistan: 82 },
  { category: "Form", Australia: 84, England: 76, Pakistan: 70 },
]

const matchupData = [
  { team: "Australia", wins: 12, losses: 8 },
  { team: "England", wins: 10, losses: 9 },
  { team: "Pakistan", wins: 15, losses: 6 },
]

const radarData = [
  { category: "Batting", value: 85 },
  { category: "Bowling", value: 88 },
  { category: "Fielding", value: 82 },
  { category: "Experience", value: 80 },
  { category: "Form", value: 84 },
]

export default function OppositionPage() {
  const [selectedTeam, setSelectedTeam] = useState<OppositionTeam | null>(oppositionTeams[0])
  const [selectedPlayer, setSelectedPlayer] = useState<OppositionPlayer | null>(oppositionPlayers[0])

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <Eye className="w-8 h-8 text-primary" />
          <h1 className="text-3xl font-bold text-foreground">Opposition Analysis</h1>
        </div>
        <p className="text-foreground/60">Detailed analysis of opposition teams and key players</p>
      </div>

      {/* Opposition Teams */}
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-foreground mb-4">Opposition Teams (8 Teams)</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
          {oppositionTeams.map((team) => (
            <Card
              key={team.id}
              className={`p-6 border cursor-pointer transition ${
                selectedTeam?.id === team.id ? "border-primary bg-primary/5" : "border-border hover:border-primary/50"
              }`}
              onClick={() => {
                setSelectedTeam(team)
                // Set selected player to first player of this team
                const firstPlayerOfTeam = oppositionPlayers.find((p) => p.team === team.name)
                setSelectedPlayer(firstPlayerOfTeam || null)
              }}
            >
              <div className="mb-4">
                <h3 className="text-xl font-bold text-foreground mb-2">{team.name}</h3>
                <p
                  className={`text-sm font-medium ${
                    team.recentForm === "Excellent"
                      ? "text-green-600 dark:text-green-400"
                      : team.recentForm === "Good"
                        ? "text-blue-600 dark:text-blue-400"
                        : "text-yellow-600 dark:text-yellow-400"
                  }`}
                >
                  {team.recentForm} Form
                </p>
              </div>

              <div className="mb-4">
                <p className="text-xs text-foreground/60 mb-2">Overall Strength</p>
                <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
                  <div
                    className="bg-gradient-to-r from-primary to-accent h-full"
                    style={{ width: `${team.strength}%` }}
                  />
                </div>
                <p className="text-sm font-bold text-foreground mt-1">{team.strength}%</p>
              </div>

              <div className="space-y-2">
                <p className="text-xs font-semibold text-foreground">Key Players</p>
                {team.keyPlayers.map((player, i) => (
                  <p key={i} className="text-xs text-foreground/60">
                    • {player}
                  </p>
                ))}
              </div>
            </Card>
          ))}
        </div>
      </div>

      {/* Team Details */}
      {selectedTeam && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* Strengths and Weaknesses */}
          <div className="lg:col-span-2 space-y-6">
            <Card className="p-6 border border-border">
              <h3 className="text-lg font-bold text-foreground mb-4 flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-green-500" />
                Strengths
              </h3>
              <div className="space-y-3">
                {selectedTeam.strengths.map((strength, i) => (
                  <div key={i} className="flex gap-3 p-3 bg-green-500/10 rounded-lg border border-green-500/20">
                    <div className="w-2 h-2 rounded-full bg-green-500 mt-1 flex-shrink-0" />
                    <p className="text-sm text-foreground">{strength}</p>
                  </div>
                ))}
              </div>
            </Card>

            <Card className="p-6 border border-border">
              <h3 className="text-lg font-bold text-foreground mb-4 flex items-center gap-2">
                <Shield className="w-5 h-5 text-red-500" />
                Weaknesses
              </h3>
              <div className="space-y-3">
                {selectedTeam.weaknesses.map((weakness, i) => (
                  <div key={i} className="flex gap-3 p-3 bg-red-500/10 rounded-lg border border-red-500/20">
                    <div className="w-2 h-2 rounded-full bg-red-500 mt-1 flex-shrink-0" />
                    <p className="text-sm text-foreground">{weakness}</p>
                  </div>
                ))}
              </div>
            </Card>
          </div>

          {/* Head to Head */}
          <Card className="p-6 border border-border sticky top-8">
            <h3 className="text-lg font-bold text-foreground mb-4">Head to Head</h3>
            <div className="space-y-4">
              <div className="p-3 bg-green-500/10 rounded-lg border border-green-500/20">
                <p className="text-xs text-foreground/60 mb-1">Wins</p>
                <p className="text-3xl font-bold text-green-600 dark:text-green-400">{selectedTeam.headToHead.wins}</p>
              </div>
              <div className="p-3 bg-red-500/10 rounded-lg border border-red-500/20">
                <p className="text-xs text-foreground/60 mb-1">Losses</p>
                <p className="text-3xl font-bold text-red-600 dark:text-red-400">{selectedTeam.headToHead.losses}</p>
              </div>
              <div className="p-3 bg-yellow-500/10 rounded-lg border border-yellow-500/20">
                <p className="text-xs text-foreground/60 mb-1">Draws</p>
                <p className="text-3xl font-bold text-yellow-600 dark:text-yellow-400">
                  {selectedTeam.headToHead.draws}
                </p>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Opposition Players */}
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-foreground mb-4">
          Key Opposition Players {selectedTeam && `(${selectedTeam.name})`}
        </h2>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Players List */}
          <div className="lg:col-span-2 space-y-3">
            {selectedTeam
              ? oppositionPlayers
                  .filter((player) => player.team === selectedTeam.name)
                  .map((player) => (
                    <Card
                      key={player.id}
                      className={`p-4 border cursor-pointer transition ${
                        selectedPlayer?.id === player.id
                          ? "border-primary bg-primary/5"
                          : "border-border hover:border-primary/50"
                      }`}
                      onClick={() => setSelectedPlayer(player)}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h3 className="font-semibold text-foreground">{player.name}</h3>
                          <p className="text-sm text-foreground/60">
                            {player.team} • {player.role}
                          </p>
                        </div>
                        <ChevronRight className="w-5 h-5 text-foreground/40" />
                      </div>
                    </Card>
                  ))
              : null}
          </div>

          {/* Player Details */}
          {selectedPlayer && (
            <Card className="p-6 border border-border sticky top-8">
              <h3 className="text-xl font-bold text-foreground mb-4">{selectedPlayer.name}</h3>

              <div className="space-y-4">
                <div className="p-3 bg-muted rounded-lg">
                  <p className="text-xs text-foreground/60 mb-1">Team</p>
                  <p className="font-semibold text-foreground">{selectedPlayer.team}</p>
                </div>

                <div className="p-3 bg-muted rounded-lg">
                  <p className="text-xs text-foreground/60 mb-1">Role</p>
                  <p className="font-semibold text-foreground">{selectedPlayer.role}</p>
                </div>

                {selectedPlayer.role === "Batter" && (
                  <>
                    <div className="p-3 bg-primary/10 rounded-lg border border-primary/20">
                      <p className="text-xs text-foreground/60 mb-1">Average Score</p>
                      <p className="text-2xl font-bold text-primary">{selectedPlayer.avgScore}</p>
                    </div>

                    <div className="p-3 bg-accent/10 rounded-lg border border-accent/20">
                      <p className="text-xs text-foreground/60 mb-1">Strike Rate</p>
                      <p className="text-2xl font-bold text-accent">{selectedPlayer.strikeRate}</p>
                    </div>
                  </>
                )}

                <div className="p-3 bg-green-500/10 rounded-lg border border-green-500/20">
                  <p className="text-xs text-foreground/60 mb-1">Strength</p>
                  <p className="text-sm text-foreground">{selectedPlayer.strength}</p>
                </div>

                <div className="p-3 bg-red-500/10 rounded-lg border border-red-500/20">
                  <p className="text-xs text-foreground/60 mb-1">Weakness</p>
                  <p className="text-sm text-foreground">{selectedPlayer.weakness}</p>
                </div>
              </div>

              <Button className="w-full mt-6">View Detailed Profile</Button>
            </Card>
          )}
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Team Strength Comparison */}
        <Card className="p-6 border border-border">
          <h3 className="text-lg font-bold text-foreground mb-4">Team Strength Comparison</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={teamStrengthData}>
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
              <Bar dataKey="Australia" fill="var(--color-primary)" />
              <Bar dataKey="England" fill="var(--color-accent)" />
              <Bar dataKey="Pakistan" fill="var(--color-secondary)" />
            </BarChart>
          </ResponsiveContainer>
        </Card>

        {/* Head to Head Record */}
        <Card className="p-6 border border-border">
          <h3 className="text-lg font-bold text-foreground mb-4">Head to Head Record</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={matchupData}>
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
              <Bar dataKey="wins" fill="var(--color-chart-1)" />
              <Bar dataKey="losses" fill="var(--color-chart-2)" />
            </BarChart>
          </ResponsiveContainer>
        </Card>
      </div>
    </div>
  )
}
