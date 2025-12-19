'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Star, MessageSquare, User, UtensilsCrossed, Reply, Send, X } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import api from '@/lib/api'
import toast from 'react-hot-toast'

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

interface ReviewCardProps {
  review: Review
  onDelete: (id: string) => void
  onResponseSuccess: () => void
}

export function ReviewCard({ review, onDelete, onResponseSuccess }: ReviewCardProps) {
  const [showResponseForm, setShowResponseForm] = useState(false)
  const [responseText, setResponseText] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmitResponse = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!responseText.trim()) {
      toast.error('Por favor escribe una respuesta')
      return
    }

    setLoading(true)
    try {
      await api.post(`/reviews/${review.id}/respond`, {
        response: responseText.trim(),
      })
      toast.success('Respuesta enviada exitosamente')
      setShowResponseForm(false)
      setResponseText('')
      onResponseSuccess()
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Error al enviar la respuesta')
    } finally {
      setLoading(false)
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="group"
    >
      <Card className="p-6 hover:shadow-xl transition-all duration-300 border-2 hover:border-primary-300">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-primary-600 rounded-full flex items-center justify-center">
                <User className="w-5 h-5 text-white" />
              </div>
              <div>
                <h4 className="font-semibold text-gray-900">
                  {review.client.firstName} {review.client.lastName}
                </h4>
                <p className="text-xs text-gray-500">{review.client.email}</p>
              </div>
            </div>

            <div className="flex items-center gap-2 mb-3">
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
              <span className="text-sm font-semibold text-gray-700">{review.rating}/5</span>
              <span className="text-gray-400">•</span>
              <div className="flex items-center gap-1 text-sm text-gray-600">
                <UtensilsCrossed className="w-3 h-3" />
                <span>{review.restaurant.name}</span>
              </div>
            </div>
          </div>

          <div className="text-xs text-gray-500">
            {new Date(review.createdAt).toLocaleDateString('es-ES', {
              year: 'numeric',
              month: 'short',
              day: 'numeric',
            })}
          </div>
        </div>

        {/* Comment */}
        <div className="mb-4">
          <p className="text-gray-700 leading-relaxed">{review.comment}</p>
        </div>

        {/* Response */}
        {review.response && (
          <div className="mb-4 p-4 bg-blue-50 border-l-4 border-blue-500 rounded-r-lg">
            <div className="flex items-center gap-2 mb-2">
              <MessageSquare className="w-4 h-4 text-blue-600" />
              <span className="text-sm font-semibold text-blue-800">Respuesta del Restaurante</span>
              {review.respondedAt && (
                <span className="text-xs text-blue-600 ml-auto">
                  {new Date(review.respondedAt).toLocaleDateString('es-ES')}
                </span>
              )}
            </div>
            <p className="text-sm text-blue-900">{review.response}</p>
          </div>
        )}

        {/* Response Form */}
        {showResponseForm && (
          <form onSubmit={handleSubmitResponse} className="mb-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
            <textarea
              value={responseText}
              onChange={(e) => setResponseText(e.target.value)}
              placeholder="Escribe tu respuesta..."
              rows={3}
              className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 resize-none mb-3"
              maxLength={500}
            />
            <div className="flex gap-2">
              <Button
                type="submit"
                variant="primary"
                size="sm"
                isLoading={loading}
                className="flex items-center justify-center"
              >
                <Send className="w-3.5 h-3.5 mr-1 flex-shrink-0" />
                <span className="text-xs">Enviar Respuesta</span>
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => {
                  setShowResponseForm(false)
                  setResponseText('')
                }}
                className="flex items-center justify-center"
              >
                <X className="w-3.5 h-3.5 mr-1 flex-shrink-0" />
                <span className="text-xs">Cancelar</span>
              </Button>
            </div>
          </form>
        )}

        {/* Actions */}
        <div className="flex gap-2 pt-4 border-t border-gray-200">
          {!review.response && !showResponseForm && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowResponseForm(true)}
              className="min-w-[90px] flex items-center justify-center"
            >
              <Reply className="w-3.5 h-3.5 mr-1 flex-shrink-0" />
              <span className="text-xs">Responder</span>
            </Button>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onDelete(review.id)}
            className="text-red-600 hover:text-red-700 hover:bg-red-50 flex items-center justify-center px-3"
          >
            <span className="text-xs">Eliminar</span>
          </Button>
        </div>
      </Card>
    </motion.div>
  )
}
