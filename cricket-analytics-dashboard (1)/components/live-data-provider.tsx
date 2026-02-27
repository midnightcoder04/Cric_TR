'use client'

import type React from 'react'
import { createContext, useContext, useEffect, useState } from 'react'

interface LiveDataContextType {
  lastUpdated: Date | null
  isRefreshing: boolean
  refreshData: () => Promise<void>
}

const LiveDataContext = createContext<LiveDataContextType | undefined>(undefined)

export function LiveDataProvider({ children }: { children: React.ReactNode }) {
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)
  const [isRefreshing, setIsRefreshing] = useState(false)

  const refreshData = async () => {
    setIsRefreshing(true)
    try {
      // Trigger live data refresh across the app
      await fetch('/api/live-updates')
      setLastUpdated(new Date())
    } catch (error) {
      console.error('[v0] Error refreshing data:', error)
    } finally {
      setIsRefreshing(false)
    }
  }

  // Auto-refresh every 5 minutes
  useEffect(() => {
    const interval = setInterval(refreshData, 300000)
    return () => clearInterval(interval)
  }, [])

  return (
    <LiveDataContext.Provider value={{ lastUpdated, isRefreshing, refreshData }}>
      {children}
    </LiveDataContext.Provider>
  )
}

export function useLiveDataContext() {
  const context = useContext(LiveDataContext)
  if (!context) {
    throw new Error('useLiveDataContext must be used within LiveDataProvider')
  }
  return context
}
