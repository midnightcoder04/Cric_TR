import { getESPNMatches, getESPNCricketNews } from '@/lib/api/espn'
import { getMatchesFromCricSheet } from '@/lib/api/cricsheet'
import { normalizeMatch } from '@/lib/utils/normalizeMatch'

// Mock India matches for fallback
const mockIndiaMatches = [
  {
    id: 'mock1',
    title: 'India vs Australia',
    status: 'upcoming',
    date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    team1: { name: 'India', runs: undefined, wickets: undefined, overs: undefined },
    team2: { name: 'Australia', runs: undefined, wickets: undefined, overs: undefined },
    venue: 'Melbourne Cricket Ground',
    format: 'ODI'
  },
  {
    id: 'mock2',
    title: 'India vs Pakistan',
    status: 'upcoming',
    date: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(),
    team1: { name: 'India', runs: undefined, wickets: undefined, overs: undefined },
    team2: { name: 'Pakistan', runs: undefined, wickets: undefined, overs: undefined },
    venue: 'Eden Gardens',
    format: 'T20'
  },
  {
    id: 'mock3',
    title: 'India vs England',
    status: 'upcoming',
    date: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
    team1: { name: 'India', runs: undefined, wickets: undefined, overs: undefined },
    team2: { name: 'England', runs: undefined, wickets: undefined, overs: undefined },
    venue: 'Lord\'s',
    format: 'Test'
  }
]

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const source = searchParams.get('source') || 'all'
    const format = searchParams.get('format') || ''

    let matches = []

    // Fetch from multiple sources with error handling
    if (source === 'all' || source === 'espn') {
      try {
        const espnMatches = await Promise.race([
          getESPNMatches('cricket'),
          new Promise((_, reject) =>
            setTimeout(() => reject(new Error('ESPN timeout')), 5000)
          )
        ]) as any[]
        matches.push(...espnMatches.filter(m => m))
      } catch (err) {
        console.error('[v0] ESPN fetch failed, using fallback:', err)
      }
    }

    if (source === 'all' || source === 'cricsheet') {
      try {
        const cricsheetMatches = await Promise.race([
          getMatchesFromCricSheet(format),
          new Promise((_, reject) =>
            setTimeout(() => reject(new Error('CricSheet timeout')), 5000)
          )
        ]) as any[]
        matches.push(...cricsheetMatches.filter(m => m))
      } catch (err) {
        console.error('[v0] CricSheet fetch failed, using fallback:', err)
      }
    }

    // Transform matches to correct format
    const transformedMatches = matches.map(m => normalizeMatch(m)).filter(m => m && m.team1 && m.team2)

    // If no matches found, use mock data
    if (transformedMatches.length === 0) {
      console.log('[v0] Using mock data for live updates')
      return Response.json({
        success: true,
        data: mockIndiaMatches,
        timestamp: new Date().toISOString(),
        source: 'mock',
        usingMockData: true
      })
    }

    let finalMatches = transformedMatches

    // Filter by format if specified
    if (format) {
      finalMatches = finalMatches.filter(m => {
        const matchFormat = m.format || 'Unknown'
        return matchFormat.toLowerCase() === format.toLowerCase()
      })
    }

    // Remove duplicates
    const uniqueMatches = Array.from(
      new Map(finalMatches.map(m => [m.id, m])).values()
    )

    return Response.json({
      success: true,
      data: uniqueMatches,
      timestamp: new Date().toISOString(),
      source,
      usingMockData: matches.every(m => m.id?.startsWith('mock'))
    })
  } catch (error) {
    console.error('[v0] Error in live updates route:', error)
    // Return mock data on error instead of failure
    return Response.json({
      success: true,
      data: mockIndiaMatches,
      timestamp: new Date().toISOString(),
      source: 'mock',
      usingMockData: true
    })
  }
}
