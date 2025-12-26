'use client'

import { useState, useEffect, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, DollarSign, Clock, TrendingUp, BarChart3, PieChart, Activity, Calendar, UtensilsCrossed } from 'lucide-react'
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import api from '@/lib/api'
import toast from 'react-hot-toast'

interface SalesMetricsModalProps {
  isOpen: boolean
  onClose: () => void
  restaurantId: string
  timeRange: 'day' | 'week' | 'month'
}

interface Sale {
  id: string
  total: number
  status: string
  createdAt: string
  updatedAt?: string
  items: Array<{
    id: string
    menuName: string
    quantity: number
    price: number
    subtotal: number
    status: string
  }>
  tableNumber?: string
  customerName?: string
}

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4']

export function SalesMetricsModal({ isOpen, onClose, restaurantId, timeRange }: SalesMetricsModalProps) {
  const [sales, setSales] = useState<Sale[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (isOpen && restaurantId) {
      loadSales()
    }
  }, [isOpen, restaurantId, timeRange])

  const loadSales = async () => {
    setLoading(true)
    try {
      const response = await api.get(`/sales`)
      console.log('📊 Sales API Response:', response.data)
      const allSales = Array.isArray(response.data) ? response.data : []
      console.log('📊 Total sales loaded:', allSales.length)
      
      // Filtrar por rango de tiempo
      const now = new Date()
      let startDate: Date
      
      if (timeRange === 'day') {
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate())
        startDate.setHours(0, 0, 0, 0)
      } else if (timeRange === 'week') {
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
        startDate.setHours(0, 0, 0, 0)
      } else {
        startDate = new Date(now.getFullYear(), now.getMonth(), 1)
        startDate.setHours(0, 0, 0, 0)
      }

      console.log('📅 Filter date range:', { 
        startDate: startDate.toISOString(), 
        now: now.toISOString(),
        timeRange 
      })

      const filteredSales = allSales.filter((sale: any) => {
        if (!sale.createdAt) {
          console.log('⚠️ Sale without createdAt:', sale.id)
          return false
        }
        
        const saleDate = new Date(sale.createdAt)
        if (isNaN(saleDate.getTime())) {
          console.log('⚠️ Invalid sale date:', sale.id, sale.createdAt)
          return false
        }
        
        saleDate.setHours(0, 0, 0, 0)
        
        const isValidDate = saleDate >= startDate
        // Incluir todas las ventas excepto las canceladas
        const saleStatus = (sale.status || '').toLowerCase()
        const isValidStatus = saleStatus !== 'cancelled'
        
        if (!isValidDate) {
          console.log('⚠️ Sale date out of range:', {
            saleId: sale.id,
            saleDate: saleDate.toISOString(),
            startDate: startDate.toISOString(),
            status: sale.status
          })
        }
        
        const isValid = isValidDate && isValidStatus
        if (!isValid) {
          console.log('⚠️ Sale filtered out:', {
            saleId: sale.id,
            status: sale.status,
            isValidDate,
            isValidStatus
          })
        }
        
        return isValid
      })
      
      console.log('✅ Filtered sales:', filteredSales.length)
      console.log('📊 Filtered sales by status:', {
        total: filteredSales.length,
        byStatus: filteredSales.reduce((acc: Record<string, number>, sale: any) => {
          const status = (sale.status || 'unknown').toLowerCase()
          acc[status] = (acc[status] || 0) + 1
          return acc
        }, {})
      })

      // Convertir valores numéricos y mapear items correctamente
      const processedSales = filteredSales.map((sale: any) => ({
        ...sale,
        total: typeof sale.total === 'string' ? parseFloat(sale.total) : Number(sale.total) || 0,
        items: (sale.items || []).map((item: any) => ({
          ...item,
          menuName: item.menuName || item.menu?.name || 'Desconocido',
          quantity: Number(item.quantity) || 0,
          price: typeof item.price === 'string' ? parseFloat(item.price) : Number(item.price) || 0,
          subtotal: typeof item.subtotal === 'string' ? parseFloat(item.subtotal) : Number(item.subtotal) || 0,
        })),
      }))

      console.log('📦 Processed sales:', processedSales.length, processedSales)
      console.log('📦 Sample sale:', processedSales[0])
      setSales(processedSales)
    } catch (error: any) {
      console.error('❌ Error loading sales:', error)
      console.error('Error details:', error.response?.data || error.message)
      toast.error('Error al cargar las ventas')
    } finally {
      setLoading(false)
    }
  }

  // Métricas calculadas
  const metrics = useMemo(() => {
    console.log('📊 Calculating metrics from sales:', sales.length)
    if (sales.length === 0) {
      console.log('⚠️ No sales to calculate metrics')
      return {
        totalRevenue: 0,
        totalSales: 0,
        averageOrderValue: 0,
        averageItemsPerSale: 0,
        averageWaitTime: 0,
        averagePreparationTime: 0,
        averageDeliveryTime: 0,
        minWaitTime: 0,
        maxWaitTime: 0,
        minPreparationTime: 0,
        maxPreparationTime: 0,
        minDeliveryTime: 0,
        maxDeliveryTime: 0,
        quickSales: 0,
        normalSales: 0,
        slowSales: 0,
        totalWaitTimes: 0,
        salesByHour: [],
        salesByStatus: [],
        topItems: [],
        salesByDish: [],
      }
    }

    // Ingresos totales - incluir todas las ventas excepto canceladas
    const validSales = sales.filter(s => {
      const status = (s.status || '').toLowerCase()
      return status !== 'cancelled'
    })
    console.log('✅ Valid sales count:', validSales.length, 'Total sales:', sales.length)
    console.log('✅ Valid sales status breakdown:', validSales.reduce((acc: Record<string, number>, sale: any) => {
      const status = (sale.status || 'unknown').toLowerCase()
      acc[status] = (acc[status] || 0) + 1
      return acc
    }, {}))
    
    const totalRevenue = validSales.reduce((sum, sale) => {
      const saleTotal = typeof sale.total === 'number' ? sale.total : parseFloat(sale.total) || 0
      return sum + saleTotal
    }, 0)
    const totalSales = validSales.length
    const averageOrderValue = totalSales > 0 ? totalRevenue / totalSales : 0
    
    console.log('💰 Revenue metrics:', { totalRevenue, totalSales, averageOrderValue })

    // Items promedio por venta (total de items dividido entre número de ventas)
    const totalItems = validSales.reduce((sum, sale) => {
      const saleItems = (sale.items || []).reduce((s: number, item: any) => s + (item.quantity || 0), 0)
      return sum + saleItems
    }, 0)
    const averageItemsPerSale = totalSales > 0 ? totalItems / totalSales : 0
    
    // Distribución porcentual de platos vendidos
    const dishDistributionMap: Record<string, { nombre: string; cantidad: number; porcentaje: number }> = {}
    validSales.forEach(sale => {
      if (sale.items && Array.isArray(sale.items)) {
        sale.items.forEach(item => {
          const dishName = item.menuName || 'Desconocido'
          const quantity = item.quantity || 0
          if (!dishDistributionMap[dishName]) {
            dishDistributionMap[dishName] = { nombre: dishName, cantidad: 0, porcentaje: 0 }
          }
          dishDistributionMap[dishName].cantidad += quantity
        })
      }
    })
    
    // Calcular porcentajes
    const dishDistribution = Object.values(dishDistributionMap)
      .map(item => ({
        ...item,
        porcentaje: totalItems > 0 ? (item.cantidad / totalItems) * 100 : 0
      }))
      .sort((a, b) => b.cantidad - a.cantidad) // Ordenar por cantidad descendente

    // Tiempo promedio de espera (tiempo entre creación y actualización, o tiempo estimado)
    const waitTimes: number[] = []
    const preparationTimes: number[] = []
    const deliveryTimes: number[] = []
    const now = new Date().getTime()
    
    validSales.forEach(sale => {
      if (!sale.createdAt) {
        console.log('⚠️ Sale without createdAt:', sale.id)
        return
      }
      
      try {
        const created = new Date(sale.createdAt).getTime()
        if (isNaN(created)) {
          console.log('⚠️ Invalid createdAt date:', sale.id, sale.createdAt)
          return
        }
        
        const saleAge = (now - created) / (1000 * 60) // Edad de la venta en minutos
        
        // Calcular tiempo total - siempre intentar calcular algo
        let totalTime: number | null = null
        
        if (sale.updatedAt) {
          // Si tiene updatedAt, usar la diferencia real
          const updated = new Date(sale.updatedAt).getTime()
          if (!isNaN(updated)) {
            totalTime = (updated - created) / (1000 * 60)
          }
        }
        
        // Si no se pudo calcular con updatedAt, usar estimación basada en estado y edad
        if (!totalTime || totalTime <= 0) {
          if (sale.status === 'delivered') {
            // Para entregadas, usar edad si es razonable, o estimar 30-45 min
            totalTime = saleAge > 0 && saleAge <= 240 ? saleAge : 35
          } else if (sale.status === 'ready') {
            // Para listas, usar edad si es razonable, o estimar 20-30 min
            totalTime = saleAge > 0 && saleAge <= 240 ? saleAge : 25
          } else if (sale.status === 'preparing' || sale.status === 'confirmed') {
            // Para en preparación, usar edad actual
            totalTime = saleAge > 0 ? saleAge : null
          } else if (sale.status === 'pending') {
            // Para pending, usar edad actual si es razonable
            totalTime = saleAge > 0 && saleAge <= 240 ? saleAge : null
          } else {
            // Para cualquier otro estado, usar edad
            totalTime = saleAge > 0 && saleAge <= 240 ? saleAge : null
          }
        }
        
        // Agregar tiempo total si es válido
        if (totalTime && totalTime >= 0.5 && totalTime <= 240) {
          waitTimes.push(totalTime)
          
          // Tiempo de preparación: calcular para TODAS las ventas que tengan algún progreso
          // Esto incluye: confirmed, preparing, ready, delivered
          let prepTime: number | null = null
          
          if (sale.status === 'ready' || sale.status === 'delivered') {
            // Para ventas listas o entregadas, preparación es 60-70% del tiempo total
            prepTime = totalTime * 0.65
          } else if (sale.status === 'preparing') {
            // Si está preparando, usar el tiempo actual como tiempo de preparación
            prepTime = totalTime
          } else if (sale.status === 'confirmed') {
            // Para confirmadas, usar el tiempo actual como tiempo de preparación
            prepTime = totalTime
          } else if (sale.status === 'pending' && totalTime > 5) {
            // Para pending con más de 5 minutos, considerar que ya empezó preparación
            prepTime = totalTime * 0.5
          }
          
          if (prepTime && prepTime >= 0.5) {
            preparationTimes.push(prepTime)
          }
          
          // Tiempo de entrega: solo para entregadas
          if (sale.status === 'delivered') {
            // Entrega es aproximadamente 20-30% del tiempo total, mínimo 3 min
            const delTime = Math.max(totalTime * 0.25, 3)
            if (delTime >= 0.5) {
              deliveryTimes.push(delTime)
            }
          }
        }
        
        // Calcular tiempo basado en estados de items si están disponibles
        // Esto es importante porque los items pueden tener estados más específicos
        if (sale.items && Array.isArray(sale.items) && sale.items.length > 0) {
          sale.items.forEach(item => {
            // Para cualquier item que no esté en pending, calcular tiempo de preparación
            if (item.status && item.status !== 'pending') {
              const itemCreated = new Date(sale.createdAt).getTime()
              let itemEndTime = now
              
              // Si el item tiene updatedAt, usarlo
              if (item.updatedAt) {
                const itemUpdated = new Date(item.updatedAt).getTime()
                if (!isNaN(itemUpdated)) {
                  itemEndTime = itemUpdated
                }
              } else if (sale.updatedAt) {
                const saleUpdated = new Date(sale.updatedAt).getTime()
                if (!isNaN(saleUpdated)) {
                  itemEndTime = saleUpdated
                }
              }
              
              const itemMinutes = (itemEndTime - itemCreated) / (1000 * 60)
              
              if (itemMinutes >= 0.5 && itemMinutes <= 240) {
                if (item.status === 'delivered') {
                  deliveryTimes.push(itemMinutes)
                  // También agregar como tiempo de preparación (el tiempo hasta que se entregó)
                  preparationTimes.push(itemMinutes * 0.7)
                } else if (item.status === 'ready') {
                  // Item listo = tiempo de preparación completo
                  preparationTimes.push(itemMinutes)
                } else if (item.status === 'preparing') {
                  // Item en preparación = tiempo actual de preparación
                  preparationTimes.push(itemMinutes)
                } else if (item.status === 'confirmed') {
                  // Item confirmado = tiempo desde confirmación
                  preparationTimes.push(itemMinutes)
                }
              }
            }
          })
        }
      } catch (error) {
        console.error('Error calculating time for sale:', sale.id, error)
      }
    })
    
    console.log('⏱️ Time calculations:', {
      waitTimes: waitTimes.length,
      preparationTimes: preparationTimes.length,
      deliveryTimes: deliveryTimes.length,
      sampleWaitTimes: waitTimes.slice(0, 5),
      samplePreparationTimes: preparationTimes.slice(0, 5),
      sampleDeliveryTimes: deliveryTimes.slice(0, 5),
      validSalesCount: validSales.length,
      salesStatuses: validSales.map(s => ({ id: s.id, status: s.status, hasUpdatedAt: !!s.updatedAt, itemsCount: s.items?.length || 0 })),
    })
    
    const averageWaitTime = waitTimes.length > 0
      ? waitTimes.reduce((sum, time) => sum + time, 0) / waitTimes.length
      : 0
    const minWaitTime = waitTimes.length > 0 ? Math.min(...waitTimes) : 0
    const maxWaitTime = waitTimes.length > 0 ? Math.max(...waitTimes) : 0
    
    const averagePreparationTime = preparationTimes.length > 0
      ? preparationTimes.reduce((sum, time) => sum + time, 0) / preparationTimes.length
      : 0
    const minPreparationTime = preparationTimes.length > 0 ? Math.min(...preparationTimes) : 0
    const maxPreparationTime = preparationTimes.length > 0 ? Math.max(...preparationTimes) : 0
    
    const averageDeliveryTime = deliveryTimes.length > 0
      ? deliveryTimes.reduce((sum, time) => sum + time, 0) / deliveryTimes.length
      : 0
    const minDeliveryTime = deliveryTimes.length > 0 ? Math.min(...deliveryTimes) : 0
    const maxDeliveryTime = deliveryTimes.length > 0 ? Math.max(...deliveryTimes) : 0
    
    // Distribución de tiempos (rápido, normal, lento)
    const quickSales = waitTimes.filter(t => t <= 15).length
    const normalSales = waitTimes.filter(t => t > 15 && t <= 30).length
    const slowSales = waitTimes.filter(t => t > 30).length

    // Ventas por hora
    const salesByHourMap: Record<number, { hour: number; count: number; revenue: number }> = {}
    for (let i = 0; i < 24; i++) {
      salesByHourMap[i] = { hour: i, count: 0, revenue: 0 }
    }
    validSales.forEach(sale => {
      if (sale.createdAt) {
        const hour = new Date(sale.createdAt).getHours()
        const saleTotal = typeof sale.total === 'number' ? sale.total : parseFloat(sale.total) || 0
        salesByHourMap[hour].count++
        salesByHourMap[hour].revenue += saleTotal
      }
    })
    const salesByHour = Object.values(salesByHourMap).map(item => ({
      hora: `${item.hour}:00`,
      ventas: item.count,
      ingresos: parseFloat(item.revenue.toFixed(2)),
    }))
    console.log('📈 Sales by hour:', salesByHour)

    // Ventas por estado
    const salesByStatusMap: Record<string, number> = {}
    
    console.log('🔍 Processing sales for status breakdown:', {
      validSalesCount: validSales.length,
      sampleSales: validSales.slice(0, 5).map(s => ({
        id: s.id,
        status: s.status,
        statusType: typeof s.status,
        statusValue: s.status
      }))
    })
    
    validSales.forEach((sale, index) => {
      // Obtener el estado original
      const originalStatus = sale.status
      console.log(`🔍 Sale ${index}: originalStatus = "${originalStatus}", type = ${typeof originalStatus}`)
      
      // Normalizar el estado - puede venir como string o enum
      let saleStatus: string
      if (typeof originalStatus === 'string') {
        saleStatus = originalStatus.toLowerCase().trim()
      } else if (originalStatus) {
        saleStatus = String(originalStatus).toLowerCase().trim()
      } else {
        saleStatus = 'pending'
      }
      
      console.log(`🔍 Sale ${index}: normalized status = "${saleStatus}"`)
      
      let status: string
      if (saleStatus === 'confirmed') {
        status = 'Confirmada'
      } else if (saleStatus === 'preparing') {
        status = 'Preparando'
      } else if (saleStatus === 'ready') {
        status = 'Lista'
      } else if (saleStatus === 'delivered') {
        status = 'Despachada'
      } else if (saleStatus === 'pending') {
        status = 'Pendiente'
      } else if (saleStatus === 'cancelled') {
        status = 'Cancelada'
      } else {
        // Si no coincide con ningún estado conocido, usar el estado original capitalizado
        status = saleStatus.charAt(0).toUpperCase() + saleStatus.slice(1)
        console.log(`⚠️ Unknown status "${saleStatus}", using "${status}"`)
      }
      
      console.log(`🔍 Sale ${index}: final status = "${status}"`)
      salesByStatusMap[status] = (salesByStatusMap[status] || 0) + 1
    })
    
    console.log('📊 SalesByStatusMap after processing:', salesByStatusMap)
    
    const salesByStatus = Object.entries(salesByStatusMap)
      .map(([name, value]) => {
        const numValue = typeof value === 'number' ? value : Number(value) || 0
        return { name, value: numValue }
      })
      .filter(item => item.value > 0) // Solo incluir estados con ventas
      .sort((a, b) => b.value - a.value) // Ordenar por cantidad descendente
    
    console.log('📊 Sales by status - FINAL:', {
      salesByStatusMap,
      salesByStatus,
      salesByStatusLength: salesByStatus.length,
      salesByStatusTypes: salesByStatus.map(s => ({ name: s.name, value: s.value, valueType: typeof s.value })),
    })

    // Items más vendidos
    const itemsMap: Record<string, { name: string; quantity: number; revenue: number }> = {}
    validSales.forEach(sale => {
      if (sale.items && Array.isArray(sale.items)) {
        sale.items.forEach(item => {
          const itemName = item.menuName || 'Desconocido'
          if (!itemsMap[itemName]) {
            itemsMap[itemName] = { name: itemName, quantity: 0, revenue: 0 }
          }
          itemsMap[itemName].quantity += item.quantity || 0
          itemsMap[itemName].revenue += item.subtotal || 0
        })
      }
    })
    const topItems = Object.values(itemsMap)
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, 10)
      .map(item => ({
        nombre: item.name,
        cantidad: item.quantity,
        ingresos: parseFloat(item.revenue.toFixed(2)),
      }))
    console.log('🏆 Top items:', topItems)

    // Ventas por plato (items vendidos)
    const itemsByDishMap: Record<string, { nombre: string; cantidad: number; ingresos: number }> = {}
    
    validSales.forEach(sale => {
      if (sale.items && Array.isArray(sale.items)) {
        sale.items.forEach(item => {
          const dishName = item.menuName || 'Desconocido'
          if (!itemsByDishMap[dishName]) {
            itemsByDishMap[dishName] = { nombre: dishName, cantidad: 0, ingresos: 0 }
          }
          const quantity = item.quantity || 0
          const subtotal = typeof item.subtotal === 'number' ? item.subtotal : parseFloat(item.subtotal) || 0
          itemsByDishMap[dishName].cantidad += quantity
          itemsByDishMap[dishName].ingresos += subtotal
        })
      }
    })
    
    // Convertir a array y ordenar por cantidad descendente
    const salesByDish = Object.values(itemsByDishMap)
      .sort((a, b) => b.cantidad - a.cantidad)
      .map(item => ({
        nombre: item.nombre,
        cantidad: item.cantidad,
        ingresos: parseFloat(item.ingresos.toFixed(2)),
      }))
    
    console.log('🍽️ Sales by dish:', salesByDish)

    const result = {
      totalRevenue,
      totalSales,
      averageOrderValue,
      averageItemsPerSale,
      dishDistribution,
      averageWaitTime,
      averagePreparationTime,
      averageDeliveryTime,
      minWaitTime,
      maxWaitTime,
      minPreparationTime,
      maxPreparationTime,
      minDeliveryTime,
      maxDeliveryTime,
      quickSales,
      normalSales,
      slowSales,
      totalWaitTimes: waitTimes.length,
      salesByHour,
      salesByStatus,
      topItems,
      salesByDish,
    }
    console.log('📊 Final metrics result:', result)
    return result
  }, [sales])

  if (!isOpen) return null

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.9, opacity: 0, y: 20 }}
          onClick={(e) => e.stopPropagation()}
          className="bg-white rounded-3xl shadow-2xl w-full max-w-7xl max-h-[90vh] overflow-hidden flex flex-col"
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-primary-500 to-primary-600 p-6 text-white">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                  <BarChart3 className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold">Métricas Detalladas de Ventas</h2>
                  <p className="text-primary-100 text-sm">
                    {timeRange === 'day' ? 'Hoy' : timeRange === 'week' ? 'Esta semana' : 'Este mes'}
                  </p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-2 hover:bg-white/20 rounded-full transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-6 bg-gray-50">
            {loading ? (
              <div className="flex items-center justify-center py-20">
                <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary-200 border-t-primary-600"></div>
                <p className="ml-4 text-gray-600">Cargando métricas...</p>
              </div>
            ) : sales.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20">
                <BarChart3 className="w-16 h-16 text-gray-400 mb-4" />
                <p className="text-xl font-semibold text-gray-700 mb-2">No hay datos disponibles</p>
                <p className="text-gray-500 text-center max-w-md">
                  No se encontraron ventas para el período seleccionado ({timeRange === 'day' ? 'hoy' : timeRange === 'week' ? 'esta semana' : 'este mes'})
                </p>
              </div>
            ) : (
              <div className="space-y-6">
                {/* Métricas Principales */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <Card className="p-4 bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-blue-700">Ingresos Totales</p>
                        <p className="text-2xl font-bold text-blue-900 mt-1">
                          ${metrics.totalRevenue.toFixed(2)}
                        </p>
                      </div>
                      <DollarSign className="w-10 h-10 text-blue-500" />
                    </div>
                  </Card>

                  <Card className="p-4 bg-gradient-to-br from-green-50 to-green-100 border-green-200">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-green-700">Total de Ventas</p>
                        <p className="text-2xl font-bold text-green-900 mt-1">
                          {metrics.totalSales}
                        </p>
                      </div>
                      <Activity className="w-10 h-10 text-green-500" />
                    </div>
                  </Card>

                  <Card className="p-4 bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-purple-700">Ticket Promedio</p>
                        <p className="text-2xl font-bold text-purple-900 mt-1">
                          ${metrics.averageOrderValue.toFixed(2)}
                        </p>
                      </div>
                      <TrendingUp className="w-10 h-10 text-purple-500" />
                    </div>
                  </Card>

                  <Card className="p-4 bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-orange-700">Tiempo Promedio</p>
                        <p className="text-2xl font-bold text-orange-900 mt-1">
                          {metrics.averageWaitTime > 0 ? `${Math.round(metrics.averageWaitTime)} min` : 'N/A'}
                        </p>
                      </div>
                      <Clock className="w-10 h-10 text-orange-500" />
                    </div>
                  </Card>
                </div>

                {/* Gráfico de Ventas por Hora */}
                <Card className="p-6">
                  <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                    <BarChart3 className="w-5 h-5 text-primary-600" />
                    Ventas por Hora
                  </h3>
                  {metrics.salesByHour && metrics.salesByHour.length > 0 && metrics.salesByHour.some(h => h.ventas > 0 || h.ingresos > 0) ? (
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={metrics.salesByHour}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="hora" />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Bar dataKey="ventas" fill="#3b82f6" name="Cantidad de Ventas" />
                        <Bar dataKey="ingresos" fill="#10b981" name="Ingresos ($)" />
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="flex items-center justify-center h-[300px] text-gray-500">
                      <p>No hay datos de ventas por hora disponibles</p>
                    </div>
                  )}
                </Card>

                {/* Gráfico de Ventas por Plato */}
                <Card className="p-6">
                  <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                    <UtensilsCrossed className="w-5 h-5 text-primary-600" />
                    Ventas por Plato {timeRange === 'day' ? '(Hoy)' : timeRange === 'week' ? '(Esta Semana)' : '(Este Mes)'}
                  </h3>
                  {metrics.salesByDish && metrics.salesByDish.length > 0 ? (
                    <ResponsiveContainer width="100%" height={400}>
                      <BarChart 
                        data={metrics.salesByDish} 
                        layout="vertical"
                        margin={{ top: 20, right: 30, left: 150, bottom: 5 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis type="number" />
                        <YAxis 
                          dataKey="nombre" 
                          type="category" 
                          width={140}
                          tick={{ fontSize: 12 }}
                        />
                        <Tooltip 
                          formatter={(value: any, name: any, props: any) => {
                            const dataKey = props?.payload?.dataKey || props?.dataKey
                            if (dataKey === 'cantidad') {
                              return [`${value} unidades`, 'Unidades Vendidas']
                            } else if (dataKey === 'ingresos') {
                              return [`$${value}`, 'Ingresos ($)']
                            }
                            return [value, name]
                          }}
                        />
                        <Legend 
                          formatter={(value, entry: any) => {
                            // Usar el dataKey para identificar correctamente cada barra
                            if (entry?.dataKey === 'cantidad') {
                              return 'Unidades Vendidas'
                            }
                            if (entry?.dataKey === 'ingresos') {
                              return 'Ingresos ($)'
                            }
                            // Fallback al name si está disponible
                            return entry?.name || value
                          }}
                        />
                        <Bar 
                          dataKey="cantidad" 
                          fill="#3b82f6" 
                          name="Unidades Vendidas"
                          radius={[0, 4, 4, 0]}
                        />
                        <Bar 
                          dataKey="ingresos" 
                          fill="#10b981" 
                          name="Ingresos ($)"
                          radius={[0, 4, 4, 0]}
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="flex items-center justify-center h-[400px] text-gray-500">
                      <p>No hay datos de ventas por plato disponibles</p>
                    </div>
                  )}
                </Card>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Gráfico de Torta - Ventas por Estado */}
                  <Card className="p-6">
                    <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                      <PieChart className="w-5 h-5 text-primary-600" />
                      Ventas por Estado
                    </h3>
                    {metrics.salesByStatus && metrics.salesByStatus.length > 0 ? (
                      <ResponsiveContainer width="100%" height={300}>
                        <RechartsPieChart>
                          <Pie
                            data={metrics.salesByStatus}
                            cx="50%"
                            cy="50%"
                            labelLine={false}
                            label={({ name, value, percent }) => {
                              const percentage = (percent * 100).toFixed(1)
                              return `${name}\n${value} (${percentage}%)`
                            }}
                            outerRadius={100}
                            fill="#8884d8"
                            dataKey="value"
                            nameKey="name"
                            startAngle={90}
                            endAngle={-270}
                          >
                            {metrics.salesByStatus.map((entry, index) => {
                              const color = COLORS[index % COLORS.length]
                              console.log(`🎨 Cell ${index}: ${entry.name} = ${entry.value}, color = ${color}`)
                              return (
                                <Cell 
                                  key={`cell-${entry.name}-${index}`} 
                                  fill={color}
                                  stroke="#fff"
                                  strokeWidth={2}
                                />
                              )
                            })}
                          </Pie>
                          <Tooltip 
                            formatter={(value: any, name: any, props: any) => {
                              const total = metrics.salesByStatus.reduce((sum: number, item: any) => sum + item.value, 0)
                              const percentage = total > 0 ? ((value / total) * 100).toFixed(1) : 0
                              return [`${value} ventas (${percentage}%)`, props.payload.name]
                            }}
                          />
                          <Legend 
                            formatter={(value, entry: any) => {
                              const total = metrics.salesByStatus.reduce((sum: number, item: any) => sum + item.value, 0)
                              const percentage = total > 0 ? ((entry.payload.value / total) * 100).toFixed(1) : 0
                              return `${value}: ${entry.payload.value} (${percentage}%)`
                            }}
                          />
                        </RechartsPieChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="flex items-center justify-center h-[300px] text-gray-500">
                        <p>No hay datos de ventas por estado disponibles</p>
                      </div>
                    )}
                  </Card>

                  {/* Top Items Vendidos */}
                  <Card className="p-6">
                    <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                      <TrendingUp className="w-5 h-5 text-primary-600" />
                      Top 10 Items Más Vendidos
                    </h3>
                    {metrics.topItems && metrics.topItems.length > 0 ? (
                      <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={metrics.topItems} layout="vertical">
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis type="number" />
                          <YAxis dataKey="nombre" type="category" width={120} />
                          <Tooltip />
                          <Legend />
                          <Bar dataKey="cantidad" fill="#3b82f6" name="Cantidad" />
                          <Bar dataKey="ingresos" fill="#10b981" name="Ingresos ($)" />
                        </BarChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="flex items-center justify-center h-[300px] text-gray-500">
                        <p>No hay datos de items vendidos disponibles</p>
                      </div>
                    )}
                  </Card>
                </div>

                {/* Métricas Adicionales */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Card className="p-6">
                    <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                      <PieChart className="w-5 h-5 text-primary-600" />
                      Distribución de Platos Vendidos {timeRange === 'day' ? '(Hoy)' : timeRange === 'week' ? '(Esta Semana)' : '(Este Mes)'}
                    </h3>
                    {metrics.dishDistribution && metrics.dishDistribution.length > 0 ? (
                      <div className="space-y-3 max-h-[400px] overflow-y-auto">
                        {metrics.dishDistribution.map((dish: any, index: number) => (
                          <div key={dish.nombre} className="space-y-2">
                            <div className="flex items-center justify-between">
                              <span className="text-sm font-semibold text-gray-700 flex-1 truncate mr-2">
                                {dish.nombre}
                              </span>
                              <div className="flex items-center gap-3">
                                <span className="text-sm font-bold text-gray-900 min-w-[60px] text-right">
                                  {dish.cantidad} unidades
                                </span>
                                <span className="text-sm font-bold text-primary-600 min-w-[70px] text-right">
                                  {dish.porcentaje.toFixed(1)}%
                                </span>
                              </div>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-2.5">
                              <div
                                className="bg-gradient-to-r from-primary-500 to-primary-600 h-2.5 rounded-full transition-all duration-500"
                                style={{ width: `${dish.porcentaje}%` }}
                              />
                            </div>
                          </div>
                        ))}
                        <div className="pt-4 mt-4 border-t border-gray-200">
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-gray-600 font-medium">Total de items vendidos:</span>
                            <span className="text-gray-900 font-bold">
                              {metrics.dishDistribution.reduce((sum: number, dish: any) => sum + dish.cantidad, 0)} unidades
                            </span>
                          </div>
                          <div className="flex items-center justify-between text-sm mt-1">
                            <span className="text-gray-600 font-medium">Items promedio por venta:</span>
                            <span className="text-gray-900 font-bold">
                              {metrics.averageItemsPerSale.toFixed(1)} items
                            </span>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center justify-center h-[200px] text-gray-500">
                        <p>No hay datos de distribución de platos disponibles</p>
                      </div>
                    )}
                  </Card>

                  <Card className="p-6">
                    <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                      <Clock className="w-5 h-5 text-primary-600" />
                      Resumen de Tiempos
                    </h3>
                    <div className="space-y-4">
                      {/* Tiempo Total */}
                      <div className="bg-gradient-to-r from-blue-50 to-blue-100 rounded-xl p-4 border border-blue-200">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-semibold text-blue-700">Tiempo Total Promedio</span>
                          <span className="text-2xl font-bold text-blue-900">
                            {metrics.averageWaitTime > 0 ? `${Math.round(metrics.averageWaitTime)} min` : 'N/A'}
                          </span>
                        </div>
                        {metrics.minWaitTime > 0 && metrics.maxWaitTime > 0 && (
                          <div className="flex items-center justify-between text-xs text-blue-600 mt-1">
                            <span>Mín: {Math.round(metrics.minWaitTime)} min</span>
                            <span>Máx: {Math.round(metrics.maxWaitTime)} min</span>
                          </div>
                        )}
                      </div>

                      {/* Tiempo de Preparación */}
                      <div className="bg-gradient-to-r from-orange-50 to-orange-100 rounded-xl p-4 border border-orange-200">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-semibold text-orange-700">Tiempo de Preparación</span>
                          <span className="text-2xl font-bold text-orange-900">
                            {metrics.averagePreparationTime > 0 ? `${Math.round(metrics.averagePreparationTime)} min` : 'N/A'}
                          </span>
                        </div>
                        {metrics.minPreparationTime > 0 && metrics.maxPreparationTime > 0 && (
                          <div className="flex items-center justify-between text-xs text-orange-600 mt-1">
                            <span>Mín: {Math.round(metrics.minPreparationTime)} min</span>
                            <span>Máx: {Math.round(metrics.maxPreparationTime)} min</span>
                          </div>
                        )}
                      </div>

                      {/* Tiempo de Entrega */}
                      <div className="bg-gradient-to-r from-green-50 to-green-100 rounded-xl p-4 border border-green-200">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-semibold text-green-700">Tiempo de Entrega</span>
                          <span className="text-2xl font-bold text-green-900">
                            {metrics.averageDeliveryTime > 0 ? `${Math.round(metrics.averageDeliveryTime)} min` : 'N/A'}
                          </span>
                        </div>
                        {metrics.minDeliveryTime > 0 && metrics.maxDeliveryTime > 0 && (
                          <div className="flex items-center justify-between text-xs text-green-600 mt-1">
                            <span>Mín: {Math.round(metrics.minDeliveryTime)} min</span>
                            <span>Máx: {Math.round(metrics.maxDeliveryTime)} min</span>
                          </div>
                        )}
                      </div>

                      {/* Distribución de Tiempos */}
                      {metrics.totalWaitTimes > 0 && (
                        <div className="mt-4 pt-4 border-t border-gray-200">
                          <h4 className="text-sm font-semibold text-gray-700 mb-3">Distribución de Tiempos</h4>
                          <div className="space-y-2">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <div className="w-3 h-3 rounded-full bg-green-500"></div>
                                <span className="text-sm text-gray-600">Rápido (≤15 min)</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <span className="font-semibold text-gray-900">{metrics.quickSales}</span>
                                <span className="text-xs text-gray-500">
                                  ({metrics.totalWaitTimes > 0 ? Math.round((metrics.quickSales / metrics.totalWaitTimes) * 100) : 0}%)
                                </span>
                              </div>
                            </div>
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                                <span className="text-sm text-gray-600">Normal (15-30 min)</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <span className="font-semibold text-gray-900">{metrics.normalSales}</span>
                                <span className="text-xs text-gray-500">
                                  ({metrics.totalWaitTimes > 0 ? Math.round((metrics.normalSales / metrics.totalWaitTimes) * 100) : 0}%)
                                </span>
                              </div>
                            </div>
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <div className="w-3 h-3 rounded-full bg-red-500"></div>
                                <span className="text-sm text-gray-600">Lento (>30 min)</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <span className="font-semibold text-gray-900">{metrics.slowSales}</span>
                                <span className="text-xs text-gray-500">
                                  ({metrics.totalWaitTimes > 0 ? Math.round((metrics.slowSales / metrics.totalWaitTimes) * 100) : 0}%)
                                </span>
                              </div>
                            </div>
                          </div>
                          <div className="mt-3 pt-3 border-t border-gray-200">
                            <div className="flex items-center justify-between text-xs text-gray-500">
                              <span>Total de ventas con tiempo registrado:</span>
                              <span className="font-semibold text-gray-700">{metrics.totalWaitTimes}</span>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </Card>
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="p-6 bg-white border-t border-gray-200">
            <Button onClick={onClose} variant="primary" className="w-full">
              Cerrar
            </Button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}
