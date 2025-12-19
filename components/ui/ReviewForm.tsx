'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Star, MessageSquare } from 'lucide-react'
import { Button } from './Button'
import api from '@/lib/api'
import toast from 'react-hot-toast'
import { useAuth } from '@/contexts/AuthContext'

interface ReviewFormProps {
  isOpen: boolean
  onClose: () => void
  restaurantId: string
  restaurantName: string
  onSuccess?: () => void
}

export function ReviewForm({ isOpen, onClose, restaurantId, restaurantName, onSuccess }: ReviewFormProps) {
  const { user } = useAuth()
  const [rating, setRating] = useState(0)
  const [hoveredRating, setHoveredRating] = useState(0)
  const [comment, setComment] = useState('')
  const [submitting, setSubmitting] = useState(false)

  // Reset form when modal closes
  const handleClose = () => {
    setRating(0)
    setHoveredRating(0)
    setComment('')
    onClose()
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!user) {
      toast.error('Debes iniciar sesión para dejar una reseña')
      onClose()
      return
    }

    if (rating === 0) {
      toast.error('Por favor selecciona una calificación con las estrellas')
      return
    }

    if (!comment.trim()) {
      toast.error('Por favor escribe un comentario sobre tu experiencia')
      return
    }

    setSubmitting(true)
    try {
      await api.post('/reviews', {
        restaurantId,
        rating,
        comment: comment.trim(),
      })
      
      toast.success('¡Gracias por tu reseña! Tu opinión ayuda a otros clientes.')
      setRating(0)
      setComment('')
      setHoveredRating(0)
      onSuccess?.()
      onClose()
    } catch (error: any) {
      if (error.response?.status === 400 && error.response?.data?.message?.includes('already reviewed')) {
        toast.error('Ya has dejado una reseña para este restaurante. Solo puedes dejar una reseña por restaurante.')
      } else {
        toast.error(error.response?.data?.message || 'Error al enviar la reseña. Por favor intenta nuevamente.')
      }
    } finally {
      setSubmitting(false)
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
        onClick={handleClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.9, opacity: 0, y: 20 }}
          transition={{ type: 'spring', duration: 0.4, bounce: 0.2 }}
          onClick={(e) => e.stopPropagation()}
          className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden"
        >
          {/* Header */}
          <div className="relative bg-gradient-to-br from-primary-500 via-primary-600 to-primary-700 p-8 pb-10">
            <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4xIj48Y2lyY2xlIGN4PSIzMCIgY3k9IjMwIiByPSIxLjUiLz48L2c+PC9nPjwvc3ZnPg==')] opacity-20"></div>
            
            <button
              onClick={handleClose}
              className="absolute top-4 right-4 text-white/90 hover:text-white transition-colors p-2 hover:bg-white/20 rounded-full z-10"
            >
              <X className="w-6 h-6" />
            </button>

            <div className="relative z-10 flex items-center gap-4">
              <motion.div
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ delay: 0.2, type: 'spring', bounce: 0.5 }}
                className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center shadow-lg"
              >
                <MessageSquare className="w-8 h-8 text-white" />
              </motion.div>
              <div>
                <motion.h2
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.3 }}
                  className="text-2xl font-bold text-white mb-1"
                >
                  Comparte tu experiencia
                </motion.h2>
                <motion.p
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.4 }}
                  className="text-primary-100 text-sm"
                >
                  {restaurantName}
                </motion.p>
              </div>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="p-8">
            {/* Rating */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="mb-8"
            >
              <label className="block text-base font-bold text-gray-900 mb-4 text-center">
                ¿Cómo calificarías tu experiencia?
              </label>
              <div className="flex items-center justify-center gap-3 mb-3">
                {[1, 2, 3, 4, 5].map((star) => (
                  <motion.button
                    key={star}
                    type="button"
                    onClick={() => setRating(star)}
                    onMouseEnter={() => setHoveredRating(star)}
                    onMouseLeave={() => setHoveredRating(0)}
                    whileHover={{ scale: 1.15 }}
                    whileTap={{ scale: 0.95 }}
                    className="focus:outline-none transition-all duration-200"
                  >
                    <Star
                      className={`w-14 h-14 transition-all duration-200 ${
                        star <= (hoveredRating || rating)
                          ? 'text-yellow-400 fill-yellow-400 drop-shadow-lg'
                          : 'text-gray-300 fill-gray-200'
                      }`}
                    />
                  </motion.button>
                ))}
              </div>
              {rating > 0 && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="text-center"
                >
                  <p className="text-lg font-semibold text-gray-700">
                    {rating} {rating === 1 ? 'estrella' : 'estrellas'}
                  </p>
                  <p className="text-sm text-gray-500 mt-1">
                    {rating === 5 && '¡Excelente!'}
                    {rating === 4 && 'Muy bueno'}
                    {rating === 3 && 'Bueno'}
                    {rating === 2 && 'Regular'}
                    {rating === 1 && 'Necesita mejorar'}
                  </p>
                </motion.div>
              )}
            </motion.div>

            {/* Comment */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
              className="mb-6"
            >
              <label className="block text-sm font-semibold text-gray-700 mb-3">
                Tu comentario
              </label>
              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Comparte detalles sobre tu experiencia: ¿Qué te gustó? ¿Qué mejorarías? Tu opinión ayuda a otros clientes..."
                rows={6}
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 resize-none transition-all duration-200"
                maxLength={500}
              />
              <p className="text-xs text-gray-500 mt-2 text-right">
                {comment.length}/500 caracteres
              </p>
            </motion.div>

            {/* Actions */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7 }}
              className="flex gap-3"
            >
              <Button
                type="button"
                variant="ghost"
                fullWidth
                onClick={handleClose}
                disabled={submitting}
                className="flex items-center justify-center"
              >
                <span>Cancelar</span>
              </Button>
              <Button
                type="submit"
                variant="primary"
                fullWidth
                disabled={submitting || rating === 0 || !comment.trim()}
                isLoading={submitting}
                className="flex items-center justify-center"
              >
                {submitting ? 'Enviando...' : 'Enviar reseña'}
              </Button>
            </motion.div>
          </form>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}
