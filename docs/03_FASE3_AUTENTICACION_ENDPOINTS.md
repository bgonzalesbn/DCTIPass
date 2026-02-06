# Fase 3: Autenticación & Endpoints MVP - Completado ✅

## Resumen de Implementación

Se ha completado la Fase 3 del proyecto IT Experience MVP con todos los endpoints de autenticación, autorización, y manejo de recursos clave.

## Arquitectura de Autenticación

### JWT Guard & Decorators

- **JwtAuthGuard**: Guard reutilizable que valida JWT + @Public() decorator
- **@CurrentUser()**: Decorator para extraer usuario del JWT
- **@Public()**: Decorator para marcar rutas públicas (register, login, etc.)
- Localización: `src/modules/auth/guards/jwt.guard.ts`

### JWT Strategy

- Implementa Passport JWT Strategy
- Extrae token de Authorization: Bearer header
- Localización: `src/modules/auth/strategies/jwt.strategy.ts`

## Endpoints Implementados

### Autenticación (`/auth`)

#### POST `/auth/register` (Public)

```
Req: RegisterDto { email, employeeNumber, firstName, lastName, password }
Res: { accessToken, refreshToken, expiresIn }
- Crea usuario + auth_credentials en transacción
- Hash Argon2id automático
- Cookie HttpOnly RefreshToken (web)
```

#### POST `/auth/login` (Public)

```
Req: LoginDto { email, password }
Res: { accessToken, refreshToken, expiresIn }
- Valida brute-force (5 intentos → 15min lockout)
- JWT + HttpOnly cookie
- Soporta Web (cookie) y Mobile (body token)
```

#### POST `/auth/refresh` (Public)

```
Req: RefreshTokenDto { refreshToken }  OR Cookie
Res: { accessToken, refreshToken, expiresIn }
- Rota token refresh automático
- Actualiza HttpOnly cookie
```

#### POST `/auth/logout` (Protected)

```
Req: -
Res: { message: "Logged out successfully" }
- Limpia HttpOnly cookie
- TODO: Blacklist token opcional
```

### Usuarios (`/users`)

#### GET `/users/me` (Protected)

```
Res: UserProfileDto {
  id, email, employeeNumber, firstName, lastName,
  groups: [{ id, name }],
  progress: {
    activitiesCompleted: number,
    totalActivities: number,
    stickerCount: number
  }
}
- Retorna perfil completo con agregación de progreso
```

#### GET `/users/:id/profile` (Protected)

```
Res: UserProfileDto (igual a /me con diferente usuario)
```

#### GET `/users/:id` (Protected)

```
Res: User documento básico
```

### Grupos (`/groups`)

#### GET `/groups` (Protected)

```
Res: Group[]
- Retorna todos los grupos activos
```

#### GET `/groups/my-groups` (Protected)

```
Res: GroupMembership[]
- Retorna grupos del usuario autenticado
```

#### GET `/groups/:id` (Protected)

```
Res: Group
- Retorna grupo específico
```

#### POST `/groups/:id/assign` (Protected)

```
Req: AssignGroupDto { userId }
Res: GroupMembership
- Asigna usuario a grupo con validación de capacidad
- Transacción: verificación + inserción atómica
```

### Schedule (`/schedule`)

#### GET `/schedule?groupId=:id&date=:date` (Protected)

```
Res: Schedule[]
- Retorna bloques de actividades para grupo + fecha
- Soporta rango: ?startDate=&endDate=
- Sin query: retorna schedule de hoy para grupos del usuario
```

### Actividades (`/activities`)

#### GET `/activities/active` (Protected)

```
Res: Activity[] (con populate sticker)
- Retorna actividades activas de los grupos del usuario
```

#### GET `/activities/:id` (Protected)

```
Res: Activity (con populate sticker)
- Retorna actividad específica
```

#### POST `/activities/:id/attempt` (Protected)

