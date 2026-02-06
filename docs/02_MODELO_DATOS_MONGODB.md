# Etapa 2: Modelo de Datos MongoDB - Documentación Técnica

## 📊 Visión General del Modelo de Datos

El modelo de datos sigue principios RDBMS normalizados en MongoDB, con énfasis en:

- **Integridad**: Índices únicos, validadores de esquema
- **Transacciones**: MongoDB replica set transactions para operaciones críticas
- **Performance**: Índices compuestos, denormalización estratégica
- **Seguridad**: Hash de contraseña con Argon2id, MFA soportado

## 🗂️ Colecciones y Relaciones

```
┌──────────────┐
│   users      │ (1 empleado = 1 usuario)
├──────────────┤
│ _id: ObjectId│ UNIQUE
│ employeeNum  │ UNIQUE, indexed
│ email        │ UNIQUE, indexed, lowercase
│ firstName    │
│ lastName     │
│ hobbies      │ nullable
│ active       │ soft-delete flag
└──────────────┘
        │
        ├─ 1:1 ──→ ┌──────────────────────┐
        │          │  auth_credentials    │ (Credenciales de autenticación)
        │          ├──────────────────────┤
        │          │ userId (FK, UNIQUE)  │
        │          │ passwordHash         │ Argon2id hashed
        │          │ passwordAlgo         │ (argon2id | bcrypt)
        │          │ passwordParams       │ {memoryCost, timeCost, ...}
        │          │ passwordVersion      │
        │          │ failedAttempts       │ Lockout tracking
        │          │ lockoutUntil         │ fecha del bloqueo
        │          │ lastLoginAt          │
        │          │ mfaEnabled           │
        │          │ mfaSecret            │ encrypted
        │          └──────────────────────┘
        │
        ├─ N:N ──→ ┌──────────────────────┐
        │          │  group_memberships   │ (Users in Groups)
        │          ├──────────────────────┤
        │          │ userId (FK)          │ Compound unique
        │          │ groupId (FK)         │ with userId
        │          │ assignedAt           │
        │          └──────────────────────┘
        │                   │
        │                   └─ FK ──→ ┌──────────────┐
        │                             │   groups     │
        │                             ├──────────────┤
        │                             │ _id: ObjectId│
        │                             │ name         │ UNIQUE
        │                             │ capacityMax  │ (default: 20)
        │                             │ shift        │ (Morning|Afternoon)
        │                             │ active       │
        │                             └──────────────┘
        │
        ├─ N ──→  ┌──────────────────────────┐
        │         │  activity_completions    │ (User completed Activity)
        │         ├──────────────────────────┤
        │         │ userId (FK)              │ Compound unique
        │         │ activityId (FK)          │ (previene duplicados)
        │         │ groupId (FK)             │
        │         │ scheduleId (FK, nullable)│
        │         │ completedAt              │
        │         └──────────────────────────┘
        │                   │
        │                   └─ FK ──→ ┌──────────────┐
        │                             │  activities  │
        │                             ├──────────────┤
        │                             │ _id: ObjectId│
        │                             │ name         │ UNIQUE
        │                             │ stickerId(FK)│ UNIQUE (1:1)
        │                             │ active       │
        │                             └──────────────┘
        │                                     │
        │                                     └─ FK ──→ ┌──────────────┐
        │                                               │   stickers   │
        │                                               ├──────────────┤
        │                                               │ _id: ObjectId│
        │                                               │ name         │ UNIQUE
        │                                               │ imageUrl     │
        │                                               │ active       │
        │                                               └──────────────┘
        │
        └─ N ──→  ┌──────────────────────┐
                  │   sticker_awards     │ (User earned Sticker)
                  ├──────────────────────┤
                  │ userId (FK)          │ Compound unique
                  │ stickerId (FK)       │ (no duplicados por user)
                  │ activityCompletionId │ FK
                  │ awardedAt            │
                  └──────────────────────┘


Schedule:
  ┌──────────────────┐
  │    schedule      │ (Cronograma normalizado)
  ├──────────────────┤
  │ groupId (FK)     │ Compound unique
  │ activityId (FK)  │ (grupo, fecha, tiempo)
  │ date (medianoche)│
  │ startTime        │
  │ endTime          │
  │ order            │
  └──────────────────┘
```

## 📋 Esquemas Detallados

### 1. users

