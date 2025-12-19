'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ShoppingBag, Calendar, X } from 'lucide-react'
import { Button } from './Button'
import { MyOrdersReservationsModal } from './MyOrdersReservationsModal'
import { useAuth } from '@/contexts/AuthContext'
import api from '@/lib/api'

export function MyOrdersReservationsButton() {
  const { user } = useAuth()
  const [isOpen, setIsOpen] = useState(false)
  const [hasOrders, setHasOrders] = useState(false)
  const [hasReservations, setHasReservations] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user || user.role !== 'client') {
      setLoading(false)
      return
    }

    const checkOrdersAndReservations = async () => {
      try {
        const [ordersRes, reservationsRes] = await Promise.all([
          api.get('/orders').catch(() => ({ data: [] })),
          api.get('/reservations').catch(() => ({ data: [] })),
        ])

        const orders = ordersRes.data || []
        const reservations = reservationsRes.data || []

        // Verificar si hay pedidos activos (pending, confirmed, preparing, ready)
        const activeOrders = orders.filter((o: any) => 
          ['pending', 'confirmed', 'preparing', 'ready'].includes(o.status)
        )
        
        // Verificar si hay reservas activas (pending, confirmed)
        const activeReservations = reservations.filter((r: any) => 
          ['pending', 'confirmed'].includes(r.status)
        )

        setHasOrders(activeOrders.length > 0)
        setHasReservations(activeReservations.length > 0)
      } catch (error) {
        console.error('Error checking orders/reservations:', error)
        setHasOrders(false)
        setHasReservations(false)
      } finally {
        setLoading(false)
      }
    }

    checkOrdersAndReservations()

    // Verificar cada 30 segundos
    const interval = setInterval(checkOrdersAndReservations, 30000)
    return () => clearInterval(interval)
  }, [user])

  if (!user || user.role !== 'client' || loading) {
    return null
  }

  if (!hasOrders && !hasReservations) {
    return null
  }

  const badgeCount = (hasOrders ? 1 : 0) + (hasReservations ? 1 : 0)

  return (
    <>
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
        className="fixed bottom-6 right-6 z-50"
      >
        <Button
          variant="primary"
          size="lg"
          onClick={() => setIsOpen(true)}
          className="relative shadow-2xl rounded-full px-6 py-4 flex items-center gap-3"
        >
          <div className="relative">
            <ShoppingBag className="w-6 h-6" />
            {badgeCount > 0 && (
              <motion.span
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center"
              >
                {badgeCount}
              </motion.span>
            )}
          </div>
          <span className="font-semibold">Mis Pedidos y Reservas</span>
        </Button>
      </motion.div>

      <AnimatePresence>
        {isOpen && (
          <MyOrdersReservationsModal
            isOpen={isOpen}
            onClose={() => setIsOpen(false)}
          />
        )}
      </AnimatePresence>
    </>
  )
}
