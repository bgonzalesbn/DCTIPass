# Análisis integral: Vulnerabilidades, Rendimiento y Optimización

**Proyecto:** DCTIPass  
**Fecha:** 2026-02-25  
**Alcance:** Backend (NestJS), Frontend (React/Vite), Base de Datos (MongoDB/Mongoose)  
**Tipo de revisión:** Análisis estático de código y configuración (sin pruebas dinámicas completas en entorno productivo)

---

## 1) Resumen ejecutivo

### Estado general

- La base técnica es sólida (NestJS + JWT + validación DTO + uso extensivo de `.lean()` en consultas).
- Existen **riesgos críticos de seguridad** que deben resolverse antes de escalar uso o abrir más superficie pública.
- Se identifican oportunidades claras de optimización en API, frontend y diseño de índices Mongo.

### Hallazgos prioritarios (Top 5)

1. **Exposición de credenciales y secretos en repositorio/scripts** (riesgo crítico).
2. **Endpoint público de limpieza de colecciones** (`/auth/clean`) con capacidad destructiva (riesgo crítico).
3. **JWT con secreto por defecto/fallback inseguro** (`your-secret-key` / `secret-key`) (riesgo alto).
4. **Uso de JWT en `localStorage`** en frontend (riesgo alto ante XSS).
5. **Superficie pública amplia con endpoints de seed/asignación** sin controles robustos (riesgo alto).

---

## 2) Metodología y cobertura

Se revisaron:

- Configuración principal del backend (`main.ts`, `app.module.ts`, `auth/*`, guards, controladores y servicios clave).
- Capa de autenticación/autorización y recuperación de contraseña.
- Capa de API frontend (`services/api.ts`, `store/authStore.ts`) y configuración PWA (`vite.config.ts`).
- Esquemas e índices de MongoDB (`schemas/*`) y scripts operativos (`*.mjs`, limpieza/seed/indexado).

No se ejecutó `npm audit` completo por limitación local de disco (`ENOSPC`), por lo que la evaluación de dependencias se considera parcial.

---

## 3) Hallazgos de seguridad

## 3.1 Críticos

### C1. Credenciales y secretos expuestos en archivos del proyecto

**Evidencia (muestras):**

- `backend/create-indexes.mjs`
- `backend/create-test-users.mjs`
- `backend/cleanup-db.mjs`
- `backend/clean-collections.js`
- `backend/.env`

**Riesgo:** Compromiso total de BD y suplantación de entorno. Cualquier actor con acceso al repo/historial puede reutilizar credenciales.

**Recomendación inmediata (24h):**

- Rotar todas las credenciales comprometidas (MongoDB, JWT, SMTP, etc.).
- Eliminar secretos hardcodeados de scripts.
- Forzar carga de secretos solo por variables de entorno/secret manager.
- Revisar historial Git y ejecutar limpieza de secretos (ej. BFG/git-filter-repo) si hubo publicación.

---

### C2. Endpoint público destructivo para limpiar colecciones

**Evidencia:**

- `backend/src/modules/auth/auth.controller.ts` (`POST /auth/clean`, marcado como `@Public()`)

**Riesgo:** Borrado masivo no autenticado de `users` y `auth_credentials`.

**Recomendación inmediata (24h):**

- Eliminar endpoint de producción o protegerlo estrictamente por:
  - guard admin,
  - flag de entorno (`NODE_ENV !== production`),
  - allowlist IP,
  - token de mantenimiento temporal.

---

## 3.2 Altos

### A1. Fallback inseguro para secreto JWT

**Evidencia:**

- `backend/src/modules/auth/auth.module.ts` (fallback `"your-secret-key"`)
- `backend/src/config/config.service.ts` (fallback `"secret-key"`)

**Riesgo:** Firma/verificación JWT predecible si falta configuración.

**Recomendación:**

- Fallar el arranque si `JWT_SECRET` no está definido y cumple política fuerte.
- Eliminar secretos por defecto en código.

---

### A2. Tokens de acceso almacenados en `localStorage`

**Evidencia:**

- `frontend/src/store/authStore.ts`
- `frontend/src/services/api.ts`

**Riesgo:** Exfiltración de tokens ante XSS.

**Recomendación:**

- Migrar a refresh token en cookie `HttpOnly` + access token en memoria.
- Endurecer CSP y sanitización de entrada/salida.

---

### A3. Superficie pública de endpoints operativos

**Evidencia:**

