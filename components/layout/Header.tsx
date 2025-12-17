'use client'

import { useAuth } from '@/contexts/AuthContext'
import { Button } from '@/components/ui/Button'
import { motion } from 'framer-motion'
import { UtensilsCrossed, LogOut, User } from 'lucide-react'

export function Header() {
  const { user, logout } = useAuth()

  return (
    <motion.header
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      className="sticky top-0 z-50 glass border-b border-white/20 shadow-sm"
    >
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <motion.div
            whileHover={{ scale: 1.05 }}
            className="flex items-center gap-2"
          >
            <div className="w-10 h-10 bg-food-gradient rounded-xl flex items-center justify-center shadow-food">
              <UtensilsCrossed className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-2xl font-display font-bold text-gradient">
              Restaurantes
            </h1>
          </motion.div>

          {user ? (
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 text-gray-700">
                <User className="w-5 h-5" />
                <span className="font-medium">{user.firstName} {user.lastName}</span>
                <span className="px-2 py-1 bg-primary-100 text-primary-700 rounded-full text-xs font-semibold">
                  {user.role}
                </span>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={logout}
                className="flex items-center gap-2"
              >
                <LogOut className="w-4 h-4" />
                Salir
              </Button>
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => window.location.href = '/login'}
              >
                Iniciar Sesión
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={() => window.location.href = '/register'}
              >
                Registrarse
              </Button>
            </div>
          )}
        </div>
      </div>
    </motion.header>
  )
}

