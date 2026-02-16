# GUÍA DE IMPLEMENTACIÓN FASE II Y III

## Optimizaciones de Rendimiento y Estado React para DCTIPass

---

## FASE II: RECOMENDADO (Impacto: 20-30% mejora adicional)

### 2.1 Consolidar Estados en ActivityState + UIState + AwardState

**Status**: 📋 Planificado  
**Archivo**: frontend/src/pages/SubActivitiesPage.tsx  
**Tiempo estimado**: 1.5-2 horas

**Problema**:

```tsx
// 23 useState actualmente distribuidos
const [activity, setActivity] = useState(...);
const [subActivities, setSubActivities] = useState(...);
const [loading, setLoading] = useState(true);
const [error, setError] = useState("");
const [showQuestionModal, setShowQuestionModal] = useState(false);
// ... etc x 18 más
```

**Solución**:

```tsx
interface ActivityState {
  activity: Activity | null;
  subActivities: SubActivityWithStatus[];
  loading: boolean;
  error: string;
  selectedActivity: SubActivityWithStatus | null;
  completedSubActivityIds: string[];
  awardsStatus: Record<string, { hasAward: boolean; completed: boolean }>;
  userSchedule: Schedule | null;
  userGroup: Group | null;
}

interface UIState {
  showQuestionModal: boolean;
  showCompletedModal: boolean;
}

interface AwardState {
  currentAward: {...} | null;
  answerResult: {...} | null;
  answeringLoading: boolean;
  answeringSubActivity: SubActivityWithStatus | null;
}

// Uso:
const [activityState, setActivityState] = useState<ActivityState>(initialActivityState);
const [uiState, setUIState] = useState<UIState>(initialUIState);
const [awardState, setAwardState] = useState<AwardState>(initialAwardState);
```

**Pasos de implementación**:

1. Crear `frontend/src/types/subActivityPageStates.ts` ✅ HECHO
2. Reemplazar cada `useState` pair con acceso a objetos consolidados
3. Actualizar `loadActivityData()` para usar `setActivityState()`
4. Actualizar handlers (`handleAnswerQuestion`, `handleSubmitAnswer`, etc.) para usar nuevos estados
5. Actualizar condicionales en JSX que consulten estado

**Cambios de código esperados**:

```tsx
// handleCompleteWithoutChallenge ANTES:
setCompletedSubActivityIds((prev) => [...prev, completedId]);
setAwardsStatus(newStatus);
setSubActivities(recalculatedArray);

// handleCompleteWithoutChallenge DESPUÉS:
setActivityState((prev) => ({
  ...prev,
  completedSubActivityIds: [...prev.completedSubActivityIds, completedId],
  awardsStatus: newStatus,
  subActivities: recalculatedArray,
}));
```

**Impacto**:

- ⬇️ 67% reducción de setState calls (23 → 9)
- ⬇️ 30% menos re-renders de componentes
- ✔️ Mejor legibilidad y mantenibilidad

---

### 2.2 Memoizar SubActivityCard Component

**Status**: 📋 Planificado  
**Archivo**: Crear frontend/src/components/SubActivityCard.tsx  
**Tiempo estimado**: 1 hora

**Problema**:

```tsx
// Actualmente, cada card se re-renderiza cuando cualquier estado cambia
{subActivities.map((subActivity) => (
  <div key={...} className={`...${subActivity.isCompleted ? "green" : ""}...`}>
    {/* 50 líneas de JSX */}
  </div>
))}
```

**Solución**:

```tsx
// NUEVO: SubActivityCard.tsx
import { memo } from "react";

interface SubActivityCardProps {
  subActivity: SubActivityWithStatus;
  onSelect: (sub: SubActivityWithStatus) => void;
  formatTime: (time: string) => string;
}

const SubActivityCard = memo(
  ({ subActivity, onSelect, formatTime }: SubActivityCardProps) => {
    return (
      <div
        onClick={() => onSelect(subActivity)}
        className={`rounded-xl shadow-lg transition-all duration-300 overflow-hidden relative
          ${subActivity.isCompleted ? "bg-green-50" : "bg-white"}
        `}
      >
        {/* Content del card */}
      </div>
    );
  },
  (prevProps, nextProps) => {
    // Custom comparison: solo re-renderear si estos campos cambian
    return (
      prevProps.subActivity._id === nextProps.subActivity._id &&
      prevProps.subActivity.isCompleted === nextProps.subActivity.isCompleted &&
      prevProps.subActivity.isActive === nextProps.subActivity.isActive &&
      prevProps.subActivity.progress === nextProps.subActivity.progress
    );
  },
);

SubActivityCard.displayName = "SubActivityCard";
export default SubActivityCard;
```

