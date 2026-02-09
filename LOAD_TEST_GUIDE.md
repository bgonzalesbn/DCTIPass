# Load Testing Guide

## Testing con 50 usuarios concurrentes

Script para simular 50 usuarios simultáneos haciendo login y accediendo a actividades.

### Requisitos

```bash
npm install axios
```

### Uso Local (Development)

```bash
# Default: 50 usuarios
node backend/load-test.mjs http://localhost:3000

# Custom: 100 usuarios
node backend/load-test.mjs http://localhost:3000 100

# Custom: 25 usuarios
node backend/load-test.mjs http://localhost:3000 25
```

### Uso en Render (Production)

```bash
# Desde la shell de Render, ejecuta:
node load-test.mjs https://dctipass-backend.onrender.com 50

# O ejecutar directamente en pipeline:
npm install axios
node load-test.mjs https://dctipass-backend.onrender.com 50
```

### Qué hace el script

1. **Login concurrente**: Todos los usuarios hacen login al mismo tiempo (o casi)
2. **Obtener actividades**: Cada usuario accede al endpoint de actividades con paginación
3. **Medir rendimiento**: Registra tiempos de respuesta, errores, rate limits
4. **Analizar resultados**: Proporciona estadísticas y recomendaciones

### Métricas que reporta

- **Logins exitosos**: Porcentaje de usuarios que lograron hacer login
- **Rate Limiting**: Cuántos requests fueron limitados (429)
- **Tiempos de respuesta**: Promedio, mín, máx para login y actividades
- **Disponibilidad**: Porcentaje de requests exitosos

### Resultados esperados

Con la optimización de paginación + Rate Limiting:

| Métrica              | Before    | After |
| -------------------- | --------- | ----- |
| Avg Login Time       | 10-15s    | 387ms |
| Max Concurrent Users | ~5        | 50+   |
| Rate Limit Hits      | >50%      | 0%    |
| CPU Usage            | Saturated | <20%  |

### Interpretación de resultados

✅ **Excelente**:

- Avg Login < 500ms
- Rate Limit Hits = 0
- 100% Logins exitosos

✅ **Bueno**:

- Avg Login < 1s
- Rate Limit Hits < 10%
- > 95% Logins exitosos

⚠️ **Necesita mejora**:

- Avg Login > 1s
- Rate Limit Hits > 10%
- Logins exitosos < 90%

### Datos de prueba

El script usa usuarios de prueba:

- IDs: 18000, 18001, 18002, ..., 18049
- Password: `Test@123` (debe existir en la BD)

**Nota**: Asegúrate de tener estos usuarios en la BD antes de correr el test.

### Crear usuarios de prueba (opcional)

```bash
# Ejecuta el seed script
node backend/seed-test-users.mjs
```

### Debugging

Si tienes errores, revisa:

1. **Backend está corriendo**:

   ```bash
   curl http://localhost:3000/health
   ```

2. **Usuarios existen**:

   ```bash
   # En MongoDB, busca usuarios con employeeNumber 18000-18049
   db.users.find({ employeeNumber: { $gte: "18000", $lte: "18049" } }).count()
   ```

3. **Paginación está activa**:
   ```bash
   curl http://localhost:3000/activities?page=1&limit=20
   # Debe retornar: { data: [...], pagination: {...} }
   ```

### Próximos pasos

Después de ver buenos resultados:

1. ✅ MongoDB Indexes (ver MONGODB_INDEXES_GUIDE.md)
2. ✅ Implementar lazy loading en frontend
3. ✅ Monitorear CPU en Render dashboard

## Troubleshooting

**"Request failed with status code 401"**

- Los usuarios de prueba no existen
- La contraseña es incorrecta
- El endpoint de login necesita autenticación básica

**"Too many login attempts"**

- El rate limiting está activo (es correcto)
- Esperar 15 minutos o resetear el contador

**"502 Bad Gateway"**

- El backend está sobrecargado
- Necesita más recursos en Render

**"ECONNREFUSED"**

- El backend no está corriendo
- URL incorrecta

## Performance Expectations

Con la infraestructura actual (Standard Plan: 2GB/1CPU):

- ✅ 50 usuarios simultáneos: SOPORTADO
- ⚠️ 100+ usuarios: Pueden haber timeouts ocasionales
- ❌ 500+ usuarios: Necesitaría Pro plan o load balancing

## Monitoreo en Render

Durante el test:

1. Ve a Render Dashboard
2. Abre tu servicio backend
3. Ve a "Metrics"
4. Monitorea:
   - CPU (debe estar < 50%)
   - Memory (debe estar < 80%)
   - Status (debe estar Green)
