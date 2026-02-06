# Pantalla de Cronograma de Actividades

## Características Implementadas

### 1. **Visualización del Cronograma**

- Muestra todas las actividades programadas para un día específico
- Navega entre días usando botones "Día anterior" y "Día siguiente"
- Selecciona una fecha específica usando el calendario
- Botón "Hoy" para volver al día actual

### 2. **Información de Cada Actividad**

Cada actividad muestra:

- **Nombre de la actividad** - Título principal
- **Horario** - Hora de inicio y fin en formato HH:mm
- **Orden** - Posición de la actividad en el día
- **Estado** - Visual indicador de completado/pendiente

### 3. **Insignias Asociadas**

Para cada actividad se muestra:

- **Insignia disponible** - La insignia que se puede ganar
- **Imagen de la insignia** - Foto de la insignia (si está disponible)
- **Nombre de la insignia** - Título descriptivo
- **Indicador de progreso** - Muestra si ya fue ganada

### 4. **Interacción con Actividades**

- **Botón "Completar"** - Marca la actividad como completada
- **Botón "✓ Completada"** - Muestra estado completado (deshabilitado)
- **Visual de completado** - Color verde y estrella (⭐) cuando está hecha

### 5. **Estilos Visuales**

- **Borde izquierdo azul** (indigo) - Actividades pendientes
- **Borde izquierdo verde** - Actividades completadas
- **Fondo azul claro** - Información de insignia pendiente
- **Fondo verde claro** - Información de insignia ya ganada

## Flujo de Datos

```
HomePage
  ↓
SchedulePage
  ├─ scheduleAPI.getSchedule(date)
  ├─ activitiesAPI.getActivities()
  ├─ badgesAPI.getBadges()
  └─ badgesAPI.getUserBadges()
```

## Funciones Principales

### `loadData()`

Carga todos los datos necesarios:

1. Horario del día seleccionado
2. Lista de todas las actividades disponibles
3. Lista de todas las insignias disponibles
4. Insignias ganadas por el usuario actual

### `handleCompleteActivity()`

Marca una actividad como completada:

1. Envía solicitud al backend
2. Actualiza el estado local de actividades completadas
3. Muestra visual de insignia ganada

### `handlePreviousDay() / handleNextDay()`

Navega entre días:

- Modifica la fecha seleccionada
- Dispara recarga de datos automática

## Rutas API Utilizadas

- `GET /schedule?date=YYYY-MM-DD` - Obtener actividades del día
- `GET /activities` - Obtener todas las actividades
- `GET /badges` - Obtener todas las insignias
- `GET /badges/user/earned` - Obtener insignias del usuario
- `POST /activities/:id/attempt` - Completar una actividad

## Estados y Variables

```typescript
interface ScheduleEvent {
  _id: string;
  activityId: string;
  date: string;
  startTime: string; // "14:00"
  endTime: string; // "15:00"
  order: number; // Posición en el día
  activity?: Activity; // Datos enriquecidos
  badge?: Badge; // Insignia asociada
}
```

## Mejoras Futuras

- [ ] Filtrar por grupo
- [ ] Vista semanal/mensual
- [ ] Recordatorios de actividades
- [ ] Comentarios en actividades
- [ ] Historial de completadas
- [ ] Búsqueda de actividades
- [ ] Exportar cronograma
