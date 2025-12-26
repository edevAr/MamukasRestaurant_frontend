'use client'

import { useAuth } from '@/contexts/AuthContext'
import { useSocket } from '@/contexts/SocketContext'
import { Header } from '@/components/layout/Header'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import api from '@/lib/api'
import toast from 'react-hot-toast'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Users,
  UtensilsCrossed,
  MessageSquare,
  Megaphone,
  Search,
  Plus,
  Trash2,
} from 'lucide-react'
import { RestaurantCard } from '@/components/admin/RestaurantCard'
import { PromotionModal } from '@/components/admin/PromotionModal'
import { UserCard } from '@/components/admin/UserCard'
import { UserEditModal } from '@/components/admin/UserEditModal'
import { ChatModal } from '@/components/admin/ChatModal'
import { ReviewCard } from '@/components/admin/ReviewCard'
import { AnnouncementModal } from '@/components/admin/AnnouncementModal'
import { AnnouncementDisplayModal } from '@/components/ui/AnnouncementDisplayModal'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'

interface Restaurant {
  id: string
  name: string
  cuisine: string
  rating: number
  isActive: boolean
  isPromoted: boolean
  promotionText?: string | null
  promotionImage?: string | null
  promotionStartDate?: string | null
  promotionEndDate?: string | null
  owner: {
    firstName: string
    lastName: string
    email: string
  }
  createdAt: string
}

interface User {
  id: string
  email: string
  firstName: string
  lastName: string
  role: 'admin' | 'owner' | 'client'
  isActive: boolean
  phone?: string
  createdAt: string
}

interface Review {
  id: string
  rating: number
  comment: string
  response?: string | null
  respondedBy?: string | null
  respondedAt?: string | null
  client: {
    firstName: string
    lastName: string
    email: string
  }
  restaurant: {
    id: string
    name: string
  }
  createdAt: string
}

interface Announcement {
  id: string
  title: string
  message: string
  image: string | null
  isActive: boolean
  targetAudience: string
  startDate: string | null
  endDate: string | null
  createdAt: string
}

type Tab = 'restaurants' | 'users' | 'reviews' | 'announcements'

