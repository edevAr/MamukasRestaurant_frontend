#!/bin/bash

# Script para ayudar a actualizar Node.js
# Este proyecto requiere Node.js >= 18.17.0

echo "🔍 Verificando versión actual de Node.js..."
CURRENT_VERSION=$(node --version 2>/dev/null | cut -d'v' -f2)
REQUIRED_VERSION="18.17.0"

echo "Versión actual: $CURRENT_VERSION"
echo "Versión requerida: >= $REQUIRED_VERSION"
echo ""

# Verificar si la versión es suficiente
if [ "$(printf '%s\n' "$REQUIRED_VERSION" "$CURRENT_VERSION" | sort -V | head -n1)" = "$REQUIRED_VERSION" ]; then
    echo "✅ Tu versión de Node.js es compatible!"
    exit 0
fi

echo "❌ Necesitas actualizar Node.js"
echo ""
echo "Opciones para actualizar:"
echo ""
echo "1. Usando Homebrew (macOS):"
echo "   brew install node@18"
echo "   # o para la última versión LTS:"
echo "   brew install node"
echo ""
echo "2. Descargar desde nodejs.org:"
echo "   Visita: https://nodejs.org/"
echo "   Descarga la versión LTS (Long Term Support)"
echo ""
echo "3. Instalar NVM (Node Version Manager):"
echo "   curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash"
echo "   nvm install 18"
echo "   nvm use 18"
echo ""
echo "Después de actualizar, ejecuta:"
echo "   node --version  # Debe mostrar >= v18.17.0"
echo "   cd frontend && rm -rf node_modules package-lock.json && npm install"

