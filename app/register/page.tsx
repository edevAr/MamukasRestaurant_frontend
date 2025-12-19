'use client'

import { useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { PasswordInput } from '@/components/ui/PasswordInput'
import { OwnerRegistrationSuccessModal } from '@/components/ui/OwnerRegistrationSuccessModal'
import { motion, AnimatePresence } from 'framer-motion'
import { Mail, Lock, User, Phone, UtensilsCrossed, Sparkles, MapPin, Image as ImageIcon, X } from 'lucide-react'
import toast from 'react-hot-toast'

export default function RegisterPage() {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    firstName: '',
    lastName: '',
    phone: '',
  })
  const [isOwner, setIsOwner] = useState(false)
  const [restaurantData, setRestaurantData] = useState({
    name: '',
    address: '',
    latitude: 0,
    longitude: 0,
    image: '',
  })
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [showSuccessModal, setShowSuccessModal] = useState(false)
  const { register } = useAuth()

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error('La imagen debe ser menor a 5MB')
        return
      }
      
      const reader = new FileReader()
      reader.onloadend = () => {
        const base64String = reader.result as string
        setRestaurantData({ ...restaurantData, image: base64String })
        setImagePreview(base64String)
      }
      reader.readAsDataURL(file)
    }
  }

  const getCurrentLocation = () => {
    if (!navigator.geolocation) {
      toast.error('La geolocalización no está disponible en tu navegador')
      return
    }

    toast.loading('Obteniendo tu ubicación...', { id: 'location' })
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setRestaurantData({
          ...restaurantData,
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        })
        toast.success('Ubicación obtenida', { id: 'location' })
      },
      (error) => {
        toast.error('No se pudo obtener la ubicación. Por favor ingrésala manualmente.', { id: 'location' })
      }
    )
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (isOwner) {
      if (!restaurantData.name || !restaurantData.address) {
        toast.error('Por favor completa todos los campos del restaurante')
        return
      }
      if (restaurantData.latitude === 0 || restaurantData.longitude === 0) {
        toast.error('Por favor obtén tu ubicación')
        return
      }
      // Validar rango de coordenadas
      if (restaurantData.latitude < -90 || restaurantData.latitude > 90) {
        toast.error('La latitud debe estar entre -90 y 90')
        return
      }
      if (restaurantData.longitude < -180 || restaurantData.longitude > 180) {
        toast.error('La longitud debe estar entre -180 y 180')
        return
      }
    }

    setLoading(true)
    try {
      const registerData: any = {
        ...formData,
        role: isOwner ? 'owner' : 'client',
      }

      if (isOwner) {
        registerData.restaurantInfo = restaurantData
      }

      await register(registerData)
      
      if (isOwner) {
        setShowSuccessModal(true)
      }
    } catch (error) {
      // Error handled by AuthContext
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden bg-gradient-to-br from-orange-50 via-amber-50 to-red-50 py-12 px-4 sm:px-6 lg:px-8">
      {/* Elementos decorativos de fondo */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div
          animate={{ rotate: 360, scale: [1, 1.2, 1] }}
          transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
          className="absolute top-20 right-20 w-64 h-64 bg-primary-300 rounded-full mix-blend-multiply filter blur-xl opacity-30"
        />
        <motion.div
          animate={{ rotate: -360, scale: [1, 1.1, 1] }}
          transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
          className="absolute bottom-20 left-20 w-64 h-64 bg-accent-300 rounded-full mix-blend-multiply filter blur-xl opacity-30"
        />
        <motion.div
          animate={{ rotate: 180, scale: [1, 1.15, 1] }}
          transition={{ duration: 30, repeat: Infinity, ease: "linear" }}
          className="absolute top-1/2 left-1/2 w-72 h-72 bg-golden-300 rounded-full mix-blend-multiply filter blur-xl opacity-20 transform -translate-x-1/2 -translate-y-1/2"
        />
      </div>

      <div className="relative z-10 w-full max-w-lg">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="card bg-white/90 backdrop-blur-lg shadow-food-lg"
        >
          {/* Header */}
          <div className="text-center mb-8">
            <motion.div
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
              className="inline-flex items-center justify-center w-20 h-20 bg-food-gradient rounded-2xl mb-4 shadow-food relative"
            >
              <UtensilsCrossed className="w-10 h-10 text-white z-10" />
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                className="absolute inset-0"
              >
                <Sparkles className="w-5 h-5 text-white/50 absolute top-1 right-1" />
              </motion.div>
            </motion.div>
            <h2 className="text-3xl font-display font-bold text-gray-900 mb-2">
              Únete a nosotros
            </h2>
            <p className="text-gray-600">
              Crea tu cuenta y comienza a disfrutar
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Nombre"
                type="text"
                placeholder="Juan"
                value={formData.firstName}
                onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                required
                icon={<User className="w-5 h-5" />}
              />

              <Input
                label="Apellido"
                type="text"
                placeholder="Pérez"
                value={formData.lastName}
                onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                required
                icon={<User className="w-5 h-5" />}
              />
            </div>

            <Input
              label="Correo electrónico"
              type="email"
              placeholder="tu@email.com"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              required
              icon={<Mail className="w-5 h-5" />}
            />

            <Input
              label="Teléfono (opcional)"
              type="tel"
              placeholder="+1 234 567 8900"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              icon={<Phone className="w-5 h-5" />}
            />

            <PasswordInput
              label="Contraseña"
              placeholder="Mínimo 6 caracteres"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              required
              minLength={6}
              icon={<Lock className="w-5 h-5" />}
            />

            {/* Owner checkbox */}
            <div className="flex items-start p-4 bg-gradient-to-r from-primary-50 to-amber-50 rounded-xl border border-primary-200">
              <input
                id="isOwner"
                type="checkbox"
                checked={isOwner}
                onChange={(e) => setIsOwner(e.target.checked)}
                className="mt-1 w-5 h-5 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
              />
              <label htmlFor="isOwner" className="ml-3 text-sm font-medium text-gray-700 cursor-pointer">
                Soy dueño de un restaurante
              </label>
            </div>

            {/* Restaurant fields */}
            <AnimatePresence>
              {isOwner && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="space-y-4 overflow-hidden"
                >
                  <div className="border-t border-gray-200 pt-4">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                      <UtensilsCrossed className="w-5 h-5 text-primary-600" />
                      Información del Restaurante
                    </h3>
                  </div>

                  <Input
                    label="Nombre del Restaurante"
                    type="text"
                    placeholder="Mi Restaurante"
                    value={restaurantData.name}
                    onChange={(e) => setRestaurantData({ ...restaurantData, name: e.target.value })}
                    required={isOwner}
                    icon={<UtensilsCrossed className="w-5 h-5" />}
                  />

                  <Input
                    label="Dirección"
                    type="text"
                    placeholder="Calle, número, ciudad"
                    value={restaurantData.address}
                    onChange={(e) => setRestaurantData({ ...restaurantData, address: e.target.value })}
                    required={isOwner}
                    icon={<MapPin className="w-5 h-5" />}
                  />

                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700">
                      Ubicación (Coordenadas)
                    </label>
                    <div className="flex gap-2">
                      <Input
                        type="number"
                        step="any"
                        placeholder="Latitud (-90 a 90)"
                        min={-90}
                        max={90}
                        value={restaurantData.latitude || ''}
                        onChange={(e) => {
                          const value = parseFloat(e.target.value)
                          if (!isNaN(value) && value >= -90 && value <= 90) {
                            setRestaurantData({ ...restaurantData, latitude: value })
                          } else if (e.target.value === '' || e.target.value === '-') {
                            setRestaurantData({ ...restaurantData, latitude: 0 })
                          }
                        }}
                        required={isOwner}
                        className="flex-1"
                      />
                      <Input
                        type="number"
                        step="any"
                        placeholder="Longitud (-180 a 180)"
                        min={-180}
                        max={180}
                        value={restaurantData.longitude || ''}
                        onChange={(e) => {
                          const value = parseFloat(e.target.value)
                          if (!isNaN(value) && value >= -180 && value <= 180) {
                            setRestaurantData({ ...restaurantData, longitude: value })
                          } else if (e.target.value === '' || e.target.value === '-') {
                            setRestaurantData({ ...restaurantData, longitude: 0 })
                          }
                        }}
                        required={isOwner}
                        className="flex-1"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        onClick={getCurrentLocation}
                        className="whitespace-nowrap"
                      >
                        <MapPin className="w-4 h-4 mr-1" />
                        Obtener
                      </Button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700">
                      Imagen del Restaurante
                    </label>
                    <div className="flex items-center gap-4">
                      <label className="flex-1 cursor-pointer">
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleImageUpload}
                          className="hidden"
                        />
                        <div className="flex items-center justify-center gap-2 px-4 py-3 border-2 border-dashed border-gray-300 rounded-lg hover:border-primary-500 transition-colors">
                          <ImageIcon className="w-5 h-5 text-gray-400" />
                          <span className="text-sm text-gray-600">
                            {imagePreview ? 'Cambiar imagen' : 'Subir imagen'}
                          </span>
                        </div>
                      </label>
                      {imagePreview && (
                        <div className="relative w-20 h-20 rounded-lg overflow-hidden border-2 border-primary-200">
                          <img
                            src={imagePreview}
                            alt="Preview"
                            className="w-full h-full object-cover"
                          />
                          <button
                            type="button"
                            onClick={() => {
                              setImagePreview(null)
                              setRestaurantData({ ...restaurantData, image: '' })
                            }}
                            className="absolute top-0 right-0 bg-red-500 text-white rounded-bl-lg p-1 hover:bg-red-600"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="flex items-start">
              <input
                id="terms"
                type="checkbox"
                className="mt-1 w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                required
              />
              <label htmlFor="terms" className="ml-2 text-sm text-gray-600">
                Acepto los{' '}
                <a href="#" className="text-primary-600 hover:text-primary-700 font-medium">
                  términos y condiciones
                </a>{' '}
                y la{' '}
                <a href="#" className="text-primary-600 hover:text-primary-700 font-medium">
                  política de privacidad
                </a>
              </label>
            </div>

            <Button
              type="submit"
              variant="primary"
              size="lg"
              fullWidth
              isLoading={loading}
              className="shadow-food"
            >
              Crear Cuenta
            </Button>

            <div className="text-center">
              <p className="text-sm text-gray-600">
                ¿Ya tienes una cuenta?{' '}
                <a
                  href="/login"
                  className="font-semibold text-primary-600 hover:text-primary-700 transition-colors"
                >
                  Inicia sesión aquí
                </a>
              </p>
            </div>
          </form>
        </motion.div>
      </div>

      {/* Success Modal */}
      <OwnerRegistrationSuccessModal
        isOpen={showSuccessModal}
        onClose={() => {
          setShowSuccessModal(false)
          window.location.href = '/login'
        }}
      />
    </div>
  )
}

