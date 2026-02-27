/**
 * Normalizes match data from different API sources into a consistent format
 */
export function normalizeMatch(m: any): any {
  // Handle ESPN format
  if (m.competitors || m.name) {
    const competitors = m.competitors || []
    return {
      id: m.id,
      title: m.name || m.shortName || 'Cricket Match',
      status: m.status || 'pre',
      date: m.date,
      venue: m.venue?.fullName || m.venue || '',
      format: m.format || m.competition?.format || 'Unknown',
      team1: {
        name: competitors[0]?.displayName || competitors[0]?.name || 'Team 1',
        runs: competitors[0]?.score,
        wickets: competitors[0]?.wickets,
        overs: competitors[0]?.overs
      },
      team2: {
        name: competitors[1]?.displayName || competitors[1]?.name || 'Team 2',
        runs: competitors[1]?.score,
        wickets: competitors[1]?.wickets,
        overs: competitors[1]?.overs
      }
    }
  }

  // Handle CricSheet format
  if (m.teams) {
    return {
      id: m.id,
      title: m.name || `${m.teams[0]} vs ${m.teams[1]}`,
      status: m.status || 'upcoming',
      date: m.startDate,
      venue: m.venue || '',
      format: m.format || 'Unknown',
      team1: {
        name: m.teams[0] || 'Team 1',
        runs: undefined,
        wickets: undefined,
        overs: undefined
      },
      team2: {
        name: m.teams[1] || 'Team 2',
        runs: undefined,
        wickets: undefined,
        overs: undefined
      }
    }
  }

  // Already in correct format
  return m
}
