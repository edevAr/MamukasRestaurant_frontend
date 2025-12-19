'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, TrendingUp, Image as ImageIcon, Calendar } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import api from '@/lib/api'
import toast from 'react-hot-toast'

interface Restaurant {
  id: string
  name: string
  isPromoted: boolean
  promotionText?: string | null
  promotionImage?: string | null
  promotionStartDate?: string | null
  promotionEndDate?: string | null
}

interface PromotionModalProps {
  isOpen: boolean
  restaurant: Restaurant | null
  onClose: () => void
  onSuccess: () => void
}

export function PromotionModal({ isOpen, restaurant, onClose, onSuccess }: PromotionModalProps) {
  const [formData, setFormData] = useState({
    promotionText: '',
    promotionImage: '',
    promotionStartDate: '',
    promotionEndDate: '',
  })
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  if (!isOpen || !restaurant) return null

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
        setFormData({ ...formData, promotionImage: base64String })
        setImagePreview(base64String)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      await api.post(`/restaurants/${restaurant.id}/promotion`, {
        promotionText: formData.promotionText,
        promotionImage: formData.promotionImage || null,
        promotionStartDate: formData.promotionStartDate || null,
        promotionEndDate: formData.promotionEndDate || null,
      })

      toast.success('Publicidad actualizada exitosamente')
      onSuccess()
      onClose()
      setFormData({
        promotionText: '',
        promotionImage: '',
        promotionStartDate: '',
        promotionEndDate: '',
      })
      setImagePreview(null)
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Error al actualizar la publicidad')
    } finally {
      setLoading(false)
    }
  }

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
          className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden"
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-amber-500 to-orange-500 p-6 text-white">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                  <TrendingUp className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold">Publicidad para {restaurant.name}</h2>
                  <p className="text-amber-100 text-sm">Esta información será visible para los clientes</p>
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

          {/* Form */}
          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Texto de Publicidad *
              </label>
              <textarea
                value={formData.promotionText}
                onChange={(e) => setFormData({ ...formData, promotionText: e.target.value })}
                placeholder="Ej: ¡Descuento del 20% en todos los platos este fin de semana!"
                rows={4}
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-amber-500 resize-none"
                required
                maxLength={500}
              />
              <p className="text-xs text-gray-500 mt-1 text-right">
                {formData.promotionText.length}/500 caracteres
              </p>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Imagen de Publicidad
              </label>
              <div className="flex items-center gap-4">
                <label className="flex-1 cursor-pointer">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                  />
                  <div className="flex items-center justify-center gap-2 px-4 py-3 border-2 border-dashed border-gray-300 rounded-xl hover:border-amber-500 transition-colors">
                    <ImageIcon className="w-5 h-5 text-gray-400" />
                    <span className="text-sm text-gray-600">
                      {imagePreview ? 'Cambiar imagen' : 'Subir imagen'}
                    </span>
                  </div>
                </label>
                {imagePreview && (
                  <div className="relative w-24 h-24 rounded-xl overflow-hidden border-2 border-amber-200">
                    <img
                      src={imagePreview}
                      alt="Preview"
                      className="w-full h-full object-cover"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        setImagePreview(null)
                        setFormData({ ...formData, promotionImage: '' })
                      }}
                      className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  <Calendar className="w-4 h-4 inline mr-1" />
                  Fecha de Inicio
                </label>
                <input
                  type="date"
                  value={formData.promotionStartDate}
                  onChange={(e) => setFormData({ ...formData, promotionStartDate: e.target.value })}
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  <Calendar className="w-4 h-4 inline mr-1" />
                  Fecha de Fin
                </label>
                <input
                  type="date"
                  value={formData.promotionEndDate}
                  onChange={(e) => setFormData({ ...formData, promotionEndDate: e.target.value })}
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                />
              </div>
            </div>

            <div className="flex gap-3 pt-4">
              <Button
                type="button"
                variant="ghost"
                fullWidth
                onClick={onClose}
                disabled={loading}
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                variant="primary"
                fullWidth
                isLoading={loading}
              >
                Guardar Publicidad
              </Button>
            </div>
          </form>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}
