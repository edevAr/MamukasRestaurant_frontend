'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronLeft, ChevronRight, Sparkles, Tag } from 'lucide-react'
import { Card } from './Card'

interface Promotion {
  id: string
  title: string
  description: string
  image?: string
  discount: number | string
  startDate: string
  endDate: string
  isPromoted: boolean
}

interface Combo {
  id: string
  name: string
  description: string
  price: number | string
  image?: string
  available: boolean
  isPromoted: boolean
}

interface PromotionCarouselProps {
  promotions: Promotion[]
  combos?: Combo[]
}

export function PromotionCarousel({ promotions, combos = [] }: PromotionCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isAutoPlaying, setIsAutoPlaying] = useState(true)

  // Combinar promociones y combos en un solo array para el carousel
  const allItems = [
    ...promotions.map(p => ({ type: 'promotion' as const, data: p })),
    ...combos.map(c => ({ type: 'combo' as const, data: c })),
  ]

  useEffect(() => {
    if (!isAutoPlaying || allItems.length <= 1) return

    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % allItems.length)
    }, 10000) // Cambiar cada 10 segundos

    return () => clearInterval(interval)
  }, [isAutoPlaying, allItems.length])

  if (allItems.length === 0) return null

  const nextSlide = () => {
    setCurrentIndex((prev) => (prev + 1) % allItems.length)
    setIsAutoPlaying(false)
  }

  const prevSlide = () => {
    setCurrentIndex((prev) => (prev - 1 + allItems.length) % allItems.length)
    setIsAutoPlaying(false)
  }

  const goToSlide = (index: number) => {
    setCurrentIndex(index)
    setIsAutoPlaying(false)
  }

  const currentItem = allItems[currentIndex]
  const isPromotion = currentItem.type === 'promotion'
  const currentData = currentItem.data

  const discountValue = isPromotion 
    ? (typeof (currentData as Promotion).discount === 'string' 
        ? parseFloat((currentData as Promotion).discount) 
        : (currentData as Promotion).discount)
    : 0

  const priceValue = !isPromotion
    ? (typeof (currentData as Combo).price === 'string' 
        ? parseFloat((currentData as Combo).price) 
        : (currentData as Combo).price)
    : 0

  const promotionData = isPromotion ? (currentData as Promotion) : null
  const comboData = !isPromotion ? (currentData as Combo) : null

  return (
    <div className="relative w-full overflow-hidden">
      <AnimatePresence mode="wait">
        <motion.div
          key={currentIndex}
          initial={{ 
            opacity: 0, 
            x: 100,
            scale: 0.9,
            rotateY: -15,
          }}
          animate={{ 
            opacity: 1, 
            x: 0,
            scale: 1,
            rotateY: 0,
          }}
          exit={{ 
            opacity: 0, 
            x: -100,
            scale: 0.9,
            rotateY: 15,
          }}
          transition={{ 
            duration: 0.6,
            ease: [0.4, 0, 0.2, 1],
            opacity: { duration: 0.3 },
          }}
          className="relative"
          style={{
            transformStyle: 'preserve-3d',
            perspective: '1000px',
          }}
        >
          <Card className="overflow-hidden bg-gradient-to-br from-primary-500 via-accent-500 to-golden-500 p-0 shadow-food-lg relative">
            {/* Animated Gradient Overlay */}
            <motion.div
              className="absolute inset-0 opacity-20"
              animate={{
                background: [
                  'linear-gradient(45deg, rgba(255,255,255,0.1) 0%, transparent 50%)',
                  'linear-gradient(135deg, rgba(255,255,255,0.1) 0%, transparent 50%)',
                  'linear-gradient(225deg, rgba(255,255,255,0.1) 0%, transparent 50%)',
                  'linear-gradient(315deg, rgba(255,255,255,0.1) 0%, transparent 50%)',
                  'linear-gradient(45deg, rgba(255,255,255,0.1) 0%, transparent 50%)',
                ],
              }}
              transition={{
                duration: 8,
                repeat: Infinity,
                ease: 'linear',
              }}
            />
            
            <div className="relative z-10">
              {/* Background Pattern */}
              <motion.div 
                className="absolute inset-0 opacity-10"
                animate={{
                  backgroundPosition: ['0% 0%', '100% 100%'],
                }}
                transition={{
                  duration: 20,
                  repeat: Infinity,
                  repeatType: 'reverse',
                  ease: 'linear',
                }}
              >
                <div className="absolute inset-0" style={{
                  backgroundImage: `radial-gradient(circle at 2px 2px, white 1px, transparent 0)`,
                  backgroundSize: '40px 40px'
                }} />
              </motion.div>

              {/* Content */}
              <div className="relative grid md:grid-cols-2 gap-6 p-6 md:p-8 z-10">
                {/* Left: Text Content */}
                <div className="flex flex-col justify-center text-white">
                  {((isPromotion && promotionData?.isPromoted) || (!isPromotion && comboData?.isPromoted)) && (
                    <motion.div
                      initial={{ scale: 0, rotate: -180 }}
                      animate={{ 
                        scale: 1, 
                        rotate: 0,
                        y: [0, -5, 0],
                      }}
                      transition={{ 
                        delay: 0.1,
                        type: "spring",
                        stiffness: 200,
                        y: {
                          duration: 2,
                          repeat: Infinity,
                          repeatType: 'reverse',
                        }
                      }}
                      className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-sm px-3 py-1 rounded-full mb-4 w-fit"
                    >
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                      >
                        <Sparkles className="w-4 h-4 text-golden-300" />
                      </motion.div>
                      <span className="text-xs font-bold uppercase tracking-wide">
                        {isPromotion ? 'Promoción Destacada' : 'Combo Especial'}
                      </span>
                    </motion.div>
                  )}

                  <motion.h3
                    initial={{ y: 30, opacity: 0, filter: 'blur(10px)' }}
                    animate={{ 
                      y: 0, 
                      opacity: 1,
                      filter: 'blur(0px)',
                    }}
                    transition={{ 
                      delay: 0.2,
                      duration: 0.6,
                      ease: [0.4, 0, 0.2, 1],
                    }}
                    className="text-3xl md:text-4xl font-display font-bold mb-3"
                  >
                    {isPromotion ? promotionData?.title : comboData?.name}
                  </motion.h3>

                  <motion.p
                    initial={{ y: 30, opacity: 0, filter: 'blur(10px)' }}
                    animate={{ 
                      y: 0, 
                      opacity: 1,
                      filter: 'blur(0px)',
                    }}
                    transition={{ 
                      delay: 0.3,
                      duration: 0.6,
                      ease: [0.4, 0, 0.2, 1],
                    }}
                    className="text-white/90 mb-4 text-lg"
                  >
                    {isPromotion ? promotionData?.description : comboData?.description}
                  </motion.p>

                  {isPromotion && discountValue > 0 && (
                    <motion.div
                      initial={{ scale: 0, rotate: -180, opacity: 0 }}
                      animate={{ 
                        scale: 1, 
                        rotate: 0,
                        opacity: 1,
                      }}
                      transition={{ 
                        delay: 0.4, 
                        type: "spring",
                        stiffness: 200,
                        damping: 15,
                      }}
                      whileHover={{ scale: 1.05 }}
                      className="flex items-center gap-3"
                    >
                      <motion.div 
                        className="bg-white/20 backdrop-blur-sm rounded-2xl px-6 py-4 border-2 border-white/30 relative overflow-hidden"
                        animate={{
                          boxShadow: [
                            '0 0 20px rgba(255,255,255,0.3)',
                            '0 0 40px rgba(255,255,255,0.5)',
                            '0 0 20px rgba(255,255,255,0.3)',
                          ],
                        }}
                        transition={{
                          duration: 2,
                          repeat: Infinity,
                          ease: 'easeInOut',
                        }}
                      >
                        <motion.div 
                          className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
                          animate={{
                            x: ['-100%', '100%'],
                          }}
                          transition={{
                            duration: 3,
                            repeat: Infinity,
                            repeatDelay: 1,
                            ease: 'easeInOut',
                          }}
                        />
                        <div className="flex items-baseline gap-1 relative z-10">
                          <motion.div
                            animate={{ rotate: [0, 10, -10, 0] }}
                            transition={{ duration: 2, repeat: Infinity, delay: 0.5 }}
                          >
                            <Tag className="w-5 h-5" />
                          </motion.div>
                          <span className="text-4xl font-bold">
                            {discountValue}%
                          </span>
                          <span className="text-xl font-semibold">OFF</span>
                        </div>
                      </motion.div>
                    </motion.div>
                  )}

                  {!isPromotion && priceValue > 0 && (
                    <motion.div
                      initial={{ scale: 0, rotate: -180, opacity: 0 }}
                      animate={{ 
                        scale: 1, 
                        rotate: 0,
                        opacity: 1,
                      }}
                      transition={{ 
                        delay: 0.4, 
                        type: "spring",
                        stiffness: 200,
                        damping: 15,
                      }}
                      whileHover={{ scale: 1.05 }}
                      className="flex items-center gap-3"
                    >
                      <motion.div 
                        className="bg-white/20 backdrop-blur-sm rounded-2xl px-6 py-4 border-2 border-white/30 relative overflow-hidden"
                        animate={{
                          boxShadow: [
                            '0 0 20px rgba(255,255,255,0.3)',
                            '0 0 40px rgba(255,255,255,0.5)',
                            '0 0 20px rgba(255,255,255,0.3)',
                          ],
                        }}
                        transition={{
                          duration: 2,
                          repeat: Infinity,
                          ease: 'easeInOut',
                        }}
                      >
                        <motion.div 
                          className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
                          animate={{
                            x: ['-100%', '100%'],
                          }}
                          transition={{
                            duration: 3,
                            repeat: Infinity,
                            repeatDelay: 1,
                            ease: 'easeInOut',
                          }}
                        />
                        <div className="flex items-baseline gap-1 relative z-10">
                          <span className="text-2xl font-bold">$</span>
                          <span className="text-4xl font-bold">
                            {priceValue.toFixed(2)}
                          </span>
                        </div>
                      </motion.div>
                    </motion.div>
                  )}

                  {isPromotion && promotionData && (
                    <motion.div
                      initial={{ y: 20, opacity: 0 }}
                      animate={{ y: 0, opacity: 1 }}
                      transition={{ delay: 0.4 }}
                      className="mt-4 text-sm text-white/80"
                    >
                      Válido hasta: {new Date(promotionData.endDate).toLocaleDateString('es-ES', {
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric'
                      })}
                    </motion.div>
                  )}
                </div>

                {/* Right: Image */}
                {currentData.image ? (
                  <motion.div 
                    className="relative h-64 md:h-80 rounded-2xl overflow-hidden shadow-2xl"
                    initial={{ scale: 1.1, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ duration: 0.6, delay: 0.2 }}
                  >
                    <motion.img
                      src={currentData.image}
                      alt={isPromotion ? promotionData?.title || '' : comboData?.name || ''}
                      className="w-full h-full object-cover"
                      animate={{
                        scale: [1, 1.05, 1],
                      }}
                      transition={{
                        duration: 8,
                        repeat: Infinity,
                        ease: 'easeInOut',
                      }}
                    />
                    <motion.div 
                      className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent"
                      animate={{
                        opacity: [0.5, 0.7, 0.5],
                      }}
                      transition={{
                        duration: 3,
                        repeat: Infinity,
                        ease: 'easeInOut',
                      }}
                    />
                    {/* Shine Effect */}
                    <motion.div
                      className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent"
                      animate={{
                        x: ['-100%', '100%'],
                      }}
                      transition={{
                        duration: 3,
                        repeat: Infinity,
                        repeatDelay: 2,
                        ease: 'easeInOut',
                      }}
                    />
                  </motion.div>
                ) : (
                  <motion.div 
                    className="relative h-64 md:h-80 rounded-2xl overflow-hidden bg-white/10 backdrop-blur-sm flex items-center justify-center"
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ duration: 0.6, delay: 0.2 }}
                  >
                    <motion.div 
                      className="text-center"
                      animate={{
                        y: [0, -10, 0],
                      }}
                      transition={{
                        duration: 3,
                        repeat: Infinity,
                        ease: 'easeInOut',
                      }}
                    >
                      <motion.div
                        animate={{ 
                          rotate: 360,
                          scale: [1, 1.2, 1],
                        }}
                        transition={{
                          rotate: { duration: 10, repeat: Infinity, ease: 'linear' },
                          scale: { duration: 2, repeat: Infinity, ease: 'easeInOut' },
                        }}
                      >
                        <Sparkles className="w-24 h-24 text-white/30 mx-auto mb-4" />
                      </motion.div>
                      <p className="text-white/60 text-sm">
                        {isPromotion ? 'Promoción Especial' : 'Combo Especial'}
                      </p>
                    </motion.div>
                  </motion.div>
                )}
              </div>
            </div>
          </Card>
        </motion.div>
      </AnimatePresence>

      {/* Navigation Arrows */}
      {allItems.length > 1 && (
        <>
          <motion.button
            onClick={prevSlide}
            className="absolute left-4 top-1/2 -translate-y-1/2 z-20 bg-white/90 hover:bg-white text-gray-800 rounded-full p-2 shadow-lg"
            whileHover={{ scale: 1.15, x: -3 }}
            whileTap={{ scale: 0.95 }}
            animate={{
              opacity: [0.7, 1, 0.7],
            }}
            transition={{
              opacity: {
                duration: 2,
                repeat: Infinity,
                ease: 'easeInOut',
              },
            }}
            aria-label="Anterior"
          >
            <ChevronLeft className="w-6 h-6" />
          </motion.button>
          <motion.button
            onClick={nextSlide}
            className="absolute right-4 top-1/2 -translate-y-1/2 z-20 bg-white/90 hover:bg-white text-gray-800 rounded-full p-2 shadow-lg"
            whileHover={{ scale: 1.15, x: 3 }}
            whileTap={{ scale: 0.95 }}
            animate={{
              opacity: [0.7, 1, 0.7],
            }}
            transition={{
              opacity: {
                duration: 2,
                repeat: Infinity,
                ease: 'easeInOut',
              },
            }}
            aria-label="Siguiente"
          >
            <ChevronRight className="w-6 h-6" />
          </motion.button>
        </>
      )}

      {/* Dots Indicator */}
      {allItems.length > 1 && (
        <div className="flex justify-center gap-2 mt-4">
          {allItems.map((item, index) => (
            <motion.button
              key={index}
              onClick={() => goToSlide(index)}
              className={`rounded-full ${
                index === currentIndex
                  ? 'bg-primary-500'
                  : 'bg-gray-300 hover:bg-gray-400'
              }`}
              initial={false}
              animate={{
                width: index === currentIndex ? 32 : 12,
                height: 12,
                scale: index === currentIndex ? 1.1 : 1,
              }}
              whileHover={{ scale: 1.2 }}
              whileTap={{ scale: 0.9 }}
              transition={{
                type: "spring",
                stiffness: 300,
                damping: 20,
              }}
              aria-label={`Ir a ${index + 1}`}
            />
          ))}
        </div>
      )}

      {/* Progress Bar */}
      {allItems.length > 1 && isAutoPlaying && (
        <motion.div
          className="absolute bottom-0 left-0 h-1 bg-white/30 z-20"
          initial={{ width: '0%' }}
          animate={{ width: '100%' }}
          transition={{
            duration: 10,
            repeat: Infinity,
            ease: 'linear',
          }}
          key={currentIndex}
        />
      )}
    </div>
  )
}
