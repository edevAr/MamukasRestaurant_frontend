'use client'

import { useAuth } from '@/contexts/AuthContext'
import { useSocket } from '@/contexts/SocketContext'
import { useSSE } from '@/contexts/SSEContext'
import { Header } from '@/components/layout/Header'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { LoginDialog } from '@/components/ui/LoginDialog'
import { ReviewForm } from '@/components/ui/ReviewForm'
import { MyOrdersReservationsButton } from '@/components/ui/MyOrdersReservationsButton'
import { motion } from 'framer-motion'
import { MapPin, Star, Clock, UtensilsCrossed, Search, Filter, MessageSquare, TrendingUp } from 'lucide-react'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import api from '@/lib/api'
import toast from 'react-hot-toast'
import { calculateIsOpen, saveOpeningHoursToStorage, getOpeningHoursFromStorage, type OpeningHours } from '@/lib/restaurant-hours'

interface Restaurant {
  id: string
  name: string
  rating: number
  reviews: number
  distance: string
  image: string
  logo?: string
  cuisine: string
  isOpen: boolean
  deliveryTime: string
  isPromoted?: boolean
  promotionText?: string | null
  promotionImage?: string | null
  promotionStartDate?: string | null
  promotionEndDate?: string | null
  openingHours?: OpeningHours
}

