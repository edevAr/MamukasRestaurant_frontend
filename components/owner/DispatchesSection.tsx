'use client'

import { useState, useEffect } from 'react'
import api from '@/lib/api'
import toast from 'react-hot-toast'
import { motion } from 'framer-motion'
import { 
  Package, 
  Check, 
  Clock,
  ChefHat,
  User,
  Hash,
  FileText,
  AlertCircle
} from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'

interface Sale {
  id: string
  total: number
  status: 'pending' | 'confirmed' | 'preparing' | 'ready' | 'delivered' | 'cancelled'
  notes?: string
  tableNumber?: string
  customerName?: string
  cashier: {
    id: string
    firstName: string
    lastName: string
  }
  items: Array<{
    id: string
    menuId: string
    menuName: string
    price: number
    quantity: number
    subtotal: number
    notes?: string
    status: 'pending' | 'preparing' | 'ready' | 'delivered'
  }>
  createdAt: string
}

interface DispatchesSectionProps {
  restaurantId: string
  userRole?: string
  staffRole?: string
  onUpdate?: () => void
}

export function DispatchesSection({ restaurantId, userRole, staffRole, onUpdate }: DispatchesSectionProps) {
  const [sales, setSales] = useState<Sale[]>([])
  const [loading, setLoading] = useState(false)
  const [updating, setUpdating] = useState<string | null>(null)

  const isCook = staffRole === 'cook' || userRole === 'owner' || staffRole === 'administrator' || staffRole === 'manager'
  const isWaiter = staffRole === 'waiter'

  useEffect(() => {
    loadSales()
    const interval = setInterval(loadSales, 5000) // Refresh every 5 seconds
    return () => clearInterval(interval)
  }, [restaurantId, isCook, isWaiter])

  const loadSales = async () => {
    setLoading(true)
    try {
      const type = isCook ? 'kitchen' : isWaiter ? 'delivery' : undefined
      const response = await api.get(`/sales${type ? `?type=${type}` : ''}`)
      setSales(response.data)
    } catch (error: any) {
      console.error('Error loading dispatches:', error)
      toast.error('Error al cargar despachos')
    } finally {
      setLoading(false)
    }
  }

  const updateItemStatus = async (saleId: string, itemId: string, status: string) => {
    setUpdating(itemId)
    try {
      await api.patch(`/sales/${saleId}/items/${itemId}/status`, { status })
      toast.success('Estado actualizado')
      loadSales()
      onUpdate?.()
    } catch (error: any) {
      console.error('Error updating item status:', error)
      toast.error('Error al actualizar el estado')
    } finally {
      setUpdating(null)
    }
  }

  const updateSaleStatus = async (saleId: string, status: string) => {
    setUpdating(saleId)
    try {
      await api.patch(`/sales/${saleId}/status`, { status })
      toast.success('Estado de venta actualizado')
      loadSales()
      onUpdate?.()
    } catch (error: any) {
      console.error('Error updating sale status:', error)
      toast.error('Error al actualizar el estado')
    } finally {
      setUpdating(null)
    }
  }

  // Para cocineros: mostrar ventas confirmadas y en preparación
  const kitchenSales = isCook 
    ? sales.filter(s => s.status === 'confirmed' || s.status === 'preparing')
    : []

  // Para meseros: mostrar ventas listas para entregar
  const deliverySales = isWaiter
    ? sales.filter(s => s.status === 'ready')
    : []

  const displaySales = isCook ? kitchenSales : deliverySales

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">
            {isCook ? 'Cocina - Despachos' : 'Meseros - Entregas'}
          </h2>
          <p className="text-gray-600 mt-1">
            {isCook 
              ? 'Gestiona los platos que deben prepararse y despacharse'
              : 'Gestiona los platos listos para entregar a los clientes'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {isCook && (
            <div className="flex items-center gap-2 px-4 py-2 bg-orange-100 rounded-lg">
              <ChefHat className="w-5 h-5 text-orange-600" />
              <span className="font-semibold text-orange-700">Modo Cocina</span>
            </div>
          )}
          {isWaiter && (
            <div className="flex items-center gap-2 px-4 py-2 bg-green-100 rounded-lg">
              <Package className="w-5 h-5 text-green-600" />
              <span className="font-semibold text-green-700">Modo Entrega</span>
            </div>
          )}
        </div>
      </div>

      {/* Sales List */}
      {loading && displaySales.length === 0 ? (
        <Card className="p-8 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Cargando despachos...</p>
        </Card>
      ) : displaySales.length === 0 ? (
        <Card className="p-8 text-center">
          <Package className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600">
            {isCook 
              ? 'No hay platos pendientes de preparar'
              : 'No hay platos listos para entregar'}
          </p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {displaySales.map((sale) => {
            const pendingItems = sale.items.filter(i => 
              isCook 
                ? i.status === 'pending' || i.status === 'preparing'
                : i.status === 'ready'
            )
            const readyItems = sale.items.filter(i => i.status === 'ready')
            const allReady = sale.items.every(i => i.status === 'ready' || i.status === 'delivered')

            return (
              <Card key={sale.id} className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
                        sale.status === 'confirmed' ? 'bg-blue-100 text-blue-700' :
                        sale.status === 'preparing' ? 'bg-orange-100 text-orange-700' :
                        sale.status === 'ready' ? 'bg-green-100 text-green-700' :
                        'bg-gray-100 text-gray-700'
                      }`}>
                        {sale.status === 'confirmed' ? 'Confirmada' :
                         sale.status === 'preparing' ? 'Preparando' :
                         sale.status === 'ready' ? 'Lista para Entregar' :
                         'Entregada'}
                      </span>
                      <span className="text-lg font-bold text-gray-900">
                        ${sale.total.toFixed(2)}
                      </span>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-gray-600">
                      {sale.tableNumber && (
                        <span className="flex items-center gap-1">
                          <Hash className="w-4 h-4" />
                          Mesa {sale.tableNumber}
                        </span>
                      )}
                      {sale.customerName && (
                        <span className="flex items-center gap-1">
                          <User className="w-4 h-4" />
                          {sale.customerName}
                        </span>
                      )}
                      <span className="flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        {new Date(sale.createdAt).toLocaleTimeString()}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Items for Kitchen */}
                {isCook && (
                  <div className="space-y-4">
                    <div className="border-t pt-4">
                      <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                        <ChefHat className="w-5 h-5 text-orange-600" />
                        Comanda - {pendingItems.length} plato(s) pendiente(s)
                      </h4>
                      <div className="space-y-3">
                        {sale.items.map((item) => (
                          <div 
                            key={item.id} 
                            className={`p-4 rounded-lg border-2 ${
                              item.status === 'pending' ? 'border-yellow-300 bg-yellow-50' :
                              item.status === 'preparing' ? 'border-orange-300 bg-orange-50' :
                              item.status === 'ready' ? 'border-green-300 bg-green-50' :
                              'border-gray-200 bg-gray-50'
                            }`}
                          >
                            <div className="flex items-start justify-between mb-2">
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                  <span className="font-bold text-lg">{item.quantity}x</span>
                                  <span className="font-semibold text-gray-900">{item.menuName}</span>
                                </div>
                                {item.notes && (
                                  <p className="text-sm text-gray-600 mt-1 flex items-center gap-1">
                                    <FileText className="w-3 h-3" />
                                    {item.notes}
                                  </p>
                                )}
                              </div>
                              <div className="flex items-center gap-2">
                                {item.status === 'pending' && (
                                  <Button
                                    onClick={() => updateItemStatus(sale.id, item.id, 'preparing')}
                                    variant="primary"
                                    size="sm"
                                    disabled={updating === item.id}
                                  >
                                    <ChefHat className="w-4 h-4 mr-1" />
                                    Iniciar
                                  </Button>
                                )}
                                {item.status === 'preparing' && (
                                  <Button
                                    onClick={() => updateItemStatus(sale.id, item.id, 'ready')}
                                    variant="primary"
                                    size="sm"
                                    disabled={updating === item.id}
                                    className="bg-green-600 hover:bg-green-700"
                                  >
                                    <Check className="w-4 h-4 mr-1" />
                                    Listo
                                  </Button>
                                )}
                                {item.status === 'ready' && (
                                  <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-semibold">
                                    ✓ Listo
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Mark all ready */}
                    {allReady && sale.status !== 'ready' && (
                      <div className="pt-4 border-t">
                        <Button
                          onClick={() => updateSaleStatus(sale.id, 'ready')}
                          variant="primary"
                          className="w-full"
                          disabled={updating === sale.id}
                        >
                          <Check className="w-5 h-5 mr-2" />
                          Marcar Venta como Lista
                        </Button>
                      </div>
                    )}
                  </div>
                )}

                {/* Items for Waiters */}
                {isWaiter && (
                  <div className="space-y-4">
                    <div className="border-t pt-4">
                      <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                        <Package className="w-5 h-5 text-green-600" />
                        Platos Listos para Entregar - {readyItems.length} plato(s)
                      </h4>
                      <div className="space-y-3">
                        {sale.items.map((item) => (
                          <div 
                            key={item.id} 
                            className={`p-4 rounded-lg border-2 ${
                              item.status === 'ready' ? 'border-green-300 bg-green-50' :
                              item.status === 'delivered' ? 'border-gray-300 bg-gray-50' :
                              'border-yellow-300 bg-yellow-50'
                            }`}
                          >
                            <div className="flex items-start justify-between mb-2">
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                  <span className="font-bold text-lg">{item.quantity}x</span>
                                  <span className="font-semibold text-gray-900">{item.menuName}</span>
                                </div>
                                {item.notes && (
                                  <p className="text-sm text-gray-600 mt-1 flex items-center gap-1">
                                    <FileText className="w-3 h-3" />
                                    {item.notes}
                                  </p>
                                )}
                              </div>
                              <div className="flex items-center gap-2">
                                {item.status === 'ready' && (
                                  <Button
                                    onClick={() => updateItemStatus(sale.id, item.id, 'delivered')}
                                    variant="primary"
                                    size="sm"
                                    disabled={updating === item.id}
                                    className="bg-green-600 hover:bg-green-700"
                                  >
                                    <Check className="w-4 h-4 mr-1" />
                                    Entregado
                                  </Button>
                                )}
                                {item.status === 'delivered' && (
                                  <span className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm font-semibold">
                                    ✓ Entregado
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Mark sale as delivered */}
                    {sale.items.every(i => i.status === 'delivered') && sale.status !== 'delivered' && (
                      <div className="pt-4 border-t">
                        <Button
                          onClick={() => updateSaleStatus(sale.id, 'delivered')}
                          variant="primary"
                          className="w-full"
                          disabled={updating === sale.id}
                        >
                          <Check className="w-5 h-5 mr-2" />
                          Marcar Venta como Entregada
                        </Button>
                      </div>
                    )}
                  </div>
                )}

                {sale.notes && (
                  <div className="mt-4 pt-4 border-t">
                    <p className="text-sm text-gray-600 flex items-center gap-1">
                      <AlertCircle className="w-4 h-4" />
                      <span className="font-medium">Nota:</span> {sale.notes}
                    </p>
                  </div>
                )}
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
