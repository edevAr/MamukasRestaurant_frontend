'use client'

import { createContext, useContext, useEffect, useState, ReactNode, useCallback, useRef } from 'react'
import { useAuth } from './AuthContext'

interface SSEEvent {
  type: string
  data: any
}

interface SSEContextType {
  connected: boolean
  subscribe: (eventType: string, callback: (data: any) => void) => () => void
}

const SSEContext = createContext<SSEContextType>({
  connected: false,
  subscribe: () => () => {},
})

export function SSEProvider({ children }: { children: ReactNode }) {
  const { user, loading: authLoading } = useAuth()
  const [connected, setConnected] = useState(false)
  const eventSourceRef = useRef<EventSource | null>(null)
  const listenersRef = useRef<Map<string, Set<(data: any) => void>>>(new Map())

  useEffect(() => {
    if (authLoading) {
      return
    }

    // Allow connection even without authentication for public events
    const token = localStorage.getItem('token')
    
    // Get API URL - the backend uses /api prefix globally
    // NEXT_PUBLIC_API_URL should already include /api (e.g., http://192.168.0.93:3000/api)
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api'
    
    // The endpoint is /api/events/stream because of the global prefix in backend
    // If apiUrl already ends with /api, use it directly, otherwise add /api
    let baseUrl = apiUrl
    if (!baseUrl.endsWith('/api')) {
      // Remove trailing slash if present, then add /api
      baseUrl = baseUrl.replace(/\/$/, '') + '/api'
    }
    
    // Include token if available, but allow connection without it
    const eventsUrl = token 
      ? `${baseUrl}/events/stream?token=${encodeURIComponent(token)}`
      : `${baseUrl}/events/stream`
    
    console.log('🔌 Connecting to SSE endpoint:', eventsUrl)

    // Create EventSource (works with or without token)
    const eventSource = new EventSource(eventsUrl)

    eventSource.onopen = () => {
      console.log('✅ SSE connection opened')
      setConnected(true)
    }

    eventSource.onmessage = (event) => {
      try {
        const sseEvent: SSEEvent = JSON.parse(event.data)
        
        // Skip connection confirmation message
        if (sseEvent.type === 'connected') {
          console.log('✅ SSE connection confirmed')
          return
        }
        
        console.log(`📨 SSE event received: ${sseEvent.type}`, sseEvent.data)
        
        // Call all listeners for this event type
        const eventListeners = listenersRef.current.get(sseEvent.type)
        if (eventListeners) {
          console.log(`📢 Calling ${eventListeners.size} listener(s) for ${sseEvent.type}`)
          eventListeners.forEach((callback) => {
            try {
              callback(sseEvent.data)
            } catch (error) {
              console.error(`Error in SSE listener for ${sseEvent.type}:`, error)
            }
          })
        } else {
          console.log(`⚠️ No listeners found for event type: ${sseEvent.type}`)
          console.log(`📋 Available listeners:`, Array.from(listenersRef.current.keys()))
        }
      } catch (error) {
        console.error('Error parsing SSE event:', error, event.data)
      }
    }

    eventSource.onerror = (error) => {
      console.error('SSE connection error:', error, { readyState: eventSource.readyState })
      setConnected(false)
      // EventSource will automatically try to reconnect
      // readyState: 0 = CONNECTING, 1 = OPEN, 2 = CLOSED
      if (eventSource.readyState === EventSource.CLOSED) {
        console.log('🔄 SSE connection closed, will attempt to reconnect')
      }
    }

    eventSourceRef.current = eventSource

    return () => {
      eventSource.close()
      eventSourceRef.current = null
      setConnected(false)
    }
  }, [user, authLoading])

  const subscribe = useCallback((eventType: string, callback: (data: any) => void) => {
    // Add listener immediately
    if (!listenersRef.current.has(eventType)) {
      listenersRef.current.set(eventType, new Set())
    }
    listenersRef.current.get(eventType)!.add(callback)

    // Return unsubscribe function
    return () => {
      const eventListeners = listenersRef.current.get(eventType)
      if (eventListeners) {
        eventListeners.delete(callback)
        if (eventListeners.size === 0) {
          listenersRef.current.delete(eventType)
        }
      }
    }
  }, [])

  return (
    <SSEContext.Provider value={{ connected, subscribe }}>
      {children}
    </SSEContext.Provider>
  )
}

export function useSSE() {
  return useContext(SSEContext)
}
