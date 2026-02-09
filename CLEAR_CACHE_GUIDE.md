# Limpiar Cache del Navegador - DCTIPass

## Opción 1: Limpiar Cache Local Storage (Recomendado)

Abre la consola del navegador (F12) y ejecuta esto:

```javascript
// Eliminar todos los datos del localStorage
localStorage.clear();

// O eliminar específicamente los datos de caché
localStorage.removeItem("authStore");
localStorage.removeItem("cacheStore");
localStorage.removeItem("profileCache");
localStorage.removeItem("activitiesCache");
localStorage.removeItem("badgesCache");

// Recargar la página
window.location.reload();
```

## Opción 2: Limpiar Service Worker

```javascript
// Desregistrar todos los service workers
navigator.serviceWorker.getRegistrations().then((registrations) => {
  for (let registration of registrations) {
    registration.unregister();
  }
});

// Esperar y recargar
setTimeout(() => window.location.reload(), 1000);
```

## Opción 3: Limpiar Completamente en Chrome/Firefox

1. Presiona `F12` para abrir DevTools
2. Ve a `Application` (Chrome) o `Storage` (Firefox)
3. Selecciona `Local Storage`
4. Haz clic derecho en la URL y selecciona `Delete`
5. Limpia `Service Workers`
6. Presiona `Ctrl + Shift + R` (hard refresh)

## Pasos para Verificar:

1. Abre el navegador en `https://dcti-pass.vercel.app`
2. Abre DevTools (F12)
3. Ve a Application → Local Storage
4. Haz clic en el URL de la aplicación
5. Elimina todo
6. Presiona Ctrl + Shift + R para hard refresh
7. Login de nuevo con usuario 18732
8. Verifica que el perfil esté vacío (sin stickers, sin progreso)

## Comandos Rápidos para Consola (F12):

```javascript
// Ver qué hay en localStorage
console.log("LocalStorage:", localStorage);

// Limpiar todo
localStorage.clear();
console.log("✅ Cache limpiado");

// Recargar
location.reload();
```

**¡El backend ya está limpio! Solo necesitas limpiar el cache del frontend.**
