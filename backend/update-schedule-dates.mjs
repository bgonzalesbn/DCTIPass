import { MongoClient } from "mongodb";

const MONGODB_URI =
  "mongodb+srv://ITExperience:itexperience%2E2025@cluster0.atplvzn.mongodb.net/ITExperience?appName=Cluster0";
const DB_NAME = "ITExperience";

async function updateScheduleDates() {
  const client = new MongoClient(MONGODB_URI);

  try {
    console.log("🔗 Conectando a MongoDB Atlas...");
    await client.connect();
    const db = client.db(DB_NAME);

    // ============================================================
    // PASO 1: VERIFICAR SCHEDULES ACTUALES
    // ============================================================
    console.log("\n📊 PASO 1: Inspeccionar documentos actuales...");

    const totalSchedules = await db.collection("schedule").countDocuments({});
    console.log(`Total de documentos en schedule: ${totalSchedules}`);

    if (totalSchedules === 0) {
      console.log("❌ La colección schedule está vacía");
      return;
    }

    const sampleSchedules = await db
      .collection("schedule")
      .find({})
      .limit(3)
      .toArray();
    console.log("\n📅 Primeros 3 documentos:");
    sampleSchedules.forEach((doc, i) => {
      console.log(`  ${i + 1}. _id: ${doc._id}`);
      console.log(`     date actual: ${doc.date}`);
    });

    // ============================================================
    // PASO 2: ACTUALIZAR TODAS LAS FECHAS
    // ============================================================
    console.log("\n" + "=".repeat(60));
    console.log("🔄 PASO 2: Actualizando todas las fechas...");
    console.log("=".repeat(60));

    const newDate = new Date("2026-02-06T06:00:00.000Z");

    const result = await db.collection("schedule").updateMany(
      {}, // Todos los documentos
      { $set: { date: newDate } },
    );

    console.log(`✅ Documentos modificados: ${result.modifiedCount}`);
    console.log(`   Nueva fecha: ${newDate.toISOString()}`);

    // ============================================================
    // PASO 3: VERIFICACIÓN FINAL
    // ============================================================
    console.log("\n" + "=".repeat(60));
    console.log("✅ VERIFICACIÓN FINAL:");
    console.log("=".repeat(60));

    const verifySchedules = await db
      .collection("schedule")
      .find({})
      .limit(5)
      .toArray();

    let allUpdated = true;
    verifySchedules.forEach((doc, i) => {
      const isCorrect = doc.date.toISOString() === newDate.toISOString();
      console.log(`📅 Documento ${i + 1}:`);
      console.log(`   Fecha: ${doc.date.toISOString()}`);
      console.log(`   Estado: ${isCorrect ? "✓ Correcto" : "✗ Error"}`);
      if (!isCorrect) allUpdated = false;
    });

    console.log("\n" + "=".repeat(60));
    if (allUpdated && result.modifiedCount > 0) {
      console.log("🎉 ¡ACTUALIZACIÓN COMPLETADA EXITOSAMENTE!");
      console.log(
        `   ${result.modifiedCount} documentos actualizados con fecha 2026-02-06T06:00:00Z`,
      );
    } else {
      console.log(
        "⚠️  Verifica que todos los documentos se actualizaron correctamente",
      );
    }
    console.log("=".repeat(60) + "\n");
  } catch (error) {
    console.error("\n❌ Error:", error.message);
    process.exit(1);
  } finally {
    await client.close();
  }
}

updateScheduleDates().catch(console.error);
