'use client'

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { useRouter } from 'next/navigation'
import api from '@/lib/api'
import toast from 'react-hot-toast'

interface User {
  id: string
  email: string
  firstName: string
  lastName: string
  role: 'admin' | 'owner' | 'client'
  staffRole?: string // 'administrator', 'manager', 'cashier', 'cook', 'waiter'
  restaurantId?: string // ID del restaurante al que pertenece el personal
}

interface AuthContextType {
  user: User | null
  loading: boolean
  login: (email: string, password: string) => Promise<void>
  register: (data: RegisterData) => Promise<void>
  logout: () => void
  updateUser: (user: User) => void
}

interface RegisterData {
  email: string
  password: string
  firstName: string
  lastName: string
  phone?: string
  role?: 'client' | 'owner'
  restaurantInfo?: {
    name: string
    address: string
    latitude: number
    longitude: number
    image?: string
  }
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    // Verificar si hay un token guardado al cargar la app
    const token = localStorage.getItem('token')
    if (token) {
      verifyToken(token)
    } else {
      setLoading(false)
    }

    // Escuchar evento de logout cuando el token expire
    const handleAuthLogout = (event: CustomEvent) => {
      console.log('🔒 Token expirado, limpiando sesión')
      setUser(null)
      localStorage.removeItem('token')
    }

    window.addEventListener('auth:logout', handleAuthLogout as EventListener)
    
    return () => {
      window.removeEventListener('auth:logout', handleAuthLogout as EventListener)
    }
  }, [])

  const verifyToken = async (token: string) => {
    try {
      // Verificar el token con el backend
      const response = await api.post('/auth/verify')
      if (response.data && response.data.user) {
        setUser(response.data.user)
        console.log('✅ Sesión restaurada:', response.data.user.email)
      } else {
        // Si no hay usuario en la respuesta, el token es inválido
        throw new Error('Token inválido')
      }
    } catch (error: any) {
      console.log('❌ Token inválido o expirado, limpiando sesión')
      // Limpiar token inválido o expirado
      localStorage.removeItem('token')
      setUser(null)
      // No redirigir aquí para evitar loops, solo limpiar la sesión
    } finally {
      setLoading(false)
    }
  }

  const login = async (email: string, password: string) => {
    try {
      const response = await api.post('/auth/login', { email, password })
      const { access_token, user } = response.data
      
      // Guardar token en localStorage para persistencia
      localStorage.setItem('token', access_token)
      setUser(user)
      
      console.log('✅ Sesión iniciada y guardada para:', user.email)
      toast.success('¡Bienvenido!')
      
      // Redirect based on role
      if (user.role === 'admin') {
        router.push('/admin')
      } else if (user.role === 'owner' || (user.role === 'client' && user.staffRole && user.staffRole !== 'waiter')) {
        // Owners y staff (excepto meseros) van a /owner
        router.push('/owner')
      } else {
        router.push('/client')
      }
    } catch (error: any) {
      console.error('Login error:', error)
      
      let errorMessage = 'Error al iniciar sesión'
      
      // Network error - no response from server
      if (!error.response) {
        if (error.code === 'ERR_NETWORK' || error.message === 'Network Error') {
          const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api'
          if (apiUrl.includes('localhost')) {
            errorMessage = 'No se pudo conectar al servidor. Si estás accediendo desde otra computadora, configura NEXT_PUBLIC_API_URL con la IP del servidor (ej: http://192.168.1.100:3000/api)'
          } else {
            errorMessage = `No se pudo conectar al servidor en ${apiUrl}. Verifica que el backend esté corriendo y accesible desde esta red.`
          }
        } else if (error.request) {
          errorMessage = 'No se recibió respuesta del servidor. Verifica que el backend esté corriendo.'
        } else {
          errorMessage = error.message || 'Error de conexión'
        }
      } else if (error.response?.data) {
        // NestJS format: { message: string } or { message: string[] }
        if (error.response.data.message) {
          errorMessage = Array.isArray(error.response.data.message)
            ? error.response.data.message.join(', ')
            : error.response.data.message
        } else if (error.response.data.error) {
          errorMessage = error.response.data.error
        }
      } else if (error.message) {
        errorMessage = error.message
      }
      
      toast.error(errorMessage)
      throw error
    }
  }

  const register = async (data: RegisterData) => {
    try {
      const response = await api.post('/auth/register', data)
      
      // Si es owner, no redirigir automáticamente (el modal se encargará)
      if (data.role === 'owner') {
        return response.data
      }
      
      toast.success('Registro exitoso. Por favor inicia sesión.')
      router.push('/login')
      return response.data
    } catch (error: any) {
      console.error('Registration error:', error)
      
      // Manejar diferentes tipos de errores
      let errorMessage = 'Error al registrarse'
      
      if (error.response) {
        // Error del servidor
        const serverError = error.response.data
        if (serverError.message) {
          errorMessage = Array.isArray(serverError.message) 
            ? serverError.message.join(', ') 
            : serverError.message
        } else if (serverError.error) {
          errorMessage = serverError.error
        }
      } else if (error.request) {
        // Error de red
        errorMessage = 'No se pudo conectar al servidor. Verifica que el backend esté corriendo en http://localhost:3000'
      } else {
        errorMessage = error.message || 'Error desconocido'
      }
      
      toast.error(errorMessage)
      throw error
    }
  }

  const logout = () => {
    // Limpiar token y estado del usuario
    localStorage.removeItem('token')
    setUser(null)
    // Redirigir a la página principal (no a login según lo solicitado anteriormente)
    router.push('/')
    toast.success('Sesión cerrada')
  }

  const updateUser = (updatedUser: User) => {
    setUser(updatedUser)
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