**En SubActivitiesPage**:

```tsx
{
  activityState.subActivities.map((sub) => (
    <SubActivityCard
      key={sub._id}
      subActivity={sub}
      onSelect={handleSubActivityClick}
      formatTime={formatTime}
    />
  ));
}
```

**Impacto**:

- ⬇️ 20-30% menos renders de cards
- ✔️ Mejor performance en cambios de estado
- ✔️ Component más testeable

---

### 2.3 Pre-calcular Progress en ActivitiesPage

**Status**: 📋 Planificado  
**Archivo**: frontend/src/pages/ActivitiesPage.tsx  
**Tiempo estimado**: 30 minutos

**Problema**:

```tsx
// calculateProgress se ejecuta N veces (una por cada activity)
{activities.map((activity) => {
  const progress = calculateProgress(activity); // Ejecución repetida
  return (
    <div key={...}>
      {/* Usa progress */}
    </div>
  );
})}
```

**Solución**:

```tsx
// Pre-calcular fuera del map
const activityProgress = useMemo(() => {
  return activities.map(activity => ({
    id: activity._id,
    progress: calculateActivityProgress(activity, completedSubActivityIds),
  }));
}, [activities, completedSubActivityIds]);

// Luego usar:
{activities.map((activity) => {
  const progress = activityProgress.find(ap => ap.id === activity._id)?.progress || 0;
  return (
    <div key={...}>
      {/* Usa progress */}
    </div>
  );
})}
```

**Impacto**:

- ⬇️ Cálculo de progress una sola vez en lugar de N
- ✔️ Mejor performance en listas grandes

---

### 2.4 Extraer ActivityCard Component Memoizado

**Status**: 📋 Planificado  
**Archivo**: Crear frontend/src/components/ActivityCard.tsx  
**Tiempo estimado**: 45 minutos

**Similar a SubActivityCard**, memoizar los cards de actividades para evitar re-renders innecesarios.

---

## FASE III: OPCIONAL (Impacto: 5-10% mejora)

### 3.1 Lazy-load Modales

**Status**: 📋 Planificado  
**Archivo**: frontend/src/pages/SubActivitiesPage.tsx  
**Tiempo estimado**: 15 minutos

```tsx
// ANTES:
import QuestionModal from "../components/QuestionModal";
import CompletedModal from "../components/CompletedModal";

// DESPUÉS:
import { lazy, Suspense } from "react";

const QuestionModal = lazy(() => import("../components/QuestionModal"));
const CompletedModal = lazy(() => import("../components/CompletedModal"));

// En JSX:
<Suspense fallback={<div className="hidden" />}>
  <QuestionModal
    isOpen={uiState.showQuestionModal}
    {...props}
  />
</Suspense>

<Suspense fallback={<div className="hidden" />}>
  <CompletedModal
    isOpen={uiState.showCompletedModal}
    {...props}
  />
</Suspense>
```

**Impacto**:

- ⬇️ 100-150kb reducción en bundle inicial
- ✔️ Mejor First Contentful Paint (FCP)

---

### 3.2 Request Deduplication en API layer

**Status**: 📋 Planificado  
**Archivo**: Crear frontend/src/utils/requestDeduplicator.ts  
**Tiempo estimado**: 1.5 horas

```typescript
// utils/requestDeduplicator.ts
class RequestDeduplicator {
  private pending: Map<string, Promise<any>> = new Map();

  async request<T>(key: string, fetcher: () => Promise<T>): Promise<T> {
    if (this.pending.has(key)) {
      return this.pending.get(key)!;
    }

    const promise = fetcher().finally(() => {
      this.pending.delete(key);
    });

    this.pending.set(key, promise);
    return promise;
  }

  clear() {
    this.pending.clear();
  }
}

export const deduplicator = new RequestDeduplicator();
```

