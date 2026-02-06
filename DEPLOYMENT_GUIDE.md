# 📱 Guía de Despliegue - DCTIPass

## Descripción General

Este documento describe cómo desplegar **DCTIPass** como una PWA en Vercel (frontend) y en Render (backend) para que sea accesible desde cualquier dispositivo móvil.

---

## 🚀 FRONTEND - Despliegue en Vercel (PWA)

### Requisitos Previos

- Cuenta en [Vercel](https://vercel.com)
- GitHub cuenta con este repositorio

### Pasos de Despliegue

1. **Conectar GitHub a Vercel**
   - Ve a [vercel.com](https://vercel.com)
   - Click en "New Project"
   - Selecciona el repositorio `DCTIPass`

2. **Configurar Variables de Entorno**
   - En Vercel, ve a Settings → Environment Variables
   - Agrega:
     ```
     VITE_API_URL=https://tu-backend-en-render.onrender.com
     ```

3. **Configurar Build Settings**
   - Framework: Next.js / Vite (auto-detectado)
   - Build Command: `npm run build`
   - Output Directory: `dist`

4. **Desplegar**
   - Vercel automáticamente hace deploy en cada push a `main`
   - Tu PWA estará disponible en: `https://dctpass.vercel.app` (o tu dominio personalizado)

### Características PWA Incluidas

✅ Instalable en dispositivos móviles  
✅ Funciona offline con Service Worker  
✅ Cacheo inteligente de API  
✅ Iconos y splash screens optimizados

---

## 🔧 BACKEND - Despliegue en Render

### Requisitos Previos

- Cuenta en [Render](https://render.com)
- MongoDB Atlas configurado (base de datos)
- Variables de entorno documentadas

### Pasos de Despliegue

1. **Crear Nuevo Servicio Web en Render**
   - Ve a [render.com](https://render.com)
   - Click en "New+"
   - Selecciona "Web Service"
   - Conecta tu GitHub

2. **Configurar el Servicio**
   - **Name**: `dctpass-backend`
   - **Environment**: Node
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npm run start:prod`
   - **Branch**: main

3. **Agregar Variables de Entorno**
   En Render Dashboard → Your Service → Environment:

   ```
   NODE_ENV=production
   PORT=3000
   MONGODB_URI=mongodb+srv://user:password@cluster.mongodb.net/dctpass
   JWT_SECRET=tu-clave-secreta-super-segura
   CORS_ORIGIN=https://dctpass.vercel.app
   ```

4. **Conectar MongoDB**
   - Si usas MongoDB Atlas:
     - Crea un cluster
     - Obtén la connection string
     - Usa como `MONGODB_URI`

5. **Desplegar**
   - Render automáticamente hace deploy en cada push
   - Tu backend estará disponible en: `https://dctpass-backend.onrender.com`

---

## 📲 Usar en Dispositivo Móvil

### iOS (iPhone/iPad)

1. Abre el navegador Safari
2. Ve a tu PWA: `https://dctpass.vercel.app`
3. Tap el botón compartir
4. Selecciona "Add to Home Screen"
5. ¡La app aparecerá como una app nativa!

### Android

1. Abre en Chrome o navegador móvil
2. Ve a `https://dctpass.vercel.app`
3. Espera a que aparezca el prompt "Instalar app"
4. Tap "Instalar"
5. ¡La app estará en tu home screen!

---

## 🔄 Flujo de Actualización

**Desarrollo → GitHub → Auto-deploy a Vercel/Render**

1. Haz cambios localmente
2. Commit: `git commit -m "Mensaje descriptivo"`
3. Push: `git push origin main`
4. Vercel y Render automáticamente:
   - Detectan los cambios
   - Ejecutan build
   - Despliegan la nueva versión

---

## ✅ Checklist Pre-Producción

- [ ] Todas las variables de entorno configuradas en ambas plataformas
- [ ] MongoDB URI válida y accesible desde Render
- [ ] CORS_ORIGIN apunta a tu dominio de Vercel
- [ ] JWT_SECRET es fuerte y único
- [ ] Frontend construye sin errores: `npm run build`
- [ ] Backend construye sin errores: `npm run build`
- [ ] Pruebas en dispositivo móvil (iOS y Android)
- [ ] Funciona offline (PWA caching)

---

## 🐛 Troubleshooting

### El frontend no conecta con el backend

- Verifica `VITE_API_URL` en Vercel
- Verifica `CORS_ORIGIN` en Render
- Usa HTTPS en ambos (no HTTP)

### La PWA no instala

- Verifica que HTTPS esté habilitado
- Revisa que manifest.json es válido
- Espera a que aparezca el prompt

### Errores en Render al iniciar

- Revisa los logs: `Settings → Logs`
- Verifica variables de entorno
- Asegúrate que MongoDB está activo

---

## 📚 Documentación Útil

- [Vercel Docs](https://vercel.com/docs)
- [Render Docs](https://render.com/docs)
- [PWA Docs](https://web.dev/progressive-web-apps/)
- [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)

---

**¡Tu DCTIPass está listo para usuarios móviles! 🚀**
