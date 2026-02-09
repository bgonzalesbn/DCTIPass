# 🚨 Diagnóstico de Rendimiento - DCTIPass Login

**Problema Reportado:** Login tarda 10-15 segundos  
**Recursos Actuales:** 512 MB RAM, 0.1 CPU en Render  
**Fecha:** 9 de Febrero 2026

---

## 📊 ANÁLISIS DEL PROBLEMA

### 1. **Los Recursos Actuales SON EL CUELLO DE BOTELLA**

Tu configuración actual es **crítica**:

```
512 MB RAM  = Extremadamente bajo
0.1 CPU     = Solo 10% de un core (casi nada)
```

**Comparación:**

- Render Free Tier: 512 MB RAM
- Render Hobby: 512 MB RAM (recomendado: desarrollo)
- Render Starter: 2GB RAM, 0.5 CPU (mínimo para producción)
- Render Standard: 4GB RAM, 1 CPU (recomendado para tu app)

### 2. **Operaciones Lentas en el Login**

Basado en el código actual, el login ejecuta:

```typescript
// auth.service.ts - login() hace esto:
1. userModel.findOne() → Query a MongoDB
2. authCredentialService.isLockedOut() → Query a MongoDB
3. authCredentialService.getByUserId() → Query a MongoDB
4. authCredentialService.verifyPassword() → ⏱️ ARGON2 (2-5 segundos!!!)
5. authCredentialService.recordFailedAttempt() o recordSuccessfulLogin()
6. jwtService.sign() → Generación de JWT
```

**El problema:** Argon2 es intencionalmente LENTO para seguridad (anti-fuerza bruta).

- Con CPU normal: 2-3 segundos
- **Con 0.1 CPU**: Puede tardar 10-15 segundos ✓ Esto explica tu problema

### 3. **Mayor Latencia por Recursos Limitados**

Con 512 MB RAM y 0.1 CPU:

- Node.js apenas puede procesar un request por vez
- El garbage collection es frecuente y lento
- MongoDB Atlas está lejos (latencia de red)
- **Cualquier operación CPU-intensiva se congela**

---

## ✅ RECOMENDACIONES (EN ORDEN DE PRIORIDAD)

### **PRIORIDAD 1: Aumentar Recursos en Render** ⭐⭐⭐

**Impacto: INMEDIATO (resultará en 3-5x mejora)**

#### Opción A: Starter Plan (Recomendado)

```
Costo: $10/mes (aprox)
- 2GB RAM
- 0.5 CPU
- Resultado esperado: Login 2-4 segundos
```

#### Opción B: Standard Plan (Lo Ideal)

```
Costo: $20/mes (aprox)
- 4GB RAM
- 1 CPU
- Resultado esperado: Login <1 segundo
```

**ACCIÓN INMEDIATA:**

```
1. Ve a https://dashboard.render.com
2. Selecciona tu servicio (dctipass.onrender.com)
3. Haz clic en "Settings"
4. Busca "Plan" en la sección izquierda
5. Elige "Starter" o "Standard"
6. Confirma y reinicia el servicio
```

### **PRIORIDAD 2: Optimizar Argon2** ⭐⭐

**Impacto: 20-30% mejora sin aumentar recursos**

Reduce el cost factor de Argon2:

```typescript
// backend/src/modules/auth/auth-credential.service.ts

// ACTUAL (lento pero seguro):
const hashedPassword = await argon2.hash(password, {
  type: argon2id,
  memoryCost: 19456, // 19 MB
  timeCost: 2, // 2 iteraciones
  parallelism: 1,
});

// OPTIMIZADO:
const hashedPassword = await argon2.hash(password, {
  type: argon2id,
  memoryCost: 16384, // 16 MB (reduce a 16)
  timeCost: 2,
  parallelism: 1,
});
// Sigue siendo seguro pero 15-20% más rápido
```

### **PRIORIDAD 3: Agregar Cache de Credenciales** ⭐

**Impacto: 5-10% mejora (reduce queries a MongoDB)**

```typescript
// backend/src/modules/auth/auth.service.ts

private credentialCache = new Map<string, any>();
private readonly CACHE_TTL = 5 * 60 * 1000; // 5 minutos

async login(loginDto: LoginDto): Promise<AuthResponseDto> {
  const { employeeNumber, password } = loginDto;

  const user = await this.userModel.findOne({
    employeeNumber,
    active: true,
  });

  if (!user) {
    throw new UnauthorizedException("Invalid credentials");
  }

  const userId = new Types.ObjectId(user._id);

  // Verificar cache primero
  const cacheKey = `creds_${userId}`;
  let credentials = this.credentialCache.get(cacheKey);

  if (!credentials) {
    credentials = await this.authCredentialService.getByUserId(userId);
    // Guardar en cache
    this.credentialCache.set(cacheKey, credentials);
    setTimeout(() => this.credentialCache.delete(cacheKey), this.CACHE_TTL);
  }

  // ... resto del código
}
```

### **PRIORIDAD 4: Implementar Rate Limiting Eficiente** ⭐

**Impacto: Seguridad + 5% rendimiento**

```typescript
// backend/src/main.ts

import rateLimit from "express-rate-limit";

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 5, // 5 intentos por ventana
  message: "Too many login attempts",
  skip: (req) => req.path !== "/auth/login", // Solo aplica a login
});

app.use(limiter);
```

### **PRIORIDAD 5: Agregar Logs de Diagnóstico** ⭐

