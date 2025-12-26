'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useSocket } from '@/contexts/SocketContext'
import { useSSE } from '@/contexts/SSEContext'
import { useRouter } from 'next/navigation'
import api from '@/lib/api'
import toast from 'react-hot-toast'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  UtensilsCrossed, 
  Clock, 
  Tag, 
  ShoppingCart, 
  ShoppingBag,
  Calendar, 
  MessageSquare,
  Power,
  Plus,
  Edit,
  Trash2,
  Star,
  X,
  Check,
  Save,
  DollarSign,
  Image as ImageIcon,
  Package,
  Users,
  Mail,
  Phone,
  MapPin,
  TrendingUp,
  AlertCircle,
  Settings,
  Send,
  LogOut,
  BarChart3,
  UserPlus,
  Activity,
  Search,
  FileText,
  Upload
} from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { SalesSection } from '@/components/owner/SalesSection'
import { DispatchesSection } from '@/components/owner/DispatchesSection'
import { SalesMetricsModal } from '@/components/owner/SalesMetricsModal'

interface Restaurant {
  id: string
  name: string
  description: string
  cuisine: string
  address: string
  phone: string
  email: string
  image: string
  logo: string
  latitude?: number
  longitude?: number
  openingHours: {
    [key: string]: {
      open: boolean
      openTime?: string
      closeTime?: string
    }
  }
  isOpen: boolean
  isActive: boolean
  rating: number
  totalReviews: number
  maxWaitTimeEnabled?: boolean
  maxWaitTimeMinutes?: number
}

interface Menu {
  id: string
  name: string
  description: string
  price: number
  image: string
  type: 'food' | 'drink' | 'combo' | 'dessert'
  available: boolean
  quantity: number
  date: string
}

interface Promotion {
  id: string
  title: string
  description: string
  image: string
  discount: number
  startDate: string
  endDate: string
  isActive: boolean
}

interface Order {
  id: string
  total: number
  status: 'pending' | 'confirmed' | 'preparing' | 'ready' | 'delivered' | 'cancelled'
  notes: string
  deliveryAddress: string
  client: {
    id: string
    firstName: string
    lastName: string
    email: string
  }
  items: Array<{
    id: string
    menu: Menu
    quantity: number
    price: number
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
  restaurantId: string
  client: {
    id: string
    firstName: string
    lastName: string
    email: string
  }
  createdAt: string
}

interface Review {
  id: string
  comment: string
  rating: number
  client: {
    id: string
    firstName: string
    lastName: string
  }
  createdAt: string
}

type Tab = 'menu' | 'hours' | 'promotions' | 'orders' | 'reservations' | 'reviews' | 'settings' | 'staff' | 'dashboard' | 'sales' | 'dispatches'

export default function OwnerPage() {
  const { user, logout } = useAuth()
  const { socket } = useSocket()
  const { subscribe } = useSSE()
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null)
  const [activeTab, setActiveTab] = useState<Tab>('menu')
  
  // Menu state
  const [menus, setMenus] = useState<Menu[]>([])
  const [showMenuForm, setShowMenuForm] = useState(false)
  const [editingMenu, setEditingMenu] = useState<Menu | null>(null)
  
  // Promotions state
  const [promotions, setPromotions] = useState<Promotion[]>([])
  const [showPromotionForm, setShowPromotionForm] = useState(false)
  const [editingPromotion, setEditingPromotion] = useState<Promotion | null>(null)
  
  // Orders & Reservations state
  const [orders, setOrders] = useState<Order[]>([])
  const [reservations, setReservations] = useState<Reservation[]>([])
  const [reviews, setReviews] = useState<Review[]>([])
  const [updatingOrder, setUpdatingOrder] = useState<string | null>(null)
  const [updatingReservation, setUpdatingReservation] = useState<string | null>(null)
  const [showAdminChat, setShowAdminChat] = useState(false)
  
  // Sales state
  const [sales, setSales] = useState<any[]>([])
  const [loadingSales, setLoadingSales] = useState(false)

  // Debug: Log activeTab changes
  useEffect(() => {
    console.log('Active tab changed to:', activeTab)
  }, [activeTab])

  useEffect(() => {
    // Bloquear acceso de meseros
    if (!user) {
      router.push('/login')
      return
    }

    // Permitir acceso a owners y staff (excepto meseros)
    // Owners siempre tienen acceso, y si tienen staffRole='administrator' también
    if (user.role === 'owner' || (user.role === 'client' && user.staffRole && user.staffRole !== 'waiter')) {
      // Si es staff o owner con restaurantId, cargar el restaurante asociado
      if (user.restaurantId) {
        loadRestaurantById(user.restaurantId)
      } else if (user.role === 'owner') {
        // Owner sin restaurantId, buscar por ownerId
        loadRestaurant()
      } else {
        // Staff sin restaurantId, error
        toast.error('No se encontró un restaurante asociado a tu cuenta')
        router.push('/client')
        return
      }
    } else {
      router.push('/login')
      return
    }
  }, [user])

  useEffect(() => {
    if (restaurant) {
      loadMenus()
      loadPromotions()
      loadOrders()
      loadReservations()
      loadReviews()
      loadSales()
    }
  }, [restaurant])

  // Escuchar evento de venta creada para refrescar despachos
  useEffect(() => {
    const handleSaleCreated = () => {
      console.log('🔄 Refrescando ventas después de crear nueva venta')
      loadSales()
    }

    window.addEventListener('sale:created', handleSaleCreated)
    return () => {
      window.removeEventListener('sale:created', handleSaleCreated)
    }
  }, [restaurant])
  
  const loadSales = async () => {
    if (!restaurant) return
    
    setLoadingSales(true)
    try {
      const response = await api.get('/sales')
      setSales(response.data)
    } catch (error: any) {
      console.error('Error loading sales:', error)
      toast.error('Error al cargar ventas')
    } finally {
      setLoadingSales(false)
    }
  }

  // SSE listeners for real-time updates (restaurant status and reservations)
  useEffect(() => {
    if (!restaurant) {
      return
    }

    console.log(`👂 Configurando listeners SSE para restaurante ${restaurant.id}`)

    // Subscribe to new reservations via SSE
    const unsubscribeReservation = subscribe('reservation:new', (data: { reservation: Reservation; timestamp: string }) => {
      console.log('🔔 Evento reservation:new recibido via SSE:', data)
      console.log('📋 Detalles de la reserva:', {
        id: data.reservation.id,
        restaurantId: data.reservation.restaurantId,
        currentRestaurantId: restaurant.id,
        match: data.reservation.restaurantId === restaurant.id
      })
      
      // Verificar que la reserva pertenece al restaurante del owner
      if (data.reservation.restaurantId === restaurant.id) {
        console.log('✅ Reserva válida, actualizando estado')
        toast.success('¡Nueva reserva recibida!', { icon: '📅' })
        setReservations(prev => {
          // Evitar duplicados
          const exists = prev.find(r => r.id === data.reservation.id)
          if (exists) {
            console.log('⚠️ Reserva ya existe, actualizando en lugar de agregar')
            return prev.map(r => r.id === data.reservation.id ? data.reservation : r)
          }
          return [data.reservation, ...prev]
        })
      } else {
        console.log('⚠️  Reserva no pertenece a este restaurante', {
          reservationRestaurantId: data.reservation.restaurantId,
          currentRestaurantId: restaurant.id
        })
      }
    })

    // Subscribe to restaurant status changes via SSE
    const unsubscribeStatus = subscribe('restaurant:status', (data: { restaurantId: string; isOpen: boolean; message: string }) => {
      if (restaurant.id === data.restaurantId) {
        setRestaurant(prev => prev ? { ...prev, isOpen: data.isOpen } : null)
      }
    })

    // Keep socket listeners for orders (not replacing those yet)
    if (socket) {
      const handleNewOrder = (order: Order) => {
        console.log('🛒 Nuevo pedido recibido:', order)
        toast.success('¡Nuevo pedido recibido!', { icon: '🛒' })
        setOrders(prev => [order, ...prev])
      }

      const handleOrderStatus = (data: { orderId: string; status: string }) => {
        setOrders(prev => prev.map(o => 
          o.id === data.orderId ? { ...o, status: data.status as any } : o
        ))
      }

      const handleReservationUpdate = (data: { reservationId: string; status: string }) => {
        setReservations(prev => prev.map(r => 
          r.id === data.reservationId ? { ...r, status: data.status as any } : r
        ))
      }

      socket.on('order:new', handleNewOrder)
      socket.on('order:status', handleOrderStatus)
      socket.on('reservation:update', handleReservationUpdate)

      console.log('✅ Listeners SSE y socket configurados correctamente')

      return () => {
        console.log('🧹 Limpiando listeners SSE y socket')
        unsubscribeReservation()
        unsubscribeStatus()
        socket.off('order:new', handleNewOrder)
        socket.off('order:status', handleOrderStatus)
        socket.off('reservation:update', handleReservationUpdate)
      }
    }

    // Subscribe to new sales via SSE
    const unsubscribeSaleNew = subscribe('sale:new', (data: { sale: any; timestamp: string }) => {
      console.log('🔔 Evento sale:new recibido via SSE:', data)
      
      if (data.sale.restaurantId === restaurant.id) {
        toast.success('¡Nueva venta recibida!', { icon: '💰' })
        setSales(prev => {
          const exists = prev.find(s => s.id === data.sale.id)
          if (exists) {
            return prev.map(s => s.id === data.sale.id ? data.sale : s)
          }
          return [data.sale, ...prev]
        })
      }
    })

    // Subscribe to sale updates via SSE
    const unsubscribeSaleUpdate = subscribe('sale:update', (data: { sale: any; timestamp: string }) => {
      console.log('🔔 Evento sale:update recibido via SSE:', data)
      
      if (data.sale.restaurantId === restaurant.id) {
        setSales(prev => {
          const exists = prev.find(s => s.id === data.sale.id)
          if (exists) {
            return prev.map(s => s.id === data.sale.id ? data.sale : s)
          }
          return prev
        })
      }
    })

    return () => {
      unsubscribeReservation()
      unsubscribeStatus()
      unsubscribeSaleNew()
      unsubscribeSaleUpdate()
    }
  }, [subscribe, socket, restaurant])

  const loadRestaurant = async () => {
    try {
      const response = await api.get('/restaurants')
      const restaurants = response.data
      const userRestaurant = restaurants.find((r: any) => r.owner?.id === user?.id)
      if (userRestaurant) {
        setRestaurant(userRestaurant)
      } else {
        toast.error('No se encontró un restaurante asociado a tu cuenta')
      }
    } catch (error: any) {
      console.error('Error loading restaurant:', error)
      toast.error('Error al cargar el restaurante')
    } finally {
      setLoading(false)
    }
  }

  const loadRestaurantById = async (restaurantId: string) => {
    try {
      const response = await api.get(`/restaurants/${restaurantId}`)
      setRestaurant(response.data)
    } catch (error: any) {
      console.error('Error loading restaurant by ID:', error)
      toast.error('Error al cargar el restaurante')
    } finally {
      setLoading(false)
    }
  }

  const loadMenus = async () => {
    if (!restaurant) return
    try {
      // Cargar menús del día actual para la sección de ventas
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      const todayStr = today.toISOString().split('T')[0]
      
      // Cargar todos los menús (para la sección de menú)
      const allMenusResponse = await api.get(`/menus?restaurantId=${restaurant.id}`)
      setMenus(allMenusResponse.data)
      
      // También cargar menús del día actual específicamente para ventas
      // (esto asegura que los menús estén disponibles para hoy)
      const todayMenusResponse = await api.get(`/menus?restaurantId=${restaurant.id}&date=${todayStr}`)
      console.log(`📅 Menús disponibles para hoy: ${todayMenusResponse.data.length}`)
    } catch (error) {
      console.error('Error loading menus:', error)
    }
  }

  const loadPromotions = async () => {
    if (!restaurant) return
    try {
      const response = await api.get(`/promotions?restaurantId=${restaurant.id}`)
      setPromotions(response.data)
    } catch (error) {
      console.error('Error loading promotions:', error)
    }
  }

  const loadOrders = async () => {
    if (!restaurant) return
    try {
      const response = await api.get(`/orders?restaurantId=${restaurant.id}`)
      setOrders(response.data)
    } catch (error) {
      console.error('Error loading orders:', error)
    }
  }

  const loadReservations = async () => {
    if (!restaurant) return
    try {
      const response = await api.get(`/reservations?restaurantId=${restaurant.id}`)
      setReservations(response.data)
    } catch (error) {
      console.error('Error loading reservations:', error)
    }
  }

  const loadReviews = async () => {
    if (!restaurant) return
    try {
      const response = await api.get(`/reviews?restaurantId=${restaurant.id}`)
      setReviews(response.data)
    } catch (error) {
      console.error('Error loading reviews:', error)
    }
  }

