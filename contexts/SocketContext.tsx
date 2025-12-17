'use client'

import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { io, Socket } from 'socket.io-client'
import { useAuth } from './AuthContext'
import toast from 'react-hot-toast'

interface SocketContextType {
  socket: Socket | null
  connected: boolean
}

const SocketContext = createContext<SocketContextType | undefined>(undefined)

// Use the same base URL as the API, but remove /api suffix for socket connection
const getSocketUrl = () => {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api'
  const baseUrl = apiUrl.replace(/\/api\/?$/, '')
  return baseUrl
}

const SOCKET_URL = getSocketUrl()

export function SocketProvider({ children }: { children: ReactNode }) {
  const [socket, setSocket] = useState<Socket | null>(null)
  const [connected, setConnected] = useState(false)
  const { user } = useAuth()

  useEffect(() => {
    if (!user) {
      if (socket) {
        socket.disconnect()
        setSocket(null)
        setConnected(false)
      }
      return
    }

    const token = localStorage.getItem('token')
    if (!token) {
      return
    }

    // Clean up existing socket if any before creating new one
    if (socket) {
      socket.removeAllListeners()
      socket.disconnect()
      setSocket(null)
      setConnected(false)
    }

    const newSocket = io(SOCKET_URL, {
      auth: {
        token,
      },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: Infinity,
      reconnectionDelayMax: 5000,
      timeout: 20000,
    })

    newSocket.on('connect', () => {
      setConnected(true)
    })

    newSocket.on('disconnect', () => {
      setConnected(false)
    })

    newSocket.on('connect_error', () => {
      setConnected(false)
    })

    newSocket.on('restaurant:status', (data) => {
      toast(data.message, {
        duration: 5000,
        icon: data.isOpen ? '✅' : '🔒',
      })
    })

    newSocket.on('menu:availability', (data) => {
      toast(
        data.available
          ? '¡Plato disponible nuevamente!'
          : 'Plato agotado',
        { duration: 3000, icon: data.available ? '✅' : '❌' }
      )
    })

    newSocket.on('order:status', (data) => {
      const statusMessages: Record<string, string> = {
        confirmed: 'Tu pedido ha sido confirmado',
        preparing: 'Tu pedido está en preparación',
        ready: '¡Tu pedido está listo!',
        delivered: 'Tu pedido ha sido entregado',
      }
      toast.success(statusMessages[data.status] || 'Estado del pedido actualizado')
    })

    newSocket.on('reservation:update', (data) => {
      toast('Tu reserva ha sido actualizada', { icon: '📅' })
    })

    newSocket.on('notification', (data) => {
      toast(data.message || 'Nueva notificación', { icon: '🔔' })
    })

    setSocket(newSocket)

    return () => {
      newSocket.close()
      setSocket(null)
      setConnected(false)
    }
  }, [user])

  return (
    <SocketContext.Provider value={{ socket, connected }}>
      {children}
    </SocketContext.Provider>
  )
}

export function useSocket() {
  const context = useContext(SocketContext)
  if (context === undefined) {
    throw new Error('useSocket must be used within a SocketProvider')
  }
  return context
}
