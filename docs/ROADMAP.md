# 📅 Roadmap ITExperience - Etapa 2 Completada

## Estado Actual: Fase 2 ✅

### ✅ Fase 1: Scaffolding & Arquitectura Base

- [x] Estructura Flutter (Clean Arch + Riverpod)
- [x] Estructura NestJS (Modular + MongoDB)
- [x] Docker Compose dev environment
- [x] Schemas básicos MongoDB
- [x] CI/CD GitHub Actions (básico)

### ✅ Fase 2: Modelo de Datos MongoDB - COMPLETADA

- [x] 9 colecciones diseñadas e implementadas
  - users (con empleadoNumber único)
  - auth_credentials (Argon2id + brute-force protection)
  - stickers
  - activities (1:1 con stickers)
  - groups (con capacidad máxima)
  - group_memberships (N:N con validación)
  - schedule (normalizado, sin solapamientos)
  - activity_completions (1 completión por activity/usuario)
  - sticker_awards (sin duplicados por usuario)
- [x] Índices únicos y compuestos
- [x] Relaciones 1:1, 1:N, N:N normalizadas
- [x] Soft deletes (deletedAt en todas)
- [x] Transacciones MongoDB
- [x] AuthCredentialService
  - Hashing con Argon2id (OWASP recommended)
  - Brute-force protection (5 intentos → 15 min lockout)
  - MFA fields (future-proof)
- [x] GroupMembershipService
  - Validación de capacidad máxima
  - Prevención de duplicados
- [x] ActivityCompletionService
  - Transacción completa para completar activity + otorgar sticker
  - Prevención de duplicados garantizada por índice unique
- [x] Documentación completa: [docs/02_MODELO_DATOS_MONGODB.md](../docs/02_MODELO_DATOS_MONGODB.md)

**Archivos creados en Fase 2**:

```
backend/src/
├── modules/
│   ├── auth/
│   │   ├── schemas/auth-credential.schema.ts (NEW)
│   │   ├── auth-credential.service.ts (NEW)
│   │   └── auth.module.ts (UPDATED)
│   ├── users/
│   │   └── schemas/user.schema.ts (UPDATED - new fields)
│   ├── stickers/
│   │   ├── stickers.module.ts (NEW)
│   │   └── schemas/sticker.schema.ts (NEW)
│   ├── activities/
│   │   ├── activities.module.ts (NEW)
│   │   ├── activity-completion.service.ts (NEW)
│   │   ├── schemas/activity.schema.ts (NEW)
│   │   ├── schemas/activity-completion.schema.ts (NEW)
│   │   └── schemas/sticker-award.schema.ts (NEW)
│   ├── groups/
│   │   ├── groups.module.ts (NEW)
│   │   ├── group-membership.service.ts (NEW)
│   │   ├── schemas/group.schema.ts (NEW)
│   │   └── schemas/group-membership.schema.ts (NEW)
│   └── schedules/
│       ├── schedules.module.ts (NEW)
│       └── schemas/schedule.schema.ts (NEW)
├── app.module.ts (UPDATED - import todos los módulos)
└── package.json (UPDATED - added argon2)

docs/
└── 02_MODELO_DATOS_MONGODB.md (NEW - 500+ líneas)
```

---

## 📋 Fase 3: Autenticación Completa (Próxima)

### Tasks:

1. **Auth Endpoints (NestJS)**
   - [ ] POST /auth/register
     - Crear user
     - Crear auth_credentials
     - Retornar JWT + refreshToken cookie
   - [ ] POST /auth/login
     - Validar email + password (con Argon2)
     - Verificar lockout
     - Retornar JWT
   - [ ] POST /auth/logout
   - [ ] POST /auth/refresh
   - [ ] GET /auth/me (protected)

2. **JWT Guard (NestJS)**
   - [ ] JwtAuthGuard para proteger endpoints
   - [ ] @Public() decorator para rutas públicas
   - [ ] req.user inyectable en controllers

3. **Flutter Integration**
   - [ ] Riverpod AuthService (login/register)
   - [ ] flutter_secure_storage para tokens (Android/iOS)
   - [ ] HTTP interceptor para añadir Authorization header
   - [ ] Auto-refresh token en expiration

4. **Tests**
   - [ ] Unit tests: AuthCredentialService
   - [ ] E2E tests: auth endpoints
   - [ ] Widget tests: login screen

5. **Security Hardening**
   - [ ] Rate limiting en /auth/login
   - [ ] CORS correctamente configurado
   - [ ] HTTPS en production

---

## 🎮 Fase 4: Features MVP

### Sticker System

- [ ] POST /activities/:id/complete
  - Transacción: crear completion + award sticker
- [ ] GET /users/:id/stickers
- [ ] GET /activities

### Group Management

- [ ] POST /groups/:id/members
  - AddUserToGroup con validación de capacidad
- [ ] GET /groups/:id/members
- [ ] DELETE /groups/:id/members/:userId

### Schedule

- [ ] POST /schedule
  - Crear schedule con validación de solapamientos
- [ ] GET /groups/:id/schedule?date=2025-02-01
- [ ] PUT /schedule/:id

### User Profiles

- [ ] GET /users/:id (con stats: stickers, activities completadas)
- [ ] PUT /users/:id
- [ ] GET /users/:id/history (completions)

---

## 🌐 Fase 5: PWA & Frontend

### Service Worker

- [ ] stale-while-revalidate para JS/CSS
- [ ] cache-first para imágenes
- [ ] offline fallback

### Flutter UI

- [ ] Login screen
- [ ] Dashboard con stickers
- [ ] Activity list
- [ ] Group view
- [ ] User profile

### Lighthouse

- [ ] Target: PWA ≥ 90
- [ ] Performance ≥ 90
- [ ] Accessibility ≥ 90

---

## 🚀 Fase 6: Deploy & Monitoring

- [ ] MongoDB Atlas
- [ ] NestJS → Vercel / Railway
- [ ] Flutter Web → Vercel
- [ ] Mobile → PlayStore / TestFlight
- [ ] Sentry

---

**Siguiente paso**: Implementar Fase 3 (Auth Endpoints + JWT Guard)
