# GUÍA DE OPTIMIZACIONES AVANZADAS DE RENDIMIENTO

## 1. SKELETON LOADERS EN LUGAR DE SPINNERS

```tsx
import { SkeletonGrid, SkeletonCard } from "../components/SkeletonLoader";

export default function ActivitiesPage() {
  const { status } = useAsync(...);

  return (
    <>
      {status === "pending" && activities.length === 0 && <SkeletonGrid count={6} />}
      {/* Mostrar datos reales */}
    </>
  );
}
```

## 2. INFINITE SCROLL (CARGAR MÁS AL LLEGAR AL BOTTOM)

```tsx
import { useInfiniteScroll } from "../hooks";

const observerTarget = useInfiniteScroll(() => {
  if (status !== "pending") {
    setPage((p) => p + 1);
    loadMoreActivities();
  }
});

return (
  <>
    <ActivityList activities={activities} />
    <div ref={observerTarget} className="mt-8">
      {status === "pending" && "Cargando más..."}
    </div>
  </>
);
```

## 3. DEBOUNCED SEARCH (EVITAR MÚLTIPLES LLAMADAS)

```tsx
import { useDebounce } from "../hooks";

const [searchTerm, setSearchTerm] = useState("");
const debouncedSearch = useDebounce(searchTerm, 500); // Esperar 500ms

useEffect(() => {
  // Se ejecuta solo después de que el usuario para de escribir 500ms
  searchActivities(debouncedSearch);
}, [debouncedSearch]);
```

## 4. LAZY LOADING DE IMÁGENES

```tsx
<img
  src={activity.imageUrl}
  alt={activity.title}
  loading="lazy" // ← Carga solo cuando es visible
  decoding="async" // ← Decodificación asincrónica
  className="w-full h-48 object-cover rounded"
/>
```

## 5. MEMOIZAR COMPONENTES PESADOS

```tsx
import { memo } from "react";

const ActivityCard = memo(({ activity, onClick }) => (
  <div onClick={onClick}>{/* Componente pesado */}</div>
));
```

## 6. RETRY AUTOMÁTICO CON TIMEOUT

```tsx
import { useAsync } from "../hooks";

const { status, value, error } = useAsync(() => activitiesAPI.getAll(), true, {
  retries: 3, // Reintentar 3 veces
  timeout: 10000, // Timeout 10s
  onError: (error) => {
    console.error("Falló después de 3 intentos:", error);
  },
});
```

## 7. PREFETCH DE DATOS

```tsx
import { usePrefetch } from "../hooks";

// Precargar perfil después de 2 segundos
usePrefetch(() => profileAPI.getProfile(), 2000);
```

## 8. PERSISTENT CACHE EN LOCALSTORAGE

```tsx
import { useLocalStorage } from "../hooks";

const [userPreferences, setPreferences] = useLocalStorage(
  "userPreferences",
  defaultPreferences,
);
```

## 9. BATCHING DE LLAMADAS API

```tsx
// En lugar de 3 llamadas separadas:
const [activities, badges, schedules] = await Promise.all([
  activitiesAPI.getAll(),
  badgesAPI.getAll(),
  schedulesAPI.getAll(),
]);

// Mejor si el backend lo soporta:
const { activities, badges, schedules } = await API.get("/data/batch");
```

## 10. PROGRESSIVE IMAGE LOADING

```tsx
<div className="relative bg-slate-700 overflow-hidden">
  {/* Imagen borrosa de fondo */}
  <img
    src={imageUrl + "?quality=10&blur=20"}
    alt="thumb"
    className="w-full h-48 object-cover blur-md"
  />

  {/* Imagen nítida encima */}
  <img
    src={imageUrl}
    alt="main"
    loading="lazy"
    className="absolute inset-0 w-full h-48 object-cover"
  />
</div>
```

## 11. CODE SPLITTING POR RUTA

Ya implementado en App.tsx con `lazy()` y `Suspense`.

## 12. MONITOREAR PERFORMANCE

```tsx
// En main.tsx:
if ("performance" in window) {
  window.addEventListener("load", () => {
    const perfData = performance.timing;
    const pageLoadTime = perfData.loadEventEnd - perfData.navigationStart;
    console.log("Tiempo de carga:", pageLoadTime, "ms");
  });
}
```

## CHECKLIST ANTES DE DESPLEGAR

- ✅ Todas las páginas usan lazy loading
- ✅ Imágenes tienen `loading="lazy"`
- ✅ Componentes pesados usan `memo()`
- ✅ Búsquedas usan `useDebounce`
- ✅ Datos se cachean con `useCacheStore`
- ✅ Llamadas API tienen retry automático
- ✅ Lighthouse score > 90
- ✅ Bundle gzipped < 150KB
- ✅ FCP (First Contentful Paint) < 2s en 4G lento
- ✅ App funciona offline

## HERRAMIENTAS PARA MONITOREAR

1. **Chrome DevTools Lighthouse** - Auditoría de rendimiento
2. **Network tab** - Ver tamaño de archivos y tiempo de descarga
3. **Performance tab** - Analizar performance de la aplicación
4. **Storage > Cache Storage** - Ver qué está en caché

## BENCHMARKS ESPERADOS

| Métrica                | Antes  | Después |
| ---------------------- | ------ | ------- |
| Bundle inicial         | ~300KB | ~100KB  |
| First Contentful Paint | 3-4s   | 1-2s    |
| Time to Interactive    | 4-5s   | 2-3s    |
| Lighthouse Score       | 60-70  | 90+     |
