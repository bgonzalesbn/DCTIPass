# IT Experience MVP - Full Stack Gamified Learning Platform

> **Estado**: Fase 2 - Modelo de Datos MongoDB ✅

## 📋 Tabla de Contenidos

- [Descripción General](#descripción-general)
- [Stack Tecnológico](#stack-tecnológico)
- [Arquitectura](#arquitectura)
  - [Frontend (Flutter)](#frontend-flutter)
  - [Backend (NestJS + MongoDB)](#backend-nestjs--mongodb)
- [Requerimientos No Funcionales](#requerimientos-no-funcionales)
- [Setup Local](#setup-local)
- [Decisiones Técnicas Justificadas](#decisiones-técnicas-justificadas)
- [Roadmap](#roadmap)

---

## 🎯 Descripción General

**IT Experience** es una plataforma de gamificación para el aprendizaje de habilidades IT, con soporte multiplataforma:

- 📱 **Mobile**: Android e iOS (Flutter nativo)
- 🌐 **Web**: PWA instalable (Flutter Web + Service Worker)
- 🎮 **Características**: Retos, insignias, puntos, leaderboards, sincronización offline

**MVP Scope**:

1. Autenticación segura (JWT + HttpOnly cookies)
2. Sistema de retos con dificultad progresiva
3. Gamificación (puntos, insignias, perfiles)
4. PWA instalable con caché inteligente
5. Soporte i18n (es-CR por defecto)

---

## 🛠 Stack Tecnológico

```
┌─────────────────────────────────────────────────────┐
│         FRONTEND (Flutter + Web PWA)                │
├─────────────────────────────────────────────────────┤
│ • Flutter 3.16.0+ (Clean Architecture)              │
│ • Riverpod + riverpod_generator (State Management)  │
│ • Dio (HTTP Client)                                 │
│ • flutter_secure_storage (Auth segura)              │
│ • go_router (Navigation)                            │
│ • hive_flutter (Cache local)                        │
│ • PWA: Service Worker + manifest.json               │
│ • i18n: flutter_localizations + intl                │
└─────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────┐
│      BACKEND (NestJS + TypeScript + Express)        │
├─────────────────────────────────────────────────────┤
│ • NestJS 10.2.0 (Framework modular)                 │
│ • MongoDB 8.0 + Mongoose (ODM)                      │
│ • JWT + Passport (Autenticación)                    │
│ • class-validator (Validación)                      │
│ • Jest + Mockito (Testing)                          │
│ • Deploy: Render                                    │
└─────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────┐
│           INFRAESTRUCTURA & DEVOPS                  │
├─────────────────────────────────────────────────────┤
│ • GitHub Actions (CI/CD)                            │
│ • MongoDB Atlas (Producción)                        │
│ • Vercel (Deploy Frontend)                          │
│ • Render (Deploy Backend)                           │
│ • PlayStore / AppStore (Deploy Mobile)              │
└─────────────────────────────────────────────────────┘
```

---

## 🏗 Arquitectura

### Frontend (Flutter)

#### Clean Architecture - 3 Capas

```
lib/
├── domain/                          # Capa independiente (interfaces, entities)
│   ├── entities/                   # Modelos puros (sin lógica de BD)
│   ├── repositories/               # Interfaces (contracts)
│   └── usecases/                   # Lógica de negocio pura
│
├── data/                            # Capa de implementación (BD, API)
│   ├── datasources/
│   │   ├── local/                  # Hive, SharedPreferences
│   │   └── remote/                 # HTTP calls (Dio)
│   ├── models/                      # Modelos + mapeos (toEntity/toJson)
│   ├── repositories/                # Implementación de interfaces domain
│   └── providers/                   # Riverpod providers (datos)
│
└── presentation/                    # Capa UI (UI sin lógica)
    ├── pages/                       # Pantallas
    ├── widgets/                     # Widgets reutilizables
    ├── controllers/                 # Riverpod controllers (business logic)
    └── providers/                   # Riverpod state providers
```

**Principio**: UI descartable, lógica portable → cambiar UI sin tocar domain/data.

#### State Management: Riverpod

**¿Por qué Riverpod sobre BLoC?**

- ✅ Más simple para MVP (menos boilerplate)
- ✅ InheritedWidget nativo + ref.watch/ref.listen
- ✅ riverpod_generator reduce código repetitivo
- ✅ Testeable sin contextos complejos
- ✅ mejor performance (lazy loading)

**Estructura de providers**:

```dart
// Service provider (singleton)
@riverpod
AuthService authService(AuthServiceRef ref) => AuthService(...);

// Repository provider
@riverpod
AuthRepository authRepository(AuthRepositoryRef ref) =>
    AuthRepository(ref.watch(authServiceProvider));

// State provider (mutable)
@riverpod
class AuthController extends _$AuthController {
  @override
  Future<AuthState> build() async => AuthState.initial();

  Future<void> login(String email, String password) async {
    state = const AsyncValue.loading();
    state = await AsyncValue.guard(() =>
      ref.read(authRepositoryProvider).login(email, password)
    );
  }
}

// UI consumer
@override
Widget build(BuildContext context, WidgetRef ref) {
  final authState = ref.watch(authControllerProvider);
  return authState.when(
    data: (auth) => Dashboard(auth: auth),
    loading: () => LoadingScreen(),
    error: (e, st) => ErrorScreen(error: e),
  );
}
```

#### PWA Web (Flutter Web)

**Requisitos PWA**:

1. ✅ manifest.json con íconos 192x512, display="standalone"
2. ✅ Service Worker + caché inteligente
3. ✅ HTTPS (requisito SW)
4. ✅ Offline-first (shell cacheado)

**Estrategia de caché**:

```javascript
// SW: stale-while-revalidate para JS/CSS
// SW: cache-first para imágenes + assets
// Fallback: último cronograma conocido
```

**Instalación**:

- **Android/Web**: Auto "Add to Home Screen" banner
- **iOS**: Manual vía Share → Add to Home Screen (limitaciones Apple)
  - Sin push notifications en background
  - Sin acceso a cámara/micrófono
  - Sin sincronización de datos en background

**Lighthouse PWA**: Objetivo ≥ 90 (LCP p75 < 2.5s)

#### Seguridad Web (Sesiones)

**NO usar localStorage para JWT** ❌

**Estrategia (Best Practice)**:

```
1. Backend emite JWT en response body
2. Cliente lo guarda EN MEMORIA (variable `let accessToken`)
3. Backend emite refreshToken en HttpOnly cookie
   ├─ HttpOnly: No accesible vía JS (XSS safe)
   ├─ Secure: Solo HTTPS en prod
   └─ SameSite=Strict: CSRF protected

4. Cliente adjunta JWT en Authorization: Bearer <token>
5. Al expirar, intercambia refreshToken por nuevo JWT
```

**Trade-offs**:

- ✅ XSS + CSRF protegido
- ✅ Estándar OAuth 2.0
- ❌ No persiste si recargas (pero mejor que localStorage)
- ✅ Mobile (Android/iOS): flutter_secure_storage en Keychain/Keystore

---

### Backend (NestJS + MongoDB)

#### Arquitectura Modular

```
backend/
├── src/
│   ├── config/                  # Configuración global (env, constants)
│   │   ├── config.service.ts
│   │   └── config.module.ts
│   ├── database/                # Conexión MongoDB + helpers
│   │   ├── database.service.ts
│   │   ├── database.module.ts
│   │   └── mongo.test.ts
│   ├── common/                  # Utilidades compartidas
│   │   ├── decorators/          # @Auth, @CurrentUser, etc
│   │   ├── filters/             # Global exception filter
│   │   └── guards/              # JWT guard
│   ├── modules/                 # Features (DDD-inspired)
│   │   ├── auth/
│   │   │   ├── auth.service.ts
│   │   │   ├── auth.controller.ts
│   │   │   ├── auth.module.ts
│   │   │   ├── dto/
│   │   │   └── guards/
│   │   ├── users/
│   │   │   ├── users.service.ts
│   │   │   ├── users.controller.ts
│   │   │   ├── users.module.ts
│   │   │   └── schemas/
│   │   └── challenges/
│   │       ├── challenges.service.ts
│   │       ├── challenges.controller.ts
│   │       ├── challenges.module.ts
│   │       └── schemas/
│   ├── app.module.ts            # Root module
│   └── main.ts                  # Entry point
├── test/                        # E2E tests
└── package.json
```

#### MongoDB Schemas + Índices

**User Schema** (`src/modules/users/schemas/user.schema.ts`):

```typescript
{
  email: String (unique, required),
  username: String (unique, required),
  firstName: String (required),
  lastName: String (optional),
  password: String (bcrypt hashed, min 8 chars),
  emailVerified: Boolean (default: false),
  totalPoints: Number (default: 0),
  completedChallenges: Number (default: 0),
  badges: [String] (array of badge IDs),
  isActive: Boolean (default: true, soft-delete),
  lastLogin: Date,
  deletedAt: Date (soft-delete, indexed),
  createdAt: Date (auto),
  updatedAt: Date (auto)
}

Índices:
- { email: 1, unique: true }
- { username: 1, unique: true }
- { isActive: 1, deletedAt: 1 } (compound para queries)
```

**Challenge Schema** (`src/modules/challenges/schemas/challenge.schema.ts`):

```typescript
{
  title: String (required),
  description: String (required),
  slug: String (unique, required, URL-safe),
  difficulty: Enum [beginner, intermediate, advanced, expert],
  points: Number (reward),
  instructions: String (HTML),
  successCriteria: String (optional, HTML),
  tags: [String] (e.g., ["JavaScript", "async"]),
  imageUrl: String (optional),
  completionCount: Number (analytics, default: 0),
  isActive: Boolean (default: true),
  releasedAt: Date (opcional, para release planning),
  retiredAt: Date (cuando se descontinúa),
  deletedAt: Date (soft-delete),
  createdAt: Date (auto),
  updatedAt: Date (auto)
}

Índices:
- { slug: 1, unique: true }
- { difficulty: 1, isActive: 1 } (queries por dificultad)
- { isActive: 1, deletedAt: 1 } (queries activos)
```

#### Autenticación y Seguridad

**Flow JWT + Cookies**:

```
1. POST /auth/register
   ├─ Valida password fuerte (min 8, mayús, números, símbolos)
   ├─ Hashea password con bcrypt (salt: 10)
   ├─ Crea user en MongoDB
   └─ Retorna { accessToken, expiresIn }
      + Set-Cookie: refreshToken (HttpOnly, Secure, SameSite)

2. POST /auth/login
   ├─ Valida email + password (bcrypt.compare)
   ├─ Genera JWT (sub: userId, email)
   └─ Retorna accesToken + cookie refreshToken

3. Request autenticado
   ├─ Client envía Authorization: Bearer <accessToken>
   ├─ JwtGuard valida firma + expiration
   └─ req.user = { sub, email }

4. Token expirado
   ├─ Client intenta request → 401 Unauthorized
   ├─ Client envía cookie refreshToken → POST /auth/refresh
   └─ Backend valida + emite nuevo accessToken
```

**Password Hashing**: bcryptjs (10 salt rounds, ~100ms/hash)

**Validación de entrada**:

- `class-validator` + `class-transformer`
- AutoTransform: JSON → DTO automáticamente
- Whitelist: Rechaza propiedades no esperadas

---

## 📋 Requerimientos No Funcionales

### 1. Accesibilidad (WCAG 2.1 AA)

- ✅ Contraste mínimo 4.5:1 (texto)
- ✅ Foco visible en navegación
- ✅ Tamaños dinámicos (texto escalable)
- ✅ Soporte lector de pantalla (Semantics)

### 2. Rendimiento

- ✅ LCP p75 < 2.5s (Web)
- ✅ Lighthouse PWA ≥ 90
- ✅ Offline-first con Service Worker
- ✅ Caché inteligente (stale-while-revalidate)

### 3. i18n

- ✅ flutter_localizations + intl
- ✅ Defecto: es-CR (Costa Rica)
- ✅ Switchable en app (es, en, etc)

### 4. Seguridad

- ✅ HTTPS obligatorio (PWA + cookies)
- ✅ JWT + HttpOnly cookies
- ✅ CORS configurado por origen
- ✅ Validación de entrada (class-validator)
- ✅ SQL Injection N/A (ODM + params)
- ✅ Rate limiting (backend)

### 5. Analítica

- ✅ Eventos: login, challenge_started, challenge_completed, badge_earned, pwa_installed
- Implementar: Firebase Analytics / Mixpanel

---

## 🚀 Setup Local

### Requisitos

- Node.js 18+
- Flutter 3.16.0+
- MongoDB Atlas o MongoDB local

### Backend Setup

```bash
cd backend

# 1. Copiar env
cp .env.example .env

# 2. Configurar MONGO_URI en .env con tu conexión MongoDB Atlas

# 3. Instalar dependencias
npm install

# 4. Iniciar en modo desarrollo
npm run start:dev

# Backend corre en http://localhost:3000
```

**Seedar datos** (TODO - Fase 2):

```bash
npm run seed
```

### Frontend Setup

```bash
cd frontend

# 1. Obtener dependencias
flutter pub get

# 2. Generar código (Riverpod, freezed, etc)
flutter pub run build_runner build --delete-conflicting-outputs

# 3. Correr en Web (Dev)
flutter run -d chrome --web-port 5000

# 4. Correr en iOS (simulator)
flutter run -d iPhone

# 5. Correr en Android (emulator)
flutter run -d emulator-5554
```

### Verificar Setup

```bash
# Backend health check
curl http://localhost:3000/health

# Flutter Web
open http://localhost:5000

# Lighthouse (Web)
open http://localhost:5000
# DevTools → Lighthouse → Run audit
```

---

## 🎯 Decisiones Técnicas Justificadas

### ✅ Riverpod vs BLoC

| Aspecto            | Riverpod   | BLoC            |
| ------------------ | ---------- | --------------- |
| Boilerplate        | Bajo ✅    | Alto            |
| Curva aprendizaje  | Media      | Alta            |
| IDE support        | ⭐⭐⭐⭐⭐ | ⭐⭐⭐          |
| riverpod_generator | Excelente  | code_generation |
| Testing            | Simple ✅  | Complejo        |

**Conclusión**: Riverpod es ideal para MVP rápido sin comprometer testing.

### ✅ NestJS vs Express puro

| Aspecto    | NestJS          | Express             |
| ---------- | --------------- | ------------------- |
| Estructura | Opinionada ✅   | Flexible            |
| TS support | Nativo          | Manual (decorators) |
| Modules    | DDD built-in ✅ | DIY                 |
| Testing    | Integrado ✅    | DIY                 |
| Escala     | Enterprise ✅   | Startups            |

**Conclusión**: NestJS para mantenibilidad y escalabilidad.

### ✅ MongoDB vs PostgreSQL

| Aspecto            | MongoDB        | PostgreSQL |
| ------------------ | -------------- | ---------- |
| Schema             | Flexible       | Rigid      |
| Queries            | Simple JSON ✅ | SQL power  |
| ACID               | Limited        | Full ✅    |
| Escala horizontal  | Native ✅      | Complejo   |
| Retos gamificación | Perfecto ✅    | Overkill   |

**Conclusión**: MongoDB suficiente para MVP; PostgreSQL si necesitas transacciones complejas.

### ✅ Flutter Web PWA vs Next.js/React

| Aspecto           | Flutter Web          | React/Next      |
| ----------------- | -------------------- | --------------- |
| Cross-platform    | Code sharing ✅      | Fragmentado     |
| Native web        | No / Web performance | Sí / Mejor perf |
| Bundle size       | Grande (~3MB)        | Flexible        |
| PWA soporte       | ✅ Service Worker    | ✅ Workbox      |
| Curva aprendizaje | 1 lenguaje ✅        | 2+ lenguajes    |

**Conclusión**: Flutter Web es pragmático si prioridad es code reuse.

---

## 📅 Roadmap

### ✅ Fase 1: Scaffolding & Arquitectura Base

- [x] Estructura Flutter (Clean Arch + Riverpod)
- [x] Estructura NestJS (Modular + MongoDB)
- [x] Schemas + índices MongoDB
- [x] CI/CD GitHub Actions (básico)
- [x] Configuración para deploy en Vercel y Render
- [ ] **Siguiente tarea**: Autenticación completa

### 📋 Fase 2: Autenticación & Seguridad

- [ ] JWT + HttpOnly cookies implementación
- [ ] flutter_secure_storage (Android/iOS)
- [ ] Refresh token rotation
- [ ] Email verification (nodemailer)
- [ ] Rate limiting + brute-force protection

### 🎮 Fase 3: Features MVP

- [ ] Challenge system (list, detail, submit)
- [ ] Points + badges gamification
- [ ] Leaderboards básicos
- [ ] User profiles + stats

### 🌐 Fase 4: PWA & Optimización

- [ ] Service Worker avanzado
- [ ] Caché inteligente
- [ ] Offline mode completo
- [ ] Lighthouse PWA ≥ 90

### 🚀 Fase 5: Deploy & Monitoreo

- [ ] MongoDB Atlas (producción)
- [ ] Backend: Vercel / Railway / AWS
- [ ] Web: Vercel / Netlify
- [ ] Mobile: PlayStore / TestFlight
- [ ] Sentry + monitoring

---

## 📚 Referencias

- [Flutter Clean Architecture](https://docs.flutter.dev/architectural-overview)
- [Riverpod Docs](https://riverpod.dev)
- [NestJS Docs](https://docs.nestjs.com)
- [MongoDB Best Practices](https://docs.mongodb.com)
- [PWA - MDN](https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps)
- [JWT Best Practices](https://tools.ietf.org/html/rfc8949)
- [OWASP Top 10](https://owasp.org/www-project-top-ten/)

---

**Fase 1 ✅ Completada**

→ Siguiente: [Pasar a Fase 2: Autenticación Completa](#)
