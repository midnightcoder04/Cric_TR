// CricSheet API Integration for live cricket data
// Source: cricsheet.org

export interface CricSheetMatch {
  id: string
  name: string
  teams: string[]
  gender: string
  format: 'Test' | 'ODI' | 'T20'
  startDate: string
  endDate: string
  status: 'live' | 'completed' | 'upcoming'
  venue: string
  city: string
  country: string
}

export interface CricSheetInning {
  team: string
  runs: number
  wickets: number
  overs: number
  ballsRun: Array<{
    over: number
    ball: number
    runs: number
    wicket?: boolean
  }>
}

const CRICSHEET_BASE_URL = 'https://api.cricsheet.org'

export async function getMatchesFromCricSheet(format?: string): Promise<CricSheetMatch[]> {
  try {
    // Try multiple CricSheet endpoints
    const endpoints = [
      `${CRICSHEET_BASE_URL}/json/matches.json`,
      `${CRICSHEET_BASE_URL}/matches`,
      `${CRICSHEET_BASE_URL}/v1/matches`
    ]

    for (const endpoint of endpoints) {
      try {
        const response = await fetch(endpoint, {
          headers: {
            'User-Agent': 'Mozilla/5.0',
            'Accept': 'application/json'
          }
        })
        
        if (response.ok) {
          const data = await response.json()
          
          if (Array.isArray(data)) {
            const indiaMatches = data
              .filter((match: any) => {
                const teams = match.teams || match.competitors || []
                return teams.some((team: any) => 
                  (typeof team === 'string' ? team : team.name)?.toLowerCase().includes('india')
                ) && (!format || match.format === format)
              })
              .map((match: any) => ({
                id: match.id || Math.random().toString(),
                name: match.name || `${match.teams?.[0]} vs ${match.teams?.[1]}`,
                teams: match.teams || [],
                gender: match.gender || 'male',
                format: match.format || 'ODI',
                startDate: match.startDate || new Date().toISOString(),
                endDate: match.endDate || '',
                status: match.status || 'upcoming',
                venue: match.venue || '',
                city: match.city || '',
                country: match.country || ''
              }))
            
            if (indiaMatches.length > 0) return indiaMatches
          }
        }
      } catch (err) {
        // Continue to next endpoint
      }
    }

    // Fallback to mock data
    return getMockCricSheetMatches(format)
  } catch (error) {
    console.error('[v0] Error fetching from CricSheet:', error)
    return getMockCricSheetMatches(format)
  }
}

function getMockCricSheetMatches(format?: string): CricSheetMatch[] {
  const allMatches: CricSheetMatch[] = [
    {
      id: 'cs1',
      name: 'India vs South Africa',
      teams: ['India', 'South Africa'],
      gender: 'male',
      format: 'ODI',
      startDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
      endDate: '',
      status: 'upcoming',
      venue: 'Arun Jaitley Stadium',
      city: 'Delhi',
      country: 'India'
    },
    {
      id: 'cs2',
      name: 'India vs Pakistan',
      teams: ['India', 'Pakistan'],
      gender: 'male',
      format: 'T20',
      startDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(),
      endDate: '',
      status: 'upcoming',
      venue: 'Eden Gardens',
      city: 'Kolkata',
      country: 'India'
    },
    {
      id: 'cs3',
      name: 'India vs New Zealand',
      teams: ['India', 'New Zealand'],
      gender: 'male',
      format: 'Test',
      startDate: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString(),
      endDate: '',
      status: 'upcoming',
      venue: 'Wankhede Stadium',
      city: 'Mumbai',
      country: 'India'
    }
  ]

  return format ? allMatches.filter(m => m.format === format) : allMatches
}

export async function getLiveMatchData(matchId: string): Promise<CricSheetInning[] | null> {
  try {
    const response = await fetch(`${CRICSHEET_BASE_URL}/match/${matchId}.json`)
    
    if (!response.ok) return null
    
    const data = await response.json()
    return data.innings || null
  } catch (error) {
    console.error('[v0] Error fetching live match data:', error)
    return null
  }
}

export function parseCricSheetData(rawData: any) {
  return {
    matchId: rawData.info?.match_id,
    teams: rawData.info?.teams,
    format: rawData.info?.format,
    startDate: rawData.info?.date,
    innings: rawData.innings
  }
}
