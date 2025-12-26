'use client'

import { motion } from 'framer-motion'
import { UtensilsCrossed, User, MapPin, Star, TrendingUp, Power, PowerOff, X, Edit, Image as ImageIcon, Calendar, Clock } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'

interface Restaurant {
  id: string
  name: string
  cuisine: string
  rating: number
  isActive: boolean
  isOpen: boolean
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

interface RestaurantCardProps {
  restaurant: Restaurant
  onToggleStatus: (id: string, current: boolean) => void
  onAddPromotion: (restaurant: Restaurant) => void
  onEdit: (restaurant: Restaurant) => void
}

export function RestaurantCard({ restaurant, onToggleStatus, onAddPromotion, onEdit }: RestaurantCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="group"
    >
      <Card className="p-6 hover:shadow-xl transition-all duration-300 border-2 hover:border-primary-300">
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-12 h-12 bg-gradient-to-br from-primary-500 to-primary-600 rounded-xl flex items-center justify-center shadow-lg">
                <UtensilsCrossed className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-900">{restaurant.name}</h3>
                <p className="text-sm text-gray-500 flex items-center gap-1 mt-1">
                  <span>{restaurant.cuisine}</span>
                  <span>•</span>
                  <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                  <span className="font-semibold">{(Number(restaurant.rating) || 0).toFixed(1)}</span>
                </p>
              </div>
            </div>

            <div className="flex items-center gap-4 text-sm text-gray-600 mb-4">
              <div className="flex items-center gap-1">
                <User className="w-4 h-4" />
                <span>{restaurant.owner.firstName} {restaurant.owner.lastName}</span>
              </div>
              <div className="flex items-center gap-1">
                <MapPin className="w-4 h-4" />
                <span className="text-xs">{restaurant.owner.email}</span>
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-2 items-end">
            <div className={`px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1 ${
              restaurant.isActive
                ? 'bg-green-100 text-green-700 border border-green-300'
                : 'bg-red-100 text-red-700 border border-red-300'
            }`}>
              {restaurant.isActive ? (
                <>
                  <Power className="w-3 h-3" />
                  Activo
                </>
              ) : (
                <>
                  <PowerOff className="w-3 h-3" />
                  Inactivo
                </>
              )}
            </div>
            <div className={`px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1 ${
              restaurant.isOpen
                ? 'bg-emerald-100 text-emerald-700 border border-emerald-300'
                : 'bg-gray-100 text-gray-700 border border-gray-300'
            }`}>
              {restaurant.isOpen ? (
                <>
                  <Clock className="w-3 h-3" />
                  Abierto
                </>
              ) : (
                <>
                  <Clock className="w-3 h-3" />
                  Cerrado
                </>
              )}
            </div>
          </div>
        </div>

        {/* Promotion Info */}
        {restaurant.isPromoted && restaurant.promotionText && (
          <div className="mb-4 p-3 bg-gradient-to-r from-amber-50 to-orange-50 rounded-lg border border-amber-200">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="w-4 h-4 text-amber-600" />
              <span className="text-sm font-semibold text-amber-800">Publicidad Activa</span>
            </div>
            <p className="text-sm text-amber-700">{restaurant.promotionText}</p>
            {restaurant.promotionStartDate && restaurant.promotionEndDate && (
              <div className="flex items-center gap-1 mt-2 text-xs text-amber-600">
                <Calendar className="w-3 h-3" />
                <span>
                  {new Date(restaurant.promotionStartDate).toLocaleDateString()} - {new Date(restaurant.promotionEndDate).toLocaleDateString()}
                </span>
              </div>
            )}
          </div>
        )}

        {/* Actions */}
        <div className="flex flex-wrap gap-2 pt-4 border-t border-gray-200">
          <Button
            variant={restaurant.isActive ? "ghost" : "primary"}
            size="sm"
            onClick={() => onToggleStatus(restaurant.id, restaurant.isActive)}
            className="min-w-[90px] flex items-center justify-center"
          >
            {restaurant.isActive ? (
              <>
                <PowerOff className="w-3.5 h-3.5 mr-1 flex-shrink-0" />
                <span className="text-xs">Desactivar</span>
              </>
            ) : (
              <>
                <Power className="w-3.5 h-3.5 mr-1 flex-shrink-0" />
                <span className="text-xs">Activar</span>
              </>
            )}
          </Button>

          <Button
            variant="ghost"
            size="sm"
            onClick={() => onAddPromotion(restaurant)}
            className="min-w-[100px] flex items-center justify-center"
          >
            <TrendingUp className="w-3.5 h-3.5 mr-1 flex-shrink-0" />
            <span className="text-xs">{restaurant.isPromoted ? 'Editar Pub.' : 'Agregar Pub.'}</span>
          </Button>

          <Button
            variant="ghost"
            size="sm"
            onClick={() => onEdit(restaurant)}
            className="min-w-[70px] flex items-center justify-center"
          >
            <Edit className="w-3.5 h-3.5 mr-1 flex-shrink-0" />
            <span className="text-xs">Editar</span>
          </Button>
        </div>
      </Card>
    </motion.div>
  )
}
