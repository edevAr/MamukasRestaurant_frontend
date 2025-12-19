'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { X, Megaphone, Sparkles } from 'lucide-react'
import { Button } from './Button'

interface Announcement {
  id: string
  title: string
  message: string
  image: string | null
  createdAt: string
}

interface AnnouncementDisplayModalProps {
  isOpen: boolean
  announcement: Announcement | null
  onClose: () => void
}

export function AnnouncementDisplayModal({ isOpen, announcement, onClose }: AnnouncementDisplayModalProps) {
  if (!isOpen || !announcement) return null

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.9, opacity: 0, y: 20 }}
          onClick={(e) => e.stopPropagation()}
          className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden relative"
        >
          {/* Decorative background */}
          <div className="absolute inset-0 bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 opacity-50"></div>
          
          {/* Animated sparkles */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            {[...Array(8)].map((_, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, scale: 0 }}
                animate={{ 
                  opacity: [0, 1, 0],
                  scale: [0, 1, 0],
                  x: Math.random() * 600 - 300,
                  y: Math.random() * 600 - 300,
                }}
                transition={{
                  duration: 2,
                  delay: i * 0.2,
                  repeat: Infinity,
                  repeatDelay: 3,
                }}
                className="absolute top-1/2 left-1/2"
              >
                <Sparkles className="w-4 h-4 text-indigo-400" />
              </motion.div>
            ))}
          </div>

          <div className="relative z-10">
            {/* Header */}
            <div className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 p-6 text-white relative overflow-hidden">
              <div className="absolute inset-0 bg-black/10"></div>
              <div className="relative flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-sm">
                    <Megaphone className="w-7 h-7" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold">Nuevo Anuncio</h2>
                    <p className="text-indigo-100 text-sm">Información importante</p>
                  </div>
                </div>
                <button
                  onClick={onClose}
                  className="p-2 hover:bg-white/20 rounded-full transition-colors backdrop-blur-sm"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="p-6">
              <h3 className="text-xl font-bold text-gray-900 mb-3">{announcement.title}</h3>
              
              {announcement.image && (
                <div className="mb-4 rounded-xl overflow-hidden">
                  <img
                    src={announcement.image}
                    alt={announcement.title}
                    className="w-full h-48 object-cover"
                  />
                </div>
              )}

              <p className="text-gray-700 leading-relaxed mb-6 whitespace-pre-wrap">
                {announcement.message}
              </p>

              <Button
                variant="primary"
                fullWidth
                size="lg"
                onClick={onClose}
                className="shadow-lg"
              >
                Entendido
              </Button>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}