- `backend/src/modules/groups/groups.controller.ts` (varios `@Public()`, incluyendo asignaciones)
- `backend/src/modules/schedules/schedule.controller.ts` (`seed/it-experience` público)
- `backend/src/modules/activities/activities.controller.ts` (`seed/it-experience` público)

**Riesgo:** Manipulación de datos por usuarios no autenticados, abuso de endpoints de seed/asignación.

**Recomendación:**

- Restringir endpoints de administración/seed a rol admin.
- Mantener públicos solo endpoints de lectura estrictamente necesarios.

---

### A4. Recuperación de contraseña vulnerable a enumeración y abuso

**Evidencia:**

- `backend/src/modules/auth/password-reset.controller.ts`
- `backend/src/modules/auth/password-reset.service.ts`

**Observaciones:**

- Respuestas permiten inferir existencia de cuenta/estado de pregunta de seguridad.
- No se observan límites robustos por IP/usuario para este flujo.
- Respuestas de seguridad se almacenan en texto normalizado (no hash criptográfico).

**Recomendación:**

- Respuestas uniformes para evitar enumeración.
- Rate limiting específico por endpoint y por identidad.
- Hash de respuesta de seguridad (Argon2/bcrypt) + pepper.

---

### A5. Falta de hardening HTTP de cabeceras

**Evidencia:**

- `backend/src/main.ts` usa `cors` y `cookie-parser`, pero no se observa `helmet`/CSP.

**Riesgo:** Mayor exposición a clickjacking, MIME sniffing y vectores web comunes.

**Recomendación:**

- Incorporar `helmet` y política CSP adecuada al frontend.

---

## 3.3 Medios

### M1. Rate limit en memoria, focalizado solo a `/auth/login`

**Evidencia:**

- `backend/src/main.ts` (mapa en memoria por IP)

**Riesgo:**

- No escala horizontalmente (instancias múltiples).
- Se pierde estado en reinicio.
- No cubre password reset ni otros endpoints sensibles.

**Recomendación:**

- Migrar a rate-limit distribuido (Redis) con políticas por endpoint.

---

### M2. Límite de payload muy alto (50MB)

**Evidencia:**

- `backend/src/main.ts` (`express.json({ limit: "50mb" })`)

**Riesgo:** Incrementa superficie de DoS/memoria para endpoints JSON comunes.

**Recomendación:**

- Reducir límite por defecto (ej. 1–2MB) y ampliar solo en endpoints que realmente lo requieran.

---

### M3. Logging excesivo con datos operativos

**Evidencia:**

- `backend/src/modules/auth/auth.service.ts` (métricas de login y errores por intento)

**Riesgo:** ruido de logs, posible fuga de metadata sensible en observabilidad.

**Recomendación:**

- Estandarizar logging estructurado por nivel y omitir identificadores sensibles.

---

## 4) Hallazgos de rendimiento

## 4.1 Backend/API

### Fortalezas observadas

- Uso frecuente de `.lean()` en lecturas (reduce overhead de Mongoose).
- Índices declarados en varios esquemas.

### Oportunidades

1. **Consultas sin paginación/límite en múltiples endpoints de listado**
   - Riesgo de crecimiento no controlado de latencia y memoria.
2. **Populate profundo en perfil de usuario** (`users.service.ts`)
   - Puede generar consultas pesadas y payload grande en `GET /users/me`.
3. **`AdminGuard` consulta BD por request**
   - Correcto desde seguridad, pero conviene cache corto o claims de rol versionadas.
4. **Rate limiter no distribuido**
   - Impacta estabilidad bajo carga horizontal.

---

## 4.2 Frontend

### Fortalezas observadas

- Build optimizado con chunks manuales en Vite.
- PWA configurada con `NetworkFirst` para API.

### Oportunidades

1. **Cache de API en PWA por 24h para respuestas dinámicas** (`vite.config.ts`)
   - Riesgo de datos obsoletos, especialmente en progreso/estado de usuario.
2. **Dependencia de `localStorage` para auth y estados dispersos**
   - Multiplica lecturas y complejidad de coherencia entre pestañas.
3. **Redirección global por `401` en interceptor**
   - Puede causar UX abrupta sin intento de refresh transparente.

---

## 4.3 Base de Datos

### Hallazgos

1. **Uso de soft-delete (`deletedAt`) sin índices compuestos alineados a consultas más comunes**.
2. **Consultas frecuentes por combinaciones** (`groupId + deletedAt`, `userId + deletedAt`) sin índice compuesto explícito en algunos modelos.
3. **Inconsistencia potencial en nombres de colección entre scripts y esquemas** (`schedule` vs `schedules`) que puede degradar mantenimiento y troubleshooting.
4. **Script con credenciales embebidas e índices fuera del ciclo de migraciones formal**.

