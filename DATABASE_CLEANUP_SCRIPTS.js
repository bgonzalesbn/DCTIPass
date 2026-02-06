// ============================================================
// SCRIPTS DE MONGODB PARA LIMPIAR Y ACTUALIZAR DATOS
// ============================================================
// Ejecutar estos scripts desde MongoDB Compass
// Asegúrate de estar en la BD correcta antes de ejecutar

// ============================================================
// 1. LIMPIAR INSIGNIAS DEL USUARIO 18732
// Mantener horario, limpiar badges y progreso de actividades
// ============================================================

// Primero, obtener el userId del usuario con IdEmployee 18732
db.users.findOne({ employeeNumber: "18732" });

// Luego usar ese userId para:
// a) Limpiar badges (user_badges collection)
db.user_badges.deleteMany({ userId: ObjectId("ID_DEL_USUARIO_AQUI") });

// b) Limpiar progreso de actividades
db.activity_progress.deleteMany({ userId: ObjectId("ID_DEL_USUARIO_AQUI") });

// c) Limpiar progreso de subactividades
db.subactivity_progress.deleteMany({ userId: ObjectId("ID_DEL_USUARIO_AQUI") });

// Verificar que todo se limpió
db.user_badges.find({ userId: ObjectId("ID_DEL_USUARIO_AQUI") }).count();
db.activity_progress.find({ userId: ObjectId("ID_DEL_USUARIO_AQUI") }).count();
db.subactivity_progress
  .find({ userId: ObjectId("ID_DEL_USUARIO_AQUI") })
  .count();

// ============================================================
// 2. CAMBIAR FECHAS EN HORARIOS
// De: 2026-02-05T06:00:00.000+00:00
// A:  2026-02-06T06:00:00.000+00:00
// ============================================================

// Ver cuántos horarios tienen la fecha antigua
db.schedules.countDocuments({
  date: new Date("2026-02-05T06:00:00.000+00:00"),
});

// Actualizar la fecha
db.schedules.updateMany(
  { date: new Date("2026-02-05T06:00:00.000+00:00") },
  { $set: { date: new Date("2026-02-06T06:00:00.000+00:00") } },
);

// Verificar que se actualizó
db.schedules.countDocuments({
  date: new Date("2026-02-06T06:00:00.000+00:00"),
});

// ============================================================
// 3. ACTUALIZAR STICKER_ID EN STICKER_AWARDS
// Mapear cada sticker con su correspondiente sticker_award
// ============================================================

// Actualizar cada uno según el mapeo proporcionado
db.sticker_awards.updateOne(
  { _id: ObjectId("69827f09da40f537463e3a45") },
  { $set: { stickerId: ObjectId("69823aced6bd58d3ea14ba73") } },
);

db.sticker_awards.updateOne(
  { _id: ObjectId("69827f09da40f537463e3a46") },
  { $set: { stickerId: ObjectId("69823b02d6bd58d3ea14ba77") } },
);

db.sticker_awards.updateOne(
  { _id: ObjectId("69827f09da40f537463e3a41") },
  { $set: { stickerId: ObjectId("69823b2ed6bd58d3ea14ba7b") } },
);

db.sticker_awards.updateOne(
  { _id: ObjectId("69827f09da40f537463e3a43") },
  { $set: { stickerId: ObjectId("69823b4cd6bd58d3ea14ba7f") } },
);

db.sticker_awards.updateOne(
  { _id: ObjectId("69827f09da40f537463e3a44") },
  { $set: { stickerId: ObjectId("69823b79d6bd58d3ea14ba83") } },
);

db.sticker_awards.updateOne(
  { _id: ObjectId("69827f09da40f537463e3a47") },
  { $set: { stickerId: ObjectId("69823b96d6bd58d3ea14ba87") } },
);

db.sticker_awards.updateOne(
  { _id: ObjectId("69827f09da40f537463e3a42") },
  { $set: { stickerId: ObjectId("69823bd5d6bd58d3ea14ba8d") } },
);

// Verificar que se actualizaron
db.sticker_awards.find({}).pretty();

// ============================================================
// 4. LIMPIAR COLECCIÓN USER_AWARDS
// ============================================================

// Ver cuántos documentos hay
db.user_awards.countDocuments({});

// Limpiar toda la colección
db.user_awards.deleteMany({});

// Verificar que está vacía
db.user_awards.countDocuments({});

// ============================================================
// SCRIPTS CONSOLIDADOS (Ejecutar en orden)
// ============================================================

/*
PASO 1: Obtener el ID del usuario
*/
const usuario = db.users.findOne({ employeeNumber: "18732" });
const userId = usuario._id;
print("Usuario ID: " + userId);

/*
PASO 2: Limpiar insignias y progreso
*/
db.user_badges.deleteMany({ userId: userId });
db.activity_progress.deleteMany({ userId: userId });
db.subactivity_progress.deleteMany({ userId: userId });
print("Insignias y progreso eliminados");

/*
PASO 3: Actualizar fechas de horarios
*/
const resultado = db.schedules.updateMany(
  { date: new Date("2026-02-05T06:00:00.000+00:00") },
  { $set: { date: new Date("2026-02-06T06:00:00.000+00:00") } },
);
print("Horarios actualizados: " + resultado.modifiedCount);

/*
PASO 4: Actualizar sticker_awards
*/
const updates = [
  { id: "69827f09da40f537463e3a45", stickerId: "69823aced6bd58d3ea14ba73" },
  { id: "69827f09da40f537463e3a46", stickerId: "69823b02d6bd58d3ea14ba77" },
  { id: "69827f09da40f537463e3a41", stickerId: "69823b2ed6bd58d3ea14ba7b" },
  { id: "69827f09da40f537463e3a43", stickerId: "69823b4cd6bd58d3ea14ba7f" },
  { id: "69827f09da40f537463e3a44", stickerId: "69823b79d6bd58d3ea14ba83" },
  { id: "69827f09da40f537463e3a47", stickerId: "69823b96d6bd58d3ea14ba87" },
  { id: "69827f09da40f537463e3a42", stickerId: "69823bd5d6bd58d3ea14ba8d" },
];

updates.forEach((update) => {
  db.sticker_awards.updateOne(
    { _id: ObjectId(update.id) },
    { $set: { stickerId: ObjectId(update.stickerId) } },
  );
});
print("Sticker awards actualizados");

/*
PASO 5: Limpiar user_awards
*/
db.user_awards.deleteMany({});
print("user_awards colección limpia");

print("\n✅ ¡Todos los cambios completados!");
