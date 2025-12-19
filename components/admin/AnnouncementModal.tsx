'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Megaphone, Image as ImageIcon, Calendar, Users } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import api from '@/lib/api'
import toast from 'react-hot-toast'

interface AnnouncementModalProps {
  isOpen: boolean
  editing: Announcement | null
  onClose: () => void
  onSuccess: () => void
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
}

export function AnnouncementModal({ isOpen, editing, onClose, onSuccess }: AnnouncementModalProps) {
  const [formData, setFormData] = useState({
    title: '',
    message: '',
    image: '',
    targetAudience: 'all',
    startDate: '',
    endDate: '',
  })
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (editing) {
      setFormData({
        title: editing.title,
        message: editing.message,
        image: editing.image || '',
        targetAudience: editing.targetAudience,
        startDate: editing.startDate ? editing.startDate.split('T')[0] : '',
        endDate: editing.endDate ? editing.endDate.split('T')[0] : '',
      })
      setImagePreview(editing.image)
    } else {
      setFormData({
        title: '',
        message: '',
        image: '',
        targetAudience: 'all',
        startDate: '',
        endDate: '',
      })
      setImagePreview(null)
    }
  }, [editing, isOpen])

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
        setFormData({ ...formData, image: base64String })
        setImagePreview(base64String)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const data = {
        ...formData,
        startDate: formData.startDate || null,
        endDate: formData.endDate || null,
        image: formData.image || null,
      }

      if (editing) {
        await api.patch(`/announcements/${editing.id}`, data)
        toast.success('Anuncio actualizado exitosamente')
      } else {
        await api.post('/announcements', data)
        toast.success('Anuncio creado y enviado a todos los usuarios')
      }

      onSuccess()
      onClose()
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Error al guardar el anuncio')
    } finally {
      setLoading(false)
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
          className="bg-white rounded-3xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto"
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-primary-500 to-primary-600 p-6 text-white sticky top-0 z-10">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                  <Megaphone className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold">
                    {editing ? 'Editar Anuncio' : 'Crear Nuevo Anuncio'}
                  </h2>
                  <p className="text-primary-100 text-sm">
                    {editing ? 'Actualiza la información del anuncio' : 'Este anuncio se enviará a todos los usuarios en tiempo real'}
                  </p>
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
                Título del Anuncio *
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="Ej: ¡Nueva promoción disponible!"
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                required
                maxLength={100}
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Mensaje *
              </label>
              <textarea
                value={formData.message}
                onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                placeholder="Escribe el contenido del anuncio que verán los usuarios..."
                rows={5}
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 resize-none"
                required
                maxLength={1000}
              />
              <p className="text-xs text-gray-500 mt-1 text-right">
                {formData.message.length}/1000 caracteres
              </p>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Imagen del Anuncio
              </label>
              <div className="flex items-center gap-4">
                <label className="flex-1 cursor-pointer">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                  />
                  <div className="flex items-center justify-center gap-2 px-4 py-3 border-2 border-dashed border-gray-300 rounded-xl hover:border-primary-500 transition-colors">
                    <ImageIcon className="w-5 h-5 text-gray-400" />
                    <span className="text-sm text-gray-600">
                      {imagePreview ? 'Cambiar imagen' : 'Subir imagen'}
                    </span>
                  </div>
                </label>
                {imagePreview && (
                  <div className="relative w-32 h-32 rounded-xl overflow-hidden border-2 border-primary-200">
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
                      className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                )}
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                <Users className="w-4 h-4 inline mr-1" />
                Audiencia Objetivo
              </label>
              <select
                value={formData.targetAudience}
                onChange={(e) => setFormData({ ...formData, targetAudience: e.target.value })}
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              >
                <option value="all">Todos los usuarios</option>
                <option value="clients">Solo clientes</option>
                <option value="owners">Solo propietarios</option>
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  <Calendar className="w-4 h-4 inline mr-1" />
                  Fecha de Inicio (opcional)
                </label>
                <input
                  type="date"
                  value={formData.startDate}
                  onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  <Calendar className="w-4 h-4 inline mr-1" />
                  Fecha de Fin (opcional)
                </label>
                <input
                  type="date"
                  value={formData.endDate}
                  onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
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
                {editing ? 'Actualizar Anuncio' : 'Crear y Enviar Anuncio'}
              </Button>
            </div>
          </form>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}
