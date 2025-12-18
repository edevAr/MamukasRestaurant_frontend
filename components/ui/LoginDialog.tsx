'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { useRouter } from 'next/navigation'
import { LogIn, X, UtensilsCrossed, Sparkles } from 'lucide-react'

interface LoginDialogProps {
  isOpen: boolean
  onClose: () => void
  title?: string
  message?: string
}

export function LoginDialog({
  isOpen,
  onClose,
  title = 'Inicia sesión para continuar',
  message = 'Para realizar pedidos o reservas, necesitas tener una cuenta. ¡Es rápido y fácil!',
}: LoginDialogProps) {
  const router = useRouter()

  const handleAccept = () => {
    router.push('/login')
  }

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
              className="relative bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden"
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
              </div>

              {/* Content */}
              <div className="p-8 pt-6">
                <motion.h2
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="text-2xl font-bold text-gray-900 mb-2 text-center"
                >
                  {title}
                </motion.h2>

                <motion.p
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                  className="text-gray-600 text-center mb-8 leading-relaxed"
                >
                  {message}
                </motion.p>

                {/* Benefits list */}
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 }}
                  className="space-y-3 mb-8"
                >
                  {[
                    'Realiza pedidos en línea',
                    'Haz reservas fácilmente',
                    'Guarda tus restaurantes favoritos',
                    'Recibe ofertas exclusivas',
                  ].map((benefit, index) => (
                    <motion.div
                      key={benefit}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.6 + index * 0.1 }}
                      className="flex items-center gap-3"
                    >
                      <div className="flex-shrink-0 w-6 h-6 bg-gradient-to-br from-orange-400 to-red-500 rounded-full flex items-center justify-center">
                        <CheckIcon className="w-4 h-4 text-white" />
                      </div>
                      <span className="text-gray-700">{benefit}</span>
                    </motion.div>
                  ))}
                </motion.div>

                {/* Actions */}
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.9 }}
                  className="flex gap-3"
                >
                  <button
                    onClick={handleAccept}
                    className="flex-1 bg-gradient-to-r from-orange-500 to-red-500 text-white font-semibold py-3 px-6 rounded-xl hover:from-orange-600 hover:to-red-600 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-[1.02] flex items-center justify-center gap-2"
                  >
                    <LogIn className="w-5 h-5" />
                    Iniciar Sesión
                  </button>
                  <button
                    onClick={onClose}
                    className="px-6 py-3 font-medium text-gray-700 bg-gray-100 rounded-xl hover:bg-gray-200 transition-colors duration-200"
                  >
                    Cancelar
                  </button>
                </motion.div>

                {/* Footer text */}
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 1 }}
                  className="text-center text-sm text-gray-500 mt-6"
                >
                  ¿No tienes cuenta?{' '}
                  <button
                    onClick={() => {
                      router.push('/register')
                      onClose()
                    }}
                    className="text-orange-600 hover:text-orange-700 font-medium underline"
                  >
                    Regístrate aquí
                  </button>
                </motion.p>
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  )
}

// Simple check icon component
function CheckIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={3}
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
    </svg>
  )
}
