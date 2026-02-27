import type { Player, OppositionPlayer, Format } from "@/lib/cricket-data"
import { indiaSquad } from "@/lib/cricket-data"

export interface PlayerMatchScore {
  player: Player
  overallScore: number
  strengthMatch: number
  weaknessAvoidance: number
  formScore: number
  formatScore: number
}

export function calculatePlayerMatchScore(
  player: Player,
  oppositionPlayers: OppositionPlayer[],
  format: Format,
): PlayerMatchScore {
  let overallScore = 0
  let strengthMatch = 0
  let weaknessAvoidance = 0

  player.strengths.forEach((strength) => {
    const matchCount = oppositionPlayers.filter((opp) => opp.weaknesses.includes(strength)).length
    strengthMatch += matchCount * 25 // 25 points per match
    overallScore += matchCount * 25
  })

  player.weaknesses.forEach((weakness) => {
    const matchCount = oppositionPlayers.filter((opp) => opp.strengths.includes(weakness)).length
    weaknessAvoidance -= matchCount * 15 // Penalize if opposition is strong in our weakness
    overallScore -= matchCount * 15
  })

  const formScore = player.form === "Excellent" ? 20 : player.form === "Good" ? 10 : 0
  overallScore += formScore

  const stats = player.stats[format]
  const formatScore = (stats.runs + stats.wickets) / 10
  overallScore += Math.min(formatScore, 30)

  return {
    player,
    overallScore: Math.max(0, overallScore),
    strengthMatch,
    weaknessAvoidance,
    formScore,
    formatScore: Math.min(formatScore, 30),
  }
}

export function buildOptimalTeam(
  oppositionPlayers: OppositionPlayer[],
  format: Format,
): { batting: Player[]; bowling: Player[]; allrounders: Player[] } {
  const matchScores = indiaSquad.map((player) => calculatePlayerMatchScore(player, oppositionPlayers, format))

  const sortedByScore = matchScores.sort((a, b) => b.overallScore - a.overallScore)

  const batting = sortedByScore
    .filter(
      (p) => (p.player.role === "Batsman" || p.player.role === "Wicket-keeper") && p.player.stats[format].runs > 0,
    )
    .slice(0, 5)
    .map((p) => p.player)

  const allrounders = sortedByScore
    .filter((p) => p.player.role === "All-rounder")
    .slice(0, 2)
    .map((p) => p.player)

  const bowling = sortedByScore
    .filter(
      (p) => (p.player.role === "Bowler" || p.player.role === "All-rounder") && p.player.stats[format].wickets > 0,
    )
    .slice(0, 4)
    .map((p) => p.player)

  return { batting, bowling, allrounders }
}

export function getPlayerDetailedAnalysis(
  player: Player,
  oppositionPlayers: OppositionPlayer[],
  format: Format,
): { strengths: string[]; risks: string[] } {
  const oppositionWeaknesses = oppositionPlayers.flatMap((p) => p.weaknesses)
  const oppositionStrengths = oppositionPlayers.flatMap((p) => p.strengths)

  const strengths = player.strengths.filter((s) => oppositionWeaknesses.includes(s))
  const risks = player.weaknesses.filter((w) => oppositionStrengths.includes(w))

  return { strengths, risks }
}
