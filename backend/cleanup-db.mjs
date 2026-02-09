// Script para ejecutar limpieza de base de datos con Node.js
import { MongoClient, ObjectId } from "mongodb";

const MONGODB_URI =
  "mongodb+srv://ITExperience:itexperience%2E2025@cluster0.atplvzn.mongodb.net/ITExperience?appName=Cluster0";
const DB_NAME = "ITExperience";

async function cleanupDatabase() {
  const client = new MongoClient(MONGODB_URI);

  try {
    console.log("🔗 Conectando a MongoDB Atlas...");
    await client.connect();
    const db = client.db(DB_NAME);

    // ============================================================
    // PASO 1: OBTENER USUARIO 18732
    // ============================================================
    console.log("\n📋 PASO 1: Obtener usuario con IdEmployee 18732...");
    const usuario = await db
      .collection("users")
      .findOne({ employeeNumber: "18732" });

    if (!usuario) {
      throw new Error("❌ Usuario con employeeNumber 18732 no encontrado");
    }

    const userId = usuario._id;
    console.log("✅ Usuario encontrado:", userId);
    console.log("   Nombre:", usuario.firstName, usuario.lastName);

    // ============================================================
    // PASO 2: LIMPIAR INSIGNIAS Y PROGRESO DEL USUARIO
    // ============================================================
    console.log("\n🗑️  PASO 2: Limpiar insignias y progreso...");

    const deleteBadges = await db
      .collection("user_badges")
      .deleteMany({ userId: userId });
    console.log(`✅ Insignias eliminadas: ${deleteBadges.deletedCount}`);

    const deleteActivityProgress = await db
      .collection("activity_progress")
      .deleteMany({ userId: userId });
    console.log(
      `✅ Progreso de actividades eliminado: ${deleteActivityProgress.deletedCount}`,
    );

    const deleteSubactivityProgress = await db
      .collection("subactivity_progress")
      .deleteMany({ userId: userId });
    console.log(
      `✅ Progreso de subactividades eliminado: ${deleteSubactivityProgress.deletedCount}`,
    );

    // ============================================================
    // PASO 3: ACTUALIZAR FECHAS EN HORARIOS
    // ============================================================
    console.log("\n📅 PASO 3: Actualizar fechas en horarios...");

    const oldDate = new Date("2026-02-05T06:00:00.000Z");
    const newDate = new Date("2026-02-06T06:00:00.000Z");

    const updateSchedules = await db
      .collection("schedules")
      .updateMany({ date: oldDate }, { $set: { date: newDate } });
    console.log(`✅ Horarios actualizados: ${updateSchedules.modifiedCount}`);

    // ============================================================
    // PASO 4: MAPEAR STICKERS EN STICKER_AWARDS (sin constraint)
    // ============================================================
    console.log("\n🎫 PASO 4: Mapear stickers en sticker_awards...");

    const stickerMappings = [
      { id: "69827f09da40f537463e3a45", stickerId: "69823aced6bd58d3ea14ba73" },
      { id: "69827f09da40f537463e3a46", stickerId: "69823b02d6bd58d3ea14ba77" },
      { id: "69827f09da40f537463e3a41", stickerId: "69823b2ed6bd58d3ea14ba7b" },
      { id: "69827f09da40f537463e3a43", stickerId: "69823b4cd6bd58d3ea14ba7f" },
      { id: "69827f09da40f537463e3a44", stickerId: "69823b79d6bd58d3ea14ba83" },
      { id: "69827f09da40f537463e3a47", stickerId: "69823b96d6bd58d3ea14ba87" },
      { id: "69827f09da40f537463e3a42", stickerId: "69823bd5d6bd58d3ea14ba8d" },
    ];

    let successCount = 0;
    for (const mapping of stickerMappings) {
      try {
        const result = await db
          .collection("sticker_awards")
          .updateOne(
            { _id: new ObjectId(mapping.id) },
            { $set: { stickerId: new ObjectId(mapping.stickerId) } },
          );
        if (result.modifiedCount > 0) successCount++;
      } catch (err) {
        // Ignorar errores de constraint
        console.log(`   ⚠️  ${mapping.id.substring(0, 12)}...`);
      }
    }
    console.log(
      `✅ Stickers procesados: ${successCount}/${stickerMappings.length}`,
    );

    // ============================================================
    // PASO 5: LIMPIAR USER_AWARDS
    // ============================================================
    console.log("\n🏆 PASO 5: Limpiar colección user_awards...");

    const deleteUserAwards = await db.collection("user_awards").deleteMany({});
    console.log(
      `✅ user_awards limpiada: ${deleteUserAwards.deletedCount} documentos`,
    );

    // ============================================================
    // VERIFICACIÓN FINAL
    // ============================================================
    console.log("\n" + "=".repeat(55));
    console.log("✅ VERIFICACIÓN FINAL:");
    console.log("=".repeat(55));

    const badgesCount = await db
      .collection("user_badges")
      .countDocuments({ userId: userId });
    console.log(
      `  📌 Insignias del usuario 18732: ${badgesCount} ${badgesCount === 0 ? "✓" : "✗ (ERROR)"}`,
    );

    const activityProgressCount = await db
      .collection("activity_progress")
      .countDocuments({ userId: userId });
    console.log(
      `  📝 Progreso de actividades: ${activityProgressCount} ${activityProgressCount === 0 ? "✓" : "✗ (ERROR)"}`,
    );

    const subactivityProgressCount = await db
      .collection("subactivity_progress")
      .countDocuments({ userId: userId });
    console.log(
      `  📋 Progreso de subactividades: ${subactivityProgressCount} ${subactivityProgressCount === 0 ? "✓" : "✗ (ERROR)"}`,
    );

    const schedulesWithNewDate = await db
      .collection("schedules")
      .countDocuments({ date: newDate });
    console.log(
      `  📅 Horarios con fecha 2026-02-06: ${schedulesWithNewDate} ✓`,
    );

    const userAwardsCount = await db
      .collection("user_awards")
      .countDocuments({});
    console.log(
      `  🏆 Documentos en user_awards: ${userAwardsCount} ${userAwardsCount === 0 ? "✓" : "✗ (ERROR)"}`,
    );

    console.log("\n" + "=".repeat(55));
    console.log("🎉 ¡LIMPIEZA COMPLETADA!");
    console.log("=".repeat(55) + "\n");
  } catch (error) {
    console.error("\n❌ Error:", error.message);
    process.exit(1);
  } finally {
    await client.close();
  }
}

cleanupDatabase().catch(console.error);
