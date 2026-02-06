# Guía: Limpiar y Actualizar Base de Datos MongoDB

## 🎯 Tareas a Realizar

### Tarea 1: Limpiar insignias del usuario 18732

- Eliminar todas las badges
- Limpiar progreso de actividades
- Limpiar progreso de subactividades
- **Mantener**: Horario asignado

### Tarea 2: Actualizar fechas en horarios

- Cambiar: `2026-02-05T06:00:00.000+00:00`
- A: `2026-02-06T06:00:00.000+00:00`

### Tarea 3: Mapear stickers en sticker_awards

- Actualizar `stickerId` según la lista de mapeo

### Tarea 4: Limpiar user_awards

- Eliminar todos los documentos de la colección

---

## 📋 Paso a Paso

### Opción 1: Usar MongoDB Compass (Recomendado)

#### Paso 1: Conectar a MongoDB Atlas

1. Abre MongoDB Compass
2. Pega tu connection string de MongoDB Atlas:
   ```
   mongodb+srv://[usuario]:[password]@[cluster].atplvzn.mongodb.net/[database]
   ```
3. Click en "Connect"

#### Paso 2: Obtener el ID del usuario

1. Navega a la colección `users`
2. Busca el usuario con `employeeNumber: "18732"`
3. **Copia su `_id`** (lo necesitarás para los siguientes pasos)

**Ejemplo de búsqueda:**

```json
{ "employeeNumber": "18732" }
```

#### Paso 3: Ejecutar los scripts

1. Abre la terminal integrada en Compass (o usa el tab "Aggregations")
2. Copia cada script del archivo `DATABASE_CLEANUP_SCRIPTS.js`
3. Reemplaza `ID_DEL_USUARIO_AQUI` con el ID real del usuario
4. Ejecuta cada bloque

---

### Opción 2: Usar Script Consolidado (Más Fácil)

1. Abre MongoDB Compass
2. Ve a la BD correcta
3. Abre la terminal integrada
4. Copia el bloque **SCRIPTS CONSOLIDADOS** completo del archivo
5. Pega en la terminal
6. Presiona Enter

Este script:

- ✅ Encuentra automáticamente el usuario 18732
- ✅ Limpia insignias y progreso
- ✅ Actualiza fechas de horarios
- ✅ Mapea stickers correctamente
- ✅ Limpia user_awards
- ✅ Muestra confirmación de cada paso

---

### Opción 3: Usar MongoDB CLI

Si prefieres usar la línea de comandos:

```bash
# Conectar a MongoDB Atlas
mongosh "mongodb+srv://[usuario]:[password]@[cluster].atplvzn.mongodb.net/[database]"

# Luego pega el script consolidado y presiona Enter
```

---

## 🔍 Verificación Después de Cada Paso

### Verificar usuario fue limpiado

```javascript
db.users.findOne({ employeeNumber: "18732" });
// Debería mostrar el usuario sin badges
```

### Verificar que no hay badges

```javascript
db.user_badges.find({ userId: ObjectId("...") }).count();
// Debería retornar 0
```

### Verificar que no hay progreso

```javascript
db.activity_progress.find({ userId: ObjectId("...") }).count();
// Debería retornar 0
```

### Verificar fechas actualizadas

```javascript
db.schedules.find({ date: new Date("2026-02-06T06:00:00.000+00:00") }).count();
// Debería mostrar cantidad de horarios actualizados
```

### Verificar sticker_awards mapeados

```javascript
db.sticker_awards.find({}).pretty();
// Debería mostrar todos con stickerId correcto
```

### Verificar user_awards está vacío

```javascript
db.user_awards.countDocuments({});
// Debería retornar 0
```

---

## 🚨 Importante

### Antes de Ejecutar:

- ✅ **Haz backup** de la base de datos
- ✅ **Verifica** que tienes acceso a MongoDB Atlas
- ✅ **Copia** el ID correcto del usuario (18732)
- ✅ **Lee** todos los scripts antes de ejecutar

### NO Hagas:

