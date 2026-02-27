"use client"

import { useRouter } from "next/navigation"
import { Card } from "@/components/ui/card"
import { BarChart3, Users, TrendingUp, Eye, RefreshCw, Zap } from "lucide-react"
import { useLiveMatches } from "@/hooks/use-live-matches"
import { useState } from "react"

export default function DashboardPage() {
  const router = useRouter()
  const { matches: liveMatches, loading, lastUpdated, refreshMatches } = useLiveMatches()
  const [autoRefresh, setAutoRefresh] = useState(true)

  const stats = [
    {
      title: "Total Players",
      value: "50",
      icon: Users,
      color: "text-blue-500",
      bgColor: "bg-blue-500/10",
      onClick: () => router.push("/dashboard/all-players"),
    },
    {
      title: "Upcoming Matches",
      value: "5",
      icon: BarChart3,
      color: "text-cyan-500",
      bgColor: "bg-cyan-500/10",
      onClick: () => router.push("/dashboard/upcoming-matches"),
    },
    {
      title: "Win Probability",
      value: "78%",
      icon: TrendingUp,
      color: "text-green-500",
      bgColor: "bg-green-500/10",
      onClick: () => router.push("/dashboard/win-probability"),
    },
    {
      title: "Opposition Teams",
      value: "8",
      icon: Eye,
      color: "text-purple-500",
      bgColor: "bg-purple-500/10",
      onClick: () => router.push("/dashboard/opposition"),
    },
  ]

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground mb-2">Dashboard</h1>
        <p className="text-foreground/60">Welcome back! Here's your cricket analytics overview.</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {stats.map((stat, i) => {
          const Icon = stat.icon
          return (
            <button key={i} onClick={stat.onClick} className="text-left">
              <Card className="p-6 border border-border hover:border-primary/50 hover:shadow-lg transition cursor-pointer">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-foreground/60 text-sm font-medium mb-2">{stat.title}</p>
                    <p className="text-3xl font-bold text-foreground">{stat.value}</p>
                  </div>
                  <div className={`${stat.bgColor} p-3 rounded-lg`}>
                    <Icon className={`w-6 h-6 ${stat.color}`} />
                  </div>
                </div>
              </Card>
            </button>
          )
        })}
      </div>

      {/* Live Matches Feed */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2 p-6 border border-border">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold text-foreground">Live Matches</h2>
              {liveMatches.some(m => m.status === 'in') && (
                <div className="flex items-center gap-1 px-2 py-1 bg-red-500/20 rounded-full">
                  <Zap className="w-4 h-4 text-red-500" />
                  <span className="text-xs font-medium text-red-600 dark:text-red-400">LIVE</span>
                </div>
              )}
            </div>
            <button
              onClick={refreshMatches}
              disabled={loading}
              className="p-2 hover:bg-muted rounded-lg transition disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 text-foreground/60 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
          
          <div className="space-y-4">
            {loading && !liveMatches.length ? (
              <div className="text-center py-8 text-foreground/60">
                <p>Loading live match data...</p>
              </div>
            ) : liveMatches.length > 0 ? (
              liveMatches.map((match, i) => (
                <div key={i} className="p-4 bg-muted rounded-lg border border-border hover:border-primary/50 transition">
                  <div className="flex items-center justify-between mb-2">
                    <p className="font-semibold text-foreground text-sm">{match.title}</p>
                    <span className={`px-2 py-1 rounded text-xs font-medium ${
                      match.status === 'in' ? 'bg-red-500/20 text-red-700 dark:text-red-400' :
                      match.status === 'post' ? 'bg-blue-500/20 text-blue-700 dark:text-blue-400' :
                      'bg-amber-500/20 text-amber-700 dark:text-amber-400'
                    }`}>
                      {match.status === 'in' ? 'LIVE' : match.status === 'post' ? 'Completed' : 'Upcoming'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <p className="text-sm text-foreground/70">{match.team1?.name || 'Team 1'}</p>
                      {match.team1?.runs !== undefined && (
                        <p className="font-semibold text-foreground">{match.team1.runs}/{match.team1.wickets} ({match.team1.overs})</p>
                      )}
                    </div>
                    <div className="text-center text-xs text-foreground/50 px-3">vs</div>
                    <div className="flex-1 text-right">
                      <p className="text-sm text-foreground/70">{match.team2?.name || 'Team 2'}</p>
                      {match.team2?.runs !== undefined && (
                        <p className="font-semibold text-foreground">{match.team2.runs}/{match.team2.wickets} ({match.team2.overs})</p>
                      )}
                    </div>
                  </div>
                  {match.venue && (
                    <p className="text-xs text-foreground/50 mt-2">{match.venue}</p>
                  )}
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-foreground/60">
                <p>No live matches available</p>
              </div>
            )}
          </div>
          
          {lastUpdated && (
            <p className="text-xs text-foreground/40 mt-4">
              Last updated: {lastUpdated.toLocaleTimeString()}
            </p>
          )}
        </Card>

        <Card className="p-6 border border-border">
          <h2 className="text-xl font-bold text-foreground mb-4">Quick Stats</h2>
          <div className="space-y-4">
            {[
              { label: "Avg Score", value: "156" },
              { label: "Win Rate", value: "67%" },
              { label: "Top Scorer", value: "Virat" },
            ].map((stat, i) => (
              <div key={i} className="p-3 bg-muted rounded-lg">
                <p className="text-sm text-foreground/60 mb-1">{stat.label}</p>
                <p className="text-lg font-bold text-foreground">{stat.value}</p>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  )
}
