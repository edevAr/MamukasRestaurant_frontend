# Frontend - Restaurantes App

Aplicación Next.js con PWA para gestión de restaurantes.

## ⚠️ Requisitos

- **Node.js**: >= 18.17.0 (requerido)
- **npm**: >= 9.0.0

Si tienes una versión anterior de Node.js, consulta [SETUP_NODE.md](./SETUP_NODE.md) para instrucciones de actualización.

## 🚀 Inicio Rápido

```bash
# Verificar versión de Node.js
node --version  # Debe ser >= 18.17.0

# Instalar dependencias
npm install

# Configurar variables de entorno
cp .env.example .env.local

# Ejecutar en desarrollo
npm run dev

# La app estará disponible en http://localhost:3001
```

## 📱 PWA

La aplicación es una Progressive Web App instalable en:
- Computadoras (Chrome, Edge, Safari)
- Tabletas
- Celulares
- Navegadores

Para instalar:
1. Abrir en navegador compatible
2. Buscar opción "Instalar" en la barra de direcciones
3. O desde el menú del navegador

## 🎨 Características

- **Responsive**: Funciona en todos los dispositivos
- **Offline**: Funcionalidad básica sin conexión (con service worker)
- **Tiempo Real**: Notificaciones instantáneas vía WebSocket
- **Optimizado**: React Query para caché inteligente

## 📁 Estructura

```
app/
├── (auth)/         # Rutas de autenticación
├── (client)/       # Panel de cliente
├── (owner)/        # Panel de dueño
├── (admin)/        # Panel de administrador
└── layout.tsx      # Layout principal

components/
├── common/         # Componentes reutilizables
├── forms/          # Formularios
└── ui/             # Componentes UI

contexts/
├── AuthContext.tsx # Contexto de autenticación
└── SocketContext.tsx # Contexto de WebSocket
```

## 🔧 Variables de Entorno

```env
NEXT_PUBLIC_API_URL=http://localhost:3000/api
NEXT_PUBLIC_SOCKET_URL=http://localhost:3000
```

## 📦 Build

```bash
# Build para producción
npm run build

# Iniciar servidor de producción
npm start
```

# MamukasRestaurant_frontend
