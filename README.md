# DCTIPass - IT Experience Platform

> **Plataforma de Gamificación para Aprendizaje IT con Sistema de Insignias y Actividades**

## 📋 Tabla de Contenidos

- [Descripción General](#-descripción-general)
- [Stack Tecnológico](#-stack-tecnológico)
- [Arquitectura del Sistema](#-arquitectura-del-sistema)
- [Backend - Documentación Técnica](#-backend---documentación-técnica)
- [Frontend - Documentación Técnica](#-frontend---documentación-técnica)
- [Modelo de Base de Datos](#-modelo-de-base-de-datos)
- [Diagramas de Flujo](#-diagramas-de-flujo)
- [Setup y Configuración](#-setup-y-configuración)
- [Deployment](#-deployment)

---

## 🎯 Descripción General

**DCTIPass** es una plataforma web de gamificación diseñada para el aprendizaje de habilidades IT. El sistema permite a los usuarios completar actividades, ganar insignias (badges), participar en grupos y seguir un cronograma estructurado de aprendizaje.

### Características Principales

- 🔐 **Autenticación Segura**: JWT con tokens HttpOnly y Argon2id para hash de contraseñas
- 🎮 **Sistema de Gamificación**: Actividades, insignias, puntos y progreso personalizado
- 👥 **Gestión de Grupos**: Organización de usuarios en grupos con capacidad máxima
- 📅 **Cronograma Estructurado**: Sistema de scheduling para actividades programadas
- 💾 **PWA Optimizada**: Aplicación web progresiva con caché inteligente y offline support
- 📊 **Dashboard de Progreso**: Visualización en tiempo real del avance del usuario

---

## 🛠 Stack Tecnológico

### Frontend

```
┌─────────────────────────────────────────────────────┐
│         FRONTEND (React + TypeScript + PWA)         │
├─────────────────────────────────────────────────────┤
│ • React 19.2.0 (UI Library)                         │
│ • TypeScript 5.9.3 (Type Safety)                    │
│ • Vite 7.2.4 (Build Tool & Dev Server)              │
│ • React Router DOM 7.13.0 (Routing)                 │
│ • Zustand 5.0.11 (State Management)                 │
│ • Axios 1.13.4 (HTTP Client)                        │
│ • Tailwind CSS 4.1.18 (Styling)                     │
│ • Vite Plugin PWA 1.2.0 (Service Worker)            │
└─────────────────────────────────────────────────────┘
```

### Backend

```
┌─────────────────────────────────────────────────────┐
│      BACKEND (NestJS + TypeScript + MongoDB)        │
├─────────────────────────────────────────────────────┤
│ • NestJS 10.2.0 (Framework)                         │
│ • TypeScript (Language)                             │
│ • MongoDB 8.0 + Mongoose 8.0.0 (Database/ODM)       │
│ • Passport + JWT (Authentication)                   │
│ • Argon2 0.31.1 (Password Hashing)                  │
│ • Class Validator 0.14.0 (Input Validation)         │
│ • Class Transformer 0.5.1 (DTO Mapping)             │
│ • Cookie Parser 1.4.6 (Session Management)          │
└─────────────────────────────────────────────────────┘
```

### Infraestructura

```
┌─────────────────────────────────────────────────────┐
│           INFRAESTRUCTURA & DEVOPS                  │
├─────────────────────────────────────────────────────┤
│ • MongoDB Atlas (Database Production)               │
│ • Vercel (Frontend Hosting)                         │
│ • Render (Backend Hosting)                          │
│ • GitHub (Version Control)                          │
└─────────────────────────────────────────────────────┘
```

---

## 🏗 Arquitectura del Sistema

### Arquitectura General

```mermaid
graph TB
    subgraph "Frontend Layer"
        A[React App PWA]
        B[Service Worker]
        C[Local Cache]
    end

    subgraph "API Gateway"
        D[NestJS Backend]
        E[JWT Auth Guard]
    end

    subgraph "Business Logic"
        F[Auth Module]
        G[Users Module]
        H[Activities Module]
        I[Stickers Module]
        J[Awards Module]
        K[Groups Module]
        L[Schedules Module]
    end

    subgraph "Data Layer"
        M[(MongoDB Atlas)]
    end

    A -->|HTTP/REST| D
    B -->|Cache Strategy| C
    D --> E
    E --> F
    E --> G
    E --> H
    E --> I
    E --> J
    E --> K
    E --> L
    F --> M
    G --> M
    H --> M
    I --> M
    J --> M
    K --> M
    L --> M
```

---

## 🔧 Backend - Documentación Técnica

### Arquitectura del Backend

El backend está construido con **NestJS** siguiendo principios de arquitectura modular y SOLID:

#### Estructura de Directorios

```
backend/
├── src/
│   ├── app.module.ts              # Módulo raíz de la aplicación
│   ├── main.ts                    # Punto de entrada
│   ├── common/                    # Recursos compartidos
│   │   ├── decorators/           # Custom decorators (@Public, etc)
│   │   ├── filters/              # Exception filters
│   │   └── guards/               # Route guards
│   ├── config/                   # Configuración
│   │   ├── config.module.ts
│   │   └── config.service.ts
│   ├── database/                 # Database connection
│   │   ├── database.module.ts
│   │   └── database.service.ts
│   └── modules/                  # Módulos de negocio
│       ├── auth/                 # Autenticación y autorización
│       ├── users/                # Gestión de usuarios
│       ├── activities/          # Gestión de actividades
│       ├── stickers/            # Gestión de insignias
│       ├── awards/              # Sistema de premios
│       ├── groups/              # Gestión de grupos
│       ├── schedules/           # Cronogramas
│       └── challenges/          # Sistema de desafíos
```

### Módulos Principales

#### 1. Auth Module (`/auth`)

**Responsabilidad**: Gestión de autenticación y autorización

**Endpoints**:

- `POST /auth/register` - Registro de nuevos usuarios
- `POST /auth/login` - Inicio de sesión
- `POST /auth/logout` - Cierre de sesión

**Características**:

- JWT con tokens HttpOnly cookies
- Password hashing con Argon2id
- Passport JWT Strategy
- Guard global para protección de rutas

**DTOs**:

```typescript
RegisterDto {
  employeeNum: string;
  email: string;
  password: string;
  firstName: string;
  lastName: string;
}

LoginDto {
  email: string;
  password: string;
}
```

#### 2. Users Module (`/users`)

**Responsabilidad**: Gestión de perfiles y datos de usuarios

**Endpoints**:

- `GET /users/me` - Obtener perfil del usuario autenticado
- `PUT /users/profile` - Actualizar perfil
- `POST /users/complete-sub-activity` - Completar sub-actividad
- `GET /users/:id` - Obtener usuario por ID
- `GET /users/:id/progress` - Obtener progreso del usuario

**Características**:

- Gestión de hobbies y posición
- Tracking de progreso de actividades
- Relación con grupos y actividades completadas

#### 3. Activities Module (`/activities`)

**Responsabilidad**: Gestión del catálogo de actividades

**Endpoints**:

- `GET /activities` - Listar todas las actividades
- `GET /activities/:id` - Obtener actividad por ID
- `POST /activities` - Crear nueva actividad
- `PUT /activities/:id` - Actualizar actividad
- `DELETE /activities/:id` - Eliminar actividad

**Modelo**:

```typescript
Activity {
  _id: ObjectId;
  name: string;
  stickerId: ObjectId;  // Relación 1:1 con Sticker
  active: boolean;
}
```

#### 4. Stickers Module (`/badges`)

**Responsabilidad**: Gestión de insignias/badges

**Endpoints**:

- `GET /badges` - Listar todas las insignias
- `GET /badges/:id` - Obtener insignia por ID
- `POST /badges` - Crear nueva insignia
- `PUT /badges/:id` - Actualizar insignia

**Modelo**:

```typescript
Sticker {
  _id: ObjectId;
  name: string;
  imageUrl: string;
  active: boolean;
}
```

#### 5. Awards Module (`/awards`)

**Responsabilidad**: Sistema de otorgamiento de insignias

**Endpoints**:

- `GET /awards/my-awards` - Obtener awards del usuario
- `POST /awards` - Otorgar award a usuario
- `GET /awards/user/:userId` - Awards de un usuario específico

**Modelo**:

```typescript
StickerAward {
  userId: ObjectId;
  stickerId: ObjectId;
  activityCompletionId: ObjectId;
  awardedAt: Date;
}
```

#### 6. Groups Module (`/groups`)

**Responsabilidad**: Gestión de grupos de usuarios

**Endpoints**:

- `GET /groups` - Listar todos los grupos
- `GET /groups/:id` - Obtener grupo por ID
- `POST /groups` - Crear nuevo grupo
- `POST /groups/:id/members` - Agregar miembro al grupo

**Modelo**:

```typescript
Group {
  _id: ObjectId;
  name: string;
  capacityMax: number;  // Default: 20
  shift: 'Morning' | 'Afternoon';
  active: boolean;
}

GroupMembership {
  userId: ObjectId;
  groupId: ObjectId;
  assignedAt: Date;
}
```

#### 7. Schedules Module (`/schedule`)

**Responsabilidad**: Gestión de cronogramas de actividades

**Endpoints**:

- `GET /schedule` - Obtener cronograma actual
- `POST /schedule` - Crear nuevo cronograma
- `PUT /schedule/:id` - Actualizar cronograma

**Modelo**:

```typescript
Schedule {
  _id: ObjectId;
  name: string;
  startDate: Date;
  endDate: Date;
  activities: ObjectId[];
  active: boolean;
}
```

### Seguridad y Middleware

**Guards**:

- `JwtAuthGuard`: Protección global de rutas (excepto las marcadas con `@Public()`)
- Validación automática de tokens JWT en cada request

**Decorators Personalizados**:

- `@Public()`: Excluye rutas del guard de autenticación

**Validation Pipes**:

- Validación automática de DTOs con `class-validator`
- Transformación automática con `class-transformer`

---

## 🎨 Frontend - Documentación Técnica

### Arquitectura del Frontend

El frontend está construido con **React 19** y **TypeScript**, siguiendo una arquitectura modular con separación de responsabilidades.

#### Estructura de Directorios

```
frontend/
├── src/
│   ├── App.tsx                    # Componente raíz y routing
│   ├── main.tsx                   # Punto de entrada
│   ├── assets/                    # Imágenes, iconos, etc.
│   ├── components/               # Componentes reutilizables
│   │   ├── Button.tsx
│   │   ├── Card.tsx
│   │   ├── LoadingSpinner.tsx
│   │   ├── TextField.tsx
│   │   ├── CompletedModal.tsx
│   │   ├── QuestionModal.tsx
│   │   └── SkeletonLoader.tsx
│   ├── hooks/                    # Custom React hooks
│   │   ├── useAsync.ts
│   │   └── usePerformance.ts
│   ├── pages/                    # Páginas de la aplicación
│   │   ├── LoginPage.tsx
│   │   ├── RegisterPage.tsx
│   │   ├── HomePage.tsx
│   │   ├── ProfilePage.tsx
│   │   ├── ActivitiesPage.tsx
│   │   ├── SubActivitiesPage.tsx
│   │   ├── BadgesPage.tsx
│   │   ├── SchedulePage.tsx
│   │   └── AdminBadgesUpload.tsx
│   ├── services/                 # Servicios de API
│   │   └── api.ts
│   ├── store/                    # Estado global (Zustand)
│   │   ├── authStore.ts
│   │   └── cacheStore.ts
│   └── types/                    # TypeScript types/interfaces
├── public/                       # Archivos estáticos
│   ├── manifest.json            # PWA manifest
│   └── icons/                   # PWA icons
├── dev-dist/                    # Service Worker generado
│   ├── sw.js
│   └── workbox-*.js
└── vite.config.ts               # Configuración de Vite + PWA
```

### Páginas Principales

#### 1. LoginPage (`/login`)

- Formulario de inicio de sesión
- Validación de credenciales
- Redirección a home después de login exitoso

#### 2. RegisterPage (`/register`)

- Formulario de registro de nuevos usuarios
- Campos: employeeNum, email, password, firstName, lastName
- Validación de datos antes de envío

#### 3. HomePage (`/home`)

- Dashboard principal del usuario
- Resumen de progreso
- Acceso rápido a actividades y badges
- Información del grupo asignado

#### 4. ProfilePage (`/profile`)

- Visualización y edición de perfil de usuario
- Datos personales
- Hobbies y posición
- Progreso general

#### 5. ActivitiesPage (`/activities`)

- Listado de todas las actividades disponibles
- Estado de completado por actividad
- Acceso a sub-actividades

#### 6. SubActivitiesPage (`/activities/:id/sub`)

- Detalle de sub-actividades de una actividad principal
- Completar sub-actividades
- Earned badges al completar

#### 7. BadgesPage (`/badges`)

- Galería de todas las insignias disponibles
- Insignias ganadas vs. disponibles
- Detalles de cada insignia

#### 8. SchedulePage (`/schedule`)

- Cronograma de actividades programadas
- Fechas de inicio y fin
- Estado de actividades en el schedule

#### 9. AdminBadgesUpload (`/admin/badges`)

- Página administrativa para subir/gestionar badges
- Solo accesible para administradores

### State Management con Zustand

#### Auth Store (`authStore.ts`)

```typescript
interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  login: (credentials) => Promise<void>;
  logout: () => void;
  updateUser: (userData) => void;
}
```

#### Cache Store (`cacheStore.ts`)

```typescript
interface CacheState {
  activities: Activity[];
  badges: Badge[];
  updateCache: (key, data) => void;
  clearCache: () => void;
}
```

### Progressive Web App (PWA)

**Características PWA**:

- ✅ Instalable en dispositivos móviles y desktop
- ✅ Service Worker con estrategia de caché
- ✅ Soporte offline para assets estáticos
- ✅ Manifest.json con íconos y metadata
- ✅ Workbox para gestión avanzada de caché

**Configuración de Caché**:

- **Cache First**: Assets estáticos (CSS, JS, imágenes)
- **Network First**: API calls (datos dinámicos)
- **Stale While Revalidate**: Datos que pueden mostrarse en caché mientras se actualizan

### Custom Hooks

#### useAsync

```typescript
// Hook para manejo de estados asíncronos
const { data, loading, error, execute } = useAsync(asyncFunction);
```

#### usePerformance

```typescript
// Hook para monitoreo de performance
const { renderTime, interactionTime } = usePerformance();
```

### Routing

**Lazy Loading**: Todas las páginas (excepto Login y Register) se cargan de forma lazy para optimizar el bundle inicial.

```typescript
const HomePage = lazy(() => import("./pages/HomePage"));
const ProfilePage = lazy(() => import("./pages/ProfilePage"));
// ...etc
```

---

## 💾 Modelo de Base de Datos

### Diagrama Entidad-Relación

```mermaid
erDiagram
    USERS ||--|| AUTH_CREDENTIALS : has
    USERS ||--o{ GROUP_MEMBERSHIPS : belongs
    GROUPS ||--o{ GROUP_MEMBERSHIPS : contains
    USERS ||--o{ ACTIVITY_COMPLETIONS : completes
    ACTIVITIES ||--o{ ACTIVITY_COMPLETIONS : "completed by"
    ACTIVITIES ||--|| STICKERS : "awards"
    USERS ||--o{ STICKER_AWARDS : earns
    STICKERS ||--o{ STICKER_AWARDS : "earned by"
    ACTIVITY_COMPLETIONS ||--o| STICKER_AWARDS : triggers
    SCHEDULES ||--o{ ACTIVITIES : includes

    USERS {
        ObjectId _id PK
        string employeeNum UK
        string email UK
        string firstName
        string lastName
        string[] hobbies
        string position
        boolean active
        date createdAt
        date updatedAt
    }

    AUTH_CREDENTIALS {
        ObjectId _id PK
        ObjectId userId FK
        string passwordHash
        string passwordAlgo
        object passwordParams
        int passwordVersion
        int failedAttempts
        date lockoutUntil
        date lastLoginAt
        boolean mfaEnabled
        string mfaSecret
    }

    GROUPS {
        ObjectId _id PK
        string name UK
        int capacityMax
        string shift
        boolean active
    }

    GROUP_MEMBERSHIPS {
        ObjectId _id PK
        ObjectId userId FK
        ObjectId groupId FK
        date assignedAt
    }

    ACTIVITIES {
        ObjectId _id PK
        string name UK
        ObjectId stickerId FK
        boolean active
    }

    STICKERS {
        ObjectId _id PK
        string name UK
        string imageUrl
        boolean active
    }

    ACTIVITY_COMPLETIONS {
        ObjectId _id PK
        ObjectId userId FK
        ObjectId activityId FK
        ObjectId groupId FK
        ObjectId scheduleId FK
        date completedAt
    }

    STICKER_AWARDS {
        ObjectId _id PK
        ObjectId userId FK
        ObjectId stickerId FK
        ObjectId activityCompletionId FK
        date awardedAt
    }

    SCHEDULES {
        ObjectId _id PK
        string name
        date startDate
        date endDate
        ObjectId[] activities
        boolean active
    }
```

### Colecciones de MongoDB

#### 1. `users`

**Propósito**: Almacenar información de usuarios/empleados

**Índices**:

- `{ employeeNum: 1 }` UNIQUE
- `{ email: 1 }` UNIQUE
- `{ active: 1 }`

#### 2. `auth_credentials`

**Propósito**: Credenciales de autenticación separadas para seguridad

**Índices**:

- `{ userId: 1 }` UNIQUE

**Características de Seguridad**:

- Password hash con Argon2id
- Tracking de intentos fallidos
- Sistema de lockout temporal
- Soporte para MFA (futuro)

#### 3. `groups`

**Propósito**: Organización de usuarios en grupos de trabajo

**Índices**:

- `{ name: 1 }` UNIQUE
- `{ active: 1, shift: 1 }`

#### 4. `group_memberships`

**Propósito**: Relación muchos a muchos entre usuarios y grupos

**Índices**:

- `{ userId: 1, groupId: 1 }` UNIQUE COMPOUND
- `{ groupId: 1 }`

#### 5. `activities`

**Propósito**: Catálogo de actividades disponibles

**Índices**:

- `{ name: 1 }` UNIQUE
- `{ stickerId: 1 }` UNIQUE (relación 1:1)
- `{ active: 1 }`

#### 6. `stickers` (Badges/Insignias)

**Propósito**: Catálogo de insignias que se pueden ganar

**Índices**:

- `{ name: 1 }` UNIQUE
- `{ active: 1 }`

#### 7. `activity_completions`

**Propósito**: Registro de actividades completadas por usuarios

**Índices**:

- `{ userId: 1, activityId: 1 }` UNIQUE COMPOUND
- `{ userId: 1, completedAt: -1 }` (historial)
- `{ activityId: 1 }` (analíticas)
- `{ scheduleId: 1 }`

#### 8. `sticker_awards`

**Propósito**: Insignias ganadas por usuarios

**Índices**:

- `{ userId: 1, stickerId: 1 }` UNIQUE COMPOUND
- `{ userId: 1, awardedAt: -1 }` (historial)
- `{ activityCompletionId: 1 }`

#### 9. `schedules`

**Propósito**: Cronogramas de actividades programadas

**Índices**:

- `{ active: 1, startDate: 1 }`
- `{ name: 1 }`

---

## 📊 Diagramas de Flujo

### Flujo de Autenticación

```mermaid
sequenceDiagram
    actor User
    participant Frontend
    participant Backend
    participant MongoDB
    participant JWT

    Note over User,JWT: Registro de Usuario
    User->>Frontend: Completa formulario registro
    Frontend->>Backend: POST /auth/register
    Backend->>Backend: Valida datos (DTO)
    Backend->>Backend: Hash password (Argon2id)
    Backend->>MongoDB: Crea User + AuthCredentials
    MongoDB-->>Backend: Usuario creado
    Backend->>JWT: Genera accessToken
    Backend-->>Frontend: {user, token}
    Frontend->>Frontend: Guarda token en memoria
    Frontend-->>User: Redirige a /home

    Note over User,JWT: Inicio de Sesión
    User->>Frontend: Ingresa email + password
    Frontend->>Backend: POST /auth/login
    Backend->>MongoDB: Busca usuario por email
    MongoDB-->>Backend: Usuario encontrado
    Backend->>Backend: Verifica password (Argon2id)
    Backend->>Backend: Valida intentos fallidos
    Backend->>JWT: Genera accessToken
    Backend->>MongoDB: Actualiza lastLoginAt
    Backend-->>Frontend: {user, token}
    Frontend->>Frontend: Guarda token en memoria
    Frontend->>Frontend: Actualiza Zustand store
    Frontend-->>User: Redirige a /home

    Note over User,JWT: Request Autenticado
    User->>Frontend: Navega a página protegida
    Frontend->>Backend: GET /users/me (+ Authorization header)
    Backend->>JWT: Valida token
    alt Token válido
        JWT-->>Backend: Token OK
        Backend->>MongoDB: Query datos
        MongoDB-->>Backend: Datos
        Backend-->>Frontend: Respuesta
        Frontend-->>User: Muestra datos
    else Token inválido/expirado
        JWT-->>Backend: Token inválido
        Backend-->>Frontend: 401 Unauthorized
        Frontend->>Frontend: Limpia auth store
        Frontend-->>User: Redirige a /login
    end
```

### Flujo de Actividades y Awards

```mermaid
sequenceDiagram
    actor User
    participant Frontend
    participant Backend
    participant MongoDB

    Note over User,MongoDB: Usuario ve actividades disponibles
    User->>Frontend: Navega a /activities
    Frontend->>Backend: GET /activities
    Backend->>MongoDB: Query activities WHERE active=true
    MongoDB-->>Backend: Lista de activities
    Backend-->>Frontend: Activities[]
    Frontend-->>User: Muestra grid de actividades

    Note over User,MongoDB: Usuario completa actividad
    User->>Frontend: Click en "Completar Actividad"
    Frontend->>Frontend: Muestra modal de confirmación
    User->>Frontend: Confirma completado
    Frontend->>Backend: POST /users/complete-sub-activity
    Note right of Backend: {activityId, subActivityId}

    Backend->>MongoDB: Busca Activity y Sticker
    MongoDB-->>Backend: Activity + Sticker data

    Backend->>MongoDB: Verifica si ya completó
    alt Ya completada
        MongoDB-->>Backend: Completion existente
        Backend-->>Frontend: 409 Conflict
        Frontend-->>User: "Ya completaste esta actividad"
    else No completada
        Backend->>MongoDB: Crea ActivityCompletion
        Backend->>MongoDB: Crea StickerAward
        Backend->>MongoDB: Actualiza progress de User
        MongoDB-->>Backend: Registros creados
        Backend-->>Frontend: {completion, award, progress}
        Frontend->>Frontend: Actualiza cache local
        Frontend->>Frontend: Muestra modal de felicitación
        Frontend-->>User: "¡Badge ganado! 🎉"
    end

    Note over User,MongoDB: Usuario ve su colección
    User->>Frontend: Navega a /badges
    Frontend->>Backend: GET /awards/my-awards
    Backend->>MongoDB: Query StickerAwards WHERE userId
    Backend->>MongoDB: LEFT JOIN Stickers
    MongoDB-->>Backend: Awards con Sticker data
    Backend-->>Frontend: MyAwards[]
    Frontend-->>User: Muestra badges ganados + bloqueados
```

### Flujo de Cronograma (Schedule)

```mermaid
sequenceDiagram
    actor Admin
    actor User
    participant Frontend
    participant Backend
    participant MongoDB

    Note over Admin,MongoDB: Admin crea Schedule
    Admin->>Frontend: Accede a admin panel
    Frontend->>Backend: POST /schedule
    Note right of Backend: {name, startDate, endDate, activities[]}
    Backend->>MongoDB: Crea Schedule document
    Backend->>MongoDB: Actualiza activities con scheduleId
    MongoDB-->>Backend: Schedule creado
    Backend-->>Frontend: {schedule}
    Frontend-->>Admin: "Cronograma creado"

    Note over User,MongoDB: Usuario consulta Schedule
    User->>Frontend: Navega a /schedule
    Frontend->>Backend: GET /schedule (current)
    Backend->>MongoDB: Query Schedule WHERE active=true
    Backend->>MongoDB: Populate activities
    MongoDB-->>Backend: Schedule completo
    Backend-->>Frontend: {schedule, activities[]}
    Frontend-->>User: Muestra timeline con fechas

    Note over User,MongoDB: Usuario ve progreso en Schedule
    Frontend->>Backend: GET /users/me/progress
    Backend->>MongoDB: Query ActivityCompletions del user
    Backend->>Backend: Calcula % completado por fecha
    MongoDB-->>Backend: Progress data
    Backend-->>Frontend: {completed, total, percentage}
    Frontend-->>User: Muestra barra de progreso
```

### Flujo PWA y Caché

```mermaid
flowchart TB
    A[Usuario accede a la app] --> B{Conexión?}
    B -->|Online| C[Service Worker intercepta request]
    B -->|Offline| D[Service Worker busca en caché]

    C --> E{Tipo de recurso?}
    E -->|Assets estáticos| F[Cache First Strategy]
    E -->|API calls| G[Network First Strategy]

    F --> H{En caché?}
    H -->|Sí| I[Sirve desde caché]
    H -->|No| J[Fetch de red + guarda en caché]

    G --> K[Intenta fetch de red]
    K --> L{Respuesta exitosa?}
    L -->|Sí| M[Actualiza caché + sirve]
    L -->|No| N[Sirve desde caché si existe]

    D --> O{Asset en caché?}
    O -->|Sí| P[Sirve desde caché offline]
    O -->|No| Q[Muestra página offline]

    I --> R[Usuario ve contenido]
    J --> R
    M --> R
    N --> R
    P --> R
    Q --> S[Usuario ve mensaje offline]
```

---

## ⚙️ Setup y Configuración

### Requisitos Previos

- **Node.js**: 18+
- **npm**: 9+
- **MongoDB**: Atlas account o local instance
- **Git**

### Configuración del Backend

1. **Clonar el repositorio**:

```bash
git clone https://github.com/bgonzalesbn/DCTIPass.git
cd DCTIPass/backend
```

2. **Instalar dependencias**:

```bash
npm install
```

3. **Configurar variables de entorno**:
   Crear archivo `.env` en la raíz del backend:

```env
# MongoDB
MONGODB_URI=mongodb+srv://user:password@cluster.mongodb.net/dctipass?retryWrites=true&w=majority

# JWT
JWT_SECRET=your-super-secret-jwt-key-change-in-production
JWT_EXPIRES_IN=1h

# Server
PORT=3000
NODE_ENV=development

# CORS
FRONTEND_URL=http://localhost:5173
```

4. **Iniciar servidor de desarrollo**:

```bash
npm run start:dev
```

Backend disponible en: `http://localhost:3000`

### Configuración del Frontend

1. **Navegar al directorio frontend**:

```bash
cd ../frontend
```

2. **Instalar dependencias**:

```bash
npm install
```

3. **Configurar variables de entorno**:
   Crear archivo `.env` en la raíz del frontend:

```env
VITE_API_URL=http://localhost:3000
VITE_APP_NAME=DCTIPass
```

4. **Iniciar servidor de desarrollo**:

```bash
npm run dev
```

Frontend disponible en: `http://localhost:5173`

### Scripts Útiles

#### Backend Scripts

```bash
# Desarrollo con hot-reload
npm run start:dev

# Build para producción
npm run build

# Producción
npm run start:prod

# Testing
npm run test
npm run test:watch
npm run test:cov

# Linting
npm run lint

# Formatear código
npm run format
```

#### Frontend Scripts

```bash
# Desarrollo
npm run dev

# Build para producción
npm run build

# Preview build de producción
npm run preview

# Linting
npm run lint
```

#### Utilidades de Base de Datos (Backend)

```bash
# Crear índices en MongoDB
node create-indexes.mjs

# Seed de badges
node seed-badges.js

# Verificar estado de BD
node verify-db.mjs

# Inspeccionar schedules
node inspect-schedules.mjs

# Limpiar colecciones (desarrollo)
node cleanup-db.mjs
```

### Configuración de MongoDB

#### Índices Requeridos

Ejecutar el script de creación de índices:

```bash
cd backend
node create-indexes.mjs
```

Esto creará todos los índices necesarios listados en la sección de [Modelo de Base de Datos](#-modelo-de-base-de-datos).

#### Seed de Datos Iniciales

1. **Crear badges/stickers**:

```bash
node seed-badges.js
```

2. **Crear usuarios de prueba**:

```bash
node create-test-users.mjs
```

3. **Verificar datos**:

```bash
node verify-db.mjs
```

---

## 🚀 Deployment

### Backend - Render

1. **Crear nuevo Web Service en Render**
2. **Conectar repositorio de GitHub**
3. **Configurar Build**:
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npm run start:prod`
   - **Environment**: Node

4. **Variables de entorno**:

   ```
   MONGODB_URI=<MongoDB Atlas URI>
   JWT_SECRET=<Production JWT Secret>
   JWT_EXPIRES_IN=1h
   NODE_ENV=production
   FRONTEND_URL=<Vercel Frontend URL>
   ```

5. **Deploy automático**: Push a `main` branch

### Frontend - Vercel

1. **Importar proyecto desde GitHub**
2. **Configurar Framework**: Vite
3. **Build Settings**:
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
   - **Install Command**: `npm install`

4. **Variables de entorno**:

   ```
   VITE_API_URL=<Render Backend URL>
   VITE_APP_NAME=DCTIPass
   ```

5. **PWA Configuration**:
   - Vercel automáticamente sirve el Service Worker
   - HTTPS automático (requerido para PWA)

6. **Deploy automático**: Push a `main` branch

### MongoDB Atlas

1. **Crear cluster**:
   - Tier: M0 (Free) para desarrollo
   - M10+ para producción
   - Región: Closest to backend

2. **Configurar acceso**:
   - Database Access: Crear usuario con permisos readWrite
   - Network Access: Añadir IP de Render o permitir 0.0.0.0/0

3. **Connection String**:
   ```
   mongodb+srv://<user>:<password>@cluster.mongodb.net/<dbname>?retryWrites=true&w=majority
   ```

### Verificación Post-Deploy

#### Health Checks

```bash
# Backend health
curl https://your-backend.onrender.com/health

# Frontend
curl https://your-frontend.vercel.app

# Test login
curl -X POST https://your-backend.onrender.com/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"test123"}'
```

#### PWA Lighthouse Audit

1. Abrir DevTools en producción
2. Lighthouse tab
3. Run audit (PWA + Performance)
4. Objetivo: Score ≥ 90

---

## 📝 Documentos Adicionales

- [Modelo de Datos MongoDB](./docs/02_MODELO_DATOS_MONGODB.md)
- [Guía de Autenticación y Endpoints](./docs/03_FASE3_AUTENTICACION_ENDPOINTS.md)
- [Roadmap del Proyecto](./docs/ROADMAP.md)
- [Guía de Performance](./PERFORMANCE_DIAGNOSTICS.md)
- [Guía de Optimización PWA](./PWA_OPTIMIZATION_GUIDE.md)
- [Guía de Testing de Carga](./LOAD_TEST_GUIDE.md)

---

## 🤝 Contribución

1. Fork el proyecto
2. Crear feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a branch (`git push origin feature/AmazingFeature`)
5. Abrir Pull Request

---

## 📄 Licencia

Este proyecto es privado y pertenece a la organización. Todos los derechos reservados.

---

## 👥 Equipo

Desarrollado por el equipo de DCTI - Banco Nacional de Costa Rica

---

## 📞 Soporte

Para soporte y preguntas, contactar al equipo de desarrollo en: [soporte@bn.cr](mailto:soporte@bn.cr)

---

**Última actualización**: Febrero 2026

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
