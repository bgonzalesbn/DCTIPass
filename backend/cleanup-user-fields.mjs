import { MongoClient } from "mongodb";

const MONGODB_URI =
  "mongodb+srv://ITExperience:itexperience%2E2025@cluster0.atplvzn.mongodb.net/ITExperience?appName=Cluster0";
const DB_NAME = "ITExperience";

async function cleanupUserDocument() {
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

    console.log("✅ Usuario encontrado:");
    console.log(`   ID: ${usuario._id}`);
    console.log(`   Nombre: ${usuario.firstName} ${usuario.lastName}`);
    console.log(`   earnedStickers: ${usuario.earnedStickers?.length || 0}`);
    console.log(
      `   activityProgress: ${usuario.activityProgress?.length || 0}`,
    );
    console.log(
      `   subActivityProgress: ${usuario.subActivityProgress?.length || 0}`,
    );

    // ============================================================
    // PASO 2: LIMPIAR ARRAYS DENTRO DEL DOCUMENTO
    // ============================================================
    console.log("\n🗑️  PASO 2: Limpiar arrays de progreso y stickers...");

    const result = await db.collection("users").updateOne(
      { employeeNumber: "18732" },
      {
        $set: {
          earnedStickers: [],
          activityProgress: [],
          subActivityProgress: [],
          totalPoints: 0,
          completedChallenges: 0,
        },
      },
    );

    console.log(`✅ Documentos actualizados: ${result.modifiedCount}`);

    // ============================================================
    // VERIFICACIÓN FINAL
    // ============================================================
    console.log("\n" + "=".repeat(60));
    console.log("✅ VERIFICACIÓN FINAL:");
    console.log("=".repeat(60));

    const usuarioActualizado = await db
      .collection("users")
      .findOne({ employeeNumber: "18732" });

    console.log(
      `📌 earnedStickers: ${usuarioActualizado.earnedStickers?.length || 0} ${usuarioActualizado.earnedStickers?.length === 0 ? "✓" : "✗"}`,
    );
    console.log(
      `📝 activityProgress: ${usuarioActualizado.activityProgress?.length || 0} ${usuarioActualizado.activityProgress?.length === 0 ? "✓" : "✗"}`,
    );
    console.log(
      `📋 subActivityProgress: ${usuarioActualizado.subActivityProgress?.length || 0} ${usuarioActualizado.subActivityProgress?.length === 0 ? "✓" : "✗"}`,
    );
    console.log(
      `⭐ totalPoints: ${usuarioActualizado.totalPoints || 0} ${usuarioActualizado.totalPoints === 0 ? "✓" : "✗"}`,
    );
    console.log(
      `🏆 completedChallenges: ${usuarioActualizado.completedChallenges || 0} ${usuarioActualizado.completedChallenges === 0 ? "✓" : "✗"}`,
    );

    console.log("\n" + "=".repeat(60));
    console.log("🎉 ¡LIMPIEZA COMPLETADA!");
    console.log("=".repeat(60));
    console.log("\n✨ Ahora limpia el localStorage en el navegador:");
    console.log("   1. Abre DevTools (F12)");
    console.log("   2. Application → Local Storage");
    console.log("   3. Haz clic derecho en el URL → Delete");
    console.log("   4. Presiona Ctrl + Shift + R (hard refresh)");
    console.log("   5. Haz login nuevamente\n");
  } catch (error) {
    console.error("\n❌ Error:", error.message);
    process.exit(1);
  } finally {
    await client.close();
  }
}

cleanupUserDocument().catch(console.error);
