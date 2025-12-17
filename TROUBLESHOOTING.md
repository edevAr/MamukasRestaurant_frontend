# 🔧 Solución de Problemas - Frontend

## Error: "Error al registrarse"

### Verificaciones

1. **¿El backend está corriendo?**
   ```bash
   # Verifica que el backend esté en http://localhost:3000
   curl http://localhost:3000/api/auth/register -X POST -H "Content-Type: application/json" -d '{"email":"test@test.com","password":"123456","firstName":"Test","lastName":"User"}'
   ```

2. **¿El archivo .env.local existe?**
   ```bash
   cd frontend
   cat .env.local
   ```
   
   Debe contener:
   ```env
   NEXT_PUBLIC_API_URL=http://localhost:3000/api
   NEXT_PUBLIC_SOCKET_URL=http://localhost:3000
   ```

3. **¿Hay errores en la consola del navegador?**
   - Abre las DevTools (F12)
   - Ve a la pestaña "Console"
   - Busca errores en rojo
   - Ve a la pestaña "Network" y verifica las peticiones

4. **¿El backend tiene la base de datos configurada?**
   - Verifica que PostgreSQL esté corriendo
   - Verifica que la base de datos `restaurantes_db` exista
   - Verifica las credenciales en `backend/.env`

### Errores Comunes

#### "Network Error" o "ERR_CONNECTION_REFUSED"
- **Causa**: El backend no está corriendo
- **Solución**: Inicia el backend con `cd backend && npm run start:dev`

#### "400 Bad Request"
- **Causa**: Los datos enviados no son válidos
- **Solución**: Verifica que todos los campos requeridos estén completos

#### "500 Internal Server Error"
- **Causa**: Error en el servidor (probablemente base de datos)
- **Solución**: Verifica los logs del backend y la configuración de la base de datos

#### "CORS Error"
- **Causa**: El backend no permite peticiones desde el frontend
- **Solución**: Verifica que `FRONTEND_URL` en `backend/.env` sea `http://localhost:3001`

## Verificar Integración

### 1. Probar el endpoint directamente

```bash
# Desde la terminal
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "123456",
    "firstName": "Juan",
    "lastName": "Pérez"
  }'
```

Si funciona, deberías recibir un JSON con los datos del usuario (sin la contraseña).

### 2. Verificar en el navegador

1. Abre las DevTools (F12)
2. Ve a la pestaña "Network"
3. Intenta registrarte
4. Busca la petición a `/api/auth/register`
5. Haz clic en ella y revisa:
   - **Request**: Los datos enviados
   - **Response**: La respuesta del servidor
   - **Status**: El código de estado HTTP

## Debugging

### Habilitar logs detallados

El código ya incluye logs en desarrollo. Revisa la consola del navegador para ver:
- La URL a la que se está haciendo la petición
- Los datos enviados
- La respuesta del servidor
- Cualquier error

### Verificar variables de entorno

```bash
cd frontend
cat .env.local
```

Asegúrate de que `NEXT_PUBLIC_API_URL` apunte a `http://localhost:3000/api`

