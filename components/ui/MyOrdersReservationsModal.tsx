'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, ShoppingBag, Calendar, Clock, MapPin, CheckCircle, XCircle, Package, Users, UtensilsCrossed } from 'lucide-react'
import { Card } from './Card'
import { Button } from './Button'
import api from '@/lib/api'
import toast from 'react-hot-toast'

interface Order {
  id: string
  total: number
  status: 'pending' | 'confirmed' | 'preparing' | 'ready' | 'delivered' | 'cancelled'
  notes?: string
  deliveryAddress?: string
  restaurant: {
    id: string
    name: string
    image?: string
  }
  items: Array<{
    id: string
    quantity: number
    price: number
    menu: {
      id: string
      name: string
      image?: string
    }
  }>
  createdAt: string
}

interface Reservation {
  id: string
  date: string
  time?: string
  numberOfGuests?: number
  reservationType: 'dine-in' | 'takeout'
  menuItems?: Array<{
    menuId: string
    name: string
    quantity: number
    price: number
  }>
  notes?: string
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed'
  restaurant: {
    id: string
    name: string
    image?: string
  }
  createdAt: string
}

interface MyOrdersReservationsModalProps {
  isOpen: boolean
  onClose: () => void
}

export function MyOrdersReservationsModal({ isOpen, onClose }: MyOrdersReservationsModalProps) {
  const [activeTab, setActiveTab] = useState<'orders' | 'reservations'>('orders')
  const [orders, setOrders] = useState<Order[]>([])
  const [reservations, setReservations] = useState<Reservation[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (isOpen) {
      fetchData()
    }
  }, [isOpen])

  const fetchData = async () => {
    setLoading(true)
    try {
      const [ordersRes, reservationsRes] = await Promise.all([
        api.get('/orders'),
        api.get('/reservations'),
      ])
      setOrders(ordersRes.data || [])
      setReservations(reservationsRes.data || [])
    } catch (error: any) {
      console.error('Error fetching data:', error)
      toast.error('Error al cargar tus pedidos y reservas')
    } finally {
      setLoading(false)
    }
  }

  const handleCancelOrder = async (orderId: string) => {
    try {
      await api.post(`/orders/${orderId}/cancel`)
      toast.success('Pedido cancelado exitosamente')
      fetchData()
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Error al cancelar el pedido')
    }
  }

  const handleCancelReservation = async (reservationId: string) => {
    try {
      await api.delete(`/reservations/${reservationId}`)
      toast.success('Reserva cancelada exitosamente')
      fetchData()
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Error al cancelar la reserva')
    }
  }

  const getStatusConfig = (status: string) => {
    const configs: Record<string, { label: string; color: string; icon: any }> = {
      pending: { label: 'Pendiente', color: 'bg-yellow-100 text-yellow-800 border-yellow-300', icon: Clock },
      confirmed: { label: 'Confirmado', color: 'bg-blue-100 text-blue-800 border-blue-300', icon: CheckCircle },
      preparing: { label: 'En preparación', color: 'bg-purple-100 text-purple-800 border-purple-300', icon: Package },
      ready: { label: 'Listo', color: 'bg-green-100 text-green-800 border-green-300', icon: CheckCircle },
      delivered: { label: 'Entregado', color: 'bg-gray-100 text-gray-800 border-gray-300', icon: CheckCircle },
      cancelled: { label: 'Cancelado', color: 'bg-red-100 text-red-800 border-red-300', icon: XCircle },
      completed: { label: 'Completada', color: 'bg-gray-100 text-gray-800 border-gray-300', icon: CheckCircle },
    }
    return configs[status] || configs.pending
  }

  if (!isOpen) return null

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          onClick={(e) => e.stopPropagation()}
          className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <h2 className="text-2xl font-bold text-gray-900">Mis Pedidos y Reservas</h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              <X className="w-6 h-6 text-gray-500" />
            </button>
          </div>

          {/* Tabs */}
          <div className="flex border-b border-gray-200">
            <button
              onClick={() => setActiveTab('orders')}
              className={`flex-1 px-6 py-4 font-semibold transition-colors ${
                activeTab === 'orders'
                  ? 'text-primary-600 border-b-2 border-primary-600 bg-primary-50'
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              <div className="flex items-center justify-center gap-2">
                <ShoppingBag className="w-5 h-5" />
                Pedidos ({orders.length})
              </div>
            </button>
            <button
              onClick={() => setActiveTab('reservations')}
              className={`flex-1 px-6 py-4 font-semibold transition-colors ${
                activeTab === 'reservations'
                  ? 'text-primary-600 border-b-2 border-primary-600 bg-primary-50'
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              <div className="flex items-center justify-center gap-2">
                <Calendar className="w-5 h-5" />
                Reservas ({reservations.length})
              </div>
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-6">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
              </div>
            ) : activeTab === 'orders' ? (
              <div className="space-y-4">
                {orders.length === 0 ? (
                  <div className="text-center py-12">
                    <ShoppingBag className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-500 text-lg">No tienes pedidos aún</p>
                  </div>
                ) : (
                  orders.map((order) => {
                    const statusConfig = getStatusConfig(order.status)
                    const StatusIcon = statusConfig.icon
                    return (
                      <Card key={order.id} className="p-6">
                        <div className="flex items-start justify-between mb-4">
                          <div>
                            <h3 className="text-lg font-semibold text-gray-900 mb-1">
                              {order.restaurant.name}
                            </h3>
                            <p className="text-sm text-gray-500">
                              {new Date(order.createdAt).toLocaleDateString('es-ES', {
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </p>
                          </div>
                          <div className={`flex items-center gap-2 px-3 py-1 rounded-full border ${statusConfig.color}`}>
                            <StatusIcon className="w-4 h-4" />
                            <span className="text-sm font-medium">{statusConfig.label}</span>
                          </div>
                        </div>

                        <div className="space-y-2 mb-4">
                          {order.items.map((item) => (
                            <div key={item.id} className="flex items-center justify-between text-sm">
                              <span className="text-gray-700">
                                {item.quantity}x {item.menu.name}
                              </span>
                              <span className="font-semibold text-gray-900">
                                ${(item.price * item.quantity).toFixed(2)}
                              </span>
                            </div>
                          ))}
                        </div>

                        {order.deliveryAddress && (
                          <div className="flex items-center gap-2 text-sm text-gray-600 mb-4">
                            <MapPin className="w-4 h-4" />
                            <span>{order.deliveryAddress}</span>
                          </div>
                        )}

                        {order.notes && (
                          <p className="text-sm text-gray-600 mb-4 italic">"{order.notes}"</p>
                        )}

                        <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                          <span className="text-lg font-bold text-gray-900">
                            Total: ${order.total.toFixed(2)}
                          </span>
                          {['pending', 'confirmed'].includes(order.status) && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleCancelOrder(order.id)}
                              className="text-red-600 hover:text-red-700 hover:bg-red-50"
                            >
                              Cancelar
                            </Button>
                          )}
                        </div>
                      </Card>
                    )
                  })
                )}
              </div>
            ) : (
              <div className="space-y-4">
                {reservations.length === 0 ? (
                  <div className="text-center py-12">
                    <Calendar className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-500 text-lg">No tienes reservas aún</p>
                  </div>
                ) : (
                  reservations.map((reservation) => {
                    const statusConfig = getStatusConfig(reservation.status)
                    const StatusIcon = statusConfig.icon
                    const totalPrice = reservation.menuItems?.reduce(
                      (sum, item) => sum + item.price * item.quantity,
                      0
                    ) || 0

                    return (
                      <Card key={reservation.id} className="p-6">
                        <div className="flex items-start justify-between mb-4">
                          <div>
                            <h3 className="text-lg font-semibold text-gray-900 mb-1">
                              {reservation.restaurant.name}
                            </h3>
                            <p className="text-sm text-gray-500">
                              {new Date(reservation.createdAt).toLocaleDateString('es-ES', {
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </p>
                          </div>
                          <div className={`flex items-center gap-2 px-3 py-1 rounded-full border ${statusConfig.color}`}>
                            <StatusIcon className="w-4 h-4" />
                            <span className="text-sm font-medium">{statusConfig.label}</span>
                          </div>
                        </div>

                        <div className="space-y-3 mb-4">
                          <div className="flex items-center gap-2 text-sm">
                            <Calendar className="w-4 h-4 text-gray-500" />
                            <span className="text-gray-700">
                              Fecha: {new Date(reservation.date).toLocaleDateString('es-ES', {
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric',
                              })}
                            </span>
                          </div>

                          {reservation.reservationType === 'dine-in' && (
                            <>
                              {reservation.time && (
                                <div className="flex items-center gap-2 text-sm">
                                  <Clock className="w-4 h-4 text-gray-500" />
                                  <span className="text-gray-700">Hora: {reservation.time}</span>
                                </div>
                              )}
                              {reservation.numberOfGuests && (
                                <div className="flex items-center gap-2 text-sm">
                                  <Users className="w-4 h-4 text-gray-500" />
                                  <span className="text-gray-700">
                                    {reservation.numberOfGuests} {reservation.numberOfGuests === 1 ? 'persona' : 'personas'}
                                  </span>
                                </div>
                              )}
                            </>
                          )}

                          {reservation.reservationType === 'takeout' && (
                            <div className="flex items-center gap-2 text-sm">
                              <UtensilsCrossed className="w-4 h-4 text-gray-500" />
                              <span className="text-gray-700">Para llevar</span>
                            </div>
                          )}

                          {reservation.menuItems && reservation.menuItems.length > 0 && (
                            <div className="mt-3 pt-3 border-t border-gray-200">
                              <p className="text-sm font-semibold text-gray-700 mb-2">Platos reservados:</p>
                              {reservation.menuItems.map((item, idx) => (
                                <div key={idx} className="flex items-center justify-between text-sm mb-1">
                                  <span className="text-gray-700">
                                    {item.quantity}x {item.name}
                                  </span>
                                  <span className="font-semibold text-gray-900">
                                    ${(item.price * item.quantity).toFixed(2)}
                                  </span>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>

                        {reservation.notes && (
                          <p className="text-sm text-gray-600 mb-4 italic">"{reservation.notes}"</p>
                        )}

                        <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                          {totalPrice > 0 && (
                            <span className="text-lg font-bold text-gray-900">
                              Total: ${totalPrice.toFixed(2)}
                            </span>
                          )}
                          {['pending', 'confirmed'].includes(reservation.status) && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleCancelReservation(reservation.id)}
                              className="text-red-600 hover:text-red-700 hover:bg-red-50"
                            >
                              Cancelar
                            </Button>
                          )}
                        </div>
                      </Card>
                    )
                  })
                )}
              </div>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}
