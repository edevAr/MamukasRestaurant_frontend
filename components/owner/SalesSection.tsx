'use client'

import { useState, useEffect } from 'react'
import api from '@/lib/api'
import toast from 'react-hot-toast'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  DollarSign, 
  ShoppingCart, 
  X, 
  User,
  Hash,
  FileText,
  UtensilsCrossed,
  Receipt,
  CreditCard,
  Home,
  Store,
  Plus,
  Minus,
  Search,
  Trash2
} from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Input } from '@/components/ui/Input'

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

interface SalesSectionProps {
  restaurantId: string
  menus: Menu[]
  onSaleCreated?: () => void
}

const typeLabels = {
  food: 'Comida',
  drink: 'Bebida',
  combo: 'Combo',
  dessert: 'Postre',
}

const typeColors = {
  food: 'bg-orange-100 text-orange-700 border-orange-300',
  drink: 'bg-blue-100 text-blue-700 border-blue-300',
  combo: 'bg-purple-100 text-purple-700 border-purple-300',
  dessert: 'bg-pink-100 text-pink-700 border-pink-300',
}

export function SalesSection({ restaurantId, menus, onSaleCreated }: SalesSectionProps) {
  const [cart, setCart] = useState<CartItem[]>([])
  const [showSaleModal, setShowSaleModal] = useState(false)
  const [showClearCartModal, setShowClearCartModal] = useState(false)
  const [loading, setLoading] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [filterType, setFilterType] = useState<'all' | 'food' | 'drink' | 'dessert'>('all')
  
  // Filtrar menús para mostrar solo los del día actual
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const todayStr = today.toISOString().split('T')[0]
  
  const todayMenus = menus.filter(menu => {
    if (!menu.date) return false
    const menuDate = new Date(menu.date)
    menuDate.setHours(0, 0, 0, 0)
    const menuDateStr = menuDate.toISOString().split('T')[0]
    return menuDateStr === todayStr
  })
  
  // Form state
  const [serviceType, setServiceType] = useState<'dine-in' | 'takeout'>('dine-in')
  const [needsInvoice, setNeedsInvoice] = useState(false)
  const [customerName, setCustomerName] = useState('')
  const [customerNit, setCustomerNit] = useState('')
  const [customerEmail, setCustomerEmail] = useState('')
  const [customerPhone, setCustomerPhone] = useState('')
  const [notes, setNotes] = useState('')

  const handleAddToCart = (menu: Menu) => {
    if (!menu.available || menu.quantity <= 0) {
      toast.error('Este plato no está disponible')
      return
    }

    const existingItem = cart.find(item => item.menuId === menu.id)
    
    if (existingItem) {
      // Si ya existe, aumentar cantidad
      if (existingItem.quantity >= menu.quantity) {
        toast.error(`Solo hay ${menu.quantity} unidades disponibles`)
        return
      }
      setCart(cart.map(item => 
        item.menuId === menu.id 
          ? { ...item, quantity: item.quantity + 1 }
          : item
      ))
      toast.success(`${menu.name} agregado al carrito`, { icon: '🛒' })
    } else {
      // Agregar nuevo item al carrito
      setCart([...cart, {
        menuId: menu.id,
        menuName: menu.name,
        menuPrice: Number(menu.price || 0),
        menuImage: menu.image,
        quantity: 1,
      }])
      toast.success(`${menu.name} agregado al carrito`, { icon: '🛒' })
    }
  }

  const handleRemoveFromCart = (menuId: string) => {
    setCart(cart.filter(item => item.menuId !== menuId))
  }

  const handleClearCart = () => {
    if (cart.length === 0) return
    setShowClearCartModal(true)
  }

  const confirmClearCart = () => {
    setCart([])
    setShowSaleModal(false)
    setShowClearCartModal(false)
    toast.success('Carrito vaciado')
  }

  const handleUpdateCartItemQuantity = (menuId: string, newQuantity: number) => {
    if (newQuantity <= 0) {
      handleRemoveFromCart(menuId)
      return
    }
    
    const menu = menus.find(m => m.id === menuId)
    if (menu && newQuantity > menu.quantity) {
      toast.error(`Solo hay ${menu.quantity} unidades disponibles`)
      return
    }

    setCart(cart.map(item => 
      item.menuId === menuId 
        ? { ...item, quantity: newQuantity }
        : item
    ))
  }

  const getCartTotal = () => {
    return cart.reduce((total, item) => total + (item.menuPrice * item.quantity), 0)
  }

  const handleOpenCart = () => {
    if (cart.length === 0) {
      toast.error('El carrito está vacío')
      return
    }
    setServiceType('dine-in')
    setNeedsInvoice(false)
    setCustomerName('')
    setCustomerNit('')
    setCustomerEmail('')
    setCustomerPhone('')
    setNotes('')
    setShowSaleModal(true)
  }

  const handleCreateSale = async () => {
    if (cart.length === 0) {
      toast.error('El carrito está vacío')
      return
    }

    if (needsInvoice && !customerName) {
      toast.error('Ingresa el nombre del cliente para la factura')
      return
    }

    setLoading(true)
    try {
      const saleData: any = {
        items: cart.map(item => ({
          menuId: item.menuId,
          quantity: item.quantity,
          notes: item.notes || undefined,
        })),
      }

      // Agregar notas si existen
      if (notes && notes.trim()) {
        saleData.notes = notes.trim()
      }

      // Agregar información del cliente si se necesita factura
      if (needsInvoice && customerName) {
        saleData.customerName = customerName.trim()
      }

      // Agregar número de mesa si es dine-in (opcional, puede ser undefined)
      if (serviceType === 'dine-in') {
        // tableNumber es opcional, se puede dejar undefined
        // saleData.tableNumber = undefined
      }

      console.log('Creating sale with data:', saleData)
      
      const response = await api.post('/sales', saleData)
      
      console.log('Sale created successfully:', response.data)
      toast.success('✅ Venta creada exitosamente')
      
      // Limpiar el carrito y cerrar el modal
      setCart([])
      setShowSaleModal(false)
      setServiceType('dine-in')
      setNeedsInvoice(false)
      setCustomerName('')
      setCustomerNit('')
      setCustomerEmail('')
      setCustomerPhone('')
      setNotes('')
      
      // Refrescar la lista de ventas/despachos
      if (onSaleCreated) {
        onSaleCreated()
      }
      
      // Pequeño delay para asegurar que el estado se actualice antes de refrescar
      setTimeout(() => {
        // Disparar evento personalizado para refrescar despachos
        window.dispatchEvent(new CustomEvent('sale:created'))
      }, 100)
    } catch (error: any) {
      console.error('Error creating sale:', error)
      const errorMessage = error.response?.data?.message || error.message || 'Error al crear la venta'
      toast.error(`❌ ${errorMessage}`)
      
      // Si el error es porque el menú no está disponible para hoy, mostrar mensaje más claro
      if (errorMessage.includes('not found for today')) {
        toast.error('⚠️ Algunos platos no están disponibles para hoy. Por favor, verifica que los platos tengan la fecha de hoy en el menú.')
      }
    } finally {
      setLoading(false)
    }
  }

  // Filter menus by search query
  const filterMenus = (menuList: Menu[]) => {
    // Filtrar por tipo primero
    let filtered = filterType === 'all' 
      ? menuList 
      : menuList.filter(menu => menu.type === filterType)
    
    // Luego filtrar por búsqueda
    if (!searchQuery.trim()) {
      return filtered
    }
    const query = searchQuery.toLowerCase().trim()
    return filtered.filter(menu => 
      menu.name.toLowerCase().includes(query) ||
      menu.description?.toLowerCase().includes(query) ||
      typeLabels[menu.type]?.toLowerCase().includes(query)
    )
  }

  // Usar solo menús del día actual
  const availableMenus = filterMenus(todayMenus.filter(m => m.available && m.quantity > 0))
  const unavailableMenus = filterMenus(todayMenus.filter(m => !m.available || m.quantity <= 0))

  // Botones de filtro rápido (solo contar menús del día actual)
  const filterButtons = [
    { id: 'all' as const, label: 'Todo', icon: '🍽️', count: todayMenus.length },
    { id: 'food' as const, label: 'Comidas', icon: '🍽️', count: todayMenus.filter(m => m.type === 'food').length },
    { id: 'drink' as const, label: 'Bebidas', icon: '🥤', count: todayMenus.filter(m => m.type === 'drink').length },
    { id: 'dessert' as const, label: 'Postres', icon: '🍰', count: todayMenus.filter(m => m.type === 'dessert').length },
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Ventas</h2>
        <p className="text-gray-600 mt-1">Selecciona platos para agregar al carrito</p>
      </div>

      {/* Filtros rápidos */}
      {todayMenus.length > 0 && (
        <div className="flex flex-wrap gap-3">
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
      )}

      {/* Search Bar */}
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
          <Search className="h-5 w-5 text-gray-400" />
        </div>
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Buscar plato por nombre, descripción o tipo..."
          className="block w-full pl-12 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-gray-900 placeholder-gray-400 transition-all"
        />
        {searchQuery && (
          <button
            onClick={() => setSearchQuery('')}
            className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-400 hover:text-gray-600"
          >
            <X className="h-5 w-5" />
          </button>
        )}
      </div>

      {/* Available Menus */}
      {availableMenus.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Platos Disponibles</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {availableMenus.map((menu, index) => (
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
                    <p className="text-gray-600 text-sm mb-4 line-clamp-2">{menu.description}</p>
                    <div className="flex items-center justify-between mb-4">
                      <span className="text-2xl font-bold text-primary-600">
                        ${Number(menu.price || 0).toFixed(2)}
                      </span>
                      <span className="text-sm text-gray-500">
                        {menu.quantity} disponible{menu.quantity !== 1 ? 's' : ''}
                      </span>
                    </div>
                    <Button
                      onClick={() => handleAddToCart(menu)}
                      variant="primary"
                      className="w-full flex items-center justify-center gap-2"
                    >
                      <Plus className="w-5 h-5" />
                      Agregar al Carrito
                    </Button>
                  </div>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {/* Unavailable Menus */}
      {unavailableMenus.length > 0 && (
        <div className="mt-8">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Platos No Disponibles</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {unavailableMenus.map((menu, index) => (
              <motion.div
                key={menu.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <Card className="p-6 opacity-60 h-full flex flex-col">
                  {menu.image ? (
                    <div className="relative w-full h-48 mb-4 rounded-xl overflow-hidden">
                      <img
                        src={menu.image}
                        alt={menu.name}
                        className="w-full h-full object-cover grayscale"
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
                    <p className="text-gray-600 text-sm mb-4 line-clamp-2">{menu.description}</p>
                    <div className="flex items-center justify-between mb-4">
                      <span className="text-2xl font-bold text-gray-400">
                        ${menu.price.toFixed(2)}
                      </span>
                      <span className="text-sm text-red-500 font-semibold">
                        No disponible
                      </span>
                    </div>
                    <Button
                      variant="ghost"
                      className="w-full"
                      disabled
                    >
                      No disponible
                    </Button>
                  </div>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {todayMenus.length === 0 && (
        <Card className="p-12 text-center">
          <ShoppingCart className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-600 text-lg">No hay platos disponibles para hoy</p>
          <p className="text-gray-500 mt-2">Agrega platos para hoy en el tab de Menú</p>
        </Card>
      )}

      {todayMenus.length > 0 && searchQuery && availableMenus.length === 0 && unavailableMenus.length === 0 && (
        <Card className="p-12 text-center">
          <Search className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-600 text-lg">No se encontraron platos</p>
          <p className="text-gray-500 mt-2">
            No hay resultados para &quot;{searchQuery}&quot;
          </p>
          <Button
            onClick={() => setSearchQuery('')}
            variant="ghost"
            className="mt-4"
          >
            Limpiar búsqueda
          </Button>
        </Card>
      )}

      {/* Sale Modal */}
      <AnimatePresence>
        {showSaleModal && cart.length > 0 && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
              onClick={() => setShowSaleModal(false)}
            />
            
            {/* Dialog */}
            <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 pointer-events-none">
              <motion.div
                initial={{ scale: 0.95, opacity: 0, y: 20 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.95, opacity: 0, y: 20 }}
                transition={{ type: 'spring', duration: 0.4, bounce: 0.2 }}
                onClick={(e) => e.stopPropagation()}
                className="bg-white rounded-xl shadow-2xl max-w-xl w-full max-h-[85vh] overflow-y-auto pointer-events-auto relative"
              >
              {/* Header */}
              <div className="sticky top-0 bg-gradient-to-r from-primary-500 to-primary-600 text-white p-4 rounded-t-xl z-50 shadow-lg">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <ShoppingCart className="w-5 h-5" />
                    <div>
                      <h3 className="text-lg font-bold">Carrito de Venta</h3>
                      <p className="text-primary-100 text-xs">{cart.length} plato{cart.length !== 1 ? 's' : ''} en el carrito</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      onClick={handleClearCart}
                      variant="ghost"
                      size="sm"
                      className="text-white hover:bg-white/20 text-xs"
                    >
                      <Trash2 className="w-4 h-4 mr-1" />
                      Vaciar
                    </Button>
                    <Button
                      onClick={() => setShowSaleModal(false)}
                      variant="ghost"
                      size="sm"
                      className="text-white hover:bg-white/20 h-8 w-8 p-0"
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>

              <div className="p-4 space-y-4 relative z-0">
                {/* Cart Items */}
                <div className="space-y-3">
                  <label className="block text-xs font-semibold text-gray-700 mb-2">
                    Platos Seleccionados
                  </label>
                  {cart.map((item) => {
                    const menu = menus.find(m => m.id === item.menuId)
                    const maxQuantity = menu?.quantity || 0
                    return (
                      <Card key={item.menuId} className="p-3 bg-gradient-to-br from-gray-50 to-gray-100">
                        <div className="flex items-center gap-3">
                          {item.menuImage && (
                            <img
                              src={item.menuImage}
                              alt={item.menuName}
                              className="w-12 h-12 rounded-lg object-cover flex-shrink-0"
                            />
                          )}
                          <div className="flex-1 min-w-0">
                            <h4 className="font-bold text-sm text-gray-900 truncate">{item.menuName}</h4>
                            <p className="text-primary-600 font-semibold text-sm mt-0.5">
                              ${item.menuPrice.toFixed(2)} c/u
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            <Button
                              onClick={() => handleUpdateCartItemQuantity(item.menuId, item.quantity - 1)}
                              variant="ghost"
                              size="sm"
                              disabled={item.quantity <= 1}
                              className="border border-gray-300 h-7 w-7 p-0"
                            >
                              <Minus className="w-3 h-3" />
                            </Button>
                            <span className="text-sm font-bold text-gray-900 w-8 text-center">
                              {item.quantity}
                            </span>
                            <Button
                              onClick={() => handleUpdateCartItemQuantity(item.menuId, item.quantity + 1)}
                              variant="ghost"
                              size="sm"
                              disabled={item.quantity >= maxQuantity}
                              className="border border-gray-300 h-7 w-7 p-0"
                            >
                              <Plus className="w-3 h-3" />
                            </Button>
                            <Button
                              onClick={() => handleRemoveFromCart(item.menuId)}
                              variant="ghost"
                              size="sm"
                              className="text-red-600 hover:text-red-700 hover:bg-red-50 h-7 w-7 p-0 ml-1"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </Button>
                          </div>
                        </div>
                        <div className="mt-2 pt-2 border-t border-gray-200 flex items-center justify-between">
                          <span className="text-xs text-gray-500">Subtotal:</span>
                          <span className="text-sm font-bold text-gray-900">
                            ${(item.menuPrice * item.quantity).toFixed(2)}
                          </span>
                        </div>
                      </Card>
                    )
                  })}
                </div>

                {/* Service Type Toggle */}
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-2">
                    Tipo de Servicio
                  </label>
                  <div 
                    onClick={() => {
                      setServiceType(serviceType === 'dine-in' ? 'takeout' : 'dine-in')
                    }}
                    className="relative cursor-pointer group"
                  >
                    <div className={`relative h-11 rounded-xl transition-all duration-300 ease-in-out shadow-inner ${
                      serviceType === 'dine-in' 
                        ? 'bg-primary-500' 
                        : 'bg-gray-300'
                    }`}>
                      {/* Animated Slider */}
                      <motion.div
                        className="absolute top-0.5 left-0.5 w-[calc(50%-0.25rem)] h-10 bg-white rounded-lg shadow-lg flex items-center justify-center z-10"
                        animate={{
                          x: serviceType === 'dine-in' ? 0 : '100%',
                        }}
                        transition={{
                          type: "spring",
                          stiffness: 500,
                          damping: 30
                        }}
                      >
                        <motion.div
                          animate={{
                            scale: [1, 1.1, 1],
                          }}
                          transition={{
                            duration: 0.3,
                            times: [0, 0.5, 1]
                          }}
                        >
                          {serviceType === 'dine-in' ? (
                            <Store className="w-5 h-5 text-primary-600" />
                          ) : (
                            <Home className="w-5 h-5 text-gray-600" />
                          )}
                        </motion.div>
                      </motion.div>
                      
                      {/* Labels */}
                      <div className="relative h-full flex items-center justify-between px-3 pointer-events-none">
                        <motion.div 
                          className={`flex items-center gap-1.5 flex-1 justify-center transition-colors duration-300 ${
                            serviceType === 'dine-in' ? 'text-white' : 'text-gray-500'
                          }`}
                          animate={{
                            opacity: serviceType === 'dine-in' ? 1 : 0.6,
                          }}
                        >
                          <Store className="w-4 h-4" />
                          <span className="text-xs font-semibold">En Local</span>
                        </motion.div>
                        <motion.div 
                          className={`flex items-center gap-1.5 flex-1 justify-center transition-colors duration-300 ${
                            serviceType === 'takeout' ? 'text-white' : 'text-gray-500'
                          }`}
                          animate={{
                            opacity: serviceType === 'takeout' ? 1 : 0.6,
                          }}
                        >
                          <Home className="w-4 h-4" />
                          <span className="text-xs font-semibold">Para Llevar</span>
                        </motion.div>
                      </div>
                    </div>
                    {/* Hover effect */}
                    <div className="absolute inset-0 rounded-xl bg-black/0 group-hover:bg-black/5 transition-colors duration-200 pointer-events-none" />
                  </div>
                </div>

                {/* Invoice Toggle */}
                <div className="border-t pt-3">
                  <div 
                    onClick={() => setNeedsInvoice(!needsInvoice)}
                    className="flex items-center justify-between cursor-pointer group hover:bg-gray-50 -mx-2 px-2 py-2 rounded-lg transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <CreditCard className={`w-4 h-4 transition-colors ${needsInvoice ? 'text-primary-600' : 'text-gray-600'}`} />
                      <span className={`text-xs font-semibold transition-colors ${needsInvoice ? 'text-primary-700' : 'text-gray-700'}`}>
                        Solicitar Factura Electrónica
                      </span>
                    </div>
                    <div className="relative">
                      <div className={`w-11 h-6 rounded-full transition-colors duration-300 ${
                        needsInvoice ? 'bg-primary-500' : 'bg-gray-300'
                      }`}>
                        <motion.div
                          className="absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow-md"
                          animate={{
                            x: needsInvoice ? 20 : 0,
                          }}
                          transition={{
                            type: "spring",
                            stiffness: 500,
                            damping: 30
                          }}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Customer Information - Only shown if invoice is needed */}
                <AnimatePresence>
                  {needsInvoice && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.3 }}
                      className="overflow-hidden"
                    >
                      <div className="space-y-2.5 pt-2">
                        <Input
                          label="Nombre Completo *"
                          value={customerName}
                          onChange={(e) => setCustomerName(e.target.value)}
                          placeholder="Ej: Juan Pérez"
                          icon={<User className="w-4 h-4" />}
                          required
                        />
                        <div className="grid grid-cols-2 gap-2.5">
                          <Input
                            label="NIT / CI"
                            value={customerNit}
                            onChange={(e) => setCustomerNit(e.target.value)}
                            placeholder="1234567890"
                            icon={<Receipt className="w-4 h-4" />}
                          />
                          <Input
                            label="Teléfono"
                            value={customerPhone}
                            onChange={(e) => setCustomerPhone(e.target.value)}
                            placeholder="70000000"
                            type="tel"
                          />
                        </div>
                        <Input
                          label="Email"
                          value={customerEmail}
                          onChange={(e) => setCustomerEmail(e.target.value)}
                          placeholder="cliente@email.com"
                          type="email"
                        />
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Notes */}
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                    Notas Adicionales
                  </label>
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Instrucciones especiales..."
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 resize-none"
                    rows={2}
                  />
                </div>

                {/* Summary & Actions */}
                <div className="border-t pt-3 space-y-3">
                  <Card className="p-3 bg-gradient-to-br from-primary-50 to-primary-100 border border-primary-200">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-700 font-semibold">Total:</span>
                      <span className="text-primary-600 font-bold text-xl">
                        ${getCartTotal().toFixed(2)}
                      </span>
                    </div>
                  </Card>
                  <div className="flex gap-2">
                    <Button
                      onClick={() => setShowSaleModal(false)}
                      variant="ghost"
                      className="flex-1"
                      disabled={loading}
                      size="sm"
                    >
                      Cancelar
                    </Button>
                    <Button
                      onClick={handleCreateSale}
                      variant="primary"
                      className="flex-1 flex items-center justify-center gap-2"
                      disabled={loading || (needsInvoice && !customerName)}
                      size="sm"
                    >
                      {loading ? (
                        <>
                          <div className="animate-spin rounded-full h-3.5 w-3.5 border-b-2 border-white"></div>
                          <span>Procesando...</span>
                        </>
                      ) : (
                        <>
                          <DollarSign className="w-4 h-4" />
                          <span>Confirmar Venta</span>
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </div>
              </motion.div>
            </div>
          </>
        )}
      </AnimatePresence>

      {/* Clear Cart Confirmation Modal */}
      <AnimatePresence>
        {showClearCartModal && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[70]"
              onClick={() => setShowClearCartModal(false)}
            />
            
            {/* Dialog */}
            <div className="fixed inset-0 z-[80] flex items-center justify-center p-4 pointer-events-none">
              <motion.div
                initial={{ scale: 0.9, opacity: 0, y: 20 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.9, opacity: 0, y: 20 }}
                transition={{ type: 'spring', duration: 0.4, bounce: 0.2 }}
                onClick={(e) => e.stopPropagation()}
                className="bg-white rounded-2xl shadow-2xl max-w-md w-full pointer-events-auto overflow-hidden"
              >
                {/* Icon Header */}
                <div className="bg-gradient-to-br from-red-50 to-orange-50 p-8 text-center">
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: 'spring', delay: 0.1, stiffness: 200 }}
                    className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-red-500 to-orange-500 rounded-full mb-4 shadow-lg"
                  >
                    <Trash2 className="w-10 h-10 text-white" />
                  </motion.div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">
                    ¿Vaciar Carrito?
                  </h3>
                  <p className="text-gray-600 text-sm">
                    Esta acción eliminará todos los items del carrito
                  </p>
                </div>

                {/* Content */}
                <div className="p-6">
                  <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-6">
                    <div className="flex items-start gap-3">
                      <div className="flex-shrink-0 mt-0.5">
                        <div className="w-5 h-5 rounded-full bg-amber-400 flex items-center justify-center">
                          <span className="text-amber-900 text-xs font-bold">!</span>
                        </div>
                      </div>
                      <div className="flex-1">
                        <p className="text-sm text-amber-900 font-medium">
                          Se eliminarán <span className="font-bold">{cart.length}</span> plato{cart.length !== 1 ? 's' : ''} del carrito
                        </p>
                        <p className="text-xs text-amber-700 mt-1">
                          Total: <span className="font-semibold">${getCartTotal().toFixed(2)}</span>
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-3">
                    <Button
                      onClick={() => setShowClearCartModal(false)}
                      variant="ghost"
                      className="flex-1"
                      size="sm"
                    >
                      Cancelar
                    </Button>
                    <Button
                      onClick={confirmClearCart}
                      variant="primary"
                      className="flex-1 bg-gradient-to-r from-red-500 to-orange-500 hover:from-red-600 hover:to-orange-600"
                      size="sm"
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      Sí, Vaciar Carrito
                    </Button>
                  </div>
                </div>
              </motion.div>
            </div>
          </>
        )}
      </AnimatePresence>

      {/* Floating Cart Button */}
      <AnimatePresence>
        {cart.length > 0 && (
          <motion.div
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 500, damping: 30 }}
            className="fixed bottom-6 right-6 z-40"
          >
            <Button
              onClick={handleOpenCart}
              variant="primary"
              size="lg"
              className="flex items-center gap-3 shadow-2xl hover:shadow-3xl transition-all relative rounded-full px-6 py-4"
            >
              <div className="relative">
                <ShoppingCart className="w-6 h-6" />
                <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center border-2 border-white">
                  {cart.reduce((sum, item) => sum + item.quantity, 0)}
                </span>
              </div>
              <div className="flex flex-col items-start">
                <span className="text-sm font-semibold">Ver Carrito</span>
                <span className="text-xs opacity-90">
                  ${getCartTotal().toFixed(2)}
                </span>
              </div>
            </Button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