```javascript
{
  _id: ObjectId,
  employeeNumber: String|Int (UNIQUE, REQ) - ID corporativo
  firstName: String (REQ)
  lastName: String (REQ)
  hobbies: String (nullable)
  email: String (UNIQUE, REQ, lowercase)
  active: Boolean (REQ, default: true)
  authProviderId: String (nullable) - para OAuth futura
  createdAt: Date (auto)
  updatedAt: Date (auto)
  deletedAt: Date (nullable, soft-delete)
}

Índices:
- { employeeNumber: 1, unique: true }
- { email: 1, unique: true }
- { active: 1 }
- { deletedAt: 1 }

Reglas:
- email en lowercase para búsquedas case-insensitive
- active = false actúa como soft-delete lógico
- deletedAt timestamp para auditoría
```

### 2. auth_credentials (1:1 con users)

```javascript
{
  _id: ObjectId,
  userId: ObjectId (REQ, UNIQUE, FK→users)

  // Password hashing
  passwordHash: String (REQ) - hash Argon2id
  passwordSalt: String (deprecated en Argon2, incluido en hash)
  passwordAlgo: Enum (REQ) - "argon2id" | "bcrypt"
  passwordParams: Object (REQ)
    - Argon2id: { memoryCost: 19456, timeCost: 2, parallelism: 1 }
    - Bcrypt: { costFactor: 10 }
  passwordVersion: Int (REQ, default: 1) - para upgrade de algo
  passwordUpdatedAt: Date (REQ) - último cambio

  // Brute-force protection
  failedAttempts: Int (REQ, default: 0)
  lockoutUntil: Date (nullable) - hasta cuándo está bloqueado

  // Login tracking
  lastLoginAt: Date (nullable)
  lastLoginIp: String (nullable)

  // MFA (futuro)
  mfaEnabled: Boolean (REQ, default: false)
  mfaMethod: String (nullable) - "totp" | "sms" | "email"
  mfaSecret: String (nullable) - encrypted

  createdAt: Date (auto)
  updatedAt: Date (auto)
  deletedAt: Date (nullable)
}

Índices:
- { userId: 1, unique: true }
- { lockoutUntil: 1 } - para queries de desbloqueo
- { lastLoginAt: -1 } - para analítica

Reglas de Brute-Force:
- Max 5 intentos fallidos
- Lockout: 15 minutos
- Reset fallidos: login exitoso
```

### 3. stickers (insignias)

```javascript
{
  _id: ObjectId,
  name: String (UNIQUE, REQ) - ej: "Ninja JavaScript"
  imageUrl: String (nullable) - URL a imagen (S3/CDN)
  active: Boolean (REQ, default: true)
  createdAt: Date (auto)
  updatedAt: Date (auto)
  deletedAt: Date (nullable)
}

Índices:
- { name: 1, unique: true }
- { active: 1 }

Cardinalidad:
- 1:1 ← activities
- N ← sticker_awards (User → Sticker, sin duplicados)
```

### 4. activities

```javascript
{
  _id: ObjectId,
  name: String (UNIQUE, REQ) - ej: "Implementar Promise"
  stickerId: ObjectId (REQ, UNIQUE, FK→stickers)
    - UNIQUE = cada actividad tiene exactamente 1 sticker
    - previene que stickers se compartan
  active: Boolean (REQ, default: true)
  createdAt: Date (auto)
  updatedAt: Date (auto)
  deletedAt: Date (nullable)
}

Índices:
- { name: 1, unique: true }
- { stickerId: 1, unique: true } - enforce 1:1
- { active: 1 }

Relación 1:1:
- Garantizado por índice unique en stickerId
- Si intentas insertar 2 activities con mismo sticker → error
```

### 5. groups

```javascript
{
  _id: ObjectId,
  name: String (UNIQUE, REQ) - ej: "Grupo A - Turno Mañana"
  capacityMax: Int (REQ, default: 20, min: 1)
    - máximo de miembros
    - validación: capacityMax >= 1
  shift: Enum (REQ) - "Morning" | "Afternoon"
  active: Boolean (REQ, default: true)
  createdAt: Date (auto)
  updatedAt: Date (auto)
  deletedAt: Date (nullable)
}

Índices:
- { name: 1, unique: true }
- { active: 1 }
- { shift: 1 }

Regla Capacidad:
- En service: contar GROUP_MEMBERSHIPS activos
- Si count >= capacityMax → rechazar nueva asignación
```

### 6. group_memberships (N:N Users ↔ Groups)

```javascript
{
  _id: ObjectId,
  userId: ObjectId (REQ, FK→users)
  groupId: ObjectId (REQ, FK→groups)
  assignedAt: Date (REQ) - cuándo se asignó
  createdAt: Date (auto)
  updatedAt: Date (auto)
  deletedAt: Date (nullable, soft-delete)
}

Índices:
- { userId: 1, groupId: 1, unique: true }
  - previene duplicados (user no puede estar 2x en mismo group)
- { groupId: 1 } - queries "obtener miembros del grupo"
- { userId: 1 } - queries "obtener grupos del usuario"

Transacción en inserción:
1. Contar miembros actuales de groupId
2. SI count >= capacityMax → abort
3. ELSE → insertar membership
4. COMMIT

Soft-Delete:
- deletedAt = timestamp → usuario removido
- queries siempre filtran deletedAt: null
```

