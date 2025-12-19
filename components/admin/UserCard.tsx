'use client'

import { motion } from 'framer-motion'
import { User, Mail, Shield, Power, PowerOff, Edit, MessageCircle, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'

interface User {
  id: string
  email: string
  firstName: string
  lastName: string
  role: 'admin' | 'owner' | 'client'
  isActive: boolean
  createdAt: string
}

interface UserCardProps {
  user: User
  onToggleStatus: (id: string, current: boolean) => void
  onEdit: (user: User) => void
  onChat: (user: User) => void
  onDelete: (id: string) => void
}

export function UserCard({ user, onToggleStatus, onEdit, onChat, onDelete }: UserCardProps) {
  const getRoleConfig = (role: string) => {
    switch (role) {
      case 'admin':
        return { color: 'bg-purple-100 text-purple-700 border-purple-300', icon: Shield, label: 'Administrador' }
      case 'owner':
        return { color: 'bg-blue-100 text-blue-700 border-blue-300', icon: User, label: 'Propietario' }
      default:
        return { color: 'bg-gray-100 text-gray-700 border-gray-300', icon: User, label: 'Cliente' }
    }
  }

  const roleConfig = getRoleConfig(user.role)
  const RoleIcon = roleConfig.icon

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="group"
    >
      <Card className="p-6 hover:shadow-xl transition-all duration-300 border-2 hover:border-primary-300">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-4 flex-1">
            <div className="w-14 h-14 bg-gradient-to-br from-primary-500 to-primary-600 rounded-full flex items-center justify-center shadow-lg">
              <User className="w-7 h-7 text-white" />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-bold text-gray-900 mb-1">
                {user.firstName} {user.lastName}
              </h3>
              <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
                <Mail className="w-4 h-4" />
                <span>{user.email}</span>
              </div>
              <div className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold border ${roleConfig.color}`}>
                <RoleIcon className="w-3 h-3" />
                <span>{roleConfig.label}</span>
              </div>
            </div>
          </div>

          <div className={`px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1 ${
            user.isActive
              ? 'bg-green-100 text-green-700 border border-green-300'
              : 'bg-red-100 text-red-700 border border-red-300'
          }`}>
            {user.isActive ? (
              <>
                <Power className="w-3 h-3" />
                Activo
              </>
            ) : (
              <>
                <PowerOff className="w-3 h-3" />
                Bloqueado
              </>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-wrap gap-2 pt-4 border-t border-gray-200">
          <Button
            variant={user.isActive ? "ghost" : "primary"}
            size="sm"
            onClick={() => onToggleStatus(user.id, user.isActive)}
            className="min-w-[90px] flex items-center justify-center"
          >
            {user.isActive ? (
              <>
                <PowerOff className="w-3.5 h-3.5 mr-1 flex-shrink-0" />
                <span className="text-xs">Bloquear</span>
              </>
            ) : (
              <>
                <Power className="w-3.5 h-3.5 mr-1 flex-shrink-0" />
                <span className="text-xs">Desbloquear</span>
              </>
            )}
          </Button>

          <Button
            variant="ghost"
            size="sm"
            onClick={() => onEdit(user)}
            className="min-w-[70px] flex items-center justify-center"
          >
            <Edit className="w-3.5 h-3.5 mr-1 flex-shrink-0" />
            <span className="text-xs">Editar</span>
          </Button>

          <Button
            variant="ghost"
            size="sm"
            onClick={() => onChat(user)}
            className="min-w-[70px] flex items-center justify-center"
          >
            <MessageCircle className="w-3.5 h-3.5 mr-1 flex-shrink-0" />
            <span className="text-xs">Chatear</span>
          </Button>

          <Button
            variant="ghost"
            size="sm"
            onClick={() => onDelete(user.id)}
            className="text-red-600 hover:text-red-700 hover:bg-red-50 flex items-center justify-center px-3"
          >
            <Trash2 className="w-3.5 h-3.5 flex-shrink-0" />
          </Button>
        </div>
      </Card>
    </motion.div>
  )
}
