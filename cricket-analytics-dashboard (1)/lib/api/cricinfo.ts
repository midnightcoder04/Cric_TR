// CricInfo API Integration for live cricket scores and data
// Source: ESPN CricInfo

export interface CricInfoMatch {
  id: string
  title: string
  status: string
  format: 'Test' | 'ODI' | 'T20' | 'Other'
  startDate: string
  venue: string
  team1: {
    name: string
    runs?: number
    wickets?: number
    overs?: string
  }
  team2: {
    name: string
    runs?: number
    wickets?: number
    overs?: string
  }
  result?: string
}

export interface CricInfoPlayer {
  id: string
  name: string
  country: string
  role: 'Batsman' | 'Bowler' | 'All-rounder' | 'Wicket-keeper'
  career: {
    format: string
    matches: number
    runs: number
    average: number
    strikeRate: number
  }[]
}

const CRICINFO_BASE_URL = 'https://www.espncricinfo.com'

// Using web scraping or unofficial API approach
export async function getLiveMatchesFromCricInfo(): Promise<CricInfoMatch[]> {
  try {
    // Note: CricInfo doesn't have a public API, but we can use web scraping
    // For this demo, returning mock data structure
    const response = await fetch('/api/cricinfo-proxy')
    
    if (!response.ok) {
      console.error('[v0] CricInfo Proxy Error:', response.statusText)
      return []
    }
    
    const matches: CricInfoMatch[] = await response.json()
    
    // Filter for India matches
    return matches.filter(match => 
      match.team1.name.includes('India') || match.team2.name.includes('India')
    )
  } catch (error) {
    console.error('[v0] Error fetching from CricInfo:', error)
    return []
  }
}

export async function getPlayerFromCricInfo(playerId: string): Promise<CricInfoPlayer | null> {
  try {
    const response = await fetch(`/api/cricinfo-player/${playerId}`)
    
    if (!response.ok) return null
    
    return await response.json()
  } catch (error) {
    console.error('[v0] Error fetching player data from CricInfo:', error)
    return null
  }
}

export async function getMatchScorecard(matchId: string): Promise<any> {
  try {
    const response = await fetch(`/api/cricinfo-scorecard/${matchId}`)
    
    if (!response.ok) return null
    
    return await response.json()
  } catch (error) {
    console.error('[v0] Error fetching scorecard:', error)
    return null
  }
}

export function formatCricInfoScore(team: any): string {
  if (team.runs !== undefined && team.wickets !== undefined && team.overs) {
    return `${team.runs}/${team.wickets} (${team.overs})`
  }
  return '-'
}
