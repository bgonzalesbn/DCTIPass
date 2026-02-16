import { MongoClient } from "mongodb";

const MONGODB_URI =
  "mongodb+srv://ITExperience:itexperience%2E2025@cluster0.atplvzn.mongodb.net/ITExperience?appName=Cluster0";
const DB_NAME = "ITExperience";
const EMPLOYEE_NUMBER = process.argv[2];
const DELETE_USER = process.argv.includes("--delete-user");

if (!EMPLOYEE_NUMBER) {
  console.error(
    "Uso: node cleanup-user-fields.mjs <employeeNumber> [--delete-user]",
  );
  process.exit(1);
}

async function cleanupUserDocument() {
  const client = new MongoClient(MONGODB_URI);

  try {
    console.log("🔗 Conectando a MongoDB Atlas...");
    await client.connect();
    const db = client.db(DB_NAME);

    // ============================================================
    // PASO 1: OBTENER USUARIO 18732
    // ============================================================
    console.log(
      `\n📋 PASO 1: Obtener usuario con employeeNumber ${EMPLOYEE_NUMBER}...`,
    );
    const usuario = await db
      .collection("users")
      .findOne({ employeeNumber: EMPLOYEE_NUMBER });

    if (!usuario) {
      throw new Error(
        `❌ Usuario con employeeNumber ${EMPLOYEE_NUMBER} no encontrado`,
      );
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
      { employeeNumber: EMPLOYEE_NUMBER },
      {
        $set: {
          earnedStickers: [],
          activityProgress: [],
          subActivityProgress: [],
          totalPoints: 0,
          completedChallenges: 0,
          clarityResponses: [],
        },
      },
    );

    console.log(`✅ Documentos actualizados: ${result.modifiedCount}`);

    // ============================================================
    // PASO 3: ELIMINAR RESPUESTAS DE RETOS Y COMPLETADOS
    // ============================================================
    console.log("\n🧹 PASO 3: Limpiar respuestas de retos y completados...");

    const userAwardsResult = await db.collection("userawards").deleteMany({
      userId: usuario._id,
    });
    console.log(`✅ userawards eliminados: ${userAwardsResult.deletedCount}`);

    const activityCompletionsResult = await db
      .collection("activitycompletions")
      .deleteMany({ userId: usuario._id });
    console.log(
      `✅ activitycompletions eliminados: ${activityCompletionsResult.deletedCount}`,
    );

    // ============================================================
    // PASO 4: LIMPIEZA PROFUNDA EN TODA LA BD (POR userId / employeeNumber)
    // ============================================================
    console.log("\n🧼 PASO 4: Limpieza profunda en colecciones...");
    const collections = await db.listCollections().toArray();
    for (const col of collections) {
      const name = col.name;
      if (name === "users") continue; // no borrar el usuario

      const byUserId = await db.collection(name).deleteMany({
        userId: usuario._id,
      });
      const byEmployee = await db.collection(name).deleteMany({
        employeeNumber: EMPLOYEE_NUMBER,
      });

      if (byUserId.deletedCount || byEmployee.deletedCount) {
        console.log(
          `✅ ${name}: userId=${byUserId.deletedCount}, employeeNumber=${byEmployee.deletedCount}`,
        );
      }
    }

    // ============================================================
    // VERIFICACIÓN FINAL
    // ============================================================
    console.log("\n" + "=".repeat(60));
    console.log("✅ VERIFICACIÓN FINAL:");
    console.log("=".repeat(60));

    const usuarioActualizado = await db
      .collection("users")
      .findOne({ employeeNumber: EMPLOYEE_NUMBER });

    if (!usuarioActualizado) {
      console.log(
        "⚠️ Usuario no encontrado tras la limpieza, ¿ya fue eliminado?",
      );
    } else {
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
    }

    if (DELETE_USER) {
      console.log("\n🧨 Eliminando documento de usuario...");
      const deleteResult = await db.collection("users").deleteOne({
        _id: usuario._id,
      });
      console.log(`✅ Usuario eliminado: ${deleteResult.deletedCount}`);
    }

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