  const toggleRestaurantStatus = async () => {
    console.log('🔄 toggleRestaurantStatus called')
    if (!restaurant) {
      console.warn('⚠️ No restaurant available')
      return
    }
    console.log('🔄 Frontend: Toggling restaurant status for:', restaurant.id, 'Current status:', restaurant.isOpen)
    
    try {
      console.log('📡 Making API call to:', `/restaurants/${restaurant.id}/toggle-open`)
      const response = await api.post(`/restaurants/${restaurant.id}/toggle-open`)
      console.log('✅ Frontend: Toggle response:', response.data)
      console.log('📊 New status:', response.data.isOpen)
      
      setRestaurant(prev => prev ? { ...prev, isOpen: response.data.isOpen } : null)
      toast.success(response.data.isOpen ? '✅ Restaurante abierto' : '🔒 Restaurante cerrado')
    } catch (error: any) {
      console.error('❌ Frontend: Error toggling restaurant status:', error)
      console.error('   - Error message:', error.message)
      console.error('   - Error response:', error.response?.data)
      console.error('   - Error status:', error.response?.status)
      toast.error(error.response?.data?.message || 'Error al cambiar el estado del restaurante')
    }
  }

  const updateOrderStatus = async (orderId: string, status: string) => {
    setUpdatingOrder(orderId)
    try {
      await api.patch(`/orders/${orderId}/status`, { status })
      setOrders(prev => prev.map(o => 
        o.id === orderId ? { ...o, status: status as any } : o
      ))
      toast.success('Estado del pedido actualizado')
    } catch (error: any) {
      console.error('Error updating order status:', error)
      toast.error(error.response?.data?.message || 'Error al actualizar el estado del pedido')
    } finally {
      setUpdatingOrder(null)
    }
  }

  const updateReservationStatus = async (reservationId: string, status: string) => {
    setUpdatingReservation(reservationId)
    try {
      await api.patch(`/reservations/${reservationId}/status`, { status })
      setReservations(prev => prev.map(r => 
        r.id === reservationId ? { ...r, status: status as any } : r
      ))
      toast.success('Estado de la reserva actualizado')
    } catch (error: any) {
      console.error('Error updating reservation status:', error)
      toast.error(error.response?.data?.message || 'Error al actualizar el estado de la reserva')
    } finally {
      setUpdatingReservation(null)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-orange-50 to-red-50">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center"
        >
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-primary-200 border-t-primary-600 mx-auto"></div>
          <p className="mt-6 text-gray-600 text-lg font-medium">Cargando tu restaurante...</p>
        </motion.div>
      </div>
    )
  }

