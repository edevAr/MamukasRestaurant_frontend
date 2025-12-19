'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Send, MessageCircle, User } from 'lucide-react'
import { Button } from '@/components/ui/Button'

interface User {
  id: string
  firstName: string
  lastName: string
  email: string
}

interface ChatModalProps {
  isOpen: boolean
  user: User | null
  onClose: () => void
}

export function ChatModal({ isOpen, user, onClose }: ChatModalProps) {
  const [message, setMessage] = useState('')
  const [messages, setMessages] = useState<Array<{ id: string; text: string; sender: 'admin' | 'user'; timestamp: Date }>>([])

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault()
    if (!message.trim() || !user) return

    // TODO: Implementar envío real de mensajes
    const newMessage = {
      id: Date.now().toString(),
      text: message,
      sender: 'admin' as const,
      timestamp: new Date(),
    }

    setMessages([...messages, newMessage])
    setMessage('')
  }

  if (!isOpen || !user) return null

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
          className="bg-white rounded-3xl shadow-2xl w-full max-w-md h-[600px] flex flex-col overflow-hidden"
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-green-500 to-emerald-500 p-4 text-white">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                  <User className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold">{user.firstName} {user.lastName}</h3>
                  <p className="text-xs text-green-100">{user.email}</p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-2 hover:bg-white/20 rounded-full transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
            {messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-gray-400">
                <MessageCircle className="w-12 h-12 mb-2" />
                <p className="text-sm">No hay mensajes aún</p>
                <p className="text-xs mt-1">Comienza la conversación</p>
              </div>
            ) : (
              messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex ${msg.sender === 'admin' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[80%] rounded-2xl px-4 py-2 ${
                      msg.sender === 'admin'
                        ? 'bg-primary-600 text-white'
                        : 'bg-white text-gray-900 border border-gray-200'
                    }`}
                  >
                    <p className="text-sm">{msg.text}</p>
                    <p className={`text-xs mt-1 ${
                      msg.sender === 'admin' ? 'text-primary-100' : 'text-gray-500'
                    }`}>
                      {msg.timestamp.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Input */}
          <form onSubmit={handleSend} className="p-4 border-t border-gray-200 bg-white">
            <div className="flex gap-2">
              <input
                type="text"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Escribe un mensaje..."
                className="flex-1 px-4 py-2 border-2 border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-green-500"
              />
              <Button
                type="submit"
                variant="primary"
                size="lg"
                disabled={!message.trim()}
              >
                <Send className="w-5 h-5" />
              </Button>
            </div>
          </form>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}
