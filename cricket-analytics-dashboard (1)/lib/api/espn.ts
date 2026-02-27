// ESPN API Integration for comprehensive cricket data
// Source: ESPN Sports Data

export interface ESPNMatch {
  id: string
  name: string
  shortName: string
  status: 'pre' | 'in' | 'post' | 'postponed' | 'cancelled'
  date: string
  timeZone: string
  venue: {
    id: string
    fullName: string
    city: string
    country: string
  }
  competition: {
    id: string
    name: string
    format: string
  }
  competitors: Array<{
    id: string
    name: string
    abbreviation: string
    displayName: string
    logo?: string
    score?: number
    wickets?: number
    overs?: string
    isWinner?: boolean
  }>
}

export interface ESPNArticle {
  id: string
  headline: string
  description: string
  links: { web: { href: string } }[]
  pubDate: string
}

const ESPN_BASE_URL = 'https://site.api.espn.com'
const ESPNCRICINFO_URL = 'https://www.espncricinfo.com/api/v1/matches'

function parseCricInfoMatch(match: any): ESPNMatch {
  return {
    id: match.id || Math.random().toString(),
    name: `${match.teams?.[0]?.name} vs ${match.teams?.[1]?.name}`,
    shortName: `${match.teams?.[0]?.abbreviation} vs ${match.teams?.[1]?.abbreviation}`,
    status: mapMatchStatus(match.status),
    date: match.startDate || new Date().toISOString(),
    timeZone: 'UTC',
    venue: {
      id: '',
      fullName: match.ground?.name || 'Unknown Venue',
      city: match.ground?.city || '',
      country: match.ground?.country || ''
    },
    competition: {
      id: '',
      name: match.series?.name || 'International',
      format: match.format || 'ODI'
    },
    competitors: match.teams?.map((team: any) => ({
      id: team.id,
      name: team.name,
      abbreviation: team.abbreviation,
      displayName: team.name,
      logo: undefined,
      score: match.result?.winner?.id === team.id ? 1 : 0,
      wickets: undefined,
      overs: undefined,
      isWinner: match.result?.winner?.id === team.id
    })) || []
  }
}

function mapMatchStatus(status: string): 'pre' | 'in' | 'post' | 'postponed' | 'cancelled' {
  const statusLower = status?.toLowerCase() || ''
  if (statusLower.includes('live') || statusLower.includes('in progress')) return 'in'
  if (statusLower.includes('completed') || statusLower.includes('finished')) return 'post'
  if (statusLower.includes('postponed')) return 'postponed'
  if (statusLower.includes('cancelled')) return 'cancelled'
  return 'pre'
}

function getMockNews(): ESPNArticle[] {
  return [
    {
      id: '1',
      headline: 'India Cricket Updates',
      description: 'Latest news and updates from Indian cricket team',
      links: [{ web: { href: '#' } }],
      pubDate: new Date().toISOString()
    }
  ]
}

function getMockIndiaMatches(): ESPNMatch[] {
  return [
    {
      id: '1',
      name: 'India vs Australia',
      shortName: 'IND vs AUS',
      status: 'pre',
      date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      timeZone: 'UTC',
      venue: {
        id: '1',
        fullName: 'Melbourne Cricket Ground',
        city: 'Melbourne',
        country: 'Australia'
      },
      competition: {
        id: '1',
        name: 'ODI Series',
        format: 'ODI'
      },
      competitors: [
        {
          id: 'ind',
          name: 'India',
          abbreviation: 'IND',
          displayName: 'India',
          score: undefined,
          wickets: undefined,
          overs: undefined,
          isWinner: false
        },
        {
          id: 'aus',
          name: 'Australia',
          abbreviation: 'AUS',
          displayName: 'Australia',
          score: undefined,
          wickets: undefined,
          overs: undefined,
          isWinner: false
        }
      ]
    },
    {
      id: '2',
      name: 'India vs England',
      shortName: 'IND vs ENG',
      status: 'pre',
      date: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
      timeZone: 'UTC',
      venue: {
        id: '2',
        fullName: 'Lord\'s Cricket Ground',
        city: 'London',
        country: 'England'
      },
      competition: {
        id: '2',
        name: 'Test Series',
        format: 'Test'
      },
      competitors: [
        {
          id: 'ind',
          name: 'India',
          abbreviation: 'IND',
          displayName: 'India',
          score: undefined,
          wickets: undefined,
          overs: undefined,
          isWinner: false
        },
        {
          id: 'eng',
          name: 'England',
          abbreviation: 'ENG',
          displayName: 'England',
          score: undefined,
          wickets: undefined,
          overs: undefined,
          isWinner: false
        }
      ]
    }
  ]
}

export async function getESPNMatches(sport: string = 'cricket'): Promise<ESPNMatch[]> {
  try {
    // ESPN Cricinfo blocks automated requests - using mock data by default
    // In production, consider using a paid cricket API or running your own proxy
    console.log('[v0] Using mock cricket match data (ESPN API blocked by anti-scraping)')
    return getMockIndiaMatches()
  } catch (error) {
    console.error('[v0] Error fetching matches:', error)
    return getMockIndiaMatches()
  }
}

export async function getESPNCricketNews(): Promise<ESPNArticle[]> {
  try {
    // ESPN Cricinfo blocks automated requests - using mock data by default
    console.log('[v0] Using mock cricket news data (ESPN API blocked by anti-scraping)')
    return getMockNews()
  } catch (error) {
    console.error('[v0] Error fetching cricket news:', error)
    return getMockNews()
  }
}

export async function getESPNTeamStats(teamId: string): Promise<any> {
  try {
    return null
  } catch (error) {
    console.error('[v0] Error fetching team stats:', error)
    return null
  }
}

function getMatchStatus(status: string): string {
  const statusMap: { [key: string]: string } = {
    'pre': 'Upcoming',
    'in': 'Live',
    'post': 'Completed',
    'postponed': 'Postponed',
    'cancelled': 'Cancelled'
  }
  return statusMap[status] || 'Unknown'
}
