'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { CheckCircle, Sparkles, UtensilsCrossed, Clock } from 'lucide-react'
import { Button } from './Button'

interface OwnerRegistrationSuccessModalProps {
  isOpen: boolean
  onClose: () => void
}

export function OwnerRegistrationSuccessModal({ isOpen, onClose }: OwnerRegistrationSuccessModalProps) {
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
          className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden relative"
        >
          {/* Decorative background gradient */}
          <div className="absolute inset-0 bg-gradient-to-br from-primary-50 via-amber-50 to-orange-50 opacity-50"></div>
          
          {/* Animated sparkles */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            {[...Array(6)].map((_, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, scale: 0 }}
                animate={{ 
                  opacity: [0, 1, 0],
                  scale: [0, 1, 0],
                  x: Math.random() * 400 - 200,
                  y: Math.random() * 400 - 200,
                }}
                transition={{
                  duration: 2,
                  delay: i * 0.3,
                  repeat: Infinity,
                  repeatDelay: 3,
                }}
                className="absolute top-1/2 left-1/2"
              >
                <Sparkles className="w-4 h-4 text-primary-400" />
              </motion.div>
            ))}
          </div>

          <div className="relative z-10 p-8">
            {/* Success Icon */}
            <motion.div
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ type: "spring", stiffness: 200, damping: 15 }}
              className="flex justify-center mb-6"
            >
              <div className="relative">
                <div className="absolute inset-0 bg-primary-200 rounded-full animate-ping opacity-75"></div>
                <div className="relative w-20 h-20 bg-gradient-to-br from-primary-500 to-primary-600 rounded-full flex items-center justify-center shadow-lg">
                  <CheckCircle className="w-12 h-12 text-white" />
                </div>
              </div>
            </motion.div>

            {/* Title */}
            <motion.h2
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="text-2xl font-bold text-center text-gray-900 mb-3"
            >
              ¡Cuenta Creada Exitosamente!
            </motion.h2>

            {/* Message */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="space-y-4 mb-6"
            >
              <p className="text-center text-gray-700 leading-relaxed">
                Su cuenta como dueño de restaurante fue creada exitosamente.
              </p>
              
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex items-start gap-3">
                <Clock className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                <p className="text-sm text-blue-800 leading-relaxed">
                  Nuestros agentes están validando la información ingresada. Una vez que se complete este proceso, su restaurante estará disponible en nuestra plataforma.
                </p>
              </div>

              <p className="text-center text-gray-600 text-sm italic">
                Gracias por preferirnos y disfrute de la experiencia.
              </p>
            </motion.div>

            {/* Decorative icon */}
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.4 }}
              className="flex justify-center mb-6"
            >
              <div className="w-16 h-16 bg-gradient-to-br from-amber-100 to-orange-100 rounded-full flex items-center justify-center">
                <UtensilsCrossed className="w-8 h-8 text-primary-600" />
              </div>
            </motion.div>

            {/* Button */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
            >
              <Button
                variant="primary"
                fullWidth
                size="lg"
                onClick={onClose}
                className="shadow-lg"
              >
                Entendido
              </Button>
            </motion.div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}
