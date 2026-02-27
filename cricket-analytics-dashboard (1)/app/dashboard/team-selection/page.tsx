"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Zap, Save } from "lucide-react"

const recommendedTeam = [
  { name: "Rohit Sharma", role: "Batsman", confidence: 95, reason: "Excellent form, strong against pace" },
  { name: "Virat Kohli", role: "Batsman", confidence: 92, reason: "Consistent performer, key player" },
  { name: "Shubman Gill", role: "Batsman", confidence: 88, reason: "Rising form, good against spinners" },
  { name: "Hardik Pandya", role: "All-rounder", confidence: 90, reason: "Balanced skills, match winner" },
  { name: "Ravichandran Ashwin", role: "All-rounder", confidence: 87, reason: "Experience, pitch conditions favor" },
  { name: "Jasprit Bumrah", role: "Bowler", confidence: 96, reason: "Best bowler, death overs specialist" },
  { name: "Mohammed Shami", role: "Bowler", confidence: 85, reason: "Swing conditions expected" },
  { name: "Kuldeep Yadav", role: "Bowler", confidence: 83, reason: "Wrist spinner, good against left-handers" },
  { name: "Rishabh Pant", role: "Wicket-keeper", confidence: 91, reason: "Aggressive batting, reliable keeper" },
  { name: "KL Rahul", role: "Batsman", confidence: 86, reason: "Backup opener, solid technique" },
  { name: "Suryakumar Yadav", role: "Batsman", confidence: 84, reason: "Middle order stability" },
]

export default function TeamSelectionPage() {
  const [matchFormat, setMatchFormat] = useState("ODI")
  const [venue, setVenue] = useState("")
  const [opposition, setOpposition] = useState("")
  const [pitchCondition, setPitchCondition] = useState("balanced")

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground">AI Team Recommendation</h1>
        <p className="text-foreground/60 mt-1">Generate optimal XI based on match conditions and opposition</p>
      </div>

      {/* Input Section */}
      <Card className="border-border">
        <CardHeader>
          <CardTitle>Match Parameters</CardTitle>
          <CardDescription>Configure match details for AI analysis</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Match Format</label>
              <select
                value={matchFormat}
                onChange={(e) => setMatchFormat(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-input border border-border text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option>Test</option>
                <option>ODI</option>
                <option>T20</option>
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Venue</label>
              <Input
                placeholder="e.g., MCG, Lords"
                value={venue}
                onChange={(e) => setVenue(e.target.value)}
                className="bg-input border-border"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Opposition</label>
              <Input
                placeholder="e.g., Australia, England"
                value={opposition}
                onChange={(e) => setOpposition(e.target.value)}
                className="bg-input border-border"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Pitch Condition</label>
              <select
                value={pitchCondition}
                onChange={(e) => setPitchCondition(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-input border border-border text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="balanced">Balanced</option>
                <option value="batting">Batting Friendly</option>
                <option value="bowling">Bowling Friendly</option>
                <option value="spin">Spin Friendly</option>
              </select>
            </div>
          </div>
          <Button className="mt-6 gap-2 w-full md:w-auto">
            <Zap className="w-4 h-4" />
            Generate Optimal XI
          </Button>
        </CardContent>
      </Card>

      {/* Recommended Team */}
      <Card className="border-border">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Recommended XI</CardTitle>
            <CardDescription>AI-powered team selection with confidence scores</CardDescription>
          </div>
          <Button className="gap-2">
            <Save className="w-4 h-4" />
            Save Team
          </Button>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {recommendedTeam.map((player, i) => (
              <div
                key={i}
                className="flex items-center justify-between p-4 rounded-lg border border-border hover:border-primary/50 transition"
              >
                <div className="flex-1">
                  <p className="font-semibold text-foreground">{player.name}</p>
                  <p className="text-sm text-foreground/60">{player.role}</p>
                  <p className="text-xs text-foreground/50 mt-1">{player.reason}</p>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-primary">{player.confidence}%</div>
                  <p className="text-xs text-foreground/60">Confidence</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