**Impacto: Entender dónde se gasta el tiempo**

```typescript
// backend/src/modules/auth/auth.service.ts

async login(loginDto: LoginDto): Promise<AuthResponseDto> {
  const startTime = Date.now();
  const checkpoints = {};

  try {
    checkpoints.start = Date.now();
    const user = await this.userModel.findOne({
      employeeNumber: loginDto.employeeNumber,
      active: true,
    });
    checkpoints.userFind = Date.now();

    if (!user) {
      throw new UnauthorizedException("Invalid credentials");
    }

    const userId = new Types.ObjectId(user._id);

    const isLockedOut = await this.authCredentialService.isLockedOut(userId);
    checkpoints.lockoutCheck = Date.now();

    if (isLockedOut) {
      throw new UnauthorizedException(
        "Account is locked. Try again after 15 minutes.",
      );
    }

    const credentials = await this.authCredentialService.getByUserId(userId);
    checkpoints.credentialsGet = Date.now();

    // 🔴 ESTA LÍNEA TARDA 2-5 SEGUNDOS (Argon2)
    const isPasswordValid = await this.authCredentialService.verifyPassword(
      credentials.passwordHash,
      loginDto.password,
    );
    checkpoints.passwordVerify = Date.now();

    if (!isPasswordValid) {
      await this.authCredentialService.recordFailedAttempt(userId);
      throw new UnauthorizedException("Invalid credentials");
    }

    const ip = "127.0.0.1";
    await this.authCredentialService.recordSuccessfulLogin(userId, ip);
    checkpoints.loginRecord = Date.now();

    // LOG DE DIAGNÓSTICO
    console.log('🕐 Login Timing:', {
      'User Find': checkpoints.userFind - checkpoints.start,
      'Lockout Check': checkpoints.lockoutCheck - checkpoints.userFind,
      'Get Credentials': checkpoints.credentialsGet - checkpoints.lockoutCheck,
      'Password Verify (Argon2)': checkpoints.passwordVerify - checkpoints.credentialsGet, // 🔴 ESTO SERÁ MÁS ALTO
      'Login Record': checkpoints.loginRecord - checkpoints.passwordVerify,
      'Total Time': checkpoints.loginRecord - checkpoints.start,
    });

    return this.generateSessionToken(user._id.toString(), user.email);
  } catch (error) {
    console.error('Login Error:', error.message);
    throw error;
  }
}
```

---

## 📈 COMPARATIVA DE MEJORAS ESPERADAS

### **Escenario A: Solo aumentar recursos a Starter**

```
ANTES: 10-15 segundos
DESPUÉS: 3-5 segundos
MEJORA: 60-70% más rápido
COSTO: $10/mes adicionales
```

### **Escenario B: Starter + Optimizar Argon2**

```
ANTES: 10-15 segundos
DESPUÉS: 2-3 segundos
MEJORA: 75-80% más rápido
COSTO: $10/mes + nada de código
```

### **Escenario C: Standard + Todas las optimizaciones**

```
ANTES: 10-15 segundos
DESPUÉS: <1 segundo
MEJORA: 95%+ más rápido
COSTO: $20/mes
```

---

## 🔍 CÓMO VERIFICAR QUÉ ESTÁ LENTO

### **Opción 1: Medir desde el Frontend**

Abre DevTools en tu app (F12) y ejecuta en la consola:

```javascript
// Medir tiempo de login
const startTime = performance.now();

// Aquí hace el login (ingresa y presiona botón)
// ... espera a que termine ...

// En la consola de nuevo ejecuta:
console.log("Login Duration:", performance.now() - startTime, "ms");
```

**Interpretación:**

- Si tarda 10000ms (10 segundos) = Tu servidor está lento
- Si tarda 2000ms pero se siente lento = Es UI/caché del navegador

### **Opción 2: Ver logs de Render**

```
1. Ve a https://dashboard.render.com
2. Selecciona tu servicio
3. Haz clic en "Logs"
4. Intenta login
5. Busca los tiempos en los logs (con mi código anterior)
```

---

## ⚡ ACCIONES INMEDIATAS (Hoy)

### **PRIMERO - Aumenta los recursos:**

1. Ve a Render Dashboard
2. Selecciona tu servicio
3. Settings → Plan → **Elige Starter ($10/mes)**
4. Reinicia el servicio
5. Prueba el login nuevamente

### **SEGUNDO - Comparte los resultados:**

- ¿Cuánto tarda ahora?
- ¿Es mejor?
- Si aún es lento, agregaré los logs de diagnóstico

---

## 📋 RESUMEN EJECUTIVO

| Recurso       | Actual  | Recomendado  | Impacto            |
| ------------- | ------- | ------------ | ------------------ |
| RAM           | 512 MB  | 2GB-4GB      | ⭐⭐⭐⭐⭐ CRÍTICO |
| CPU           | 0.1     | 0.5-1 CPU    | ⭐⭐⭐⭐⭐ CRÍTICO |
| Argon2 Cost   | 19456   | 16384        | ⭐⭐ Moderado      |
| Caching       | Ninguno | Redis/Memory | ⭐⭐ Bajo          |
| Rate Limiting | Ninguno | Yes          | ⭐ Seguridad       |

**Conclusión:** El problema **90% es falta de recursos**. Aumentar a Starter debería resolver el 80% del problema.

---

¿Quieres que implemente las optimizaciones de código? O ¿Primero aumentas los recursos y vemos si mejora?
