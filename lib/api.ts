import axios from 'axios'

// Get API URL from environment or use localhost as fallback
// For network access, set NEXT_PUBLIC_API_URL to http://[YOUR_IP]:3000/api
// Example: NEXT_PUBLIC_API_URL=http://192.168.1.100:3000/api
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api'

export const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000, // 10 seconds timeout
})

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('token')
      if (token) {
        config.headers.Authorization = `Bearer ${token}`
      }
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// Response interceptor to handle errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Log error for debugging
    if (process.env.NODE_ENV === 'development') {
      console.error('API Error:', {
        url: error.config?.url,
        method: error.config?.method,
        status: error.response?.status,
        data: error.response?.data,
        message: error.message,
        code: error.code,
        request: error.request ? 'Request made but no response' : 'No request made',
      })
    }

    // Handle network errors
    if (!error.response) {
      if (error.code === 'ECONNABORTED') {
        console.error('Request timeout - Backend may be slow or not responding')
      } else if (error.code === 'ERR_NETWORK' || error.message === 'Network Error') {
        console.error('Network error - Backend may not be running at:', API_URL)
      }
    }

    if (error.response?.status === 401) {
      if (typeof window !== 'undefined') {
        // Token expirado o inválido - limpiar sesión
        localStorage.removeItem('token')
        
        // Disparar evento personalizado para que AuthContext limpie el estado del usuario
        window.dispatchEvent(new CustomEvent('auth:logout', { detail: { reason: 'token_expired' } }))
        
        // Solo redirigir si no estamos en una página pública
        const publicPaths = ['/', '/login', '/register']
        const currentPath = window.location.pathname
        
        if (!publicPaths.includes(currentPath)) {
          // Redirigir a la página principal en lugar de login
          window.location.href = '/'
        }
      }
    }
    return Promise.reject(error)
  }
)

export default api

