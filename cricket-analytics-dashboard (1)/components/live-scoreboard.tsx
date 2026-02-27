'use client'

import { Card } from '@/components/ui/card'
import { useLiveMatches } from '@/hooks/use-live-matches'
import { Zap, Clock, MapPin } from 'lucide-react'

export function LiveScoreboard() {
  const { matches, loading, lastUpdated } = useLiveMatches()

  const liveMatches = matches.filter(m => m.status === 'in')

  if (loading && !matches.length) {
    return (
      <Card className="p-6 border border-border">
        <p className="text-foreground/60 text-center py-8">Loading live scoreboard...</p>
      </Card>
    )
  }

  return (
    <Card className="p-6 border border-border bg-gradient-to-br from-card to-card/50">
      <div className="flex items-center gap-2 mb-6">
        <Zap className="w-5 h-5 text-red-500 animate-pulse" />
        <h3 className="text-lg font-bold text-foreground">Live Scoreboard</h3>
        <span className="ml-auto text-xs text-foreground/60">
          {liveMatches.length} match{liveMatches.length !== 1 ? 'es' : ''} live
        </span>
      </div>

      {liveMatches.length > 0 ? (
        <div className="space-y-4">
          {liveMatches.map((match) => (
            <div key={match.id} className="p-4 bg-muted/50 rounded-lg border border-primary/20 hover:border-primary/50 transition">
              <p className="text-sm text-foreground/70 mb-3 font-medium">{match.title}</p>
              
              <div className="grid grid-cols-3 gap-4 mb-3">
                {/* Team 1 */}
                <div className="text-center">
                  <p className="text-xs text-foreground/60 mb-1">{match.team1.name}</p>
                  <p className="text-xl font-bold text-foreground">
                    {match.team1.runs}
                  </p>
                  <p className="text-xs text-foreground/60">
                    /{match.team1.wickets} ({match.team1.overs})
                  </p>
                </div>

                {/* vs Badge */}
                <div className="flex items-center justify-center">
                  <span className="text-xs font-semibold text-foreground/40 bg-muted px-2 py-1 rounded">vs</span>
                </div>

                {/* Team 2 */}
                <div className="text-center">
                  <p className="text-xs text-foreground/60 mb-1">{match.team2.name}</p>
                  <p className="text-xl font-bold text-foreground">
                    {match.team2.runs}
                  </p>
                  <p className="text-xs text-foreground/60">
                    /{match.team2.wickets} ({match.team2.overs})
                  </p>
                </div>
              </div>

              {match.venue && (
                <div className="flex items-center gap-1 text-xs text-foreground/50">
                  <MapPin className="w-3 h-3" />
                  <span>{match.venue}</span>
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-6 text-foreground/60">
          <Clock className="w-8 h-8 mx-auto mb-2 opacity-50" />
          <p>No matches currently live</p>
          <p className="text-xs mt-1">Check back soon for live cricket action</p>
        </div>
      )}

      {lastUpdated && (
        <p className="text-xs text-foreground/40 mt-4 text-right">
          Last update: {lastUpdated.toLocaleTimeString()}
        </p>
      )}
    </Card>
  )
}
