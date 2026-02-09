import { MongoClient } from "mongodb";

const MONGODB_URI =
  "mongodb+srv://ITExperience:itexperience%2E2025@cluster0.atplvzn.mongodb.net/ITExperience?appName=Cluster0";
const DB_NAME = "ITExperience";

async function inspectSchedules() {
  const client = new MongoClient(MONGODB_URI);

  try {
    console.log("🔗 Conectando a MongoDB...");
    await client.connect();
    const db = client.db(DB_NAME);

    console.log("\n📊 INSPECCIÓN DE SCHEDULES:");
    console.log("=".repeat(60));

    const totalSchedules = await db.collection("schedules").countDocuments({});
    console.log(`Total de schedules en BD: ${totalSchedules}`);

    if (totalSchedules === 0) {
      console.log("❌ La colección de schedules está VACÍA");
    } else {
      console.log("\n📅 Primeros 10 schedules:");
      const schedules = await db
        .collection("schedules")
        .find({})
        .limit(10)
        .toArray();
      schedules.forEach((schedule, i) => {
        console.log(`  ${i + 1}. ID: ${schedule._id}`);
        console.log(`     Fecha: ${schedule.date}`);
        console.log(`     Tipo: ${typeof schedule.date}`);
      });

      // Mostrar fechas únicas
      console.log("\n🗓️  Fechas únicas en schedules:");
      const uniqueDates = await db
        .collection("schedules")
        .aggregate([
          { $group: { _id: "$date", count: { $sum: 1 } } },
          { $sort: { count: -1 } },
          { $limit: 10 },
        ])
        .toArray();

      uniqueDates.forEach((item) => {
        console.log(`  - ${item._id} (${item.count} documentos)`);
      });
    }

    console.log("\n" + "=".repeat(60));
  } catch (error) {
    console.error("❌ Error:", error.message);
  } finally {
    await client.close();
  }
}

inspectSchedules();