  if (!restaurant) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-orange-50 to-red-50">
        <Card className="p-8 text-center max-w-md">
          <AlertCircle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-4">No tienes un restaurante</h2>
          <p className="text-gray-600 mb-6">Contacta al administrador para crear tu restaurante.</p>
          <Button onClick={() => router.push('/client')} className="w-full">
            Volver al inicio
          </Button>
        </Card>
      </div>
    )
  }

  // Definir tabs disponibles según el rol del usuario
  const getAllTabs = (): Array<{ id: Tab; label: string; icon: any; count?: number }> => {
    const allTabs = [
      { id: 'menu' as Tab, label: 'Menú', icon: UtensilsCrossed, count: menus.length },
      { id: 'hours' as Tab, label: 'Horarios', icon: Clock },
      { id: 'promotions' as Tab, label: 'Promociones', icon: Tag, count: promotions.length },
      { id: 'orders' as Tab, label: 'Pedidos', icon: ShoppingCart, count: orders.filter(o => o.status !== 'delivered' && o.status !== 'cancelled').length },
      { id: 'reservations' as Tab, label: 'Reservas', icon: Calendar, count: reservations.filter(r => r.status === 'pending').length },
      { id: 'reviews' as Tab, label: 'Comentarios', icon: MessageSquare, count: reviews.length },
      { id: 'sales' as Tab, label: 'Ventas', icon: DollarSign, count: sales.filter(s => {
          // Contar solo ventas que tienen items pendientes de despachar
          const hasPendingItems = s.items?.some((item: any) => 
            item.status === 'pending' || item.status === 'preparing' || item.status === 'ready'
          )
          return (s.status === 'pending' || s.status === 'confirmed') && hasPendingItems
        }).length },
      { id: 'dispatches' as Tab, label: 'Despachos', icon: Package, count: sales.filter(s => s.status === 'pending' || s.status === 'confirmed' || s.status === 'preparing' || s.status === 'ready').length },
      { id: 'dashboard' as Tab, label: 'Dashboard', icon: BarChart3 },
      { id: 'staff' as Tab, label: 'Personal', icon: Users },
      { id: 'settings' as Tab, label: 'Configuración', icon: Settings },
    ]

    // Filtrar tabs según el rol
    if (!user) return []

    // Owner o Administrator (staffRole='administrator'): puede ver todo
    // Los owners que se registran como dueños de restaurante tienen staffRole='administrator'
    if (user.role === 'owner' || user.staffRole === 'administrator') {
      return allTabs
    }

    // Staff roles (clientes con staffRole)
    if (user.role === 'client' && user.staffRole) {
      switch (user.staffRole) {
        case 'manager':
          // Gerente: todo menos Configuración
          return allTabs.filter(tab => tab.id !== 'settings')
        case 'cashier':
          // Cajero/Vendedor: Promociones, Pedidos, Reservas, Ventas
          return allTabs.filter(tab => ['promotions', 'orders', 'reservations', 'sales'].includes(tab.id))
        case 'cook':
          // Cocinero: Pedidos, Reservas, Despachos
          return allTabs.filter(tab => ['orders', 'reservations', 'dispatches'].includes(tab.id))
        case 'waiter':
          // Mesero: Despachos (para entregar)
          return allTabs.filter(tab => tab.id === 'dispatches')
        default:
          return []
      }
    }

    return []
  }

  const tabs = getAllTabs()

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-orange-50/30 to-red-50/30">
      {/* Header */}
      <motion.div
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="glass border-b border-white/20 shadow-sm sticky top-0 z-50"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-4">
              {restaurant.logo && (
                <img src={restaurant.logo} alt={restaurant.name} className="w-16 h-16 rounded-xl object-cover shadow-md" />
              )}
              <div>
                <h1 className="text-3xl font-bold text-gray-900">{restaurant.name}</h1>
                <div className="flex items-center gap-3 mt-1">
                  <span className="px-3 py-1 bg-primary-100 text-primary-700 rounded-full text-sm font-semibold">
                    {restaurant.cuisine}
                  </span>
                  <div className="flex items-center gap-1 text-yellow-500">
                    <Star className="w-4 h-4 fill-current" />
                    <span className="text-sm font-semibold text-gray-700">
                      {Number(restaurant.rating || 0).toFixed(1)}
                    </span>
                    <span className="text-xs text-gray-500">({restaurant.totalReviews || 0})</span>
                  </div>
                  {user?.staffRole && (
                    <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-semibold capitalize">
                      {user.staffRole === 'administrator' ? 'Administrador' : 
                       user.staffRole === 'manager' ? 'Gerente' :
                       user.staffRole === 'cashier' ? 'Cajero' :
                       user.staffRole === 'cook' ? 'Cocinero' : user.staffRole}
                    </span>
                  )}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-right">
                <p className="text-xs text-gray-500 uppercase tracking-wide">Estado</p>
                <div className="flex items-center gap-2 mt-1">
                  <div className={`w-3 h-3 rounded-full ${restaurant.isOpen ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`}></div>
                  <p className={`font-bold text-lg ${restaurant.isOpen ? 'text-green-600' : 'text-red-600'}`}>
                    {restaurant.isOpen ? 'Abierto' : 'Cerrado'}
                  </p>
                </div>
              </div>
              {/* Solo owners y administrators pueden abrir/cerrar restaurante */}
              {(user?.role === 'owner' || user?.staffRole === 'administrator') && (
                <Button
                  onClick={() => {
                    console.log('🖱️ Button clicked - toggling restaurant status')
                    toggleRestaurantStatus()
                  }}
                  variant={restaurant.isOpen ? 'secondary' : 'primary'}
                  className="flex items-center gap-2 shadow-lg hover:shadow-xl transition-all"
                >
                  <Power className={`w-5 h-5 ${restaurant.isOpen ? '' : 'animate-pulse'}`} />
                  {restaurant.isOpen ? 'Cerrar' : 'Abrir'} Restaurante
                </Button>
              )}
              <Button
                onClick={() => {
                  if (confirm('¿Estás seguro de que deseas cerrar sesión?')) {
                    logout()
                  }
                }}
                variant="ghost"
                className="flex items-center gap-2 text-red-600 hover:text-red-700 hover:bg-red-50"
              >
                <LogOut className="w-5 h-5" />
                Salir
              </Button>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Tabs */}
      <div className="bg-white/60 backdrop-blur-sm border-b border-gray-200/50 sticky top-[88px] z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex space-x-1 overflow-x-auto scrollbar-hide pb-2">
            {tabs.map((tab) => {
              const Icon = tab.icon
              const isActive = activeTab === tab.id
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => {
                    console.log('Tab clicked:', tab.id, 'Current:', activeTab)
                    setActiveTab(tab.id)
                  }}
                  className={`relative flex items-center gap-2 px-6 py-4 font-semibold text-sm transition-all duration-200 whitespace-nowrap cursor-pointer select-none ${
                    isActive
                      ? 'text-primary-600'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  {tab.label}
                  {tab.count !== undefined && tab.count > 0 && (
                    <span className={`ml-2 px-2 py-0.5 rounded-full text-xs font-bold ${
                      isActive ? 'bg-primary-100 text-primary-700' : 'bg-gray-200 text-gray-700'
                    }`}>
                      {tab.count}
                    </span>
                  )}
                  {isActive && (
                    <motion.div
                      layoutId="activeTab"
                      className="absolute bottom-0 left-0 right-0 h-1 bg-primary-600 rounded-t-full"
                      initial={false}
                      transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                    />
                  )}
                </button>
              )
            })}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'menu' && (
          <MenuSection
            restaurant={restaurant}
            menus={menus}
            onRefresh={loadMenus}
            showForm={showMenuForm}
            setShowForm={setShowMenuForm}
            editingMenu={editingMenu}
            setEditingMenu={setEditingMenu}
          />
        )}
        {activeTab === 'hours' && (
          <HoursSection restaurant={restaurant} onUpdate={loadRestaurant} />
        )}
        {activeTab === 'promotions' && (
          <PromotionsSection
            restaurant={restaurant}
            promotions={promotions}
            onRefresh={loadPromotions}
            showForm={showPromotionForm}
            setShowForm={setShowPromotionForm}
            editingPromotion={editingPromotion}
            setEditingPromotion={setEditingPromotion}
          />
        )}
        {activeTab === 'orders' && (
          <OrdersSection 
            orders={orders} 
            onUpdateStatus={updateOrderStatus}
            updatingOrder={updatingOrder}
          />
        )}
        {activeTab === 'reservations' && (
          <ReservationsSection
            reservations={reservations}
            onUpdateStatus={updateReservationStatus}
            updatingReservation={updatingReservation}
          />
        )}
        {activeTab === 'reviews' && <ReviewsSection reviews={reviews} restaurant={restaurant} />}
        {activeTab === 'dashboard' && (
          <DashboardSection 
            restaurant={restaurant}
            orders={orders}
            reservations={reservations}
            sales={sales}
          />
        )}
        {activeTab === 'staff' && (
          <StaffSection 
            restaurant={restaurant}
          />
        )}
        {activeTab === 'sales' && (
          <SalesSection 
            restaurantId={restaurant.id}
            menus={menus}
            onSaleCreated={loadSales}
          />
        )}
        {activeTab === 'dispatches' && (
          <DispatchesSection 
            restaurantId={restaurant.id}
            userRole={user?.role}
            staffRole={user?.staffRole}
            onUpdate={loadSales}
            maxWaitTimeEnabled={restaurant.maxWaitTimeEnabled ?? true}
            maxWaitTimeMinutes={restaurant.maxWaitTimeMinutes ?? 20}
          />
        )}
        {activeTab === 'settings' && (
          <RestaurantSettingsSection 
            restaurant={restaurant} 
            onUpdate={loadRestaurant}
            onOpenChat={() => setShowAdminChat(true)}
          />
        )}
      </div>

      {/* Admin Chat Modal */}
      {showAdminChat && (
        <AdminChatModal
          isOpen={showAdminChat}
          onClose={() => setShowAdminChat(false)}
          restaurantName={restaurant?.name || ''}
        />
      )}
    </div>
  )
}

// Menu Section Component
function MenuSection({
  restaurant,
  menus,
  onRefresh,
  showForm,
  setShowForm,
  editingMenu,
  setEditingMenu,
}: {
  restaurant: Restaurant
  menus: Menu[]
  onRefresh: () => void
  showForm: boolean
  setShowForm: (show: boolean) => void
  editingMenu: Menu | null
  setEditingMenu: (menu: Menu | null) => void
}) {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    image: '',
    type: 'food' as 'food' | 'drink' | 'combo' | 'dessert',
    quantity: '',
    date: new Date().toISOString().split('T')[0],
    investedAmount: '', // Monto invertido
    profitPercentage: '30', // Porcentaje de ganancia por defecto
  })
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [uploadingImage, setUploadingImage] = useState(false)
  const [loading, setLoading] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [togglingId, setTogglingId] = useState<string | null>(null)
  const [filterType, setFilterType] = useState<'all' | 'food' | 'drink' | 'dessert'>('all')
  const [searchQuery, setSearchQuery] = useState('')

  // Calcular precio sugerido basado en monto invertido y porcentaje de ganancia
  const calculateSuggestedPrice = () => {
    const invested = parseFloat(formData.investedAmount) || 0
    const profitPercent = parseFloat(formData.profitPercentage) || 0
    if (invested > 0 && profitPercent >= 0) {
      const suggestedPrice = invested * (1 + profitPercent / 100)
      return suggestedPrice.toFixed(2)
    }
    return ''
  }

  const suggestedPrice = calculateSuggestedPrice()

  useEffect(() => {
    if (editingMenu) {
      setFormData({
        name: editingMenu.name,
        description: editingMenu.description || '',
        price: editingMenu.price.toString(),
        image: editingMenu.image || '',
        type: editingMenu.type,
        quantity: editingMenu.quantity.toString(),
        date: editingMenu.date.split('T')[0],
        investedAmount: '',
        profitPercentage: '30',
      })
      setImagePreview(editingMenu.image || null)
      setShowForm(true)
    } else if (showForm) {
      // Resetear formulario cuando se abre para crear nuevo
      setFormData({
        name: '',
        description: '',
        price: '',
        image: '',
        type: 'food',
        quantity: '',
        date: new Date().toISOString().split('T')[0],
        investedAmount: '',
        profitPercentage: '30',
      })
      setImagePreview(null)
    }
  }, [editingMenu, showForm, setShowForm])

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error('La imagen debe ser menor a 5MB')
        return
      }
      if (!file.type.startsWith('image/')) {
        toast.error('Por favor selecciona un archivo de imagen válido')
        return
      }
      
      setUploadingImage(true)
      const reader = new FileReader()
      reader.onloadend = () => {
        const base64String = reader.result as string
        setFormData({ ...formData, image: base64String })
        setImagePreview(base64String)
        setUploadingImage(false)
        toast.success('✅ Imagen cargada exitosamente')
      }
      reader.onerror = () => {
        toast.error('Error al cargar la imagen')
        setUploadingImage(false)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setLoading(true)
    try {
      const data = {
        ...formData,
        price: parseFloat(formData.price),
        quantity: parseInt(formData.quantity) || 0,
        restaurantId: restaurant.id,
        date: formData.date,
      }

      if (editingMenu) {
        await api.patch(`/menus/${editingMenu.id}`, data)
        toast.success('✅ Menú actualizado exitosamente')
      } else {
        await api.post('/menus', data)
        toast.success('✅ Menú creado exitosamente')
      }

      setShowForm(false)
      setEditingMenu(null)
      setFormData({
        name: '',
        description: '',
        price: '',
        image: '',
        type: 'food',
        quantity: '',
        date: new Date().toISOString().split('T')[0],
        investedAmount: '',
        profitPercentage: '30',
      })
      onRefresh()
    } catch (error: any) {
      console.error('Error saving menu:', error)
      toast.error(error.response?.data?.message || 'Error al guardar el menú')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!window.confirm('¿Estás seguro de eliminar este plato? Esta acción no se puede deshacer.')) return
    setDeletingId(id)
    try {
      await api.delete(`/menus/${id}`)
      toast.success('✅ Plato eliminado')
      onRefresh()
    } catch (error: any) {
      console.error('Error deleting menu:', error)
      toast.error(error.response?.data?.message || 'Error al eliminar el plato')
    } finally {
      setDeletingId(null)
    }
  }

  const toggleAvailability = async (id: string, available: boolean) => {
    setTogglingId(id)
    try {
      await api.patch(`/menus/${id}/availability`, { available })
      toast.success(available ? '✅ Plato disponible' : '🔒 Plato no disponible')
      onRefresh()
    } catch (error: any) {
      console.error('Error updating availability:', error)
      toast.error(error.response?.data?.message || 'Error al actualizar disponibilidad')
    } finally {
      setTogglingId(null)
    }
  }

  const typeLabels = {
    food: 'Comida',
    drink: 'Bebida',
    dessert: 'Postre',
    combo: 'Combo'
  }

  const typeColors = {
    food: 'bg-orange-100 text-orange-700 border-orange-200',
    drink: 'bg-blue-100 text-blue-700 border-blue-200',
    dessert: 'bg-pink-100 text-pink-700 border-pink-200',
    combo: 'bg-purple-100 text-purple-700 border-purple-200'
  }

  // Filtrar menús según el tipo seleccionado y la búsqueda
  const filteredMenus = menus.filter(menu => {
    // Filtro por tipo
    const matchesType = filterType === 'all' || menu.type === filterType
    
    // Filtro por búsqueda (nombre o descripción)
    const matchesSearch = searchQuery === '' || 
      menu.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (menu.description && menu.description.toLowerCase().includes(searchQuery.toLowerCase()))
    
    return matchesType && matchesSearch
  })

  const filterButtons = [
    { id: 'all' as const, label: 'Todo', icon: '🍽️', count: menus.length },
    { id: 'food' as const, label: 'Comidas', icon: '🍽️', count: menus.filter(m => m.type === 'food').length },
    { id: 'drink' as const, label: 'Bebidas', icon: '🥤', count: menus.filter(m => m.type === 'drink').length },
    { id: 'dessert' as const, label: 'Postres', icon: '🍰', count: menus.filter(m => m.type === 'dessert').length },
  ]

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <div>
          <h2 className="text-3xl font-bold text-gray-900">Gestión de Menú</h2>
          <p className="text-gray-600 mt-1">Administra los platos de tu restaurante</p>
        </div>
        <Button 
          onClick={(e) => {
            e.preventDefault()
            e.stopPropagation()
            if (showForm && !editingMenu) {
              setShowForm(false)
            } else {
              setEditingMenu(null)
              setShowForm(true)
            }
          }}
          className="flex items-center gap-2 shadow-lg"
        >
          <Plus className="w-5 h-5" />
          {showForm && !editingMenu ? 'Cancelar' : 'Agregar Plato'}
        </Button>
      </div>

      {/* Filtros rápidos */}
      {menus.length > 0 && (
        <>
          <div className="mb-4 flex flex-wrap gap-3">
            {filterButtons.map((filter) => (
              <button
                key={filter.id}
                onClick={() => setFilterType(filter.id)}
                className={`px-4 py-2 rounded-xl font-semibold text-sm transition-all duration-200 flex items-center gap-2 ${
                  filterType === filter.id
                    ? 'bg-primary-500 text-white shadow-lg scale-105'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <span>{filter.icon}</span>
                <span>{filter.label}</span>
                <span className={`px-2 py-0.5 rounded-full text-xs ${
                  filterType === filter.id
                    ? 'bg-white/20 text-white'
                    : 'bg-gray-200 text-gray-600'
                }`}>
                  {filter.count}
                </span>
              </button>
            ))}
          </div>

          {/* Buscador */}
          <div className="mb-6 relative">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar por nombre o descripción..."
              className="w-full pl-12 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all outline-none"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                title="Limpiar búsqueda"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>
        </>
      )}

      {/* Menu Form Modal */}
      <AnimatePresence>
        {showForm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
            onClick={() => {
              setShowForm(false)
              setEditingMenu(null)
              setImagePreview(null)
              setFormData({
                name: '',
                description: '',
                price: '',
                image: '',
                type: 'food',
                quantity: '',
                date: new Date().toISOString().split('T')[0],
                investedAmount: '',
                profitPercentage: '30',
              })
            }}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-3xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col"
            >
              {/* Header */}
              <div className="bg-gradient-to-r from-primary-500 to-primary-600 p-6 text-white">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                      {editingMenu ? (
                        <Edit className="w-6 h-6" />
                      ) : (
                        <Plus className="w-6 h-6" />
                      )}
                    </div>
                    <div>
                      <h2 className="text-2xl font-bold">
                        {editingMenu ? 'Editar Plato' : 'Nuevo Plato'}
                      </h2>
                      <p className="text-primary-100 text-sm">
                        {editingMenu ? 'Modifica la información del plato' : 'Agrega un nuevo plato al menú'}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      setShowForm(false)
                      setEditingMenu(null)
                      setImagePreview(null)
                      setFormData({
                        name: '',
                        description: '',
                        price: '',
                        image: '',
                        type: 'food',
                        quantity: '',
                        date: new Date().toISOString().split('T')[0],
                        investedAmount: '',
                        profitPercentage: '30',
                      })
                    }}
                    className="p-2 hover:bg-white/20 rounded-full transition-colors"
                  >
                    <X className="w-6 h-6" />
                  </button>
                </div>
              </div>

              {/* Form Content */}
              <form onSubmit={handleSubmit} className="flex flex-col h-full">
                <div className="flex-1 overflow-y-auto p-6 bg-gray-50 space-y-6">
                  {/* Información Básica */}
                  <div className="bg-white rounded-2xl p-6 border border-gray-200">
                    <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                      <UtensilsCrossed className="w-5 h-5 text-primary-600" />
                      Información Básica
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="md:col-span-2">
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                          Nombre del Plato *
                        </label>
                        <input
                          type="text"
                          required
                          value={formData.name}
                          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                          className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all"
                          placeholder="Ej: Spaghetti Carbonara"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                          <Package className="w-4 h-4 inline mr-1" />
                          Tipo *
                        </label>
                        <select
                          required
                          value={formData.type}
                          onChange={(e) => setFormData({ ...formData, type: e.target.value as any })}
                          className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all"
                        >
                          <option value="food">🍽️ Comida</option>
                          <option value="drink">🥤 Bebida</option>
                          <option value="dessert">🍰 Postre</option>
                          <option value="combo">🍱 Combo</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                          Fecha del Menú *
                        </label>
                        <input
                          type="date"
                          required
                          value={formData.date}
                          onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                          className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Cálculo de Precio */}
                  <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-6 border-2 border-blue-200">
                    <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                      <DollarSign className="w-5 h-5 text-blue-600" />
                      Cálculo de Precio
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                          💰 Monto Invertido
                        </label>
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          value={formData.investedAmount}
                          onChange={(e) => setFormData({ ...formData, investedAmount: e.target.value })}
                          className="w-full px-4 py-3 border-2 border-blue-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all bg-white"
                          placeholder="0.00"
                        />
                        <p className="text-xs text-gray-500 mt-1">Costo de producción</p>
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                          📈 Porcentaje de Ganancia (%)
                        </label>
                        <input
                          type="number"
                          step="0.1"
                          min="0"
                          max="1000"
                          value={formData.profitPercentage}
                          onChange={(e) => setFormData({ ...formData, profitPercentage: e.target.value })}
                          className="w-full px-4 py-3 border-2 border-blue-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all bg-white"
                          placeholder="30"
                        />
                        <p className="text-xs text-gray-500 mt-1">Margen de ganancia</p>
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                          💵 Precio Sugerido
                        </label>
                        <div className="relative">
                          <input
                            type="text"
                            readOnly
                            value={suggestedPrice ? `$${suggestedPrice}` : '$0.00'}
                            className="w-full px-4 py-3 border-2 border-green-400 rounded-xl bg-green-50 font-bold text-green-700 text-lg"
                          />
                          {suggestedPrice && (
                            <button
                              type="button"
                              onClick={() => setFormData({ ...formData, price: suggestedPrice })}
                              className="absolute right-2 top-1/2 -translate-y-1/2 px-3 py-1.5 bg-green-500 text-white rounded-lg text-sm font-semibold hover:bg-green-600 transition-colors flex items-center gap-1"
                            >
                              <Check className="w-4 h-4" />
                              Usar
                            </button>
                          )}
                        </div>
                        <p className="text-xs text-gray-500 mt-1">Precio calculado automáticamente</p>
                      </div>
                    </div>
                  </div>

                  {/* Precio Final */}
                  <div className="bg-white rounded-2xl p-6 border border-gray-200">
                    <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                      <DollarSign className="w-5 h-5 text-primary-600" />
                      Precio de Venta *
                    </h3>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Precio Final
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        required
                        value={formData.price}
                        onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all text-lg font-semibold"
                        placeholder="0.00"
                      />
                      {suggestedPrice && parseFloat(formData.price) !== parseFloat(suggestedPrice) && (
                        <p className="text-xs text-amber-600 mt-1 flex items-center gap-1">
                          <AlertCircle className="w-3 h-3" />
                          El precio difiere del sugerido (${suggestedPrice})
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Descripción del Plato */}
                  <div className="bg-white rounded-2xl p-6 border border-gray-200">
                    <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                      <FileText className="w-5 h-5 text-primary-600" />
                      Descripción del Plato
                    </h3>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Describe tu plato
                      </label>
                      <textarea
                        value={formData.description}
                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                        rows={5}
                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all resize-none"
                        placeholder="Describe los ingredientes, preparación, sabor, presentación y cualquier detalle especial que haga único este plato..."
                      />
                      <p className="text-xs text-gray-500 mt-2">
                        {formData.description.length} caracteres
                      </p>
                    </div>
                  </div>

                  {/* Imagen del Plato */}
                  <div className="bg-white rounded-2xl p-6 border border-gray-200">
                    <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                      <ImageIcon className="w-5 h-5 text-primary-600" />
                      Imagen del Plato
                    </h3>
                    <div className="space-y-4">
                      {imagePreview ? (
                        <div className="relative group">
                          <div className="relative w-full h-64 rounded-2xl overflow-hidden border-2 border-primary-200 shadow-lg">
                            <img
                              src={imagePreview}
                              alt="Preview"
                              className="w-full h-full object-cover"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                            <button
                              type="button"
                              onClick={() => {
                                setImagePreview(null)
                                setFormData({ ...formData, image: '' })
                              }}
                              className="absolute top-3 right-3 p-2 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors opacity-0 group-hover:opacity-100 shadow-lg"
                            >
                              <X className="w-4 h-4" />
                            </button>
                            <div className="absolute bottom-3 left-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity">
                              <p className="text-white text-sm font-semibold">Imagen cargada</p>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <label className="flex flex-col items-center justify-center w-full h-64 border-2 border-dashed border-gray-300 rounded-2xl bg-gradient-to-br from-gray-50 to-gray-100 hover:from-primary-50 hover:to-primary-100 hover:border-primary-400 cursor-pointer transition-all duration-300 group">
                          <div className="flex flex-col items-center justify-center pt-5 pb-6">
                            {uploadingImage ? (
                              <>
                                <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary-200 border-t-primary-600 mb-4"></div>
                                <p className="text-sm font-semibold text-gray-700">Cargando imagen...</p>
                              </>
                            ) : (
                              <>
                                <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mb-4 group-hover:bg-primary-200 transition-colors">
                                  <ImageIcon className="w-8 h-8 text-primary-600" />
                                </div>
                                <p className="text-sm font-semibold text-gray-700 mb-1">
                                  <span className="text-primary-600">Haz clic para subir</span> o arrastra una imagen
                                </p>
                                <p className="text-xs text-gray-500">
                                  PNG, JPG, GIF hasta 5MB
                                </p>
                              </>
                            )}
                          </div>
                          <input
                            type="file"
                            accept="image/*"
                            onChange={handleImageUpload}
                            className="hidden"
                            disabled={uploadingImage}
                          />
                        </label>
                      )}
                      
                      {/* Opción alternativa: URL */}
                      <div className="relative">
                        <div className="absolute inset-0 flex items-center">
                          <div className="w-full border-t border-gray-300"></div>
                        </div>
                        <div className="relative flex justify-center text-sm">
                          <span className="px-4 bg-white text-gray-500 font-medium">O ingresa una URL</span>
                        </div>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                          URL de Imagen
                        </label>
                        <div className="flex gap-2">
                          <input
                            type="url"
                            value={formData.image && !imagePreview ? formData.image : (imagePreview && imagePreview.startsWith('http') ? imagePreview : '')}
                            onChange={(e) => {
                              const url = e.target.value
                              setFormData({ ...formData, image: url })
                              if (url && url.startsWith('http')) {
                                setImagePreview(url)
                              } else if (!url) {
                                setImagePreview(null)
                              }
                            }}
                            className="flex-1 px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all"
                            placeholder="https://ejemplo.com/imagen.jpg"
                          />
                          {formData.image && (
                            <button
                              type="button"
                              onClick={() => {
                                setFormData({ ...formData, image: '' })
                                setImagePreview(null)
                              }}
                              className="px-4 py-3 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-colors"
                            >
                              <X className="w-5 h-5" />
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Información Adicional */}
                  <div className="bg-white rounded-2xl p-6 border border-gray-200">
                    <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                      <Settings className="w-5 h-5 text-primary-600" />
                      Información Adicional
                    </h3>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Cantidad Disponible
                      </label>
                      <input
                        type="number"
                        min="0"
                        value={formData.quantity}
                        onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all"
                        placeholder="0 (ilimitado si está vacío)"
                      />
                      <p className="text-xs text-gray-500 mt-1">Deja vacío para cantidad ilimitada</p>
                    </div>
                  </div>
                </div>

                {/* Footer */}
                <div className="p-6 bg-white border-t border-gray-200 flex gap-3">
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={() => {
                      setShowForm(false)
                      setEditingMenu(null)
                      setImagePreview(null)
                      setFormData({
                        name: '',
                        description: '',
                        price: '',
                        image: '',
                        type: 'food',
                        quantity: '',
                        date: new Date().toISOString().split('T')[0],
                        investedAmount: '',
                        profitPercentage: '30',
                      })
                    }}
                    className="px-6"
                  >
                    <X className="w-5 h-5 mr-2" />
                    Cancelar
                  </Button>
                  <Button
                    type="submit"
                    isLoading={loading}
                    className="flex-1 flex items-center justify-center gap-2"
                  >
                    <Save className="w-5 h-5" />
                    {editingMenu ? 'Actualizar Plato' : 'Crear Plato'}
                  </Button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {menus.length === 0 ? (
        <Card className="p-12 text-center">
          <UtensilsCrossed className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-600 text-lg">No hay platos en el menú aún</p>
          <p className="text-gray-500 mt-2">Comienza agregando tu primer plato</p>
        </Card>
      ) : filteredMenus.length === 0 ? (
        <Card className="p-12 text-center">
          <UtensilsCrossed className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-600 text-lg">
            {searchQuery 
              ? `No se encontraron resultados para "${searchQuery}"`
              : filterType === 'food' 
                ? 'No hay comidas en el menú'
                : filterType === 'drink' 
                  ? 'No hay bebidas en el menú'
                  : filterType === 'dessert'
                    ? 'No hay postres en el menú'
                    : 'No hay platos en el menú'}
          </p>
          <p className="text-gray-500 mt-2">
            {searchQuery 
              ? 'Intenta con otros términos de búsqueda'
              : 'Agrega algunos platos de este tipo'}
          </p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredMenus.map((menu, index) => (
            <motion.div
              key={menu.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <Card className="p-6 hover:shadow-xl transition-all duration-300 border-2 border-transparent hover:border-primary-200 h-full flex flex-col">
                {menu.image ? (
                  <div className="relative w-full h-48 mb-4 rounded-xl overflow-hidden">
                    <img
                      src={menu.image}
                      alt={menu.name}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = 'none'
                      }}
                    />
                    <div className={`absolute top-3 right-3 px-3 py-1 rounded-full text-xs font-bold border-2 ${typeColors[menu.type]}`}>
                      {typeLabels[menu.type]}
                    </div>
                  </div>
                ) : (
                  <div className="w-full h-48 mb-4 rounded-xl bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
                    <UtensilsCrossed className="w-16 h-16 text-gray-400" />
                  </div>
                )}
                <div className="flex-1">
                  <h3 className="font-bold text-xl mb-2 text-gray-900">{menu.name}</h3>
                  {menu.description && (
                    <p className="text-sm text-gray-600 mb-4 line-clamp-2">{menu.description}</p>
                  )}
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-2xl font-bold text-primary-600">
                      ${Number(menu.price || 0).toFixed(2)}
                    </span>
                    {menu.quantity > 0 && (
                      <span className="text-sm text-gray-500">
                        {menu.quantity} disponibles
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex gap-2 pt-4 border-t border-gray-200">
                  <button
                    onClick={(e) => {
                      e.preventDefault()
                      e.stopPropagation()
                      toggleAvailability(menu.id, !menu.available)
                    }}
                    disabled={togglingId === menu.id}
                    className={`flex-1 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                      menu.available
                        ? 'bg-green-100 text-green-700 hover:bg-green-200'
                        : 'bg-red-100 text-red-700 hover:bg-red-200'
                    } disabled:opacity-50`}
                  >
                    {togglingId === menu.id ? '...' : menu.available ? '✓ Disponible' : '✗ No disponible'}
                  </button>
                  <button
                    onClick={(e) => {
                      e.preventDefault()
                      e.stopPropagation()
                      setEditingMenu(menu)
                    }}
                    className="px-4 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors"
                    title="Editar"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  <button
                    onClick={(e) => {
                      e.preventDefault()
                      e.stopPropagation()
                      handleDelete(menu.id)
                    }}
                    disabled={deletingId === menu.id}
                    className="px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors disabled:opacity-50"
                    title="Eliminar"
                  >
                    {deletingId === menu.id ? (
                      <div className="w-4 h-4 border-2 border-red-700 border-t-transparent rounded-full animate-spin"></div>
                    ) : (
                      <Trash2 className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </Card>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  )
}

// Hours Section Component
function HoursSection({
  restaurant,
  onUpdate,
}: {
  restaurant: Restaurant
  onUpdate: () => void
}) {
  const [openingHours, setOpeningHours] = useState(restaurant.openingHours || {})
  const [loading, setLoading] = useState(false)
  const [hasChanges, setHasChanges] = useState(false)

  const days = [
    { key: 'monday', label: 'Lunes', short: 'Lun' },
    { key: 'tuesday', label: 'Martes', short: 'Mar' },
    { key: 'wednesday', label: 'Miércoles', short: 'Mié' },
    { key: 'thursday', label: 'Jueves', short: 'Jue' },
    { key: 'friday', label: 'Viernes', short: 'Vie' },
    { key: 'saturday', label: 'Sábado', short: 'Sáb' },
    { key: 'sunday', label: 'Domingo', short: 'Dom' },
  ]

  useEffect(() => {
    const original = JSON.stringify(restaurant.openingHours || {})
    const current = JSON.stringify(openingHours)
    setHasChanges(original !== current)
  }, [openingHours, restaurant.openingHours])

  const handleSave = async () => {
    setLoading(true)
    try {
      await api.patch(`/restaurants/${restaurant.id}/opening-hours`, {
        openingHours,
      })
      toast.success('✅ Horarios actualizados exitosamente')
      setHasChanges(false)
      onUpdate()
    } catch (error: any) {
      console.error('Error updating hours:', error)
      toast.error(error.response?.data?.message || 'Error al actualizar los horarios')
    } finally {
      setLoading(false)
    }
  }

  const updateDay = (day: string, field: string, value: any) => {
    setOpeningHours({
      ...openingHours,
      [day]: {
        ...(openingHours[day] || {}),
        [field]: value,
      },
    })
  }

  const toggleDay = (day: string) => {
    const current = openingHours[day] || { open: false }
    updateDay(day, 'open', !current.open)
    if (!current.open) {
      updateDay(day, 'openTime', '09:00')
      updateDay(day, 'closeTime', '22:00')
    }
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <div>
          <h2 className="text-3xl font-bold text-gray-900">Horarios de Atención</h2>
          <p className="text-gray-600 mt-1">Configura los horarios de tu restaurante</p>
        </div>
        <Button 
          onClick={(e) => {
            e.preventDefault()
            e.stopPropagation()
            handleSave()
          }}
          isLoading={loading}
          disabled={!hasChanges}
          className="flex items-center gap-2 shadow-lg"
        >
          <Save className="w-5 h-5" />
          Guardar Cambios
        </Button>
      </div>

      <Card className="p-8 shadow-xl">
        <div className="space-y-3">
          {days.map((day) => {
            const dayHours = openingHours[day.key] || { open: false, openTime: '09:00', closeTime: '22:00' }
            return (
              <motion.div
                key={day.key}
                whileHover={{ scale: 1.01 }}
                className={`flex items-center gap-4 p-5 rounded-xl border-2 transition-all ${
                  dayHours.open
                    ? 'border-primary-200 bg-primary-50/50'
                    : 'border-gray-200 bg-gray-50'
                }`}
              >
                <div className="w-32">
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={dayHours.open || false}
                      onChange={(e) => {
                        e.preventDefault()
                        e.stopPropagation()
                        toggleDay(day.key)
                      }}
                      className="w-5 h-5 text-primary-600 border-gray-300 rounded focus:ring-primary-500 cursor-pointer"
                    />
                    <span className="font-bold text-gray-900">{day.label}</span>
                  </label>
                </div>
                {dayHours.open ? (
                  <div className="flex items-center gap-4 flex-1">
                    <div className="flex items-center gap-2">
                      <Clock className="w-5 h-5 text-gray-500" />
                      <input
                        type="time"
                        value={dayHours.openTime || '09:00'}
                        onChange={(e) => {
                          e.preventDefault()
                          e.stopPropagation()
                          updateDay(day.key, 'openTime', e.target.value)
                        }}
                        className="px-4 py-2 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 font-semibold"
                      />
                    </div>
                    <span className="text-gray-500 font-semibold">a</span>
                    <div className="flex items-center gap-2">
                      <input
                        type="time"
                        value={dayHours.closeTime || '22:00'}
                        onChange={(e) => {
                          e.preventDefault()
                          e.stopPropagation()
                          updateDay(day.key, 'closeTime', e.target.value)
                        }}
                        className="px-4 py-2 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 font-semibold"
                      />
                      <Clock className="w-5 h-5 text-gray-500" />
                    </div>
                  </div>
                ) : (
                  <div className="flex-1 text-gray-400 font-medium">Cerrado</div>
                )}
              </motion.div>
            )
          })}
        </div>
      </Card>
    </div>
  )
}

// Promotions Section Component
function PromotionsSection({
  restaurant,
  promotions,
  onRefresh,
  showForm,
  setShowForm,
  editingPromotion,
  setEditingPromotion,
}: {
  restaurant: Restaurant
  promotions: Promotion[]
  onRefresh: () => void
  showForm: boolean
  setShowForm: (show: boolean) => void
  editingPromotion: Promotion | null
  setEditingPromotion: (promo: Promotion | null) => void
}) {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    image: '',
    discount: '',
    startDate: new Date().toISOString().split('T')[0],
    endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
  })
  const [loading, setLoading] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  useEffect(() => {
    if (editingPromotion) {
      setFormData({
        title: editingPromotion.title,
        description: editingPromotion.description,
        image: editingPromotion.image || '',
        discount: editingPromotion.discount?.toString() || '',
        startDate: editingPromotion.startDate.split('T')[0],
        endDate: editingPromotion.endDate.split('T')[0],
      })
      setShowForm(true)
    }
  }, [editingPromotion, setShowForm])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setLoading(true)
    try {
      const data = {
        ...formData,
        discount: formData.discount ? parseFloat(formData.discount) : undefined,
        restaurantId: restaurant.id,
      }

      if (editingPromotion) {
        await api.patch(`/promotions/${editingPromotion.id}`, data)
        toast.success('✅ Promoción actualizada exitosamente')
      } else {
        await api.post('/promotions', data)
        toast.success('✅ Promoción creada exitosamente')
      }

      setShowForm(false)
      setEditingPromotion(null)
      setFormData({
        title: '',
        description: '',
        image: '',
        discount: '',
        startDate: new Date().toISOString().split('T')[0],
        endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      })
      onRefresh()
    } catch (error: any) {
      console.error('Error saving promotion:', error)
      toast.error(error.response?.data?.message || 'Error al guardar la promoción')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!window.confirm('¿Estás seguro de eliminar esta promoción?')) return
    setDeletingId(id)
    try {
      await api.delete(`/promotions/${id}`)
      toast.success('✅ Promoción eliminada')
      onRefresh()
    } catch (error: any) {
      console.error('Error deleting promotion:', error)
      toast.error(error.response?.data?.message || 'Error al eliminar la promoción')
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <div>
          <h2 className="text-3xl font-bold text-gray-900">Promociones y Combos</h2>
          <p className="text-gray-600 mt-1">Crea ofertas especiales para atraer clientes</p>
        </div>
        <Button 
          onClick={(e) => {
            e.preventDefault()
            e.stopPropagation()
            if (showForm && !editingPromotion) {
              setShowForm(false)
            } else {
              setEditingPromotion(null)
              setShowForm(true)
            }
          }}
          className="flex items-center gap-2 shadow-lg"
        >
          <Plus className="w-5 h-5" />
          {showForm && !editingPromotion ? 'Cancelar' : 'Nueva Promoción'}
        </Button>
      </div>

      <AnimatePresence>
        {showForm && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
          >
            <Card className="p-8 mb-8 shadow-xl border-2 border-primary-100">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-2xl font-bold text-gray-900">
                  {editingPromotion ? '✏️ Editar Promoción' : '➕ Nueva Promoción'}
                </h3>
                <button
                  onClick={(e) => {
                    e.preventDefault()
                    e.stopPropagation()
                    setShowForm(false)
                    setEditingPromotion(null)
                  }}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="md:col-span-2">
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Título de la Promoción *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all"
                      placeholder="Ej: Combo Familiar"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      <TrendingUp className="w-4 h-4 inline mr-1" />
                      Descuento (%)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      max="100"
                      value={formData.discount}
                      onChange={(e) => setFormData({ ...formData, discount: e.target.value })}
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all"
                      placeholder="Ej: 20"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      <ImageIcon className="w-4 h-4 inline mr-1" />
                      URL de Imagen
                    </label>
                    <input
                      type="url"
                      value={formData.image}
                      onChange={(e) => setFormData({ ...formData, image: e.target.value })}
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all"
                      placeholder="https://ejemplo.com/promocion.jpg"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Fecha de Inicio *
                    </label>
                    <input
                      type="date"
                      required
                      value={formData.startDate}
                      onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Fecha de Fin *
                    </label>
                    <input
                      type="date"
                      required
                      value={formData.endDate}
                      onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Descripción *
                  </label>
                  <textarea
                    required
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    rows={4}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all resize-none"
                    placeholder="Describe la promoción, qué incluye, condiciones, etc..."
                  />
                </div>
                <div className="flex gap-3 pt-4">
                  <Button 
                    type="submit" 
                    isLoading={loading}
                    className="flex-1 flex items-center justify-center gap-2"
                  >
                    <Save className="w-5 h-5" />
                    {editingPromotion ? 'Actualizar Promoción' : 'Crear Promoción'}
                  </Button>
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={(e) => {
                      e.preventDefault()
                      e.stopPropagation()
                      setShowForm(false)
                      setEditingPromotion(null)
                    }}
                    className="px-6"
                  >
                    <X className="w-5 h-5" />
                  </Button>
                </div>
              </form>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {promotions.length === 0 ? (
        <Card className="p-12 text-center">
          <Tag className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-600 text-lg">No hay promociones aún</p>
          <p className="text-gray-500 mt-2">Crea tu primera promoción para atraer más clientes</p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {promotions.map((promo, index) => (
            <motion.div
              key={promo.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <Card className="p-6 hover:shadow-xl transition-all duration-300 border-2 border-transparent hover:border-primary-200 h-full flex flex-col">
                {promo.image ? (
                  <div className="relative w-full h-48 mb-4 rounded-xl overflow-hidden">
                    <img
                      src={promo.image}
                      alt={promo.title}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = 'none'
                      }}
                    />
                    {promo.discount && (
                      <div className="absolute top-3 right-3 px-3 py-1 bg-red-500 text-white rounded-full text-sm font-bold shadow-lg">
                        -{promo.discount}%
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="w-full h-48 mb-4 rounded-xl bg-gradient-to-br from-primary-100 to-primary-200 flex items-center justify-center">
                    <Tag className="w-16 h-16 text-primary-400" />
                  </div>
                )}
                <div className="flex-1">
                  <h3 className="font-bold text-xl mb-2 text-gray-900">{promo.title}</h3>
                  <p className="text-sm text-gray-600 mb-4 line-clamp-3">{promo.description}</p>
                  {promo.discount && (
                    <div className="mb-4">
                      <span className="inline-block px-3 py-1 bg-primary-100 text-primary-700 rounded-lg text-sm font-bold">
                        {promo.discount}% de descuento
                      </span>
                    </div>
                  )}
                  <div className="text-xs text-gray-500 mb-4">
                    <Calendar className="w-4 h-4 inline mr-1" />
                    {new Date(promo.startDate).toLocaleDateString()} - {new Date(promo.endDate).toLocaleDateString()}
                  </div>
                </div>
                <div className="flex gap-2 pt-4 border-t border-gray-200">
                  <button
                    onClick={(e) => {
                      e.preventDefault()
                      e.stopPropagation()
                      setEditingPromotion(promo)
                    }}
                    className="flex-1 px-4 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors font-semibold flex items-center justify-center gap-2"
                  >
                    <Edit className="w-4 h-4" />
                    Editar
                  </button>
                  <button
                    onClick={(e) => {
                      e.preventDefault()
                      e.stopPropagation()
                      handleDelete(promo.id)
                    }}
                    disabled={deletingId === promo.id}
                    className="px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors disabled:opacity-50"
                    title="Eliminar"
                  >
                    {deletingId === promo.id ? (
                      <div className="w-4 h-4 border-2 border-red-700 border-t-transparent rounded-full animate-spin"></div>
                    ) : (
                      <Trash2 className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </Card>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  )
}

// Orders Section Component
function OrdersSection({
  orders,
  onUpdateStatus,
  updatingOrder,
}: {
  orders: Order[]
  onUpdateStatus: (id: string, status: string) => void
  updatingOrder: string | null
}) {
  const statusConfig = {
    pending: { 
      label: 'Pendiente', 
      color: 'bg-yellow-100 text-yellow-800 border-yellow-300',
      icon: '⏳',
      next: 'confirmed',
      nextLabel: 'Confirmar'
    },
    confirmed: { 
      label: 'Confirmado', 
      color: 'bg-blue-100 text-blue-800 border-blue-300',
      icon: '✓',
      next: 'preparing',
      nextLabel: 'En Preparación'
    },
    preparing: { 
      label: 'En Preparación', 
      color: 'bg-orange-100 text-orange-800 border-orange-300',
      icon: '👨‍🍳',
      next: 'ready',
      nextLabel: 'Listo'
    },
    ready: { 
      label: 'Listo', 
      color: 'bg-green-100 text-green-800 border-green-300',
      icon: '✅',
      next: 'delivered',
      nextLabel: 'Entregado'
    },
    delivered: { 
      label: 'Entregado', 
      color: 'bg-gray-100 text-gray-800 border-gray-300',
      icon: '📦',
      next: null
    },
    cancelled: { 
      label: 'Cancelado', 
      color: 'bg-red-100 text-red-800 border-red-300',
      icon: '❌',
      next: null
    },
  }

  const activeOrders = orders.filter(o => o.status !== 'delivered' && o.status !== 'cancelled')
  const completedOrders = orders.filter(o => o.status === 'delivered' || o.status === 'cancelled')

  return (
    <div>
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-gray-900">Pedidos</h2>
        <p className="text-gray-600 mt-1">Gestiona los pedidos de tus clientes</p>
      </div>

      {orders.length === 0 ? (
        <Card className="p-12 text-center">
          <ShoppingCart className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-600 text-lg">No hay pedidos aún</p>
          <p className="text-gray-500 mt-2">Los pedidos aparecerán aquí cuando los clientes realicen órdenes</p>
        </Card>
      ) : (
        <div className="space-y-6">
          {activeOrders.length > 0 && (
            <div>
              <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                Pedidos Activos ({activeOrders.length})
              </h3>
              <div className="space-y-4">
                {activeOrders.map((order, index) => {
                  const config = statusConfig[order.status]
                  return (
                    <motion.div
                      key={order.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                    >
                      <Card className="p-6 hover:shadow-xl transition-all border-2 border-gray-200">
                        <div className="flex justify-between items-start mb-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <h3 className="font-bold text-xl text-gray-900">
                                Pedido #{order.id.slice(0, 8).toUpperCase()}
                              </h3>
                              <span className={`px-3 py-1 rounded-full text-sm font-bold border-2 ${config.color}`}>
                                {config.icon} {config.label}
                              </span>
                            </div>
                            <div className="flex items-center gap-4 text-sm text-gray-600 mt-2">
                              <div className="flex items-center gap-1">
                                <Users className="w-4 h-4" />
                                <span className="font-semibold">{order.client.firstName} {order.client.lastName}</span>
                              </div>
                              <div className="flex items-center gap-1">
                                <Mail className="w-4 h-4" />
                                <span>{order.client.email}</span>
                              </div>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-3xl font-bold text-primary-600">${Number(order.total || 0).toFixed(2)}</p>
                            <p className="text-xs text-gray-500 mt-1">
                              {new Date(order.createdAt).toLocaleString()}
                            </p>
                          </div>
                        </div>

                        <div className="mb-4 p-4 bg-gray-50 rounded-xl">
                          <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                            <Package className="w-5 h-5" />
                            Items del Pedido
                          </h4>
                          <ul className="space-y-2">
                            {order.items.map((item) => (
                              <li key={item.id} className="flex justify-between items-center text-sm">
                                <span className="text-gray-700">
                                  <span className="font-bold text-primary-600">{item.quantity}x</span> {item.menu.name}
                                </span>
                                <span className="font-semibold text-gray-900">${Number(item.price || 0).toFixed(2)}</span>
                              </li>
                            ))}
                          </ul>
                        </div>

                        {order.deliveryAddress && (
                          <div className="mb-4 p-3 bg-blue-50 rounded-lg flex items-start gap-2">
                            <MapPin className="w-5 h-5 text-blue-600 mt-0.5" />
                            <div>
                              <p className="text-xs font-semibold text-blue-900">Dirección de Entrega</p>
                              <p className="text-sm text-blue-700">{order.deliveryAddress}</p>
                            </div>
                          </div>
                        )}

                        {order.notes && (
                          <div className="mb-4 p-3 bg-yellow-50 rounded-lg">
                            <p className="text-xs font-semibold text-yellow-900 mb-1">Nota del Cliente</p>
                            <p className="text-sm text-yellow-800">{order.notes}</p>
                          </div>
                        )}

                        {config.next && (
                          <Button
                            onClick={(e) => {
                              e.preventDefault()
                              e.stopPropagation()
                              onUpdateStatus(order.id, config.next!)
                            }}
                            isLoading={updatingOrder === order.id}
                            className="w-full flex items-center justify-center gap-2"
                          >
                            <Check className="w-5 h-5" />
                            Marcar como {config.nextLabel}
                          </Button>
                        )}
                      </Card>
                    </motion.div>
                  )
                })}
              </div>
            </div>
          )}

          {completedOrders.length > 0 && (
            <div className="mt-8">
              <h3 className="text-xl font-bold text-gray-900 mb-4">Pedidos Completados ({completedOrders.length})</h3>
              <div className="space-y-3">
                {completedOrders.map((order) => {
                  const config = statusConfig[order.status]
                  return (
                    <Card key={order.id} className="p-4 opacity-75">
                      <div className="flex justify-between items-center">
                        <div>
                          <span className="font-semibold">Pedido #{order.id.slice(0, 8).toUpperCase()}</span>
                          <span className={`ml-3 px-2 py-1 rounded-full text-xs font-bold border ${config.color}`}>
                            {config.icon} {config.label}
                          </span>
                        </div>
                        <div className="text-right">
                          <span className="font-bold text-gray-900">${Number(order.total || 0).toFixed(2)}</span>
                          <p className="text-xs text-gray-500">{new Date(order.createdAt).toLocaleDateString()}</p>
                        </div>
                      </div>
                    </Card>
                  )
                })}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// Reservations Section Component
function ReservationsSection({
  reservations,
  onUpdateStatus,
  updatingReservation,
}: {
  reservations: Reservation[]
  onUpdateStatus: (id: string, status: string) => void
  updatingReservation: string | null
}) {
  const statusConfig = {
    pending: { 
      label: 'Pendiente', 
      color: 'bg-yellow-100 text-yellow-800 border-yellow-300',
      icon: '⏳'
    },
    confirmed: { 
      label: 'Confirmada', 
      color: 'bg-blue-100 text-blue-800 border-blue-300',
      icon: '✓'
    },
    cancelled: { 
      label: 'Cancelada', 
      color: 'bg-red-100 text-red-800 border-red-300',
      icon: '❌'
    },
    completed: { 
      label: 'Completada', 
      color: 'bg-gray-100 text-gray-800 border-gray-300',
      icon: '✅'
    },
  }

  const activeReservations = reservations.filter(r => r.status === 'pending' || r.status === 'confirmed')
  const completedReservations = reservations.filter(r => r.status === 'completed' || r.status === 'cancelled')

  return (
    <div>
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-gray-900">Reservas</h2>
        <p className="text-gray-600 mt-1">Gestiona las reservas de tus clientes</p>
      </div>

      {reservations.length === 0 ? (
        <Card className="p-12 text-center">
          <Calendar className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-600 text-lg">No hay reservas aún</p>
          <p className="text-gray-500 mt-2">Las reservas aparecerán aquí cuando los clientes las realicen</p>
        </Card>
      ) : (
        <div className="space-y-6">
          {activeReservations.length > 0 && (
            <div>
              <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                Reservas Activas ({activeReservations.length})
              </h3>
              <div className="space-y-4">
                {activeReservations.map((reservation, index) => {
                  const config = statusConfig[reservation.status]
                  return (
                    <motion.div
                      key={reservation.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                    >
                      <Card className="p-6 hover:shadow-xl transition-all border-2 border-gray-200">
                        <div className="flex justify-between items-start mb-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <h3 className="font-bold text-xl text-gray-900">
                                Reserva #{reservation.id.slice(0, 8).toUpperCase()}
                              </h3>
                              <span className={`px-3 py-1 rounded-full text-sm font-bold border-2 ${config.color}`}>
                                {config.icon} {config.label}
                              </span>
                            </div>
                            <div className="flex items-center gap-4 text-sm text-gray-600 mt-2">
                              <div className="flex items-center gap-1">
                                <Users className="w-4 h-4" />
                                <span className="font-semibold">{reservation.client.firstName} {reservation.client.lastName}</span>
                              </div>
                              <div className="flex items-center gap-1">
                                <Mail className="w-4 h-4" />
                                <span>{reservation.client.email}</span>
                              </div>
                            </div>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                          <div className="space-y-3 p-4 bg-gray-50 rounded-xl">
                            <div>
                              <p className="text-xs font-semibold text-gray-500 uppercase mb-1">Fecha</p>
                              <p className="font-bold text-gray-900 flex items-center gap-1">
                                <Calendar className="w-4 h-4" />
                                {new Date(reservation.date).toLocaleDateString('es-ES', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                              </p>
                            </div>
                            {reservation.reservationType === 'dine-in' && reservation.time && (
                              <>
                                <div>
                                  <p className="text-xs font-semibold text-gray-500 uppercase mb-1">Hora</p>
                                  <p className="font-bold text-gray-900 flex items-center gap-1">
                                    <Clock className="w-4 h-4" />
                                    {reservation.time}
                                  </p>
                                </div>
                                {reservation.numberOfGuests && (
                                  <div>
                                    <p className="text-xs font-semibold text-gray-500 uppercase mb-1">Personas</p>
                                    <p className="font-bold text-gray-900 flex items-center gap-1">
                                      <Users className="w-4 h-4" />
                                      {reservation.numberOfGuests} {reservation.numberOfGuests === 1 ? 'persona' : 'personas'}
                                    </p>
                                  </div>
                                )}
                              </>
                            )}
                            <div>
                              <p className="text-xs font-semibold text-gray-500 uppercase mb-1">Tipo</p>
                              <div className="flex items-center gap-2">
                                {reservation.reservationType === 'dine-in' ? (
                                  <>
                                    <UtensilsCrossed className="w-4 h-4 text-orange-500" />
                                    <span className="px-3 py-1 bg-orange-100 text-orange-700 rounded-full text-xs font-semibold">Comer en el lugar</span>
                                  </>
                                ) : (
                                  <>
                                    <ShoppingBag className="w-4 h-4 text-blue-500" />
                                    <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-semibold">Para llevar</span>
                                  </>
                                )}
                              </div>
                            </div>
                          </div>
                          {reservation.menuItems && reservation.menuItems.length > 0 && (
                            <div className="p-4 bg-gray-50 rounded-xl">
                              <p className="text-xs font-semibold text-gray-500 uppercase mb-3">Platos Reservados</p>
                              <div className="space-y-2">
                                {reservation.menuItems.map((item, idx) => (
                                  <div key={idx} className="flex items-center justify-between text-sm bg-white p-2 rounded-lg border border-gray-200">
                                    <span className="text-gray-700 font-medium">{item.name}</span>
                                    <div className="flex items-center gap-3">
                                      <span className="text-gray-500">x{item.quantity}</span>
                                      <span className="font-semibold text-gray-900">${(item.price * item.quantity).toFixed(2)}</span>
                                    </div>
                                  </div>
                                ))}
                                <div className="flex items-center justify-between pt-2 mt-2 border-t-2 border-gray-300">
                                  <span className="font-bold text-gray-900">Total:</span>
                                  <span className="font-bold text-lg text-orange-600">
                                    ${reservation.menuItems.reduce((sum, item) => sum + (item.price * item.quantity), 0).toFixed(2)}
                                  </span>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>

                        {reservation.notes && (
                          <div className="mb-4 p-3 bg-yellow-50 rounded-lg">
                            <p className="text-xs font-semibold text-yellow-900 mb-1">Nota del Cliente</p>
                            <p className="text-sm text-yellow-800">{reservation.notes}</p>
                          </div>
                        )}

                        <div className="flex gap-2">
                          {reservation.status === 'pending' && (
                            <>
                              <Button
                                onClick={(e) => {
                                  e.preventDefault()
                                  e.stopPropagation()
                                  onUpdateStatus(reservation.id, 'confirmed')
                                }}
                                isLoading={updatingReservation === reservation.id}
                                className="flex-1 flex items-center justify-center gap-2"
                              >
                                <Check className="w-5 h-5" />
                                Confirmar Reserva
                              </Button>
                              <Button
                                onClick={(e) => {
                                  e.preventDefault()
                                  e.stopPropagation()
                                  onUpdateStatus(reservation.id, 'cancelled')
                                }}
                                variant="secondary"
                                isLoading={updatingReservation === reservation.id}
                                className="px-6"
                              >
                                <X className="w-5 h-5" />
                              </Button>
                            </>
                          )}
                          {reservation.status === 'confirmed' && (
                            <Button
                              onClick={(e) => {
                                e.preventDefault()
                                e.stopPropagation()
                                onUpdateStatus(reservation.id, 'completed')
                              }}
                              isLoading={updatingReservation === reservation.id}
                              className="w-full flex items-center justify-center gap-2"
                            >
                              <Check className="w-5 h-5" />
                              Marcar como Completada
                            </Button>
                          )}
                        </div>

                        <p className="text-xs text-gray-500 mt-4">
                          Creada: {new Date(reservation.createdAt).toLocaleString()}
                        </p>
                      </Card>
                    </motion.div>
                  )
                })}
              </div>
            </div>
          )}

          {completedReservations.length > 0 && (
            <div className="mt-8">
              <h3 className="text-xl font-bold text-gray-900 mb-4">Reservas Completadas ({completedReservations.length})</h3>
              <div className="space-y-3">
                {completedReservations.map((reservation) => {
                  const config = statusConfig[reservation.status]
                  return (
                    <Card key={reservation.id} className="p-4 opacity-75">
                      <div className="flex justify-between items-center">
                        <div>
                          <span className="font-semibold">Reserva #{reservation.id.slice(0, 8).toUpperCase()}</span>
                          <span className={`ml-3 px-2 py-1 rounded-full text-xs font-bold border ${config.color}`}>
                            {config.icon} {config.label}
                          </span>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-semibold">{new Date(reservation.date).toLocaleDateString()} {reservation.time}</p>
                          <p className="text-xs text-gray-500">{reservation.numberOfGuests} personas</p>
                        </div>
                      </div>
                    </Card>
                  )
                })}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// Reviews Section Component
function ReviewsSection({ reviews, restaurant }: { reviews: Review[], restaurant: Restaurant }) {
  return (
    <div>
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold text-gray-900">Comentarios y Reseñas</h2>
            <p className="text-gray-600 mt-1">Lee lo que dicen tus clientes sobre tu restaurante</p>
          </div>
          <div className="text-right">
              <div className="flex items-center gap-2">
                <Star className="w-8 h-8 fill-yellow-400 text-yellow-400" />
                <div>
                  <p className="text-3xl font-bold text-gray-900">{Number(restaurant.rating || 0).toFixed(1)}</p>
                  <p className="text-sm text-gray-500">{restaurant.totalReviews || 0} {(restaurant.totalReviews || 0) === 1 ? 'reseña' : 'reseñas'}</p>
                </div>
              </div>
          </div>
        </div>
      </div>

      {reviews.length === 0 ? (
        <Card className="p-12 text-center">
          <MessageSquare className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-600 text-lg">No hay comentarios aún</p>
          <p className="text-gray-500 mt-2">Las reseñas de tus clientes aparecerán aquí</p>
        </Card>
      ) : (
        <div className="space-y-4">
          {reviews.map((review, index) => (
            <motion.div
              key={review.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <Card className="p-6 hover:shadow-lg transition-all">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="font-bold text-lg text-gray-900 mb-2">
                      {review.client.firstName} {review.client.lastName}
                    </h3>
                    <div className="flex items-center gap-1">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          className={`w-5 h-5 ${
                            i < review.rating
                              ? 'fill-yellow-400 text-yellow-400'
                              : 'text-gray-300'
                          }`}
                        />
                      ))}
                      <span className="ml-2 text-sm font-semibold text-gray-700">{review.rating}/5</span>
                    </div>
                  </div>
                  <p className="text-sm text-gray-500">
                    {new Date(review.createdAt).toLocaleDateString('es-ES', { 
                      year: 'numeric', 
                      month: 'long', 
                      day: 'numeric' 
                    })}
                  </p>
                </div>
                <p className="text-gray-700 leading-relaxed">{review.comment}</p>
              </Card>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  )
}

// Restaurant Settings Section Component
function RestaurantSettingsSection({ 
  restaurant, 
  onUpdate,
  onOpenChat 
}: { 
  restaurant: Restaurant
  onUpdate: () => void
  onOpenChat: () => void
}) {
  const [formData, setFormData] = useState({
    name: restaurant.name,
    description: restaurant.description || '',
    cuisine: restaurant.cuisine || '',
    address: restaurant.address,
    phone: restaurant.phone || '',
    email: restaurant.email || '',
    latitude: restaurant.latitude || 0,
    longitude: restaurant.longitude || 0,
    image: restaurant.image || '',
    logo: restaurant.logo || '',
    maxWaitTimeEnabled: restaurant.maxWaitTimeEnabled ?? true,
    maxWaitTimeMinutes: restaurant.maxWaitTimeMinutes ?? 20,
  })
  const [imagePreview, setImagePreview] = useState<string | null>(restaurant.image || null)
  const [logoPreview, setLogoPreview] = useState<string | null>(restaurant.logo || null)
  const [saving, setSaving] = useState(false)

  // Update form when restaurant changes
  useEffect(() => {
    setFormData({
      name: restaurant.name,
      description: restaurant.description || '',
      cuisine: restaurant.cuisine || '',
      address: restaurant.address,
      phone: restaurant.phone || '',
      email: restaurant.email || '',
      latitude: restaurant.latitude || 0,
      longitude: restaurant.longitude || 0,
      image: restaurant.image || '',
      logo: restaurant.logo || '',
      maxWaitTimeEnabled: restaurant.maxWaitTimeEnabled ?? true,
      maxWaitTimeMinutes: restaurant.maxWaitTimeMinutes ?? 20,
    })
    setImagePreview(restaurant.image || null)
    setLogoPreview(restaurant.logo || null)
  }, [restaurant])

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>, type: 'image' | 'logo') => {
    const file = e.target.files?.[0]
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error('La imagen debe ser menor a 5MB')
        return
      }
      const reader = new FileReader()
      reader.onloadend = () => {
        const base64String = reader.result as string
        if (type === 'image') {
          setFormData({ ...formData, image: base64String })
          setImagePreview(base64String)
        } else {
          setFormData({ ...formData, logo: base64String })
          setLogoPreview(base64String)
        }
      }
      reader.readAsDataURL(file)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    try {
      await api.patch(`/restaurants/${restaurant.id}`, formData)
      toast.success('Restaurante actualizado exitosamente')
      onUpdate()
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Error al actualizar el restaurante')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div>
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold text-gray-900">Configuración del Restaurante</h2>
            <p className="text-gray-600 mt-1">Edita los detalles de tu restaurante</p>
          </div>
          <Button
            variant="primary"
            onClick={onOpenChat}
            className="flex items-center gap-2"
          >
            <MessageSquare className="w-5 h-5" />
            <span>Chatear con Administrador</span>
          </Button>
        </div>
      </div>

      <Card className="p-8">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Nombre del Restaurante *
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Tipo de Cocina *
              </label>
              <input
                type="text"
                value={formData.cuisine}
                onChange={(e) => setFormData({ ...formData, cuisine: e.target.value })}
                placeholder="Ej: Italiana, Mexicana, etc."
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Descripción
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Describe tu restaurante..."
              rows={4}
              className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 resize-none"
            />
          </div>

          {/* Contact Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                <Phone className="w-4 h-4 inline mr-1" />
                Teléfono
              </label>
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                <Mail className="w-4 h-4 inline mr-1" />
                Email
              </label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              />
            </div>
          </div>

          {/* Location */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              <MapPin className="w-4 h-4 inline mr-1" />
              Dirección *
            </label>
            <input
              type="text"
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              required
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Latitud *
              </label>
              <input
                type="number"
                step="any"
                min="-90"
                max="90"
                value={formData.latitude}
                onChange={(e) => setFormData({ ...formData, latitude: parseFloat(e.target.value) || 0 })}
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Longitud *
              </label>
              <input
                type="number"
                step="any"
                min="-180"
                max="180"
                value={formData.longitude}
                onChange={(e) => setFormData({ ...formData, longitude: parseFloat(e.target.value) || 0 })}
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                required
              />
            </div>
          </div>

          {/* Images */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                <ImageIcon className="w-4 h-4 inline mr-1" />
                Imagen Principal
              </label>
              <div className="space-y-3">
                <label className="flex items-center justify-center gap-2 px-4 py-3 border-2 border-dashed border-gray-300 rounded-xl hover:border-primary-500 transition-colors cursor-pointer">
                  <ImageIcon className="w-5 h-5 text-gray-400" />
                  <span className="text-sm text-gray-600">
                    {imagePreview ? 'Cambiar imagen' : 'Subir imagen'}
                  </span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleImageUpload(e, 'image')}
                    className="hidden"
                  />
                </label>
                {imagePreview && (
                  <div className="relative w-full h-48 rounded-xl overflow-hidden border-2 border-primary-200">
                    <img
                      src={imagePreview}
                      alt="Preview"
                      className="w-full h-full object-cover"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        setImagePreview(null)
                        setFormData({ ...formData, image: '' })
                      }}
                      className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                <ImageIcon className="w-4 h-4 inline mr-1" />
                Logo
              </label>
              <div className="space-y-3">
                <label className="flex items-center justify-center gap-2 px-4 py-3 border-2 border-dashed border-gray-300 rounded-xl hover:border-primary-500 transition-colors cursor-pointer">
                  <ImageIcon className="w-5 h-5 text-gray-400" />
                  <span className="text-sm text-gray-600">
                    {logoPreview ? 'Cambiar logo' : 'Subir logo'}
                  </span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleImageUpload(e, 'logo')}
                    className="hidden"
                  />
                </label>
                {logoPreview && (
                  <div className="relative w-32 h-32 rounded-xl overflow-hidden border-2 border-primary-200">
                    <img
                      src={logoPreview}
                      alt="Logo Preview"
                      className="w-full h-full object-cover"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        setLogoPreview(null)
                        setFormData({ ...formData, logo: '' })
                      }}
                      className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Max Wait Time Configuration */}
          <div className="pt-6 border-t border-gray-200">
            <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
              <Clock className="w-5 h-5 text-primary-600" />
              Tiempo Máximo de Espera
            </h3>
            <p className="text-sm text-gray-600 mb-4">
              Configura el tiempo máximo de espera para que las órdenes se marquen como urgentes en el tab de despachos.
            </p>
            
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="maxWaitTimeEnabled"
                  checked={formData.maxWaitTimeEnabled}
                  onChange={(e) => setFormData({ ...formData, maxWaitTimeEnabled: e.target.checked })}
                  className="w-5 h-5 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                />
                <label htmlFor="maxWaitTimeEnabled" className="text-sm font-semibold text-gray-700 cursor-pointer">
                  Habilitar tiempo máximo de espera
                </label>
              </div>

              {formData.maxWaitTimeEnabled && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="overflow-hidden"
                >
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Tiempo máximo (minutos)
                      </label>
                      <input
                        type="number"
                        min="1"
                        max="1440"
                        value={formData.maxWaitTimeMinutes}
                        onChange={(e) => setFormData({ ...formData, maxWaitTimeMinutes: parseInt(e.target.value) || 20 })}
                        className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                        placeholder="20"
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        Las órdenes que excedan este tiempo se marcarán como urgentes
                      </p>
                    </div>
                  </div>
                </motion.div>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4 border-t border-gray-200">
            <Button
              type="submit"
              variant="primary"
              fullWidth
              isLoading={saving}
              className="flex items-center justify-center"
            >
              <Save className="w-5 h-5 mr-2 flex-shrink-0" />
              <span>Guardar Cambios</span>
            </Button>
          </div>
        </form>
      </Card>
    </div>
  )
}

// Admin Chat Modal Component
function AdminChatModal({ 
  isOpen, 
  onClose, 
  restaurantName 
}: { 
  isOpen: boolean
  onClose: () => void
  restaurantName: string
}) {
  const [messages, setMessages] = useState<Array<{ id: string; text: string; sender: 'owner' | 'admin'; timestamp: Date }>>([])
  const [newMessage, setNewMessage] = useState('')
  const [sending, setSending] = useState(false)

  const handleSend = async () => {
    if (!newMessage.trim()) return

    setSending(true)
    try {
      // TODO: Implementar endpoint de mensajería
      // Por ahora, solo agregamos el mensaje localmente
      const message = {
        id: Date.now().toString(),
        text: newMessage,
        sender: 'owner' as const,
        timestamp: new Date(),
      }
      setMessages([...messages, message])
      setNewMessage('')
      toast.success('Mensaje enviado')
    } catch (error: any) {
      toast.error('Error al enviar el mensaje')
    } finally {
      setSending(false)
    }
  }

  if (!isOpen) return null

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.9, opacity: 0, y: 20 }}
          onClick={(e) => e.stopPropagation()}
          className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl h-[600px] flex flex-col overflow-hidden"
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-primary-500 to-primary-600 p-6 text-white">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                  <MessageSquare className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="text-xl font-bold">Chat con Administrador</h2>
                  <p className="text-primary-100 text-sm">{restaurantName}</p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-2 hover:bg-white/20 rounded-full transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-gray-50">
            {messages.length === 0 ? (
              <div className="text-center py-12">
                <MessageSquare className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500">No hay mensajes aún</p>
                <p className="text-sm text-gray-400 mt-2">Envía un mensaje al administrador</p>
              </div>
            ) : (
              messages.map((msg) => (
                <motion.div
                  key={msg.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`flex ${msg.sender === 'owner' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[70%] rounded-2xl px-4 py-3 ${
                      msg.sender === 'owner'
                        ? 'bg-primary-600 text-white'
                        : 'bg-white text-gray-900 border border-gray-200'
                    }`}
                  >
                    <p className="text-sm">{msg.text}</p>
                    <p className={`text-xs mt-1 ${
                      msg.sender === 'owner' ? 'text-primary-100' : 'text-gray-500'
                    }`}>
                      {msg.timestamp.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </motion.div>
              ))
            )}
          </div>

          {/* Input */}
          <div className="p-4 border-t border-gray-200 bg-white">
            <div className="flex gap-2">
              <input
                type="text"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                placeholder="Escribe un mensaje..."
                className="flex-1 px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              />
              <Button
                onClick={handleSend}
                variant="primary"
                disabled={!newMessage.trim() || sending}
                className="flex items-center justify-center"
              >
                <Send className="w-5 h-5 flex-shrink-0" />
              </Button>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}

// Dashboard Section Component
function DashboardSection({
  restaurant,
  orders,
  reservations,
  sales,
}: {
  restaurant: Restaurant | null
  orders: Order[]
  reservations: Reservation[]
  sales: any[]
}) {
  const [timeRange, setTimeRange] = useState<'day' | 'week' | 'month'>('day')
  const [loading, setLoading] = useState(false)
  const [metrics, setMetrics] = useState<any>(null)
  const [showSalesMetrics, setShowSalesMetrics] = useState(false)

  useEffect(() => {
    if (restaurant) {
      loadMetrics()
    }
  }, [restaurant, timeRange, orders, reservations, sales])

  const loadMetrics = async () => {
    setLoading(true)
    try {
      // TODO: Implementar endpoint de métricas en backend
      // Por ahora calculamos desde los datos locales
      const now = new Date()
      const startDate = timeRange === 'day' 
        ? new Date(now.getFullYear(), now.getMonth(), now.getDate())
        : timeRange === 'week'
        ? new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
        : new Date(now.getFullYear(), now.getMonth(), 1)

      const filteredOrders = orders.filter(o => new Date(o.createdAt) >= startDate)
      const filteredReservations = reservations.filter(r => new Date(r.createdAt) >= startDate)
      const filteredSales = sales.filter(s => new Date(s.createdAt) >= startDate)

      // Calcular métricas básicas - incluir ventas y órdenes
      const ordersRevenue = filteredOrders
        .filter(o => o.status !== 'cancelled')
        .reduce((sum, o) => sum + (typeof o.total === 'number' ? o.total : parseFloat(o.total) || 0), 0)
      
      const salesRevenue = filteredSales
        .filter(s => s.status !== 'cancelled' && s.status !== 'pending')
        .reduce((sum, s) => sum + (typeof s.total === 'number' ? s.total : parseFloat(s.total) || 0), 0)

      const totalRevenue = ordersRevenue + salesRevenue
      const totalOrders = filteredOrders.length
      const totalSales = filteredSales.length
      const totalReservations = filteredReservations.length

      // Menú más/menos vendido - incluir ventas y órdenes
      const menuItemsCount: Record<string, number> = {}
      filteredOrders.forEach(order => {
        order.items?.forEach((item: any) => {
          const menuName = item.menu?.name || 'Desconocido'
          menuItemsCount[menuName] = (menuItemsCount[menuName] || 0) + item.quantity
        })
      })
      filteredSales.forEach(sale => {
        sale.items?.forEach((item: any) => {
          const menuName = item.menuName || 'Desconocido'
          menuItemsCount[menuName] = (menuItemsCount[menuName] || 0) + item.quantity
        })
      })

      const menuItems = Object.entries(menuItemsCount)
        .map(([name, count]) => ({ name, count }))
        .sort((a, b) => b.count - a.count)

      const mostSold = menuItems[0] || { name: 'N/A', count: 0 }
      const leastSold = menuItems[menuItems.length - 1] || { name: 'N/A', count: 0 }

      // Días de la semana con más/menos clientes - incluir ventas
      const dayCounts: Record<string, number> = {}
      filteredOrders.forEach(order => {
        const day = new Date(order.createdAt).toLocaleDateString('es-ES', { weekday: 'long' })
        dayCounts[day] = (dayCounts[day] || 0) + 1
      })
      filteredSales.forEach(sale => {
        const day = new Date(sale.createdAt).toLocaleDateString('es-ES', { weekday: 'long' })
        dayCounts[day] = (dayCounts[day] || 0) + 1
      })
      filteredReservations.forEach(res => {
        const day = new Date(res.createdAt).toLocaleDateString('es-ES', { weekday: 'long' })
        dayCounts[day] = (dayCounts[day] || 0) + 1
      })

      const dayItems = Object.entries(dayCounts)
        .map(([day, count]) => ({ day, count }))
        .sort((a, b) => b.count - a.count)

      const busiestDay = dayItems[0] || { day: 'N/A', count: 0 }
      const quietestDay = dayItems[dayItems.length - 1] || { day: 'N/A', count: 0 }

      setMetrics({
        totalRevenue,
        totalOrders,
        totalSales,
        totalReservations,
        mostSold,
        leastSold,
        busiestDay,
        quietestDay,
        prediction: calculatePrediction(orders, reservations, sales)
      })
    } catch (error) {
      console.error('Error loading metrics:', error)
    } finally {
      setLoading(false)
    }
  }

  const calculatePrediction = (allOrders: Order[], allReservations: Reservation[], allSales: any[]) => {
    // Predicción simple basada en promedio de últimos 7 días - incluir ventas
    const last7DaysOrders = allOrders.filter(o => {
      const orderDate = new Date(o.createdAt)
      const daysAgo = (Date.now() - orderDate.getTime()) / (1000 * 60 * 60 * 24)
      return daysAgo <= 7
    })
    
    const last7DaysSales = allSales.filter(s => {
      const saleDate = new Date(s.createdAt)
      const daysAgo = (Date.now() - saleDate.getTime()) / (1000 * 60 * 60 * 24)
      return daysAgo <= 7
    })

    const totalLast7Days = last7DaysOrders.length + last7DaysSales.length
    const avgOrdersPerDay = totalLast7Days / 7
    const predictedOrders = Math.round(avgOrdersPerDay)

    return {
      predictedOrders,
      confidence: totalLast7Days > 0 ? 'Alta' : 'Baja'
    }
  }

  if (!restaurant) {
    return <div className="text-center py-12">Cargando...</div>
  }

  return (
    <div className="space-y-6">
      {/* Time Range Selector */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">Dashboard de Métricas</h2>
        <div className="flex gap-2">
          {(['day', 'week', 'month'] as const).map((range) => (
            <Button
              key={range}
              variant={timeRange === range ? 'primary' : 'ghost'}
              size="sm"
              onClick={() => setTimeRange(range)}
            >
              {range === 'day' ? 'Hoy' : range === 'week' ? 'Semana' : 'Mes'}
            </Button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
        </div>
      ) : metrics ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Revenue Card */}
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-700">Ganancias</h3>
              <DollarSign className="w-8 h-8 text-green-500" />
            </div>
            <p className="text-3xl font-bold text-gray-900">${metrics.totalRevenue.toFixed(2)}</p>
            <p className="text-sm text-gray-500 mt-2">
              {timeRange === 'day' ? 'Hoy' : timeRange === 'week' ? 'Esta semana' : 'Este mes'}
            </p>
          </Card>

          {/* Orders Card */}
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-700">Pedidos</h3>
              <ShoppingCart className="w-8 h-8 text-blue-500" />
            </div>
            <p className="text-3xl font-bold text-gray-900">{metrics.totalOrders}</p>
            <p className="text-sm text-gray-500 mt-2">Total de pedidos</p>
          </Card>

          {/* Sales Card */}
          <Card 
            className="p-6 cursor-pointer hover:shadow-lg transition-all duration-300 hover:scale-105"
            onClick={() => setShowSalesMetrics(true)}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-700">Ventas</h3>
              <DollarSign className="w-8 h-8 text-green-500" />
            </div>
            <p className="text-3xl font-bold text-gray-900">{metrics.totalSales || 0}</p>
            <p className="text-sm text-gray-500 mt-2">Total de ventas</p>
            <p className="text-xs text-primary-600 mt-2 font-medium">Click para ver métricas detalladas</p>
          </Card>

          {/* Reservations Card */}
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-700">Reservas</h3>
              <Calendar className="w-8 h-8 text-purple-500" />
            </div>
            <p className="text-3xl font-bold text-gray-900">{metrics.totalReservations}</p>
            <p className="text-sm text-gray-500 mt-2">Total de reservas</p>
          </Card>

          {/* Most Sold Menu */}
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-700">Más Vendido</h3>
              <TrendingUp className="w-8 h-8 text-green-500" />
            </div>
            <p className="text-xl font-bold text-gray-900">{metrics.mostSold.name}</p>
            <p className="text-sm text-gray-500 mt-2">{metrics.mostSold.count} unidades</p>
          </Card>

          {/* Least Sold Menu */}
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-700">Menos Vendido</h3>
              <TrendingUp className="w-8 h-8 text-red-500 rotate-180" />
            </div>
            <p className="text-xl font-bold text-gray-900">{metrics.leastSold.name}</p>
            <p className="text-sm text-gray-500 mt-2">{metrics.leastSold.count} unidades</p>
          </Card>

          {/* Busiest Day */}
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-700">Día Más Ocupado</h3>
              <Users className="w-8 h-8 text-orange-500" />
            </div>
            <p className="text-xl font-bold text-gray-900 capitalize">{metrics.busiestDay.day}</p>
            <p className="text-sm text-gray-500 mt-2">{metrics.busiestDay.count} clientes</p>
          </Card>

          {/* Quietest Day */}
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-700">Día Menos Ocupado</h3>
              <Users className="w-8 h-8 text-gray-400" />
            </div>
            <p className="text-xl font-bold text-gray-900 capitalize">{metrics.quietestDay.day}</p>
            <p className="text-sm text-gray-500 mt-2">{metrics.quietestDay.count} clientes</p>
          </Card>

          {/* Prediction Card */}
          <Card className="p-6 md:col-span-2 lg:col-span-3">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-700">Predicción para Mañana</h3>
              <BarChart3 className="w-8 h-8 text-indigo-500" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-2xl font-bold text-gray-900">{metrics.prediction.predictedOrders}</p>
                <p className="text-sm text-gray-500">Pedidos estimados</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">{metrics.prediction.confidence}</p>
                <p className="text-sm text-gray-500">Confianza</p>
              </div>
            </div>
            <p className="text-sm text-gray-600 mt-4 italic">
              Basado en el promedio de los últimos 7 días
            </p>
          </Card>
        </div>
      ) : (
        <div className="text-center py-12">
          <p className="text-gray-500">No hay datos disponibles</p>
        </div>
      )}

      {/* Sales Metrics Modal */}
      {restaurant && (
        <SalesMetricsModal
          isOpen={showSalesMetrics}
          onClose={() => setShowSalesMetrics(false)}
          restaurantId={restaurant.id}
          timeRange={timeRange}
        />
      )}
    </div>
  )
}

// Staff Section Component
function StaffSection({
  restaurant,
}: {
  restaurant: Restaurant | null
}) {
  const [staff, setStaff] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [editingStaff, setEditingStaff] = useState<any>(null)
  const [formData, setFormData] = useState({
    email: '',
    firstName: '',
    lastName: '',
    phone: '',
    role: 'waiter',
    schedule: {
      monday: { start: '09:00', end: '17:00', enabled: true },
      tuesday: { start: '09:00', end: '17:00', enabled: true },
      wednesday: { start: '09:00', end: '17:00', enabled: true },
      thursday: { start: '09:00', end: '17:00', enabled: true },
      friday: { start: '09:00', end: '17:00', enabled: true },
      saturday: { start: '09:00', end: '17:00', enabled: true },
      sunday: { start: '09:00', end: '17:00', enabled: false },
    }
  })

  useEffect(() => {
    if (restaurant) {
      loadStaff()
    }
  }, [restaurant])

  const loadStaff = async () => {
    setLoading(true)
    try {
      // TODO: Implementar endpoint de personal en backend
      // Por ahora usamos datos mock
      setStaff([])
    } catch (error) {
      console.error('Error loading staff:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      // TODO: Implementar creación/actualización de personal en backend
      toast.success(editingStaff ? 'Personal actualizado' : 'Personal agregado')
      setShowForm(false)
      setEditingStaff(null)
      setFormData({
        email: '',
        firstName: '',
        lastName: '',
        phone: '',
        role: 'waiter',
        schedule: {
          monday: { start: '09:00', end: '17:00', enabled: true },
          tuesday: { start: '09:00', end: '17:00', enabled: true },
          wednesday: { start: '09:00', end: '17:00', enabled: true },
          thursday: { start: '09:00', end: '17:00', enabled: true },
          friday: { start: '09:00', end: '17:00', enabled: true },
          saturday: { start: '09:00', end: '17:00', enabled: true },
          sunday: { start: '09:00', end: '17:00', enabled: false },
        }
      })
      loadStaff()
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Error al guardar personal')
    }
  }

  const handleDelete = async (staffId: string) => {
    if (!confirm('¿Estás seguro de que deseas eliminar a este miembro del personal?')) {
      return
    }
    try {
      // TODO: Implementar eliminación de personal en backend
      toast.success('Personal eliminado')
      loadStaff()
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Error al eliminar personal')
    }
  }

  const roleLabels: Record<string, string> = {
    waiter: 'Mesero',
    cook: 'Cocinero',
    manager: 'Gerente',
    cashier: 'Cajero',
  }

  if (!restaurant) {
    return <div className="text-center py-12">Cargando...</div>
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">Gestión de Personal</h2>
        <Button
          onClick={() => {
            setEditingStaff(null)
            setShowForm(true)
          }}
          variant="primary"
          className="flex items-center gap-2"
        >
          <UserPlus className="w-5 h-5" />
          Agregar Personal
        </Button>
      </div>

      {showForm && (
        <Card className="p-6">
          <h3 className="text-xl font-bold text-gray-900 mb-4">
            {editingStaff ? 'Editar Personal' : 'Nuevo Personal'}
          </h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Teléfono</label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nombre</label>
                <input
                  type="text"
                  required
                  value={formData.firstName}
                  onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Apellido</label>
                <input
                  type="text"
                  required
                  value={formData.lastName}
                  onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Rol</label>
                <select
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                >
                  <option value="waiter">Mesero</option>
                  <option value="cook">Cocinero</option>
                  <option value="manager">Gerente</option>
                  <option value="cashier">Cajero</option>
                </select>
              </div>
            </div>

            <div className="pt-4 border-t border-gray-200">
              <h4 className="text-lg font-semibold text-gray-900 mb-4">Horarios de Trabajo</h4>
              <div className="space-y-3">
                {Object.entries(formData.schedule).map(([day, schedule]) => (
                  <div key={day} className="flex items-center gap-4">
                    <label className="flex items-center gap-2 w-32">
                      <input
                        type="checkbox"
                        checked={schedule.enabled}
                        onChange={(e) => {
                          setFormData({
                            ...formData,
                            schedule: {
                              ...formData.schedule,
                              [day]: { ...schedule, enabled: e.target.checked }
                            }
                          })
                        }}
                        className="w-4 h-4 text-primary-600 rounded focus:ring-primary-500"
                      />
                      <span className="text-sm font-medium text-gray-700 capitalize">{day}</span>
                    </label>
                    {schedule.enabled && (
                      <div className="flex items-center gap-2 flex-1">
                        <input
                          type="time"
                          value={schedule.start}
                          onChange={(e) => {
                            setFormData({
                              ...formData,
                              schedule: {
                                ...formData.schedule,
                                [day]: { ...schedule, start: e.target.value }
                              }
                            })
                          }}
                          className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                        />
                        <span className="text-gray-500">-</span>
                        <input
                          type="time"
                          value={schedule.end}
                          onChange={(e) => {
                            setFormData({
                              ...formData,
                              schedule: {
                                ...formData.schedule,
                                [day]: { ...schedule, end: e.target.value }
                              }
                            })
                          }}
                          className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                        />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div className="flex gap-4 pt-4">
              <Button type="submit" variant="primary">
                {editingStaff ? 'Actualizar' : 'Agregar'}
              </Button>
              <Button
                type="button"
                variant="ghost"
                onClick={() => {
                  setShowForm(false)
                  setEditingStaff(null)
                }}
              >
                Cancelar
              </Button>
            </div>
          </form>
        </Card>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
        </div>
      ) : staff.length === 0 ? (
        <Card className="p-12 text-center">
          <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500 text-lg">No hay personal registrado</p>
          <p className="text-sm text-gray-400 mt-2">Agrega miembros de tu equipo para comenzar</p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {staff.map((member) => (
            <Card key={member.id} className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">
                    {member.firstName} {member.lastName}
                  </h3>
                  <p className="text-sm text-gray-500">{member.email}</p>
                  <p className="text-sm text-gray-500">{member.phone}</p>
                </div>
                <span className="px-3 py-1 bg-primary-100 text-primary-700 rounded-full text-xs font-semibold">
                  {roleLabels[member.role] || member.role}
                </span>
              </div>
              <div className="flex gap-2 pt-4 border-t border-gray-200">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setEditingStaff(member)
                    setFormData({
                      email: member.email,
                      firstName: member.firstName,
                      lastName: member.lastName,
                      phone: member.phone || '',
                      role: member.role,
                      schedule: member.schedule || formData.schedule
                    })
                    setShowForm(true)
                  }}
                  className="flex-1"
                >
                  <Edit className="w-4 h-4 mr-2" />
                  Editar
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleDelete(member.id)}
                  className="text-red-600 hover:text-red-700 hover:bg-red-50"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
