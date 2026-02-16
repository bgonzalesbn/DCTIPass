# Guía de la Pregunta de Claridad

## ¿Qué es?

La pregunta de claridad es una funcionalidad opcional que permite evaluar qué tan claro le quedó el rol de una dirección al usuario después de completar una sesión.

## Características

### Pregunta Presentada

"¿Qué tan claro te queda ahora el rol de esta dirección?"

### Escala de Respuestas (Horizontal con Emojis)

- 😕 **Nada claro**
- 🙂 **Claro**
- 😄 **Muy claro**
- 🤩 **Clarísimo**

## Flujo de Usuario

Cuando un usuario completa una subactividad con pregunta de claridad habilitada:

1. **Paso 1: Reto** - Usuario responde la pregunta del administrador (challenge)
2. **Paso 2: Evaluación** - Usuario evalúa su claridad sobre el rol de la dirección
3. **Resultado** - Ambas respuestas deben completarse para avanzar a la siguiente sesión

## Implementación Técnica

### Backend

#### Schema (GroupSessionItem)

```typescript
{
  subActivityId: ObjectId,
  subActivityName: string,
  startTime: string,
  endTime: string,
  order: number,
  enableClarityQuestion: boolean  // ← NUEVO CAMPO
}
```

#### User Schema (ClarityResponse)

```typescript
{
  subActivityId: ObjectId,
  scheduleId: ObjectId,
  response: string,  // "Nada claro" | "Claro" | "Muy claro" | "Clarísimo"
  answeredAt: Date
}
```

#### Endpoint

```
POST /users/clarity-response
Body: {
  subActivityId: string,
  scheduleId: string,
  response: string
}
```

### Frontend

#### Componente Principal

`ClarityQuestionModal.tsx` - Modal de 2 pasos:

- Paso 1: Pregunta del reto (challenge)
- Paso 2: Pregunta de claridad (si está habilitada)

#### Integración

- Detecta automáticamente si la sesión tiene `enableClarityQuestion: true`
- Muestra ambas preguntas en un flujo secuencial
- Guarda ambas respuestas antes de completar

## Configuración en Módulo Administrador

### Cómo Habilitar la Pregunta de Claridad

**IMPORTANTE**: Para habilitar esta funcionalidad en una sesión específica, el administrador debe:

1. **Acceder al módulo de Schedules/Horarios**
2. **Editar el schedule** correspondiente
3. **En la sección de Group Sessions** (sesiones por grupo):
   - Buscar la sesión específica (subactividad)
   - **Agregar el campo `enableClarityQuestion: true`** en la configuración de la sesión

### Ejemplo de Estructura JSON en la Base de Datos

```json
{
  "_id": "schedule123",
  "title": "IT Experience - Sesión Mañana",
  "groupSessions": [
    {
      "groupId": "grupo1",
      "sessions": [
        {
          "subActivityId": "subact1",
          "subActivityName": "Arquitectura",
          "startTime": "08:00",
          "endTime": "08:30",
          "order": 1,
          "enableClarityQuestion": true // ← HABILITAR AQUÍ
        },
        {
          "subActivityId": "subact2",
          "subActivityName": "Infraestructura",
          "startTime": "08:30",
          "endTime": "09:00",
          "order": 2,
          "enableClarityQuestion": false // ← DESHABILITADO
        }
      ]
    }
  ]
}
```

### Interfaz de Administrador (Pendiente)

**NOTA**: Actualmente, la funcionalidad está implementada en el backend y frontend, pero falta crear la interfaz en el módulo administrador para activar/desactivar la pregunta de claridad de forma visual.

**Se requiere**:

- Checkbox o toggle en la edición de sesiones del módulo admin
- Permitir habilitar/deshabilitar `enableClarityQuestion` por cada sesión
- Mostrar indicador visual de qué sesiones tienen la pregunta habilitada

**Ubicación sugerida**:

- Archivo: `frontend/src/pages/admin/tabs/AdminSchedulesTab.tsx` (o similar)
- Agregar campo en el formulario de edición de sesiones

## Datos Almacenados

Todas las respuestas de claridad se guardan en el modelo de Usuario:

```typescript
user.clarityResponses = [
  {
    subActivityId: "subact1",
    scheduleId: "schedule1",
    response: "Muy claro",
    answeredAt: "2026-02-16T12:30:00Z",
  },
  // ...
];
```

## Reportes y Análisis

Estas respuestas pueden ser utilizadas para:

- **Medir efectividad** de las sesiones
- **Identificar direcciones** que necesitan mejor comunicación
- **Mejorar contenido** según feedback de claridad
- **Reportes** de satisfacción y comprensión

## Ventajas

✅ **Opcional por sesión** - Solo se activa donde es necesaria  
✅ **No intrusiva** - Flujo natural después del reto  
✅ **Feedback valioso** - Datos para mejorar las sesiones  
✅ **Fácil de responder** - Escala visual con emojis  
✅ **Validación** - Obligatoria cuando está habilitada para avanzar

## Próximos Pasos

1. ✅ **Backend implementado** - Schema y endpoints funcionales
2. ✅ **Frontend implementado** - Modal y flujo de usuario completos
3. ⏳ **Pendiente**: Interfaz admin para activar/desactivar por sesión
4. ⏳ **Pendiente**: Dashboard de reportes de claridad
5. ⏳ **Pendiente**: Exportar respuestas de claridad a PDF/Excel

---

**Desarrollado**: Febrero 2026  
**Versión**: 1.0
