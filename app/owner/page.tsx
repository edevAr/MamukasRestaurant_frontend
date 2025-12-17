'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useSocket } from '@/contexts/SocketContext'
import { useRouter } from 'next/navigation'
import api from '@/lib/api'
import toast from 'react-hot-toast'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  UtensilsCrossed, 
  Clock, 
  Tag, 
  ShoppingCart, 
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
  AlertCircle
} from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'

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
  time: string
  numberOfGuests: number
  notes: string
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed'
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

type Tab = 'menu' | 'hours' | 'promotions' | 'orders' | 'reservations' | 'reviews'

export default function OwnerPage() {
  const { user } = useAuth()
  const { socket } = useSocket()
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

  // Debug: Log activeTab changes
  useEffect(() => {
    console.log('Active tab changed to:', activeTab)
  }, [activeTab])

  useEffect(() => {
    if (!user || user.role !== 'owner') {
      router.push('/login')
      return
    }
    loadRestaurant()
  }, [user])

  useEffect(() => {
    if (restaurant) {
      loadMenus()
      loadPromotions()
      loadOrders()
      loadReservations()
      loadReviews()
    }
  }, [restaurant])

  // Socket listeners for real-time updates
  useEffect(() => {
    if (!socket) return

    const handleNewOrder = (order: Order) => {
      toast.success('¡Nuevo pedido recibido!', { icon: '🛒' })
      setOrders(prev => [order, ...prev])
    }

    const handleOrderStatus = (data: { orderId: string; status: string }) => {
      setOrders(prev => prev.map(o => 
        o.id === data.orderId ? { ...o, status: data.status as any } : o
      ))
    }

    const handleNewReservation = (reservation: Reservation) => {
      toast.success('¡Nueva reserva recibida!', { icon: '📅' })
      setReservations(prev => [reservation, ...prev])
    }

    const handleReservationUpdate = (data: { reservationId: string; status: string }) => {
      setReservations(prev => prev.map(r => 
        r.id === data.reservationId ? { ...r, status: data.status as any } : r
      ))
    }

    const handleRestaurantStatus = (data: { restaurantId: string; isOpen: boolean; message: string }) => {
      if (restaurant && restaurant.id === data.restaurantId) {
        setRestaurant(prev => prev ? { ...prev, isOpen: data.isOpen } : null)
      }
    }

    socket.on('order:new', handleNewOrder)
    socket.on('order:status', handleOrderStatus)
    socket.on('reservation:new', handleNewReservation)
    socket.on('reservation:update', handleReservationUpdate)
    socket.on('restaurant:status', handleRestaurantStatus)

    return () => {
      socket.off('order:new', handleNewOrder)
      socket.off('order:status', handleOrderStatus)
      socket.off('reservation:new', handleNewReservation)
      socket.off('reservation:update', handleReservationUpdate)
      socket.off('restaurant:status', handleRestaurantStatus)
    }
  }, [socket, restaurant])

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

  const loadMenus = async () => {
    if (!restaurant) return
    try {
      const response = await api.get(`/menus?restaurantId=${restaurant.id}`)
      setMenus(response.data)
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

  const tabs = [
    { id: 'menu' as Tab, label: 'Menú', icon: UtensilsCrossed, count: menus.length },
    { id: 'hours' as Tab, label: 'Horarios', icon: Clock },
    { id: 'promotions' as Tab, label: 'Promociones', icon: Tag, count: promotions.length },
    { id: 'orders' as Tab, label: 'Pedidos', icon: ShoppingCart, count: orders.filter(o => o.status !== 'delivered' && o.status !== 'cancelled').length },
    { id: 'reservations' as Tab, label: 'Reservas', icon: Calendar, count: reservations.filter(r => r.status === 'pending').length },
    { id: 'reviews' as Tab, label: 'Comentarios', icon: MessageSquare, count: reviews.length },
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-orange-50/30 to-red-50/30">
      {/* Header */}
      <motion.div
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="bg-white/80 backdrop-blur-lg shadow-lg border-b border-gray-200/50 sticky top-0 z-50"
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
            </div>
          </div>
        </div>
      </motion.div>

      {/* Tabs */}
      <div className="bg-white/60 backdrop-blur-sm border-b border-gray-200/50 sticky top-[88px] z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex space-x-1 overflow-x-auto scrollbar-hide">
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
      </div>
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
  })
  const [loading, setLoading] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [togglingId, setTogglingId] = useState<string | null>(null)

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
      })
      setShowForm(true)
    }
  }, [editingMenu, setShowForm])

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
                  {editingMenu ? '✏️ Editar Plato' : '➕ Nuevo Plato'}
                </h3>
                <button
                  onClick={(e) => {
                    e.preventDefault()
                    e.stopPropagation()
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
                    })
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
                      <DollarSign className="w-4 h-4 inline mr-1" />
                      Precio *
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      required
                      value={formData.price}
                      onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all"
                      placeholder="0.00"
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
                      placeholder="https://ejemplo.com/imagen.jpg"
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
                    rows={4}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all resize-none"
                    placeholder="Describe el plato, ingredientes, etc..."
                  />
                </div>
                <div className="flex gap-3 pt-4">
                  <Button 
                    type="submit" 
                    isLoading={loading}
                    className="flex-1 flex items-center justify-center gap-2"
                  >
                    <Save className="w-5 h-5" />
                    {editingMenu ? 'Actualizar Plato' : 'Crear Plato'}
                  </Button>
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={(e) => {
                      e.preventDefault()
                      e.stopPropagation()
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
                      })
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

      {menus.length === 0 ? (
        <Card className="p-12 text-center">
          <UtensilsCrossed className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-600 text-lg">No hay platos en el menú aún</p>
          <p className="text-gray-500 mt-2">Comienza agregando tu primer plato</p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {menus.map((menu, index) => (
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

                        <div className="grid grid-cols-3 gap-4 mb-4 p-4 bg-gray-50 rounded-xl">
                          <div>
                            <p className="text-xs font-semibold text-gray-500 uppercase mb-1">Fecha</p>
                            <p className="font-bold text-gray-900 flex items-center gap-1">
                              <Calendar className="w-4 h-4" />
                              {new Date(reservation.date).toLocaleDateString('es-ES', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                            </p>
                          </div>
                          <div>
                            <p className="text-xs font-semibold text-gray-500 uppercase mb-1">Hora</p>
                            <p className="font-bold text-gray-900 flex items-center gap-1">
                              <Clock className="w-4 h-4" />
                              {reservation.time}
                            </p>
                          </div>
                          <div>
                            <p className="text-xs font-semibold text-gray-500 uppercase mb-1">Personas</p>
                            <p className="font-bold text-gray-900 flex items-center gap-1">
                              <Users className="w-4 h-4" />
                              {reservation.numberOfGuests} {reservation.numberOfGuests === 1 ? 'persona' : 'personas'}
                            </p>
                          </div>
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