export default function AdminPage() {
  const { user, loading: authLoading } = useAuth()
  const { socket } = useSocket()
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<Tab>('restaurants')
  const [loading, setLoading] = useState(true)

  // Data states
  const [restaurants, setRestaurants] = useState<Restaurant[]>([])
  const [users, setUsers] = useState<User[]>([])
  const [reviews, setReviews] = useState<Review[]>([])
  const [announcements, setAnnouncements] = useState<Announcement[]>([])

  // Modal states
  const [search, setSearch] = useState('')
  const [selectedRestaurant, setSelectedRestaurant] = useState<Restaurant | null>(null)
  const [showPromotionModal, setShowPromotionModal] = useState(false)
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [showUserEditModal, setShowUserEditModal] = useState(false)
  const [showChatModal, setShowChatModal] = useState(false)
  const [showAnnouncementModal, setShowAnnouncementModal] = useState(false)
  const [editingAnnouncement, setEditingAnnouncement] = useState<Announcement | null>(null)
  const [currentAnnouncement, setCurrentAnnouncement] = useState<Announcement | null>(null)

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login')
      return
    }
    if (user && user.role !== 'admin') {
      toast.error('Acceso denegado. Solo administradores pueden acceder.')
      router.push('/client')
      return
    }
    if (user && user.role === 'admin') {
      loadData()
    }
  }, [user, authLoading, router])

  // Listen for announcements
  useEffect(() => {
    const handleAnnouncement = (event: CustomEvent) => {
      setCurrentAnnouncement(event.detail)
    }

    window.addEventListener('announcement-received', handleAnnouncement as EventListener)
    return () => {
      window.removeEventListener('announcement-received', handleAnnouncement as EventListener)
    }
  }, [])

  const loadData = async () => {
    setLoading(true)
    try {
      await Promise.all([
        loadRestaurants(),
        loadUsers(),
        loadReviews(),
        loadAnnouncements(),
      ])
    } catch (error) {
      toast.error('Error al cargar los datos')
    } finally {
      setLoading(false)
    }
  }

  const loadRestaurants = async () => {
    try {
      const response = await api.get('/restaurants/admin/all')
      setRestaurants(response.data)
    } catch (error) {
      console.error('Error loading restaurants:', error)
      toast.error('Error al cargar los restaurantes')
    }
  }

  const loadUsers = async () => {
    try {
      const response = await api.get('/users')
      setUsers(response.data)
    } catch (error) {
      console.error('Error loading users:', error)
      toast.error('Error al cargar los usuarios')
    }
  }

  const loadReviews = async () => {
    try {
      const response = await api.get('/reviews')
      setReviews(response.data)
    } catch (error) {
      console.error('Error loading reviews:', error)
      toast.error('Error al cargar las reseñas')
    }
  }

  const loadAnnouncements = async () => {
    try {
      const response = await api.get('/announcements')
      setAnnouncements(response.data)
    } catch (error) {
      console.error('Error loading announcements:', error)
      toast.error('Error al cargar los anuncios')
    }
  }

  // Restaurant actions
  const toggleRestaurantStatus = async (id: string, currentStatus: boolean) => {
    try {
      if (currentStatus) {
        await api.post(`/restaurants/${id}/deactivate`)
        toast.success('Restaurante desactivado')
      } else {
        await api.post(`/restaurants/${id}/activate`)
        toast.success('Restaurante activado')
      }
      loadRestaurants()
    } catch (error) {
      toast.error('Error al cambiar el estado del restaurante')
    }
  }

  const handleAddPromotion = (restaurant: Restaurant) => {
    setSelectedRestaurant(restaurant)
    setShowPromotionModal(true)
  }

  const handleEditRestaurant = (restaurant: Restaurant) => {
    // TODO: Implementar edición de restaurante
    toast('Funcionalidad de edición próximamente')
  }

  // User actions
  const toggleUserStatus = async (id: string, currentStatus: boolean) => {
    try {
      if (currentStatus) {
        await api.post(`/users/${id}/block`)
        toast.success('Usuario bloqueado')
      } else {
        await api.post(`/users/${id}/unblock`)
        toast.success('Usuario desbloqueado')
      }
      loadUsers()
    } catch (error) {
      toast.error('Error al cambiar el estado del usuario')
    }
  }

  const handleEditUser = (user: User) => {
    setSelectedUser(user)
    setShowUserEditModal(true)
  }

  const handleChatUser = (user: User) => {
    setSelectedUser(user)
    setShowChatModal(true)
  }

  const handleDeleteUser = async (id: string) => {
    if (!confirm('¿Estás seguro de eliminar este usuario?')) return
    try {
      await api.delete(`/users/${id}`)
      toast.success('Usuario eliminado')
      loadUsers()
    } catch (error) {
      toast.error('Error al eliminar el usuario')
    }
  }

  // Review actions
  const handleDeleteReview = async (id: string) => {
    if (!confirm('¿Estás seguro de eliminar esta reseña?')) return
    try {
      await api.delete(`/reviews/${id}`)
      toast.success('Reseña eliminada')
      loadReviews()
    } catch (error) {
      toast.error('Error al eliminar la reseña')
    }
  }

  // Announcement actions
  const handleCreateAnnouncement = () => {
    setEditingAnnouncement(null)
    setShowAnnouncementModal(true)
  }

  const handleEditAnnouncement = (announcement: Announcement) => {
    setEditingAnnouncement(announcement)
    setShowAnnouncementModal(true)
  }

  const handleDeleteAnnouncement = async (id: string) => {
    if (!confirm('¿Estás seguro de eliminar este anuncio?')) return
    try {
      await api.delete(`/announcements/${id}`)
      toast.success('Anuncio eliminado')
      loadAnnouncements()
    } catch (error) {
      toast.error('Error al eliminar el anuncio')
    }
  }

  const toggleAnnouncementStatus = async (id: string) => {
    try {
      await api.post(`/announcements/${id}/toggle`)
      toast.success('Estado del anuncio actualizado')
      loadAnnouncements()
    } catch (error) {
      toast.error('Error al cambiar el estado')
    }
  }

  // Filter functions
  const filteredRestaurants = restaurants.filter((r) =>
    r.name.toLowerCase().includes(search.toLowerCase()) ||
    r.cuisine.toLowerCase().includes(search.toLowerCase()) ||
    `${r.owner.firstName} ${r.owner.lastName}`.toLowerCase().includes(search.toLowerCase())
  )

  const filteredUsers = users.filter(
    (u) =>
      u.email.toLowerCase().includes(search.toLowerCase()) ||
      `${u.firstName} ${u.lastName}`.toLowerCase().includes(search.toLowerCase())
  )

  const filteredReviews = reviews.filter(
    (r) =>
      r.comment.toLowerCase().includes(search.toLowerCase()) ||
      r.restaurant.name.toLowerCase().includes(search.toLowerCase()) ||
      `${r.client.firstName} ${r.client.lastName}`.toLowerCase().includes(search.toLowerCase())
  )

  const filteredAnnouncements = announcements.filter(
    (a) =>
      a.title.toLowerCase().includes(search.toLowerCase()) ||
      a.message.toLowerCase().includes(search.toLowerCase())
  )

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-amber-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-primary-600 mx-auto"></div>
          <p className="mt-4 text-gray-600 text-lg">Cargando panel de administración...</p>
        </div>
      </div>
    )
  }

  if (!user || user.role !== 'admin') {
    return null
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-amber-50">
      <Header />
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-5xl font-bold text-gray-900 mb-2 bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
            Panel de Administración
          </h1>
          <p className="text-gray-600 text-lg">Gestiona restaurantes, usuarios, reseñas y anuncios de forma intuitiva</p>
        </motion.div>

        {/* Tabs */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-200 mb-6 overflow-hidden">
          <div className="flex border-b border-gray-200">
            {[
              { id: 'restaurants' as Tab, label: 'Restaurantes', icon: UtensilsCrossed, count: restaurants.length },
              { id: 'users' as Tab, label: 'Usuarios', icon: Users, count: users.length },
              { id: 'reviews' as Tab, label: 'Reseñas', icon: MessageSquare, count: reviews.length },
              { id: 'announcements' as Tab, label: 'Anuncios', icon: Megaphone, count: announcements.length },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex-1 px-6 py-4 font-semibold transition-all ${
                  activeTab === tab.id
                    ? 'text-primary-600 border-b-3 border-primary-600 bg-primary-50'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                }`}
              >
                <div className="flex items-center justify-center gap-2">
                  <tab.icon className="w-5 h-5" />
                  <span>{tab.label}</span>
                  <span className={`px-2 py-0.5 rounded-full text-xs ${
                    activeTab === tab.id
                      ? 'bg-indigo-100 text-indigo-700'
                      : 'bg-gray-100 text-gray-600'
                  }`}>
                    {tab.count}
                  </span>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Search Bar */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-4 mb-6">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder={`Buscar en ${activeTab}...`}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-12 pr-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-lg"
            />
          </div>
        </div>

        {/* Content */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.2 }}
          >
            {activeTab === 'restaurants' && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredRestaurants.length === 0 ? (
                  <div className="col-span-full text-center py-12">
                    <UtensilsCrossed className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-500 text-lg">No se encontraron restaurantes</p>
                  </div>
                ) : (
                  filteredRestaurants.map((restaurant) => (
                    <RestaurantCard
                      key={restaurant.id}
                      restaurant={restaurant}
                      onToggleStatus={toggleRestaurantStatus}
                      onAddPromotion={handleAddPromotion}
                      onEdit={handleEditRestaurant}
                    />
                  ))
                )}
              </div>
            )}

            {activeTab === 'users' && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredUsers.length === 0 ? (
                  <div className="col-span-full text-center py-12">
                    <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-500 text-lg">No se encontraron usuarios</p>
                  </div>
                ) : (
                  filteredUsers.map((user) => (
                    <UserCard
                      key={user.id}
                      user={user}
                      onToggleStatus={toggleUserStatus}
                      onEdit={handleEditUser}
                      onChat={handleChatUser}
                      onDelete={handleDeleteUser}
                    />
                  ))
                )}
              </div>
            )}

            {activeTab === 'reviews' && (
              <div className="space-y-4">
                {filteredReviews.length === 0 ? (
                  <div className="text-center py-12 bg-white rounded-2xl shadow-lg">
                    <MessageSquare className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-500 text-lg">No se encontraron reseñas</p>
                  </div>
                ) : (
                  filteredReviews.map((review) => (
                    <ReviewCard
                      key={review.id}
                      review={review}
                      onDelete={handleDeleteReview}
                      onResponseSuccess={loadReviews}
                    />
                  ))
                )}
              </div>
            )}

            {activeTab === 'announcements' && (
              <div>
                <div className="mb-6 flex justify-end">
                  <Button
                    variant="primary"
                    size="md"
                    onClick={handleCreateAnnouncement}
                    className="shadow-lg flex items-center justify-center"
                  >
                    <Plus className="w-4 h-4 mr-2 flex-shrink-0" />
                    <span>Crear Anuncio</span>
                  </Button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredAnnouncements.length === 0 ? (
                    <div className="col-span-full text-center py-12 bg-white rounded-2xl shadow-lg">
                      <Megaphone className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                      <p className="text-gray-500 text-lg">No hay anuncios creados</p>
                    </div>
                  ) : (
                    filteredAnnouncements.map((announcement) => (
                      <motion.div
                        key={announcement.id}
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="group"
                      >
                        <Card className="p-6 hover:shadow-xl transition-all duration-300 border-2 hover:border-primary-300 h-full flex flex-col">
                          <div className="flex items-start justify-between mb-4">
                            <div className="flex-1">
                              <h3 className="text-xl font-bold text-gray-900 mb-2">{announcement.title}</h3>
                              {announcement.image && (
                                <img
                                  src={announcement.image}
                                  alt={announcement.title}
                                  className="w-full h-32 object-cover rounded-lg mb-3"
                                />
                              )}
                              <p className="text-gray-700 text-sm line-clamp-3 mb-4">{announcement.message}</p>
                            </div>
                          </div>

                          <div className="mt-auto pt-4 border-t border-gray-200">
                            <div className="flex items-center justify-between mb-3">
                              <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                                announcement.isActive
                                  ? 'bg-green-100 text-green-700 border border-green-300'
                                  : 'bg-gray-100 text-gray-700 border border-gray-300'
                              }`}>
                                {announcement.isActive ? 'Activo' : 'Inactivo'}
                              </span>
                              <span className="text-xs text-gray-500 capitalize">
                                {announcement.targetAudience}
                              </span>
                            </div>
                            <div className="flex gap-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleEditAnnouncement(announcement)}
                                className="min-w-[70px] flex items-center justify-center"
                              >
                                <span className="text-xs">Editar</span>
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => toggleAnnouncementStatus(announcement.id)}
                                className="min-w-[80px] flex items-center justify-center"
                              >
                                <span className="text-xs">{announcement.isActive ? 'Desactivar' : 'Activar'}</span>
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDeleteAnnouncement(announcement.id)}
                                className="text-red-600 hover:text-red-700 hover:bg-red-50 flex items-center justify-center px-3"
                              >
                                <Trash2 className="w-3.5 h-3.5 flex-shrink-0" />
                              </Button>
                            </div>
                          </div>
                        </Card>
                      </motion.div>
                    ))
                  )}
                </div>
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Modals */}
      <PromotionModal
        isOpen={showPromotionModal}
        restaurant={selectedRestaurant}
        onClose={() => {
          setShowPromotionModal(false)
          setSelectedRestaurant(null)
        }}
        onSuccess={loadRestaurants}
      />

      <UserEditModal
        isOpen={showUserEditModal}
        user={selectedUser}
        onClose={() => {
          setShowUserEditModal(false)
          setSelectedUser(null)
        }}
        onSuccess={loadUsers}
      />

      <ChatModal
        isOpen={showChatModal}
        user={selectedUser}
        onClose={() => {
          setShowChatModal(false)
          setSelectedUser(null)
        }}
      />

      <AnnouncementModal
        isOpen={showAnnouncementModal}
        editing={editingAnnouncement}
        onClose={() => {
          setShowAnnouncementModal(false)
          setEditingAnnouncement(null)
        }}
        onSuccess={loadAnnouncements}
      />

      <AnnouncementDisplayModal
        isOpen={!!currentAnnouncement}
        announcement={currentAnnouncement}
        onClose={() => setCurrentAnnouncement(null)}
      />
    </div>
  )
}
