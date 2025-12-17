# Actualizar Node.js

Este proyecto requiere **Node.js >= 18.17.0**. Actualmente estás usando Node.js 16.15.0.

## Opción 1: Usando NVM (Recomendado)

Si tienes NVM instalado:

```bash
# Instalar Node.js 18.17.0 (o la última versión LTS)
nvm install 18

# Usar Node.js 18
nvm use 18

# O usar automáticamente la versión del .nvmrc
nvm use

# Verificar la versión
node --version
```

## Opción 2: Instalar Node.js directamente

1. Visita https://nodejs.org/
2. Descarga la versión LTS (Long Term Support) - actualmente 20.x
3. Instala el paquete
4. Reinicia tu terminal
5. Verifica: `node --version`

## Opción 3: Usando Homebrew (macOS)

```bash
# Actualizar Homebrew
brew update

# Instalar Node.js LTS
brew install node@18

# O instalar la última versión
brew install node

# Verificar
node --version
```

## Verificar instalación

Después de actualizar, verifica que tienes la versión correcta:

```bash
node --version  # Debe ser >= 18.17.0
npm --version
```

Luego, reinstala las dependencias:

```bash
cd frontend
rm -rf node_modules package-lock.json
npm install
npm run dev
```

