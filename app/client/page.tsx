'use client'

import { useAuth } from '@/contexts/AuthContext'
import { useSocket } from '@/contexts/SocketContext'
import { Header } from '@/components/layout/Header'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { motion } from 'framer-motion'
import { MapPin, Star, Clock, UtensilsCrossed, Search, Filter } from 'lucide-react'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import api from '@/lib/api'
import toast from 'react-hot-toast'

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
}

export default function ClientPage() {
  const { user, loading: authLoading } = useAuth()
  const { socket, connected } = useSocket()
  const router = useRouter()
  const [search, setSearch] = useState('')
  const [restaurants, setRestaurants] = useState<Restaurant[]>([])
  const [loading, setLoading] = useState(true)

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!authLoading && !user) {
      console.log('⚠️ User not authenticated, redirecting to login')
      router.push('/login')
    }
  }, [user, authLoading, router])


  useEffect(() => {
    fetchRestaurants()
  }, [])

  // Listen to restaurant status changes in real-time
  useEffect(() => {
    if (authLoading || !user) {
      return
    }

    if (!socket) {
      return
    }

    const handleRestaurantStatus = (data: { restaurantId: string; isOpen: boolean; message: string }) => {
      setRestaurants(prev => {
        const updated = prev.map(rest => 
          rest.id === data.restaurantId 
            ? { ...rest, isOpen: data.isOpen }
            : rest
        )
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
    }

    socket.on('restaurant:status', handleRestaurantStatus)

    return () => {
      socket.off('restaurant:status', handleRestaurantStatus)
    }
  }, [socket, user, authLoading])

  const fetchRestaurants = async () => {
    try {
      setLoading(true)
      const response = await api.get('/restaurants')
      console.log('📋 Fetched restaurants from API:', response.data.length, 'restaurants')
      // Transformar los datos del backend al formato esperado
      const transformed = response.data.map((rest: any) => {
        const restaurant = {
          id: rest.id,
          name: rest.name,
          rating: rest.rating || 0,
          reviews: rest.reviews?.length || rest.totalReviews || 0,
          distance: '0.5 km', // TODO: Calcular distancia real
          image: rest.image || 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800&h=600&fit=crop',
          logo: rest.logo || null,
          cuisine: rest.cuisine || 'Gourmet',
          isOpen: rest.isOpen !== false, // Ensure boolean
          deliveryTime: '25-35 min',
        }
        console.log(`   - Restaurant: ${restaurant.name} (ID: ${restaurant.id}, isOpen: ${restaurant.isOpen})`)
        return restaurant
      })
      setRestaurants(transformed)
      console.log('✅ Restaurants state updated with', transformed.length, 'restaurants')
    } catch (error: any) {
      console.error('Error fetching restaurants:', error)
      // Si falla, usar datos de ejemplo
      setRestaurants([
        {
          id: '1',
          name: 'La Cocina Italiana',
          rating: 4.8,
          reviews: 234,
          distance: '0.5 km',
          image: '🍝',
          cuisine: 'Italiana',
          isOpen: true,
          deliveryTime: '25-35 min',
        },
        {
          id: '2',
          name: 'Sushi Master',
          rating: 4.9,
          reviews: 189,
          distance: '1.2 km',
          image: '🍣',
          cuisine: 'Japonesa',
          isOpen: true,
          deliveryTime: '30-40 min',
        },
        {
          id: '3',
          name: 'Burger Paradise',
          rating: 4.7,
          reviews: 456,
          distance: '0.8 km',
          image: '🍔',
          cuisine: 'Americana',
          isOpen: true,
          deliveryTime: '20-30 min',
        },
      ])
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

                  <div className="flex items-center gap-4 text-sm text-gray-500 mb-4">
                    <div className="flex items-center gap-1">
                      <MapPin className="w-4 h-4" />
                      {restaurant.distance}
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock className="w-4 h-4" />
                      {restaurant.deliveryTime}
                    </div>
                    <div className="flex items-center gap-1">
                      <UtensilsCrossed className="w-4 h-4" />
                      {restaurant.reviews} reseñas
                    </div>
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
    </div>
  )
}