```
Req: AttemptActivityDto { groupId?, scheduleId? }
Res: { completion, award }
- Transacción idempotente:
  1. Verifica actividad + usuario
  2. Valida que no exista completion previa
  3. Obtiene sticker asociado
  4. Crea ActivityCompletion
  5. Crea StickerAward (upsert)
  6. Commit atómico
```

### Badges/Stickers (`/badges`)

#### GET `/badges/mine` (Protected)

```
Res: {
  earned: number,
  total: number,
  badges: [{
    id, name, description, icon,
    isEarned: boolean,
    earnedAt?: Date
  }]
}
- Retorna todas las insignias con estado de usuario
```

#### GET `/badges` (Protected)

```
Res: Sticker[]
- Retorna todas las insignias disponibles
```

## DTOs Implementados

### Auth DTOs

```typescript
RegisterDto: { email, employeeNumber, firstName, lastName?, password }
LoginDto: { email, password }
RefreshTokenDto: { refreshToken }
AuthResponseDto: { accessToken, refreshToken, expiresIn }
UserProfileDto: { id, email, employeeNumber, firstName, lastName, groups, progress }
LogoutDto: { message }
```

### Group DTOs

```typescript
CreateGroupDto: { name, description?, capacityMax? }
AssignGroupDto: { userId }
```

### Activity DTOs

```typescript
AttemptActivityDto: { groupId?, scheduleId? }
```

## Seguridad Implementada

### Autenticación

- ✅ JWT con secret configurable
- ✅ Refresh token rotation (30 días)
- ✅ HttpOnly, Secure, SameSite cookies para web
- ✅ Bearer token para mobile

### Autorización

- ✅ JwtAuthGuard en todos los endpoints protegidos
- ✅ @Public() decorator para rutas abiertas
- ✅ @CurrentUser() para extraer user del JWT

### Protección contra Ataques

- ✅ Brute-force: 5 intentos → 15min lockout
- ✅ Argon2id hashing (19.5MB memory, 2 time cost)
- ✅ Email en lowercase para evitar duplicados
- ✅ Única (userId, stickerId) en awards para idempotencia

### CORS

- ✅ Configurable via ENV
- ✅ Credentials enabled
- ✅ Soporta múltiples orígenes

## Servicios & Transacciones

### AuthService

```
+ register(RegisterDto): AuthResponseDto
+ login(LoginDto): AuthResponseDto
+ refreshToken(token): AuthResponseDto
+ validateJwt(token): payload
- generateTokens(userId, email): AuthResponseDto
```

### AuthCredentialService

```
+ createCredentials(userId, password)
+ verifyPassword(hash, plain): boolean
+ recordFailedAttempt(userId): lockoutUntil?
+ recordSuccessfulLogin(userId, ip)
+ isLockedOut(userId): boolean
+ getByUserId(userId): AuthCredential
+ updatePassword(userId, newPassword)
```

### UsersService

```
+ getProfile(userId): UserProfileDto
+ findById(userId): User
+ findByEmail(email): User
```

### GroupsService & GroupMembershipService

```
GroupsService:
+ findAll(): Group[]
+ findById(id): Group
+ create(data): Group

GroupMembershipService:
+ getUserGroups(userId): GroupMembership[]
+ addMember(groupId, memberId): Transacción con capacidad
+ getGroupMembers(groupId): User[]
+ getGroupMemberCount(groupId): number
+ isUserInGroup(userId, groupId): boolean
```

### ScheduleService

```
+ getScheduleByDate(groupId, date): Schedule[]
+ getScheduleByDateRange(groupId, start, end): Schedule[]
+ getTodaySchedule(userId): Schedule[]
```

### ActivitiesService & ActivityCompletionService

```
ActivitiesService:
+ findAll(): Activity[]
+ findById(id): Activity
+ getActiveForUser(userId): Activity[]

ActivityCompletionService:
+ completeActivityAndAwardSticker(userId, activityId, groupId?, scheduleId?): Transacción
  - MongoDB session para atomicidad
  - Upsert completion + award
```

### StickersService

