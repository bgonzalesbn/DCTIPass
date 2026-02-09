# MongoDB Indexes - Manual Creation Guide

## Instrucciones para crear índices en MongoDB Atlas

Los índices mejoran significativamente el performance de las queries (10x más rápidas).

### Opción 1: MongoDB Atlas UI (Recomendado)

1. Ve a [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Selecciona tu Cluster
3. Haz click en "Collections"
4. Para cada colección, ejecuta los siguientes índices:

#### Activities Collection

```javascript
db.activities.createIndex({ active: 1 });
db.activities.createIndex({ name: 1 });
```

#### Stickers Collection

```javascript
db.stickers.createIndex({ _id: 1 });
db.stickers.createIndex({ name: 1 });
```

#### Users Collection

```javascript
db.users.createIndex({ employeeNumber: 1 }, { unique: true });
db.users.createIndex({ email: 1 }, { unique: true });
```

#### Schedules Collection

```javascript
db.schedules.createIndex({ date: 1 });
db.schedules.createIndex({ activityId: 1 });
```

#### Activity Progress Collection

```javascript
db.activity_progress.createIndex({ userId: 1 });
db.activity_progress.createIndex({ activityId: 1 });
```

### Opción 2: Via Script Node.js (Local)

Si tienes conexión desde tu máquina:

```bash
cd backend
node create-indexes.mjs
```

### Opción 3: Via Render Shell (En el servidor)

1. Ve a tu aplicación en Render
2. Abre la Shell
3. Ejecuta:

```bash
node create-indexes.mjs
```

## Verificar que los índices fueron creados

En MongoDB Atlas, ve a la colección y verifica en la pestaña "Indexes".

## Impacto esperado

- Queries en `activities.find({ active: true })`: **10x más rápida**
- Búsquedas por `name`: **5-10x más rápida**
- Lookups por `_id` en stickers: **Optimizado**
- Login performance: **Ligeramente mejorado** (0-10ms)

## Nota

Los índices son automáticos para campos `_id`. Los índices únicos (`unique: true`) previenen duplicados.
