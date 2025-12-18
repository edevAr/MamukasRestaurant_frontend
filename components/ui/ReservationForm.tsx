'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { useState } from 'react'
import { X, UtensilsCrossed, ShoppingBag, Users, Clock, Calendar, Sparkles } from 'lucide-react'
import { Button } from './Button'

interface MenuItem {
  id: string
  name: string
  price: number
  quantity: number
}

interface ReservationFormProps {
  isOpen: boolean
  onClose: () => void
  menuItem: MenuItem
  restaurantId: string
  restaurantName: string
  onSubmit: (data: ReservationFormData) => Promise<void>
}

export interface ReservationFormData {
  reservationType: 'dine-in' | 'takeout'
  numberOfGuests?: number
  time?: string
  date: string
  menuItems: Array<{
    menuId: string
    name: string
    quantity: number
    price: number
  }>
  notes?: string
}

export function ReservationForm({
  isOpen,
  onClose,
  menuItem,
  restaurantId,
  restaurantName,
  onSubmit,
}: ReservationFormProps) {
  const [reservationType, setReservationType] = useState<'dine-in' | 'takeout'>('dine-in')
  const [numberOfGuests, setNumberOfGuests] = useState(2)
  const [time, setTime] = useState('19:00')
  const [date, setDate] = useState(new Date().toISOString().split('T')[0])
  const [quantity, setQuantity] = useState(1)
  const [notes, setNotes] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const formData: ReservationFormData = {
        reservationType,
        date,
        menuItems: [
          {
            menuId: menuItem.id,
            name: menuItem.name,
            quantity,
            price: menuItem.price,
          },
        ],
        ...(reservationType === 'dine-in' && {
          numberOfGuests,
          time,
        }),
        ...(notes && { notes }),
      }

      await onSubmit(formData)
      onClose()
      
      // Reset form
      setReservationType('dine-in')
      setNumberOfGuests(2)
      setTime('19:00')
      setQuantity(1)
      setNotes('')
    } catch (error) {
      console.error('Error submitting reservation:', error)
    } finally {
      setLoading(false)
    }
  }

  const totalPrice = menuItem.price * quantity

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
            onClick={onClose}
          />

          {/* Dialog */}
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              transition={{ type: 'spring', duration: 0.4, bounce: 0.2 }}
              className="relative bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Decorative gradient header */}
              <div className="relative bg-gradient-to-br from-orange-500 via-amber-500 to-red-500 p-8 pb-12">
                <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4xIj48Y2lyY2xlIGN4PSIzMCIgY3k9IjMwIiByPSIxLjUiLz48L2c+PC9nPjwvc3ZnPg==')] opacity-20"></div>
                
                {/* Close button */}
                <button
                  onClick={onClose}
                  className="absolute top-4 right-4 text-white/80 hover:text-white transition-colors p-2 hover:bg-white/10 rounded-full"
                >
                  <X className="w-5 h-5" />
                </button>

                {/* Icon */}
                <div className="relative z-10 flex justify-center mb-4">
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.2, type: 'spring', bounce: 0.5 }}
                    className="w-20 h-20 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center shadow-lg"
                  >
                    <motion.div
                      animate={{ rotate: [0, 10, -10, 0] }}
                      transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
                    >
                      <UtensilsCrossed className="w-10 h-10 text-white" />
                    </motion.div>
                  </motion.div>
                </div>

                {/* Sparkles decoration */}
                <div className="absolute top-8 left-8">
                  <motion.div
                    animate={{ 
                      scale: [1, 1.2, 1],
                      opacity: [0.5, 1, 0.5]
                    }}
                    transition={{ duration: 2, repeat: Infinity }}
                  >
                    <Sparkles className="w-6 h-6 text-white/60" />
                  </motion.div>
                </div>
                <div className="absolute bottom-8 right-8">
                  <motion.div
                    animate={{ 
                      scale: [1, 1.2, 1],
                      opacity: [0.5, 1, 0.5]
                    }}
                    transition={{ duration: 2, repeat: Infinity, delay: 1 }}
                  >
                    <Sparkles className="w-6 h-6 text-white/60" />
                  </motion.div>
                </div>

                <h2 className="text-2xl font-bold text-white text-center relative z-10">
                  Reservar en {restaurantName}
                </h2>
              </div>

              {/* Content */}
              <div className="p-8">
                <form onSubmit={handleSubmit} className="space-y-6">
                  {/* Reservation Type */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-3">
                      Tipo de Reserva
                    </label>
                    <div className="grid grid-cols-2 gap-4">
                      <button
                        type="button"
                        onClick={() => setReservationType('dine-in')}
                        className={`p-4 rounded-xl border-2 transition-all ${
                          reservationType === 'dine-in'
                            ? 'border-orange-500 bg-orange-50 shadow-lg scale-105'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <div className="flex flex-col items-center gap-2">
                          <UtensilsCrossed className={`w-8 h-8 ${reservationType === 'dine-in' ? 'text-orange-600' : 'text-gray-400'}`} />
                          <span className={`font-semibold ${reservationType === 'dine-in' ? 'text-orange-600' : 'text-gray-600'}`}>
                            Comer en el lugar
                          </span>
                        </div>
                      </button>
                      <button
                        type="button"
                        onClick={() => setReservationType('takeout')}
                        className={`p-4 rounded-xl border-2 transition-all ${
                          reservationType === 'takeout'
                            ? 'border-orange-500 bg-orange-50 shadow-lg scale-105'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <div className="flex flex-col items-center gap-2">
                          <ShoppingBag className={`w-8 h-8 ${reservationType === 'takeout' ? 'text-orange-600' : 'text-gray-400'}`} />
                          <span className={`font-semibold ${reservationType === 'takeout' ? 'text-orange-600' : 'text-gray-600'}`}>
                            Para llevar
                          </span>
                        </div>
                      </button>
                    </div>
                  </div>

                  {/* Date */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      <Calendar className="w-4 h-4 inline mr-2" />
                      Fecha
                    </label>
                    <input
                      type="date"
                      value={date}
                      onChange={(e) => setDate(e.target.value)}
                      min={new Date().toISOString().split('T')[0]}
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition-all"
                      required
                    />
                  </div>

                  {/* Dine-in specific fields */}
                  <AnimatePresence>
                    {reservationType === 'dine-in' && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.3 }}
                        className="space-y-4"
                      >
                        <div>
                          <label className="block text-sm font-semibold text-gray-700 mb-2">
                            <Users className="w-4 h-4 inline mr-2" />
                            Número de Personas
                          </label>
                          <input
                            type="number"
                            min="1"
                            max="20"
                            value={numberOfGuests}
                            onChange={(e) => setNumberOfGuests(parseInt(e.target.value) || 1)}
                            className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition-all"
                            required
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-semibold text-gray-700 mb-2">
                            <Clock className="w-4 h-4 inline mr-2" />
                            Hora de Llegada
                          </label>
                          <input
                            type="time"
                            value={time}
                            onChange={(e) => setTime(e.target.value)}
                            className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition-all"
                            required
                          />
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Menu Item Info */}
                  <div className="bg-gray-50 rounded-xl p-4 border-2 border-gray-200">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="font-semibold text-gray-900">{menuItem.name}</h3>
                      <span className="text-lg font-bold text-orange-600">
                        ${menuItem.price.toFixed(2)}
                      </span>
                    </div>
                    <div className="flex items-center gap-4">
                      <label className="text-sm font-medium text-gray-700">Cantidad:</label>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => setQuantity(Math.max(1, quantity - 1))}
                          className="w-8 h-8 rounded-lg bg-white border-2 border-gray-300 hover:border-orange-500 hover:bg-orange-50 transition-colors flex items-center justify-center font-bold"
                        >
                          -
                        </button>
                        <span className="w-12 text-center font-semibold">{quantity}</span>
                        <button
                          type="button"
                          onClick={() => setQuantity(Math.min(menuItem.quantity, quantity + 1))}
                          className="w-8 h-8 rounded-lg bg-white border-2 border-gray-300 hover:border-orange-500 hover:bg-orange-50 transition-colors flex items-center justify-center font-bold"
                        >
                          +
                        </button>
                      </div>
                      <div className="ml-auto">
                        <span className="text-lg font-bold text-gray-900">
                          Total: ${totalPrice.toFixed(2)}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Notes */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Notas Adicionales (Opcional)
                    </label>
                    <textarea
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      rows={3}
                      placeholder="Alergias, preferencias especiales, etc."
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition-all resize-none"
                    />
                  </div>

                  {/* Actions */}
                  <div className="flex gap-3 pt-4">
                    <button
                      type="submit"
                      disabled={loading}
                      className="flex-1 px-6 py-3 bg-gradient-to-r from-orange-500 to-red-500 text-white font-semibold rounded-xl hover:from-orange-600 hover:to-red-600 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {loading ? 'Reservando...' : 'Confirmar Reserva'}
                    </button>
                    <button
                      type="button"
                      onClick={onClose}
                      className="px-6 py-3 font-medium text-gray-700 bg-gray-100 rounded-xl hover:bg-gray-200 transition-colors duration-200"
                    >
                      Cancelar
                    </button>
                  </div>
                </form>
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  )
}
