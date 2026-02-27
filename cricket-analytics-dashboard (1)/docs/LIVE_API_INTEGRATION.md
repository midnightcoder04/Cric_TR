# Live Cricket Data Integration

This document describes the live data integration setup for CricketAI with CricSheet, CricInfo, and ESPN APIs.

## Data Sources

### 1. **CricSheet** (cricsheet.org)
- **Purpose**: Comprehensive cricket match data and historical statistics
- **Endpoint**: `https://api.cricsheet.org`
- **Data Provided**:
  - Match details (venues, teams, formats)
  - Ball-by-ball data
  - Player performances
  - Historical statistics
- **Update Frequency**: Real-time during matches
- **Usage**: `lib/api/cricsheet.ts`

### 2. **ESPN CricInfo** (espncricinfo.com)
- **Purpose**: Live scores and comprehensive cricket coverage
- **Method**: Web scraping or API proxy (as ESPN doesn't have public API)
- **Data Provided**:
  - Live match scores
  - Player profiles and statistics
  - Match commentary
  - News and articles
- **Update Frequency**: Real-time (every 5-10 seconds during matches)
- **Usage**: `lib/api/cricinfo.ts`
- **Route**: `/api/cricinfo-proxy`

### 3. **ESPN Sports API** (site.api.espn.com)
- **Purpose**: General sports data including cricket
- **Endpoint**: `https://site.api.espn.com/site/api/site/v2/sports/cricket`
- **Data Provided**:
  - Match schedules and results
  - Team statistics
  - Competition information
  - News feeds
- **Update Frequency**: Every 5 minutes (cached)
- **Usage**: `lib/api/espn.ts`

## Real-time Features

### Live Match Updates
- Dashboard displays live matches from all sources
- Auto-refresh every 30 seconds
- Manual refresh button available
- Live indicator badge for ongoing matches

### Live Scoreboard Component
```tsx
import { LiveScoreboard } from '@/components/live-scoreboard'

export default function Page() {
  return <LiveScoreboard />
}
```

### Using Live Data Hooks
```tsx
import { useLiveMatches } from '@/hooks/use-live-matches'

export default function Component() {
  const { matches, loading, lastUpdated, refreshMatches } = useLiveMatches()
  
  return (
    // Display matches
  )
}
```

## API Routes

### GET /api/live-updates
Fetches live match data from all sources

**Query Parameters:**
- `source`: 'all' | 'espn' | 'cricsheet' (default: 'all')
- `format`: 'Test' | 'ODI' | 'T20' (optional)

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "match_123",
      "title": "India vs Australia",
      "status": "in",
      "team1": { "name": "India", "runs": 156, "wickets": 3, "overs": "20.0" },
      "team2": { "name": "Australia", "runs": 0, "wickets": 0, "overs": "0.0" },
      "venue": "MCG, Melbourne"
    }
  ],
  "timestamp": "2026-01-21T10:30:00Z",
  "source": "all"
}
```

## Data Caching Strategy

- **ESPN API**: 5-minute cache (for match lists)
- **CricSheet**: Real-time (no cache for live matches)
- **CricInfo**: 30-second cache for scores

## Error Handling

All API calls include error handling with fallback to mock data:
- Network errors: Return empty array with error message
- API rate limits: Use cached data
- Timeout (10s): Fall back to mock data

## Rate Limiting

- ESPN API: Up to 500 requests per minute
- CricSheet: Unlimited (static data)
- CricInfo: Through proxy to avoid rate limits

## Configuration

To use these integrations:

1. Ensure internet connectivity
2. No API keys required for public sources
3. CORS proxying handled by Next.js API routes
4. Real-time updates via client-side polling

## Future Enhancements

- WebSocket support for true real-time updates
- Push notifications for match events
- Advanced caching with Redis
- Data persistence with database
- Player tracking and live statistics