### Recomendaciones de índice (prioridad alta)

- `group_memberships`: `{ userId: 1, deletedAt: 1 }`, `{ groupId: 1, deletedAt: 1 }`.
- `schedule`: validar índice para patrones reales (`groupIds + date + active`, `activityId + active + date`).
- Revisar cardinalidad e `explain()` en endpoints más usados (`/users/me`, `/schedule`, `/admin/*`).

---

## 5) Matriz de priorización

| ID  | Hallazgo                                 | Severidad | Impacto    | Esfuerzo   | Prioridad |
| --- | ---------------------------------------- | --------- | ---------- | ---------- | --------- |
| C1  | Secretos expuestos en repo/scripts       | Crítica   | Muy alto   | Medio      | P0        |
| C2  | `/auth/clean` público destructivo        | Crítica   | Muy alto   | Bajo       | P0        |
| A1  | JWT fallback inseguro                    | Alta      | Alto       | Bajo       | P0        |
| A2  | JWT en localStorage                      | Alta      | Alto       | Medio/Alto | P1        |
| A3  | Endpoints seed/asignación públicos       | Alta      | Alto       | Bajo/Medio | P1        |
| A4  | Password reset con riesgo de enumeración | Alta      | Alto       | Medio      | P1        |
| M1  | Rate limit en memoria                    | Media     | Medio/Alto | Medio      | P1        |
| M2  | Payload global 50MB                      | Media     | Medio      | Bajo       | P2        |
| P1  | Consultas sin paginación consistente     | Media     | Medio      | Medio      | P2        |
| DB1 | Índices compuestos no alineados          | Media     | Medio/Alto | Medio      | P2        |

---

## 6) Plan de remediación recomendado

## Fase 1 (0–72 horas)

- Revocar/rotar secretos comprometidos y eliminar hardcode de scripts.
- Deshabilitar o blindar `POST /auth/clean`.
- Eliminar fallbacks de `JWT_SECRET` y fallar startup si falta.
- Restringir endpoints `seed` y asignaciones a rol admin.

## Fase 2 (Semana 1)

- Implementar `helmet` + CSP y endurecimiento de CORS.
- Extender rate limiting a password reset y endpoints sensibles (idealmente con Redis).
- Reducir límite global de payload y permitir overrides por endpoint.
- Ajustar mensajes de password reset para evitar enumeración.

## Fase 3 (Semanas 2–3)

- Migrar autenticación frontend a refresh token en cookie `HttpOnly` + access token en memoria.
- Revisar y aplicar índices compuestos según `explain()` y tráfico real.
- Establecer paginación/límites uniformes en todos los listados.

## Fase 4 (Semana 4)

- Observabilidad: métricas por endpoint (`p50/p95/p99`, tasa 4xx/5xx, saturación).
- Pruebas de carga y regresión de seguridad automatizadas en CI.

---

## 7) KPIs sugeridos para seguimiento

- **Seguridad:**
  - # secretos expuestos detectados por escaneo (objetivo: 0)
  - % endpoints sensibles protegidos por rol (objetivo: 100%)
- **Backend:**
  - p95 de `/auth/login`, `/users/me`, `/schedule` (objetivo definido por SLO)
  - tasa de error 5xx (objetivo: <1%)
- **Frontend:**
  - TTI/LCP en móvil
  - tasa de sesión interrumpida por `401`
- **BD:**
  - ratio de queries con `COLLSCAN` (objetivo: ~0 en endpoints críticos)

---

## 8) Conclusión

El sistema está bien encaminado en arquitectura y modularidad, pero actualmente presenta **riesgos críticos de seguridad** (secretos expuestos y endpoint destructivo público) que requieren acción inmediata.  
Una vez mitigados esos puntos P0/P1, el siguiente salto de calidad vendrá de:

1. autenticación web más robusta (cookies HttpOnly + refresh),
2. endurecimiento de capa HTTP, y
3. optimización de consultas/índices basada en telemetría real.

---

## 9) Limitaciones del análisis

- No se ejecutaron pruebas dinámicas completas ni pentest activo.
- `npm audit` no pudo completarse por limitación local de disco (`ENOSPC`).
- Este informe debe complementarse con pruebas en entorno staging/producción controlado.