```
+ findAll(): Sticker[]
+ getUserBadges(userId): { earned, total, badges }
```

## Validaciones Implementadas

- ✅ Email: UNIQUE, lowercase, validator @IsEmail()
- ✅ EmployeeNumber: UNIQUE, @MinLength(3)
- ✅ Password: @MinLength(8), Argon2id hash
- ✅ Schedule: No overlaps (composite index groupId+date+startTime)
- ✅ Groups: Capacity validation via service logic
- ✅ Activities: stickerId UNIQUE (1:1 constraint)
- ✅ Awards: Unique (userId, stickerId) para idempotencia

## Configuración

### Environment Variables (.env.example)

```env
MONGODB_URI=...
JWT_SECRET=...
JWT_REFRESH_SECRET=...
JWT_EXPIRATION=7d
CORS_ORIGIN=http://localhost:3001,http://localhost:5000
NODE_ENV=development
LOG_LEVEL=debug
...
```

### Módulos Nest

- AuthModule: JWT, Passport, Auth Service
- UsersModule: User Service & Controller
- GroupsModule: Group & GroupMembership Services
- SchedulesModule: Schedule Service & Controller
- ActivitiesModule: Activity & Activity Completion Services
- StickersModule: Sticker Service & Controller

## Archivos Creados

### Guards & Decorators

- `src/auth/guards/jwt.guard.ts`
- `src/auth/strategies/jwt.strategy.ts`
- `src/common/decorators/public.decorator.ts`
- `src/common/decorators/current-user.decorator.ts`

### Controllers

- `src/modules/auth/auth.controller.ts` (actualizado)
- `src/modules/users/users.controller.ts` (actualizado)
- `src/modules/groups/groups.controller.ts` (creado)
- `src/modules/schedules/schedule.controller.ts` (creado)
- `src/modules/activities/activities.controller.ts` (creado)
- `src/modules/activities/stickers.controller.ts` (creado)

### Services

- `src/modules/auth/auth.service.ts` (actualizado)
- `src/modules/auth/auth-credential.service.ts` (actualizado)
- `src/modules/users/users.service.ts` (actualizado)
- `src/modules/groups/groups.service.ts` (creado)
- `src/modules/groups/group-membership.service.ts` (actualizado)
- `src/modules/schedules/schedule.service.ts` (creado)
- `src/modules/activities/activities.service.ts` (creado)
- `src/modules/activities/activity-completion.service.ts` (actualizado)
- `src/modules/activities/stickers.service.ts` (creado)

### DTOs

- `src/modules/auth/dto/auth.dto.ts` (actualizado)
- `src/modules/groups/dto/group.dto.ts` (creado)
- `src/modules/activities/dto/activity.dto.ts` (actualizado)

### Configuración

- `.env.example` (actualizado)
- `src/modules/auth/auth.module.ts` (actualizado)

## Próximos Pasos (Fase 4)

- [ ] Rate limiting (@nestjs/throttler)
- [ ] Logging estructurado (Pino/Winston)
- [ ] OpenAPI/Swagger documentation
- [ ] Admin CRUD endpoints
- [ ] Email verification
- [ ] Password reset flow
- [ ] User roles & permissions
- [ ] Audit logs
- [ ] Analytics

## Testing Checklist

```bash
# Backend debe compilar
npm run build ✅

# Endpoints a probar:
POST   /auth/register       - Crear usuario
POST   /auth/login          - Loguearse
POST   /auth/refresh        - Renovar token
POST   /auth/logout         - Logout
GET    /users/me            - Perfil
GET    /groups              - Listar grupos
POST   /groups/:id/assign   - Asignar usuario
GET    /schedule?...        - Ver schedule
GET    /activities/active   - Actividades disponibles
POST   /activities/:id/attempt - Completar actividad
GET    /badges/mine         - Ver insignias ganadas
```

## Status: ✅ FASE 3 COMPLETADA

Todos los endpoints de Fase 3 están implementados y compilando sin errores.
Backend listo para testear e integrar con frontend.