export default function ClientPage() {
  const { user, loading: authLoading } = useAuth()
  const { socket, connected } = useSocket()
  const { subscribe, connected: sseConnected } = useSSE()
  const router = useRouter()
  const [search, setSearch] = useState('')
  const [restaurants, setRestaurants] = useState<Restaurant[]>([])
  const [loading, setLoading] = useState(true)
  const [hasLoaded, setHasLoaded] = useState(false)
  const [selectedRestaurantForReview, setSelectedRestaurantForReview] = useState<Restaurant | null>(null)
  const [showLoginDialog, setShowLoginDialog] = useState(false)

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!authLoading && !user) {
      console.log('⚠️ User not authenticated, redirecting to login')
      router.push('/login')
    }
  }, [user, authLoading, router])

  useEffect(() => {
    // Solo cargar si no se ha cargado antes
    if (!hasLoaded) {
      fetchRestaurants()
      setHasLoaded(true)
    }
  }, [hasLoaded])

  // Listen to restaurant hours updates via SSE
  useEffect(() => {
    if (authLoading) {
      return
    }

    console.log('👂 Setting up SSE listener for restaurant:hours-updated in /client page')

    const unsubscribeHours = subscribe('restaurant:hours-updated', (data: { restaurantId: string; openingHours: OpeningHours }) => {
      console.log('🕐 Restaurant hours update received via SSE in /client:', data)
      
      // Actualizar sessionStorage
      saveOpeningHoursToStorage(data.restaurantId, data.openingHours)
      
      // Recalcular isOpen y actualizar UI
      const newIsOpen = calculateIsOpen(data.openingHours)
      
      setRestaurants(prev => {
        const existingIndex = prev.findIndex(rest => rest.id === data.restaurantId)
        if (existingIndex === -1) {
          return prev
        }
        
        const updated = prev.map((rest, index) => {
          if (index === existingIndex) {
            return { ...rest, isOpen: newIsOpen, openingHours: data.openingHours }
          }
          return rest
        })
        
        return updated
      })
    })

    return unsubscribeHours
  }, [authLoading, subscribe])

  // Periodic check for restaurant status changes based on opening hours
  useEffect(() => {
    const interval = setInterval(() => {
      setRestaurants(prev => {
        let hasChanges = false
        const updated = prev.map(restaurant => {
          // Obtener horarios de sessionStorage o usar los del restaurante
          const openingHours = getOpeningHoursFromStorage(restaurant.id) || restaurant.openingHours
          
          if (!openingHours) {
            return restaurant
          }
          
          // Calcular nuevo estado
          const newIsOpen = calculateIsOpen(openingHours)
          
          // Si cambió el estado, actualizar
          if (restaurant.isOpen !== newIsOpen) {
            hasChanges = true
            console.log(`🔄 Restaurant ${restaurant.name} status changed: ${restaurant.isOpen} -> ${newIsOpen}`)
            return { ...restaurant, isOpen: newIsOpen }
          }
          
          return restaurant
        })
        
        return hasChanges ? updated : prev
      })
    }, 30000) // Verificar cada 30 segundos

    return () => clearInterval(interval)
  }, [])

  // Listen to restaurant status changes via SSE (works for authenticated users)
  useEffect(() => {
    if (authLoading) {
      return
    }

    console.log('👂 Setting up SSE listener for restaurant:status in /client page')

    const unsubscribe = subscribe('restaurant:status', (data: { restaurantId: string; isOpen: boolean; message: string }) => {
      console.log('🔔 Restaurant status update received via SSE in /client:', data)
      
      setRestaurants(prev => {
        // Evitar duplicados: solo actualizar si el restaurante existe
        const existingIndex = prev.findIndex(rest => rest.id === data.restaurantId)
        if (existingIndex === -1) {
          console.log(`⚠️ Restaurant ${data.restaurantId} not found in current list`)
          console.log(`📋 Available IDs:`, prev.map(r => ({ id: r.id, name: r.name })))
          return prev
        }
        
        const currentRestaurant = prev[existingIndex]
        console.log(`✅ Found restaurant at index ${existingIndex}:`, currentRestaurant.name)
        console.log(`📊 Current isOpen: ${currentRestaurant.isOpen}, New isOpen: ${data.isOpen}`)
        
        // Si el valor ya es el mismo, no actualizar (evitar re-renders innecesarios)
        if (currentRestaurant.isOpen === data.isOpen) {
          console.log(`ℹ️ Restaurant status already matches, skipping update`)
          return prev
        }
        
        // Actualizar solo el restaurante existente - crear nuevo array y nuevo objeto
        const updated = prev.map((rest, index) => {
          if (index === existingIndex) {
            return { ...rest, isOpen: data.isOpen }
          }
          return rest
        })
        
        console.log(`✅ Updated restaurant:`, updated[existingIndex])
        return updated
      })
      
      toast(data.message, { 
        duration: 3000, 
        icon: data.isOpen ? '✅' : '🔒',
        style: {
          background: data.isOpen ? '#10b981' : '#ef4444',
          color: '#fff',
        }
      })
    })

    return unsubscribe
  }, [subscribe, authLoading])

  const fetchRestaurants = async () => {
    try {
      setLoading(true)
      const response = await api.get('/restaurants')
      console.log('📋 Fetched restaurants from API:', response.data.length, 'restaurants')
      // Transformar los datos del backend al formato esperado
      const transformed: Restaurant[] = response.data.map((rest: any) => {
        const openingHours = rest.openingHours || null
        
        // Guardar horarios en sessionStorage
        if (openingHours) {
          saveOpeningHoursToStorage(rest.id, openingHours)
        }
        
        // Calcular isOpen basado en horarios si están disponibles
        const calculatedIsOpen = openingHours 
          ? calculateIsOpen(openingHours)
          : (rest.isOpen !== false)
        
        const restaurant: Restaurant = {
          id: rest.id,
          name: rest.name,
          rating: rest.rating || 0,
          reviews: rest.reviews?.length || rest.totalReviews || 0,
          distance: '0.5 km', // TODO: Calcular distancia real
          image: rest.image || 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800&h=600&fit=crop',
          logo: rest.logo || null,
          cuisine: rest.cuisine || 'Gourmet',
          isOpen: calculatedIsOpen,
          deliveryTime: '25-35 min',
          isPromoted: rest.isPromoted || false,
          promotionText: rest.promotionText || null,
          promotionImage: rest.promotionImage || null,
          promotionStartDate: rest.promotionStartDate || null,
          promotionEndDate: rest.promotionEndDate || null,
          openingHours: openingHours,
        }
        console.log(`   - Restaurant: ${restaurant.name} (ID: ${restaurant.id}, isOpen: ${restaurant.isOpen})`)
        return restaurant
      })
      
      // Eliminar duplicados por ID (mantener el primero de cada ID único)
      const uniqueRestaurants: Restaurant[] = Array.from(
        new Map(transformed.map((rest) => [rest.id, rest])).values()
      )
      
      console.log(`📊 Restaurants after deduplication: ${uniqueRestaurants.length} unique restaurants (from ${transformed.length} total)`)
      
      // Reemplazar completamente en lugar de agregar
      setRestaurants(uniqueRestaurants)
      console.log('✅ Restaurants state updated with', transformed.length, 'restaurants')
    } catch (error: any) {
      console.error('Error fetching restaurants:', error)
      toast.error('Error al cargar los restaurantes')
      // No usar datos de ejemplo, dejar array vacío
      setRestaurants([])
    } finally {
      setLoading(false)
    }
  }

  // Show loading state while auth is loading
  if (authLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 via-amber-50 to-red-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">Cargando...</p>
        </div>
      </div>
    )
  }

  // Don't render if not authenticated (will redirect)
  if (!user) {
    return null
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-amber-50 to-red-50">
      <Header />

      <main className="container mx-auto px-4 py-8">
        {/* Hero Section */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <h1 className="text-5xl font-display font-bold text-gradient mb-4">
            ¡Hola, {user?.firstName}! 👋
          </h1>
          <p className="text-xl text-gray-600 mb-8">
            Descubre los mejores restaurantes cerca de ti
          </p>

          {/* Search Bar */}
          <div className="max-w-2xl mx-auto">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Buscar restaurantes, platos, cocina..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-12 pr-4 py-4 rounded-2xl border-2 border-gray-200 focus:border-primary-400 focus:ring-2 focus:ring-primary-200 outline-none text-lg shadow-lg"
              />
              <Button
                variant="primary"
                size="md"
                className="absolute right-2 top-1/2 transform -translate-y-1/2"
              >
                <Filter className="w-5 h-5" />
              </Button>
            </div>
          </div>
        </motion.div>

        {/* Restaurants Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {restaurants.map((restaurant, index) => (
            <motion.div
              key={restaurant.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card hover className="overflow-hidden p-0">
                {/* Image */}
                <div className="relative h-48 w-full overflow-hidden">
                  {restaurant.image && (
                    <img
                      src={restaurant.image}
                      alt={restaurant.name}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800&h=600&fit=crop'
                      }}
                    />
                  )}
                  {/* Overlay oscuro para mejor contraste */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-black/10 to-transparent"></div>
                  {/* Logo como marca de agua blanca transparente con efecto difuminado */}
                  {restaurant.logo && (
                    <div className="absolute bottom-4 right-4 z-20">
                      <div className="relative" style={{ width: '4.4rem', height: '4.4rem' }}>
                        {/* Glow effect - resplandor suave difuminado */}
                        <div className="absolute inset-0 rounded-2xl bg-white/20 blur-2xl"></div>
                        {/* Main container transparente con efecto difuminado */}
                        <div className="relative rounded-2xl bg-white/10 backdrop-blur-lg p-2 shadow-[0_8px_32px_0_rgba(255,255,255,0.2)] border border-white/20">
                          {/* Logo image con efecto difuminado */}
                          <div className="relative rounded-xl overflow-hidden h-full">
                            <img
                              src={restaurant.logo}
                              alt={`${restaurant.name} logo`}
                              className="w-full h-full object-cover rounded-xl"
                              style={{ 
                                filter: 'brightness(0) invert(1) blur(0.5px)',
                                opacity: 0.6
                              }}
                              onError={(e) => {
                                (e.target as HTMLImageElement).style.display = 'none'
                              }}
                            />
                            {/* Overlay difuminado adicional para efecto glassmorphism */}
                            <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-white/10 to-transparent pointer-events-none backdrop-blur-sm"></div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                  {restaurant.isOpen ? (
                    <div className="absolute top-4 right-4 bg-green-500 text-white px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1 z-10 shadow-lg">
                      <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
                      Abierto
                    </div>
                  ) : (
                    <div className="absolute top-4 right-4 bg-red-500 text-white px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1 z-10 shadow-lg">
                      <div className="w-2 h-2 bg-white rounded-full"></div>
                      Cerrado
                    </div>
                  )}
                  {/* Promotion Badge */}
                  {restaurant.isPromoted && (restaurant.promotionText || restaurant.promotionImage) && (
                    <div className="absolute top-4 left-4 bg-gradient-to-r from-amber-500 to-orange-500 text-white px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1 z-10 shadow-lg">
                      <TrendingUp className="w-3 h-3" />
                      Promoción
                    </div>
                  )}
                </div>

                {/* Content */}
                <div>
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="text-xl font-display font-bold text-gray-900">
                      {restaurant.name}
                    </h3>
                    <div className="flex items-center gap-1 bg-golden-100 text-golden-700 px-2 py-1 rounded-lg">
                      <Star className="w-4 h-4 fill-current" />
                      <span className="font-semibold text-sm">{restaurant.rating}</span>
                    </div>
                  </div>

                  <p className="text-gray-600 text-sm mb-4">{restaurant.cuisine}</p>

                  {/* Promotion Info */}
                  {restaurant.isPromoted && restaurant.promotionText && (
                    <div className="mb-4 p-3 bg-gradient-to-r from-amber-50 to-orange-50 rounded-lg border border-amber-200">
                      <div className="flex items-center gap-2 mb-1">
                        <TrendingUp className="w-4 h-4 text-amber-600" />
                        <span className="text-sm font-semibold text-amber-800">Promoción Activa</span>
                      </div>
                      <p className="text-sm text-amber-700">{restaurant.promotionText}</p>
                    </div>
                  )}

                  <div className="flex items-center gap-4 text-sm text-gray-500 mb-4">
                    <div className="flex items-center gap-1">
                      <MapPin className="w-4 h-4" />
                      {restaurant.distance}
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock className="w-4 h-4" />
                      {restaurant.deliveryTime}
                    </div>
                    <button
                      onClick={() => {
                        if (!user) {
                          setShowLoginDialog(true)
                        } else {
                          setSelectedRestaurantForReview(restaurant)
                        }
                      }}
                      className="flex items-center gap-1 hover:text-primary-600 transition-colors cursor-pointer"
                      title="Ver reseñas y dejar comentario"
                    >
                      <MessageSquare className="w-4 h-4" />
                      <span>{restaurant.reviews} reseñas</span>
                    </button>
                  </div>

                  <Button
                    variant="primary"
                    fullWidth
                    onClick={() => router.push(`/client/restaurant/${restaurant.id}/menu`)}
                  >
                    Ver Menú
                  </Button>
                </div>
              </Card>
            </motion.div>
          ))}
        </div>
      </main>

      {/* Login Dialog for Reviews */}
      <LoginDialog
        isOpen={showLoginDialog}
        onClose={() => setShowLoginDialog(false)}
        title="Inicia sesión para dejar una reseña"
        message="Para compartir tu experiencia y calificar este restaurante, necesitas tener una cuenta. ¡Es rápido y fácil!"
        benefits={[
          'Deja reseñas y calificaciones',
          'Ayuda a otros clientes',
          'Comparte tu experiencia',
          'Accede a todas las funciones',
        ]}
      />

      {/* Review Form */}
      {selectedRestaurantForReview && (
        <ReviewForm
          isOpen={!!selectedRestaurantForReview}
          onClose={() => setSelectedRestaurantForReview(null)}
          restaurantId={selectedRestaurantForReview.id}
          restaurantName={selectedRestaurantForReview.name}
          onSuccess={() => {
            // Recargar restaurantes para actualizar ratings
            fetchRestaurants()
          }}
        />
      )}

      {/* Orders and Reservations Button */}
      <MyOrdersReservationsButton />
    </div>
  )
}