- ❌ Ejecutar sin verificar el usuario correcto
- ❌ Modificar otros usuarios
- ❌ Ejecutar en BD de producción sin backup
- ❌ Saltarte las verificaciones

---

## 📊 Orden de Ejecución Recomendado

1. **Backup** (si es posible)
2. **Verificar usuario 18732 existe**
3. **Ejecutar PASO 1**: Obtener ID del usuario
4. **Ejecutar PASO 2**: Limpiar insignias y progreso
5. **Ejecutar PASO 3**: Actualizar fechas
6. **Ejecutar PASO 4**: Mapear stickers
7. **Ejecutar PASO 5**: Limpiar user_awards
8. **Verificar** todos los cambios

---

## 💾 Script Rápido (Copiar y Pegar)

```javascript
// PASO 1: Obtener usuario
const usuario = db.users.findOne({ employeeNumber: "18732" });
const userId = usuario._id;
print("✅ Usuario encontrado: " + userId);

// PASO 2: Limpiar
db.user_badges.deleteMany({ userId: userId });
db.activity_progress.deleteMany({ userId: userId });
db.subactivity_progress.deleteMany({ userId: userId });
print("✅ Insignias y progreso limpiados");

// PASO 3: Actualizar fechas
db.schedules.updateMany(
  { date: new Date("2026-02-05T06:00:00.000+00:00") },
  { $set: { date: new Date("2026-02-06T06:00:00.000+00:00") } },
);
print("✅ Fechas actualizadas");

// PASO 4: Mapear stickers
const updates = [
  { id: "69827f09da40f537463e3a45", stickerId: "69823aced6bd58d3ea14ba73" },
  { id: "69827f09da40f537463e3a46", stickerId: "69823b02d6bd58d3ea14ba77" },
  { id: "69827f09da40f537463e3a41", stickerId: "69823b2ed6bd58d3ea14ba7b" },
  { id: "69827f09da40f537463e3a43", stickerId: "69823b4cd6bd58d3ea14ba7f" },
  { id: "69827f09da40f537463e3a44", stickerId: "69823b79d6bd58d3ea14ba83" },
  { id: "69827f09da40f537463e3a47", stickerId: "69823b96d6bd58d3ea14ba87" },
  { id: "69827f09da40f537463e3a42", stickerId: "69823bd5d6bd58d3ea14ba8d" },
];
updates.forEach((u) => {
  db.sticker_awards.updateOne(
    { _id: ObjectId(u.id) },
    { $set: { stickerId: ObjectId(u.stickerId) } },
  );
});
print("✅ Stickers mapeados");

// PASO 5: Limpiar user_awards
db.user_awards.deleteMany({});
print("✅ user_awards limpiado");

print("\n🎉 ¡Todos los cambios completados!");
```

---

## 🆘 Troubleshooting

### Error: "User not found"

- Verifica que escribiste bien el employeeNumber (18732)
- Asegúrate de estar en la BD correcta

### Error: "Permission denied"

- Verifica que tu usuario en MongoDB Atlas tiene permisos de escritura
- Revisa las roles en MongoDB Atlas

### Error: "Invalid ObjectId"

- Verifica que copiaste bien el ID (sin espacios)
- Debe tener exactamente 24 caracteres

### Los cambios no se guardaron

- Revisa que no haya errores en la consola
- Ejecuta las verificaciones para confirmar

---

## ✅ Verificación Final

Después de ejecutar todo, debería ver:

- ✅ Usuario 18732 sin badges
- ✅ Sin progreso de actividades
- ✅ Sin progreso de subactividades
- ✅ Horario actualizado a 2026-02-06
- ✅ Stickers mapeados correctamente
- ✅ user_awards vacío

---

## 📞 Dudas

Si tienes dudas:

1. Revisa el archivo `DATABASE_CLEANUP_SCRIPTS.js`
2. Verifica que estés en la BD correcta
3. Revisa los IDs antes de ejecutar
4. Haz un test con 1 documento primero

¡Éxito! 🚀