### 7. schedule

```javascript
{
  _id: ObjectId,
  groupId: ObjectId (REQ, FK→groups)
  activityId: ObjectId (REQ, FK→activities)
  date: Date (REQ, medianoche UTC) - fecha de la actividad
    - se guarda como midnight (00:00:00 UTC)
    - permite queries por fecha sin problemas
  startTime: String (REQ, formato HH:mm) - ej: "09:00"
  endTime: String (REQ, formato HH:mm) - ej: "10:30"
  order: Int (REQ) - orden secuencial en el día (1, 2, 3...)
  createdAt: Date (auto)
  updatedAt: Date (auto)
  deletedAt: Date (nullable)
}

Índices:
- { groupId: 1, date: 1, startTime: 1, endTime: 1, unique: true }
  - previene schedules solapados en mismo grupo
- { date: 1, groupId: 1 } - queries por día/grupo
- { groupId: 1, date: 1, startTime: 1 } - búsquedas por rango horario
- { groupId: 1, order: 1 } - ordenamiento secuencial

Validación en upsert:
- Al insertar/actualizar, verificar no haya solapamiento de horario
- ej: si existe (groupId, date, 09:00-10:00),
      no permitir (groupId, date, 09:30-11:00)
```

### 8. activity_completions

```javascript
{
  _id: ObjectId,
  userId: ObjectId (REQ, FK→users)
  activityId: ObjectId (REQ, FK→activities)
  groupId: ObjectId (REQ, FK→groups)
  scheduleId: ObjectId (nullable, FK→schedule)
    - si se completó desde un schedule específico
    - nullable si se completa manualmente
  completedAt: Date (REQ) - timestamp de finalización
  createdAt: Date (auto)
  updatedAt: Date (auto)
  deletedAt: Date (nullable)
}

Índices:
- { userId: 1, activityId: 1, unique: true }
  - previene duplicados (user solo puede completar 1x activity)
- { userId: 1 } - "obtener activities completadas por user"
- { activityId: 1 } - "quién completó esta activity"
- { groupId: 1 } - queries por grupo
- { completedAt: -1 } - para analítica (últimas completadas)

Transacción (ver activity-completion.service.ts):
1. Verificar activity existe
2. Verificar user NO ha completado ya
3. Obtener sticker de la activity
4. Crear activity_completion
5. Crear sticker_award (sin duplicados)
6. COMMIT (o ABORT si duplicado)
```

### 9. sticker_awards

```javascript
{
  _id: ObjectId,
  userId: ObjectId (REQ, FK→users)
  stickerId: ObjectId (REQ, FK→stickers)
  activityCompletionId: ObjectId (REQ, FK→activity_completions)
  awardedAt: Date (REQ) - cuándo se otorgó
  createdAt: Date (auto)
  updatedAt: Date (auto)
  deletedAt: Date (nullable)
}

Índices:
- { userId: 1, stickerId: 1, unique: true }
  - previene que user tenga 2x el mismo sticker
  - transacción garantiza esto, pero índice añade safety layer
- { userId: 1, awardedAt: -1 } - "stickers de user, ordenados por reciente"
- { stickerId: 1 } - "quién tiene este sticker"
- { awardedAt: -1 } - para leaderboards

Operaciones garantizadas:
- User solo puede ganar 1 sticker por activity
- Índice unique previene inserciones duplicadas
- Si concurren 2 requests completando mismo activity
  → 1 gana, otra recibe error (manejado en service)
```

## 🔐 Seguridad

### Hash de Contraseña: Argon2id

**¿Por qué Argon2id sobre bcrypt?**

| Aspecto                 | Argon2id    | Bcrypt        |
| ----------------------- | ----------- | ------------- |
| NIST 2023 recomendado   | ✅          | ⚠️ Antiguo    |
| Resistencia GPU attacks | ✅ Sí       | ❌ No         |
| Memory hard             | ✅ 19.5MB   | ❌ No         |
| Configurable            | ✅ Sí       | ⚠️ costFactor |
| Velocidad               | ~100ms/hash | ~200ms/hash   |

**Implementación**:

```typescript
const argon2Options = {
  type: argon2.argon2id,
  memoryCost: 19456, // ~19 MB (OWASP minimum)
  timeCost: 2,
  parallelism: 1,
};

const hash = await argon2.hash(password, argon2Options);
const isValid = await argon2.verify(hash, plainPassword);
```

### Brute-Force Protection

```javascript
// En AuthCredentialService.recordFailedAttempt()
if (failedAttempts >= 5) {
  lockoutUntil = now + 15 minutes
  // Usuario no puede login hasta lockoutUntil > now
}

// En login:
if (lockoutUntil && lockoutUntil > now) {
  throw "Account locked. Try again in 15 min"
}

// En login exitoso:
failedAttempts = 0
lockoutUntil = null
lastLoginAt = now
lastLoginIp = req.ip
```

### MFA (Future-Proof)

```javascript
// Campos en auth_credentials:
mfaEnabled: Boolean (default: false)
mfaMethod: "totp" | "sms" | "email"
mfaSecret: encrypted_string
```

## 📈 Índices y Performance

### Índices por Use Case

| Colección            | Índice                           | Razón                       |
| -------------------- | -------------------------------- | --------------------------- |
| users                | {email:1}                        | Login, búsqueda de usuario  |
| users                | {employeeNumber:1}               | Búsqueda por ID corporativo |
| auth_credentials     | {lockoutUntil:1}                 | Desbloqueo automático       |
| group_memberships    | {groupId:1, userId:1}            | Queries N:N                 |
| activity_completions | {userId:1, activityId:1}         | Prevenir duplicados         |
| sticker_awards       | {userId:1, stickerId:1}          | Prevenir duplicados         |
| schedule             | {groupId:1, date:1, startTime:1} | Búsquedas por rango         |

### Cardinalidad Esperada

```
users: ~1000 (empleados)
groups: ~50 (grupos de turno)
activities: ~200 (ejercicios)
stickers: ~100 (insignias)
group_memberships: ~2000 (usuarios × grupos)
schedule: ~50,000 (50 actividades × 50 grupos × 20 días)
activity_completions: ~100,000 (usuarios haciendo actividades)
sticker_awards: ~100,000 (stickers ganados)
```

## 🔄 Transacciones MongoDB

### Transacción: Completar Activity & Otorgar Sticker

```javascript
const session = await db.startSession();
session.startTransaction();

try {
  // Paso 1: Verificar activity existe
  const activity = await activities.findById(id).session(session);

  // Paso 2: Verificar NO completada
  const existing = await completions
    .findOne({ userId, activityId })
    .session(session);
  if (existing) throw new Error("Already completed");

  // Paso 3: Crear completion
  const completion = await completions.insertOne({...}).session(session);

  // Paso 4: Crear award (transaccional)
  const award = await awards.insertOne({...}).session(session);

  await session.commitTransaction();
} catch (e) {
  await session.abortTransaction();
  throw e;
} finally {
  await session.endSession();
}
```

### Transacción: Agregar User a Group

```javascript
// En GroupMembershipService.addUserToGroup()
// SIN session explícita (NestJS maneja el contexto)
// Pero seguimos estos pasos atómicos:

1. Fetch group (obtener capacityMax)
2. Count miembros actuales (deletedAt: null)
3. IF count >= capacityMax → throw
4. ELSE → insertOne membership (unique índice maneja duplicados)
```

## ⚡ Soft Deletes

Todas las colecciones tienen campo `deletedAt: Date|null`.

**Convención**:

```javascript
// Listar activos
db.users.find({ deletedAt: null });

// Listar todos (incluyendo borrados)
db.users.find({});

// Borrar lógico
db.users.updateOne({ _id }, { deletedAt: Date.now() });

// Restaurar
db.users.updateOne({ _id }, { deletedAt: null });

// Purga física (cuidado!)
db.users.deleteOne({ _id });
```

## 🧪 Testing

Ver `backend/src/database/mongo.test.ts` para setup de MongoDB Memory Server en tests.

```typescript
// En test setup:
beforeAll(async () => {
  const mongoUri = await mongooseModuleOptions();
  // Usa MongoDB en memoria
});

afterAll(async () => {
  await closeInMongodConnection();
});
```

## 📝 Notas de Implementación

1. **ObjectId**: Mongoose convierte automáticamente strings a ObjectId en refs
2. **Indexación**: Aplicar después de deployment (no bloquea reads)
3. **Versionado de Schema**: passwordVersion permite upgrade de algos futuro
4. **Timezone**: Todas las fechas en UTC (JavaScript Date)
5. **Validación**: usar class-validator en DTOs + schema validation en Mongoose

---

**Etapa 2 ✅ Completada**

→ Siguiente: [Fase 3: Autenticación Completa](#)