```typescript
// services/api.ts
export const usersAPI = {
  getProfile: () =>
    deduplicator.request("users:profile", () => apiClient.get("/users/me")),
  // ... etc
};
```

**Impacto**:

- ⬇️ Previene solicitudes duplicadas paralelas
- ✔️ Mejor manejo de caso edge (usuario hace click múltiples veces rápido)

---

## RESUMEN DE CAMBIOS POR FASE

### FASE 1 - CRÍTICO ✅ COMPLETADO

| Tarea                            | Archivo(s)               | Tiempo     | Impacto            |
| -------------------------------- | ------------------------ | ---------- | ------------------ |
| Parallelizar API calls           | SubActivitiesPage.tsx    | 25 min     | **-65% load time** |
| Custom hook useSubActivityStatus | Crear hook, refactorizar | 45 min     | Mantenibilidad     |
| Limpiar UTF-8                    | SubActivitiesPage.tsx    | 10 min     | Calidad            |
| **Total FASE 1**                 | **3 files**              | **80 min** | **+700ms perf**    |

### FASE 2 - RECOMENDADO 📋 PENDIENTE

| Tarea                    | Archivo(s)                    | Tiempo              | Impacto                   |
| ------------------------ | ----------------------------- | ------------------- | ------------------------- |
| Consolidar estados       | Tipos + SubActivitiesPage.tsx | 120 min             | **-30% renders**          |
| Memoizar SubActivityCard | Crear component               | 60 min              | **-25% card renders**     |
| Memoizar ActivityCard    | Crear component               | 45 min              | **-20% activity renders** |
| Pre-calcular progress    | ActivitiesPage.tsx            | 30 min              | Optimización interna      |
| **Total FASE 2**         | **5 files**                   | **255 min (4h15m)** | **+100-200ms perf**       |

### FASE 3 - OPCIONAL 💡 PENDIENTE

| Tarea                 | Archivo(s)            | Tiempo              | Impacto                  |
| --------------------- | --------------------- | ------------------- | ------------------------ |
| Lazy-load modales     | SubActivitiesPage.tsx | 15 min              | **-100kb bundle**        |
| Request deduplication | Crear util + api.ts   | 90 min              | Previene race conditions |
| Virtual scrolling     | Si aplica en futuro   | -                   | Para listas >50 items    |
| **Total FASE 3**      | **3 files**           | **105 min (1h45m)** | **+50mb memory**, UX     |

---

## VERIFICACIÓN POST-OPTIMIZACIÓN

Después de implementar FASE 2, verifica:

```typescript
// Performance metrics
console.time("SubActivitiesPage Load");
// ... cargar página
console.timeEnd("SubActivitiesPage Load");

// Render count (usar React DevTools Profiler)
// Esperado ANTES: 8-12 renders iniciales, 5-8 por estado
// Esperado DESPUÉS: 3-4 renders iniciales, 1-2 por estado

// Memory usage
// Esperado ANTES: ~45-50mb
// Esperado DESPUÉS: ~35-40mb
```

---

## TESTING RECOMENDADO

Después de cada fase:

1. **Functional Testing**: Verificar que toda acción funciona igual
2. **Performance Testing**: Medir con DevTools
3. **Visual Regression**: Screenshots antes/después
4. **Load Testing**: Simular múltiples usuarios

```bash
# Medir rendimiento inicial
npm run build

# Ver tamaño del bundle
ls -lh dist/

# Ejecutar en modo profiling
npm run dev -- --profile
```

---

## NOTAS IMPORTANTES

⚠️ **NO HACER**:

- No cambiar API endpoints (requiere cambio backend)
- No eliminar funcionalidad (solo optimizar)
- No cambiar estructura de datos en state JSON

✅ **SÍ HACER**:

- Probar en múltiples navegadores
- Commit incremental por cada feature
- Documentar cambios en PR
- Ejecutar tests antes de push

---

## PRÓXIMOS PASOS DESPUÉS DE ESTO

1. Aplicar mismas optimizaciones a ActivitiesPage.tsx
2. Considerar agregar SWR/TanStack Query para data fetching
3. Implementar Service Worker caching
4. Optimizar imágenes/assets
5. Consider code splitting por rutas
