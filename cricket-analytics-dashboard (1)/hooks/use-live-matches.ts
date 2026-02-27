'use client'

import { useState, useEffect } from 'react'

export interface LiveMatch {
  id: string
  title: string
  status: string
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
  venue?: string
  date?: string
}

export function useLiveMatches(format?: string) {
  const [matches, setMatches] = useState<LiveMatch[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)

  useEffect(() => {
    const fetchMatches = async () => {
      try {
        setLoading(true)
        setError(null)
        
        const params = new URLSearchParams()
        if (format) params.append('format', format)
        
        const response = await fetch(`/api/live-updates?${params.toString()}`)
        
        if (!response.ok) throw new Error('Failed to fetch live matches')
        
        const data = await response.json()
        setMatches(data.data || [])
        setLastUpdated(new Date())
      } catch (err) {
        console.error('[v0] Error fetching live matches:', err)
        setError(err instanceof Error ? err.message : 'Unknown error')
      } finally {
        setLoading(false)
      }
    }

    fetchMatches()

    // Set up polling for real-time updates (every 30 seconds)
    const interval = setInterval(fetchMatches, 30000)

    return () => clearInterval(interval)
  }, [format])

  const refreshMatches = async () => {
    const params = new URLSearchParams()
    if (format) params.append('format', format)
    
    try {
      const response = await fetch(`/api/live-updates?${params.toString()}`)
      const data = await response.json()
      setMatches(data.data || [])
      setLastUpdated(new Date())
    } catch (err) {
      console.error('[v0] Error refreshing matches:', err)
    }
  }

  return { matches, loading, error, lastUpdated, refreshMatches }
}
