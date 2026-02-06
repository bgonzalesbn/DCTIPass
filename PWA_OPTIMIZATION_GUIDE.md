# PWA y Optimización de Rendimiento - IT Experience

## ✅ PWA - Instalar en dispositivo móvil

### iOS (iPhone/iPad)

1. Abre Safari en tu iPhone/iPad
2. Ve a: **https://dcti-pass.vercel.app**
3. Presiona el botón compartir (↑ en la parte inferior)
4. Desplázate y selecciona "Agregar a pantalla de inicio"
5. Dale un nombre y presiona "Agregar"
6. ¡Listo! La app está ahora en tu pantalla de inicio

### Android

1. Abre Chrome en tu Android
2. Ve a: **https://dcti-pass.vercel.app**
3. Presiona el menú ⋮ (esquina superior derecha)
4. Selecciona "Instalar aplicación" o "Agregar a pantalla de inicio"
5. Confirma y ¡listo!

### Características de la PWA

- ✅ Funciona sin internet (offline mode con caché de service worker)
- ✅ Instalable como app nativa sin AppStore/PlayStore
- ✅ Notificaciones push (configurables)
- ✅ Actualización automática cuando hay cambios

## 🚀 Optimizaciones de Rendimiento Implementadas

### 1. **Lazy Loading de Rutas**

```typescript
const ActivitiesPage = lazy(() => import("./pages/ActivitiesPage"));
```

- Las páginas se cargan solo cuando se navega a ellas
- El bundle inicial es más pequeño
- Cargas más rápidas inicialmente

### 2. **Code Splitting Automático**

- React, Zustand, Axios y Router están en chunks separados
- Se descargan bajo demanda
- Reduce el tamaño del main bundle

### 3. **Caché de Datos con Zustand**

```typescript
import { useCacheStore } from "./store/cacheStore";

// Los datos se cachean por 5 minutos
const activities = useCacheStore.getActivities();
if (activities) {
  // Usar datos en caché
} else {
  // Llamar a la API
}
```

- Evita llamadas API repetidas
- Respuestas instantáneas para datos frescos

### 4. **Service Worker & Network Cache**

- APIs se cachean con estrategia "NetworkFirst"
- Si hay conexión, usa red. Si no, usa caché
- Las imágenes se cachean por 24 horas

### 5. **Minificación y Compresión**

- `console.log` removidos en producción
- JavaScript minificado (Terser)
- CSS purificado con Tailwind

## 📊 Resultados Esperados

Antes de optimizaciones:

- Bundle inicial: ~300KB
- First Contentful Paint (FCP): ~3-4s en 4G lento

Después de optimizaciones:

- Bundle inicial: ~80-100KB
- First Contentful Paint: ~1-2s en 4G lento
- Navegación entre páginas: instantáneo (caché)

## 🔧 Cómo Usar la Caché de Datos

### En ActivitiesPage.tsx

```typescript
import { useCacheStore } from "../store/cacheStore";
import { activitiesAPI } from "../services/api";

export default function ActivitiesPage() {
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(false);
  const { getActivities, setActivities: setCachedActivities } = useCacheStore();

  useEffect(() => {
    const cached = getActivities();
    if (cached) {
      setActivities(cached); // Usar caché
      return;
    }

    // Solo si no hay caché, llamar a la API
    const fetchActivities = async () => {
      setLoading(true);
      try {
        const response = await activitiesAPI.getAll();
        setActivities(response.data);
        setCachedActivities(response.data); // Guardar en caché
      } finally {
        setLoading(false);
      }
    };

    fetchActivities();
  }, []);

  return (
    <>
      {loading && <LoadingSpinner />}
      {/* Mostrar actividades */}
    </>
  );
}
```

## ⚡ Rendimiento Monitorizar

Para monitorizar el rendimiento en Chrome:

1. Abre DevTools (F12)
2. Ve a la pestaña "Lighthouse"
3. Selecciona "Mobile" y haz clic en "Analyze page load"
4. Te dará un score de 0-100 en:
   - Performance
   - Accessibility
   - Best Practices
   - SEO

Meta: **Performance > 90**

## 📱 Testing PWA Offline

1. Abre la app en el navegador
2. Abre DevTools → Application → Service Workers
3. Marca "Offline"
4. Navega por la app
5. Deberían funcionar las páginas que ya visitaste gracias al caché

## 🔄 Actualizar la Caché

Los datos se actualizan automáticamente cada 5 minutos. Para forzar actualización:

```typescript
const { clearCache } = useCacheStore();
clearCache(); // Limpia todo el caché
```

## 📝 Próximas Mejoras Sugeridas

- [ ] Implementar skeleton loaders en lugar de LoadingSpinner
- [ ] Lazy load de imágenes con `<img loading="lazy" />`
- [ ] Compresión de imágenes (WebP)
- [ ] Virtual scrolling para listas largas
- [ ] Prefetching de datos que el usuario probablemente necesitará
