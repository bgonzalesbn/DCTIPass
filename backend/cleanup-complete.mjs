import { MongoClient, ObjectId } from "mongodb";

const MONGODB_URI =
  "mongodb+srv://ITExperience:itexperience%2E2025@cluster0.atplvzn.mongodb.net/ITExperience?appName=Cluster0";
const DB_NAME = "ITExperience";

async function cleanupUserCompletely() {
  const client = new MongoClient(MONGODB_URI);

  try {
    console.log("🔗 Conectando a MongoDB Atlas...");
    await client.connect();
    const db = client.db(DB_NAME);

    // ============================================================
    // PASO 1: OBTENER USUARIO 18732
    // ============================================================
    console.log("\n📋 PASO 1: Obtener usuario con employeeNumber 18732...");
    const usuario = await db
      .collection("users")
      .findOne({ employeeNumber: "18732" });

    if (!usuario) {
      throw new Error("❌ Usuario con employeeNumber 18732 no encontrado");
    }

    const userId = new ObjectId(usuario._id);
    console.log("✅ Usuario encontrado:", userId);
    console.log("   Nombre:", usuario.firstName, usuario.lastName);

    // ============================================================
    // PASO 2: LIMPIAR TODO PROGRESO Y DATOS DEL USUARIO
    // ============================================================
    console.log("\n🗑️  PASO 2: Eliminando todos los datos del usuario...");

    // Limpiar user_badges
    const deleteBadges = await db
      .collection("user_badges")
      .deleteMany({ userId: userId });
    console.log(`✅ user_badges eliminadas: ${deleteBadges.deletedCount}`);

    // Limpiar activity_progress
    const deleteActivityProgress = await db
      .collection("activity_progress")
      .deleteMany({ userId: userId });
    console.log(
      `✅ activity_progress eliminada: ${deleteActivityProgress.deletedCount}`,
    );

    // Limpiar subactivity_progress
    const deleteSubactivityProgress = await db
      .collection("subactivity_progress")
      .deleteMany({ userId: userId });
    console.log(
      `✅ subactivity_progress eliminada: ${deleteSubactivityProgress.deletedCount}`,
    );

    // Limpiar earned_stickers
    const deleteEarnedStickers = await db
      .collection("earned_stickers")
      .deleteMany({ userId: userId });
    console.log(
      `✅ earned_stickers eliminadas: ${deleteEarnedStickers.deletedCount}`,
    );

    // Limpiar sticker_awards
    const deleteStickerAwards = await db
      .collection("sticker_awards")
      .deleteMany({ userId: userId });
    console.log(
      `✅ sticker_awards eliminadas: ${deleteStickerAwards.deletedCount}`,
    );

    // Limpiar user_awards
    const deleteUserAwards = await db
      .collection("user_awards")
      .deleteMany({ userId: userId });
    console.log(`✅ user_awards eliminadas: ${deleteUserAwards.deletedCount}`);

    // Limpiar challenge_progress
    const deleteChallengeProgress = await db
      .collection("challenge_progress")
      .deleteMany({ userId: userId });
    console.log(
      `✅ challenge_progress eliminada: ${deleteChallengeProgress.deletedCount}`,
    );

    // ============================================================
    // PASO 3: ACTUALIZAR SCHEDULES
    // ============================================================
    console.log("\n📅 PASO 3: Actualizar schedules...");

    // Buscar primero qué schedules existen
    const existingSchedules = await db
      .collection("schecule")
      .countDocuments({});
    console.log(`📊 Total de schedules en la BD: ${existingSchedules}`);

    if (existingSchedules > 0) {
      const oldDate = new Date("2026-02-05T06:00:00.000Z");
      const newDate = new Date("2026-02-06T06:00:00.000Z");

      const updateSchedules = await db
        .collection("schecule")
        .updateMany({ date: oldDate }, { $set: { date: newDate } });
      console.log(
        `✅ Schedules actualizados: ${updateSchedules.modifiedCount}`,
      );
    }

    // ============================================================
    // VERIFICACIÓN FINAL
    // ============================================================
    console.log("\n" + "=".repeat(60));
    console.log("✅ VERIFICACIÓN FINAL:");
    console.log("=".repeat(60));

    const finalBadges = await db
      .collection("user_badges")
      .countDocuments({ userId: userId });
    console.log(
      `📌 user_badges restantes: ${finalBadges} ${finalBadges === 0 ? "✓" : "✗ ERROR"}`,
    );

    const finalActivityProgress = await db
      .collection("activity_progress")
      .countDocuments({ userId: userId });
    console.log(
      `📝 activity_progress restante: ${finalActivityProgress} ${finalActivityProgress === 0 ? "✓" : "✗ ERROR"}`,
    );

    const finalSubactivityProgress = await db
      .collection("subactivity_progress")
      .countDocuments({ userId: userId });
    console.log(
      `📋 subactivity_progress restante: ${finalSubactivityProgress} ${finalSubactivityProgress === 0 ? "✓" : "✗ ERROR"}`,
    );

    const finalEarnedStickers = await db
      .collection("earned_stickers")
      .countDocuments({ userId: userId });
    console.log(
      `🎫 earned_stickers restantes: ${finalEarnedStickers} ${finalEarnedStickers === 0 ? "✓" : "✗ ERROR"}`,
    );

    const finalStickerAwards = await db
      .collection("sticker_awards")
      .countDocuments({ userId: userId });
    console.log(
      `🎖️  sticker_awards restantes: ${finalStickerAwards} ${finalStickerAwards === 0 ? "✓" : "✗ ERROR"}`,
    );

    const finalUserAwards = await db
      .collection("user_awards")
      .countDocuments({ userId: userId });
    console.log(
      `🏆 user_awards restantes: ${finalUserAwards} ${finalUserAwards === 0 ? "✓" : "✗ ERROR"}`,
    );

    const finalChallengeProgress = await db
      .collection("challenge_progress")
      .countDocuments({ userId: userId });
    console.log(
      `⚔️  challenge_progress restante: ${finalChallengeProgress} ${finalChallengeProgress === 0 ? "✓" : "✗ ERROR"}`,
    );

    console.log("\n" + "=".repeat(60));
    console.log("🎉 ¡LIMPIEZA COMPLETADA!");
    console.log("=".repeat(60) + "\n");
  } catch (error) {
    console.error("\n❌ Error:", error.message);
    process.exit(1);
  } finally {
    await client.close();
  }
}

cleanupUserCompletely().catch(console.error);
