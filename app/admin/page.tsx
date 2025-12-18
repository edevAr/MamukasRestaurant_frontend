'use client'

import { useAuth } from '@/contexts/AuthContext'
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
  TrendingUp,
  Shield,
  X,
  Check,
  Edit,
  Trash2,
  Plus,
  Search,
  Filter,
  Eye,
  EyeOff,
  Star,
  Calendar,
  Image as ImageIcon,
} from 'lucide-react'

interface Restaurant {
  id: string
  name: string
  cuisine: string
  rating: number
  isActive: boolean
  isPromoted: boolean
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
  createdAt: string
}

interface Review {
  id: string
  rating: number
  comment: string
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
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<Tab>('restaurants')
  const [loading, setLoading] = useState(true)

  // Data states
  const [restaurants, setRestaurants] = useState<Restaurant[]>([])
  const [users, setUsers] = useState<User[]>([])
  const [reviews, setReviews] = useState<Review[]>([])
  const [announcements, setAnnouncements] = useState<Announcement[]>([])

  // Search and filters
  const [search, setSearch] = useState('')
  const [showAnnouncementForm, setShowAnnouncementForm] = useState(false)
  const [editingAnnouncement, setEditingAnnouncement] = useState<Announcement | null>(null)

  // Form states
  const [announcementForm, setAnnouncementForm] = useState({
    title: '',
    message: '',
    image: '',
    targetAudience: 'all',
    startDate: '',
    endDate: '',
  })

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
      const response = await api.get('/restaurants')
      setRestaurants(response.data)
    } catch (error) {
      console.error('Error loading restaurants:', error)
    }
  }

  const loadUsers = async () => {
    try {
      const response = await api.get('/users')
      setUsers(response.data)
    } catch (error) {
      console.error('Error loading users:', error)
    }
  }

  const loadReviews = async () => {
    try {
      const response = await api.get('/reviews')
      setReviews(response.data)
    } catch (error) {
      console.error('Error loading reviews:', error)
    }
  }

  const loadAnnouncements = async () => {
    try {
      const response = await api.get('/announcements')
      setAnnouncements(response.data)
    } catch (error) {
      console.error('Error loading announcements:', error)
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

  const toggleRestaurantPromotion = async (id: string, currentStatus: boolean) => {
    try {
      if (currentStatus) {
        await api.post(`/restaurants/${id}/unpromote`)
        toast.success('Publicidad removida')
      } else {
        await api.post(`/restaurants/${id}/promote`)
        toast.success('Restaurante promocionado')
      }
      loadRestaurants()
    } catch (error) {
      toast.error('Error al cambiar la promoción')
    }
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

  // Review actions
  const deleteReview = async (id: string) => {
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
  const handleAnnouncementSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const data = {
        ...announcementForm,
        startDate: announcementForm.startDate || null,
        endDate: announcementForm.endDate || null,
        image: announcementForm.image || null,
      }

      if (editingAnnouncement) {
        await api.patch(`/announcements/${editingAnnouncement.id}`, data)
        toast.success('Anuncio actualizado')
      } else {
        await api.post('/announcements', data)
        toast.success('Anuncio creado')
      }

      setShowAnnouncementForm(false)
      setEditingAnnouncement(null)
      setAnnouncementForm({
        title: '',
        message: '',
        image: '',
        targetAudience: 'all',
        startDate: '',
        endDate: '',
      })
      loadAnnouncements()
    } catch (error) {
      toast.error('Error al guardar el anuncio')
    }
  }

  const deleteAnnouncement = async (id: string) => {
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

  const openEditAnnouncement = (announcement: Announcement) => {
    setEditingAnnouncement(announcement)
    setAnnouncementForm({
      title: announcement.title,
      message: announcement.message,
      image: announcement.image || '',
      targetAudience: announcement.targetAudience,
      startDate: announcement.startDate ? announcement.startDate.split('T')[0] : '',
      endDate: announcement.endDate ? announcement.endDate.split('T')[0] : '',
    })
    setShowAnnouncementForm(true)
  }

  // Filter functions
  const filteredRestaurants = restaurants.filter((r) =>
    r.name.toLowerCase().includes(search.toLowerCase()) ||
    r.cuisine.toLowerCase().includes(search.toLowerCase())
  )

  const filteredUsers = users.filter(
    (u) =>
      u.email.toLowerCase().includes(search.toLowerCase()) ||
      `${u.firstName} ${u.lastName}`.toLowerCase().includes(search.toLowerCase())
  )

  const filteredReviews = reviews.filter(
    (r) =>
      r.comment.toLowerCase().includes(search.toLowerCase()) ||
      r.restaurant.name.toLowerCase().includes(search.toLowerCase())
  )

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Cargando...</p>
        </div>
      </div>
    )
  }

  if (!user || user.role !== 'admin') {
    return null
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      <Header />
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            Panel de Administración
          </h1>
          <p className="text-gray-600">Gestiona restaurantes, usuarios, reseñas y anuncios</p>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 mb-6">
          <div className="flex border-b border-gray-200">
            {[
              { id: 'restaurants' as Tab, label: 'Restaurantes', icon: UtensilsCrossed },
              { id: 'users' as Tab, label: 'Usuarios', icon: Users },
              { id: 'reviews' as Tab, label: 'Reseñas', icon: MessageSquare },
              { id: 'announcements' as Tab, label: 'Anuncios', icon: Megaphone },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex-1 px-6 py-4 font-medium transition-colors ${
                  activeTab === tab.id
                    ? 'text-indigo-600 border-b-2 border-indigo-600 bg-indigo-50'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                }`}
              >
                <div className="flex items-center justify-center gap-2">
                  <tab.icon className="w-5 h-5" />
                  <span>{tab.label}</span>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Search Bar */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Buscar..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
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
              <RestaurantsTab
                restaurants={filteredRestaurants}
                onToggleStatus={toggleRestaurantStatus}
                onTogglePromotion={toggleRestaurantPromotion}
              />
            )}

            {activeTab === 'users' && (
              <UsersTab users={filteredUsers} onToggleStatus={toggleUserStatus} />
            )}

            {activeTab === 'reviews' && (
              <ReviewsTab reviews={filteredReviews} onDelete={deleteReview} />
            )}

            {activeTab === 'announcements' && (
              <AnnouncementsTab
                announcements={announcements}
                onDelete={deleteAnnouncement}
                onToggle={toggleAnnouncementStatus}
                onEdit={openEditAnnouncement}
                onCreate={() => {
                  setEditingAnnouncement(null)
                  setAnnouncementForm({
                    title: '',
                    message: '',
                    image: '',
                    targetAudience: 'all',
                    startDate: '',
                    endDate: '',
                  })
                  setShowAnnouncementForm(true)
                }}
              />
            )}
          </motion.div>
        </AnimatePresence>

        {/* Announcement Form Modal */}
        <AnimatePresence>
          {showAnnouncementForm && (
            <AnnouncementFormModal
              form={announcementForm}
              setForm={setAnnouncementForm}
              onSubmit={handleAnnouncementSubmit}
              onClose={() => {
                setShowAnnouncementForm(false)
                setEditingAnnouncement(null)
              }}
              editing={!!editingAnnouncement}
            />
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}

// Restaurant Tab Component
function RestaurantsTab({
  restaurants,
  onToggleStatus,
  onTogglePromotion,
}: {
  restaurants: Restaurant[]
  onToggleStatus: (id: string, current: boolean) => void
  onTogglePromotion: (id: string, current: boolean) => void
}) {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Restaurante
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Propietario
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Estado
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Publicidad
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Acciones
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {restaurants.map((restaurant) => (
              <tr key={restaurant.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <div>
                      <div className="text-sm font-medium text-gray-900">{restaurant.name}</div>
                      <div className="text-sm text-gray-500">{restaurant.cuisine}</div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900">
                    {restaurant.owner.firstName} {restaurant.owner.lastName}
                  </div>
                  <div className="text-sm text-gray-500">{restaurant.owner.email}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <button
                    onClick={() => onToggleStatus(restaurant.id, restaurant.isActive)}
                    className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                      restaurant.isActive
                        ? 'bg-green-100 text-green-800'
                        : 'bg-red-100 text-red-800'
                    }`}
                  >
                    {restaurant.isActive ? (
                      <>
                        <Check className="w-3 h-3 mr-1" />
                        Activo
                      </>
                    ) : (
                      <>
                        <X className="w-3 h-3 mr-1" />
                        Inactivo
                      </>
                    )}
                  </button>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <button
                    onClick={() => onTogglePromotion(restaurant.id, restaurant.isPromoted)}
                    className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                      restaurant.isPromoted
                        ? 'bg-yellow-100 text-yellow-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}
                  >
                    {restaurant.isPromoted ? (
                      <>
                        <TrendingUp className="w-3 h-3 mr-1" />
                        Promocionado
                      </>
                    ) : (
                      'No promocionado'
                    )}
                  </button>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <div className="flex gap-2">
                    <button
                      onClick={() => onToggleStatus(restaurant.id, restaurant.isActive)}
                      className="text-indigo-600 hover:text-indigo-900"
                    >
                      {restaurant.isActive ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

// Users Tab Component
function UsersTab({
  users,
  onToggleStatus,
}: {
  users: User[]
  onToggleStatus: (id: string, current: boolean) => void
}) {
  const getRoleColor = (role: string) => {
    switch (role) {
      case 'admin':
        return 'bg-purple-100 text-purple-800'
      case 'owner':
        return 'bg-blue-100 text-blue-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Usuario
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Email
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Rol
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Estado
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Acciones
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {users.map((user) => (
              <tr key={user.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-gray-900">
                    {user.firstName} {user.lastName}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-500">{user.email}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${getRoleColor(user.role)}`}>
                    {user.role}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <button
                    onClick={() => onToggleStatus(user.id, user.isActive)}
                    className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                      user.isActive
                        ? 'bg-green-100 text-green-800'
                        : 'bg-red-100 text-red-800'
                    }`}
                  >
                    {user.isActive ? (
                      <>
                        <Check className="w-3 h-3 mr-1" />
                        Activo
                      </>
                    ) : (
                      <>
                        <X className="w-3 h-3 mr-1" />
                        Bloqueado
                      </>
                    )}
                  </button>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <button
                    onClick={() => onToggleStatus(user.id, user.isActive)}
                    className="text-indigo-600 hover:text-indigo-900"
                  >
                    {user.isActive ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

// Reviews Tab Component
function ReviewsTab({
  reviews,
  onDelete,
}: {
  reviews: Review[]
  onDelete: (id: string) => void
}) {
  return (
    <div className="space-y-4">
      {reviews.map((review) => (
        <div
          key={review.id}
          className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow"
        >
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <div className="flex items-center gap-1">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className={`w-4 h-4 ${
                        i < review.rating
                          ? 'fill-yellow-400 text-yellow-400'
                          : 'text-gray-300'
                      }`}
                    />
                  ))}
                </div>
                <span className="text-sm font-medium text-gray-900">
                  {review.restaurant.name}
                </span>
              </div>
              <p className="text-gray-700 mb-3">{review.comment}</p>
              <div className="flex items-center gap-4 text-sm text-gray-500">
                <span>
                  Por: {review.client.firstName} {review.client.lastName}
                </span>
                <span>•</span>
                <span>{new Date(review.createdAt).toLocaleDateString()}</span>
              </div>
            </div>
            <button
              onClick={() => onDelete(review.id)}
              className="ml-4 text-red-600 hover:text-red-800 transition-colors"
            >
              <Trash2 className="w-5 h-5" />
            </button>
          </div>
        </div>
      ))}
    </div>
  )
}

// Announcements Tab Component
function AnnouncementsTab({
  announcements,
  onDelete,
  onToggle,
  onEdit,
  onCreate,
}: {
  announcements: Announcement[]
  onDelete: (id: string) => void
  onToggle: (id: string) => void
  onEdit: (announcement: Announcement) => void
  onCreate: () => void
}) {
  return (
    <div>
      <div className="mb-4 flex justify-end">
        <button
          onClick={onCreate}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
        >
          <Plus className="w-5 h-5" />
          Crear Anuncio
        </button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {announcements.map((announcement) => (
          <div
            key={announcement.id}
            className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow"
          >
            <div className="flex items-start justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">{announcement.title}</h3>
              <button
                onClick={() => onToggle(announcement.id)}
                className={`p-1 rounded ${
                  announcement.isActive
                    ? 'text-green-600 hover:bg-green-50'
                    : 'text-gray-400 hover:bg-gray-50'
                }`}
              >
                {announcement.isActive ? <Eye className="w-5 h-5" /> : <EyeOff className="w-5 h-5" />}
              </button>
            </div>
            {announcement.image && (
              <img
                src={announcement.image}
                alt={announcement.title}
                className="w-full h-32 object-cover rounded-lg mb-4"
              />
            )}
            <p className="text-gray-700 mb-4 line-clamp-3">{announcement.message}</p>
            <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
              <span className="capitalize">{announcement.targetAudience}</span>
              {announcement.startDate && (
                <span>{new Date(announcement.startDate).toLocaleDateString()}</span>
              )}
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => onEdit(announcement)}
                className="flex-1 px-3 py-2 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
              >
                <Edit className="w-4 h-4 inline mr-1" />
                Editar
              </button>
              <button
                onClick={() => onDelete(announcement.id)}
                className="px-3 py-2 text-sm bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// Announcement Form Modal
function AnnouncementFormModal({
  form,
  setForm,
  onSubmit,
  onClose,
  editing,
}: {
  form: any
  setForm: (form: any) => void
  onSubmit: (e: React.FormEvent) => void
  onClose: () => void
  editing: boolean
}) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
      >
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900">
              {editing ? 'Editar Anuncio' : 'Crear Anuncio'}
            </h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          <form onSubmit={onSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Título
              </label>
              <input
                type="text"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Mensaje
              </label>
              <textarea
                value={form.message}
                onChange={(e) => setForm({ ...form, message: e.target.value })}
                rows={4}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                URL de Imagen (opcional)
              </label>
              <input
                type="url"
                value={form.image}
                onChange={(e) => setForm({ ...form, image: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                placeholder="https://ejemplo.com/imagen.jpg"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Audiencia
              </label>
              <select
                value={form.targetAudience}
                onChange={(e) => setForm({ ...form, targetAudience: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              >
                <option value="all">Todos</option>
                <option value="clients">Clientes</option>
                <option value="owners">Propietarios</option>
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Fecha de Inicio (opcional)
                </label>
                <input
                  type="date"
                  value={form.startDate}
                  onChange={(e) => setForm({ ...form, startDate: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Fecha de Fin (opcional)
                </label>
                <input
                  type="date"
                  value={form.endDate}
                  onChange={(e) => setForm({ ...form, endDate: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
              </div>
            </div>

            <div className="flex gap-3 pt-4">
              <button
                type="submit"
                className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
              >
                {editing ? 'Actualizar' : 'Crear'}
              </button>
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Cancelar
              </button>
            </div>
          </form>
        </div>
      </motion.div>
    </div>
  )
}
