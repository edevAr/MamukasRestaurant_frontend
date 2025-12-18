'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { useSocket } from '@/contexts/SocketContext'
import { Header } from '@/components/layout/Header'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { LoginDialog } from '@/components/ui/LoginDialog'
import { ReservationForm, ReservationFormData } from '@/components/ui/ReservationForm'
import { motion } from 'framer-motion'
import { ArrowLeft, UtensilsCrossed, Star, Clock, MapPin, ShoppingCart, Calendar, X } from 'lucide-react'
import api from '@/lib/api'
import toast from 'react-hot-toast'
import { PromotionCarousel } from '@/components/ui/PromotionCarousel'

interface MenuItem {
  id: string
  name: string
  description: string
  price: number
  image?: string
  type: 'food' | 'drink' | 'dessert'
  available: boolean
  quantity: number
}

interface Restaurant {
  id: string
  name: string
  cuisine: string
  rating: number
  address?: string
}

export default function RestaurantMenuPage() {
  const params = useParams()
  const router = useRouter()
  const { user } = useAuth()
  const { socket } = useSocket()
  const restaurantId = params.id as string

  const [restaurant, setRestaurant] = useState<Restaurant | null>(null)
  const [menuItems, setMenuItems] = useState<MenuItem[]>([])
  const [promotions, setPromotions] = useState<any[]>([])
  const [combos, setCombos] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0])
  const [reservations, setReservations] = useState<Record<string, any>>({})
  const [reservingItem, setReservingItem] = useState<string | null>(null)
  const [showLoginDialog, setShowLoginDialog] = useState(false)
  const [showReservationForm, setShowReservationForm] = useState(false)
  const [selectedMenuItem, setSelectedMenuItem] = useState<MenuItem | null>(null)

  // Join restaurant room when entering the page
  useEffect(() => {
    if (socket && restaurantId && user) {
      console.log(`🔌 Uniéndose a sala del restaurante: ${restaurantId}`)
      socket.emit('restaurant:join', { restaurantId })
      
      return () => {
        console.log(`🔌 Saliendo de sala del restaurante: ${restaurantId}`)
        socket.emit('restaurant:leave', { restaurantId })
      }
    }
  }, [socket, restaurantId, user])

  useEffect(() => {
    if (restaurantId) {
      console.log('🔄 Loading restaurant data for:', restaurantId, 'Date:', selectedDate)
      fetchRestaurantData()
      fetchMenu()
      fetchPromotions()
      fetchCombos()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [restaurantId, selectedDate])

  // Separate effect for reservations when user changes
  useEffect(() => {
    if (restaurantId && user?.role === 'client') {
      fetchReservations()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user])

  const fetchRestaurantData = async () => {
    try {
      const response = await api.get(`/restaurants/${restaurantId}`)
      setRestaurant(response.data)
    } catch (error: any) {
      console.error('Error fetching restaurant:', error)
      toast.error('Error al cargar el restaurante')
    }
  }

  const fetchMenu = async (showLoading = true) => {
    try {
      if (showLoading) {
        setLoading(true)
      }
      const url = `/menus?restaurantId=${restaurantId}&date=${selectedDate}`
      console.log('🔍 Fetching menu from:', url)
      const response = await api.get(url)
      console.log('📋 Menu response:', {
        dataLength: response.data?.length || 0,
        data: response.data,
        firstItem: response.data?.[0]
      })
      
      // Convertir precios a números si vienen como strings
      const menuItems = (response.data || []).map((item: any) => {
        const processed = {
          ...item,
          id: item.id,
          name: item.name || 'Sin nombre',
          description: item.description || '',
          price: typeof item.price === 'string' ? parseFloat(item.price) : Number(item.price) || 0,
          quantity: typeof item.quantity === 'string' ? parseInt(item.quantity) : Number(item.quantity) || 0,
          type: (item.type || 'food').toLowerCase(),
          available: item.available !== false,
          image: item.image || null,
        }
        console.log('📦 Processed item:', processed.name, 'Type:', processed.type)
        return processed
      })
      
      console.log('✅ Menu items processed:', {
        count: menuItems.length,
        types: menuItems.map(i => i.type),
        items: menuItems.slice(0, 3)
      })
      setMenuItems(menuItems)
    } catch (error: any) {
      console.error('❌ Error fetching menu:', error)
      console.error('Error details:', error.response?.data)
      console.error('Error status:', error.response?.status)
      toast.error('Error al cargar el menú')
      setMenuItems([]) // Asegurar que se establece un array vacío en caso de error
    } finally {
      if (showLoading) {
        setLoading(false)
      }
    }
  }

  const fetchPromotions = async () => {
    try {
      const response = await api.get(`/promotions?restaurantId=${restaurantId}&active=true`)
      setPromotions(response.data || [])
    } catch (error: any) {
      console.error('Error fetching promotions:', error)
      // No mostrar error si no hay promociones
    }
  }

  const fetchCombos = async () => {
    try {
      const response = await api.get(`/menus?restaurantId=${restaurantId}&type=combo&date=${selectedDate}`)
      // Convertir precios a números si vienen como strings
      const combosData = (response.data || []).map((item: any) => ({
        ...item,
        price: typeof item.price === 'string' ? parseFloat(item.price) : item.price,
        quantity: typeof item.quantity === 'string' ? parseInt(item.quantity) : item.quantity,
      }))
      setCombos(combosData)
    } catch (error: any) {
      console.error('Error fetching combos:', error)
      // No mostrar error si no hay combos
    }
  }

  const fetchReservations = async () => {
    try {
      const response = await api.get('/menu-reservations')
      const reservationsMap: Record<string, any> = {}
      response.data.forEach((reservation: any) => {
        if (reservation.menuId && reservation.status === 'pending') {
          reservationsMap[reservation.menuId] = reservation
        }
      })
      setReservations(reservationsMap)
    } catch (error: any) {
      console.error('Error fetching reservations:', error)
    }
  }

  const handleReserve = async (item: MenuItem) => {
    if (!user || user.role !== 'client') {
      setShowLoginDialog(true)
      return
    }

    setSelectedMenuItem(item)
    setShowReservationForm(true)
  }

  const handleReservationSubmit = async (formData: ReservationFormData) => {
    if (!selectedMenuItem || !restaurant) return

    try {
      setReservingItem(selectedMenuItem.id)
      
      const response = await api.post('/reservations', {
        ...formData,
        restaurantId: restaurant.id,
      })
      
      toast.success('¡Reserva realizada exitosamente!', {
        icon: '✅',
        duration: 4000,
      })
      
      // Recargar menú para actualizar cantidades
      await fetchMenu(false)
      
    } catch (error: any) {
      console.error('Error creating reservation:', error)
      toast.error(error.response?.data?.message || 'Error al realizar la reserva')
      throw error
    } finally {
      setReservingItem(null)
    }
  }

  const handleCancelReservation = async (reservationId: string, menuId: string) => {
    try {
      await api.delete(`/menu-reservations/${reservationId}`)
      
      // Actualizar estado local sin recargar
      setReservations(prev => {
        const newReservations = { ...prev }
        delete newReservations[menuId]
        return newReservations
      })
      
      // Actualizar cantidad disponible del item
      setMenuItems(prev => prev.map(item => 
        item.id === menuId 
          ? { ...item, quantity: item.quantity + 1 }
          : item
      ))
      
      toast.success('Reserva cancelada exitosamente')
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Error al cancelar la reserva')
    }
  }

  const groupedMenu = menuItems.reduce((acc, item) => {
    // Normalizar el tipo a minúsculas para asegurar compatibilidad
    const normalizedType = (item.type || 'food').toLowerCase()
    if (!acc[normalizedType]) {
      acc[normalizedType] = []
    }
    acc[normalizedType].push(item)
    return acc
  }, {} as Record<string, MenuItem[]>)

  console.log('📊 Menu state:', {
    menuItemsCount: menuItems.length,
    groupedMenuKeys: Object.keys(groupedMenu),
    groupedMenuItemsCount: Object.entries(groupedMenu).map(([k, v]) => `${k}: ${v.length}`),
    loading,
    restaurantId,
    selectedDate,
    menuItems: menuItems.slice(0, 3), // Primeros 3 items para debug
    allTypes: [...new Set(menuItems.map(i => i.type))]
  })

  const typeLabels = {
    food: '🍽️ Platos Principales',
    drink: '🥤 Bebidas',
    dessert: '🍰 Postres',
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-amber-50 to-red-50">
      <Header />

      <main className="container mx-auto px-4 py-8">
        {/* Back Button */}
        <Button
          variant="ghost"
          onClick={() => router.push('/')}
          className="mb-6 flex items-center gap-2"
        >
          <ArrowLeft className="w-4 h-4" />
          Volver a restaurantes
        </Button>

        {loading ? (
          <div className="text-center py-12">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
              className="inline-flex items-center justify-center w-16 h-16 bg-food-gradient rounded-2xl mb-4 shadow-food"
            >
              <UtensilsCrossed className="w-8 h-8 text-white" />
            </motion.div>
            <p className="text-gray-600">Cargando menú...</p>
          </div>
        ) : (
          <>
            {/* Restaurant Header */}
            {restaurant && (
              <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-8"
              >
                <Card className="p-6">
                  <div className="flex items-start justify-between">
                    <div>
                      <h1 className="text-3xl font-display font-bold text-gray-900 mb-2">
                        {restaurant.name}
                      </h1>
                      <p className="text-gray-600 mb-4">{restaurant.cuisine}</p>
                      <div className="flex items-center gap-4 text-sm text-gray-500">
                        <div className="flex items-center gap-1">
                          <Star className="w-4 h-4 fill-golden-400 text-golden-400" />
                          <span className="font-semibold">{restaurant.rating}</span>
                        </div>
                        {restaurant.address && (
                          <div className="flex items-center gap-1">
                            <MapPin className="w-4 h-4" />
                            <span>{restaurant.address}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </Card>

                {/* Promotions and Combos Carousel */}
                {(promotions.length > 0 || combos.length > 0) && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="mt-6"
                  >
                    <PromotionCarousel promotions={promotions} combos={combos} />
                  </motion.div>
                )}
              </motion.div>
            )}

            {/* Date Selector */}
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-6"
            >
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Fecha del menú
              </label>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="input"
              />
            </motion.div>

            {/* Menu Items */}
            {!loading && menuItems.length === 0 ? (
              <Card className="p-12 text-center">
                <UtensilsCrossed className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-700 mb-2">
                  No hay menú disponible
                </h3>
                <p className="text-gray-500 mb-4">
                  Este restaurante no tiene menú disponible para la fecha seleccionada.
                </p>
                <Button
                  variant="primary"
                  onClick={() => {
                    const today = new Date().toISOString().split('T')[0]
                    setSelectedDate(today)
                  }}
                >
                  Ver menú de hoy
                </Button>
              </Card>
            ) : !loading && Object.keys(groupedMenu).length > 0 ? (
              <div className="space-y-8">
                {Object.entries(groupedMenu).map(([type, items], index) => (
                  <motion.div
                    key={type}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                  >
                    <h2 className="text-2xl font-display font-bold text-gray-900 mb-4">
                      {typeLabels[type as keyof typeof typeLabels] || type.charAt(0).toUpperCase() + type.slice(1)}
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {items.map((item) => (
                        <Card key={item.id} hover className="overflow-hidden p-0">
                          {item.image && (
                            <div className="h-48 w-full overflow-hidden">
                              <img
                                src={item.image}
                                alt={item.name}
                                className="w-full h-full object-cover"
                                onError={(e) => {
                                  (e.target as HTMLImageElement).src = 'https://via.placeholder.com/800x600?text=Imagen+no+disponible'
                                }}
                              />
                            </div>
                          )}
                          <div className="p-4">
                            <div className="flex items-start justify-between mb-2">
                              <h3 className="text-lg font-semibold text-gray-900">
                                {item.name}
                              </h3>
                              <span className="text-xl font-bold text-primary-600">
                                ${Number(item.price).toFixed(2)}
                              </span>
                            </div>
                            {item.description && (
                              <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                                {item.description}
                              </p>
                            )}
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                {item.available ? (
                                  <span className="text-xs bg-fresh-100 text-fresh-700 px-2 py-1 rounded-full font-semibold">
                                    Disponible
                                  </span>
                                ) : (
                                  <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full font-semibold">
                                    Agotado
                                  </span>
                                )}
                                {item.quantity > 0 && (
                                  <span className="text-xs text-gray-500">
                                    {item.quantity} disponibles
                                  </span>
                                )}
                              </div>
                              {reservations[item.id] ? (
                                <Button
                                  variant="secondary"
                                  size="sm"
                                  onClick={() => handleCancelReservation(reservations[item.id].id, item.id)}
                                  className="flex items-center gap-2"
                                >
                                  <X className="w-4 h-4" />
                                  Cancelar Reserva
                                </Button>
                              ) : (
                                <Button
                                  variant="primary"
                                  size="sm"
                                  disabled={!item.available || reservingItem === item.id}
                                  onClick={() => handleReserve(item)}
                                  className="flex items-center gap-2"
                                >
                                  <Calendar className="w-4 h-4" />
                                  {reservingItem === item.id ? 'Reservando...' : 'Reservar'}
                                </Button>
                              )}
                            </div>
                          </div>
                        </Card>
                      ))}
                    </div>
                  </motion.div>
                ))}
              </div>
            ) : null}
          </>
        )}
      </main>

      {/* Login Dialog */}
      <LoginDialog
        isOpen={showLoginDialog}
        onClose={() => setShowLoginDialog(false)}
        title="Inicia sesión para reservar"
        message="Para reservar platos del menú, necesitas tener una cuenta de cliente. ¡Es rápido y fácil!"
      />

      {/* Reservation Form */}
      {selectedMenuItem && restaurant && (
        <ReservationForm
          isOpen={showReservationForm}
          onClose={() => {
            setShowReservationForm(false)
            setSelectedMenuItem(null)
          }}
          menuItem={{
            id: selectedMenuItem.id,
            name: selectedMenuItem.name,
            price: selectedMenuItem.price,
            quantity: selectedMenuItem.quantity,
          }}
          restaurantId={restaurant.id}
          restaurantName={restaurant.name}
          onSubmit={handleReservationSubmit}
        />
      )}
    </div>
  )
}

