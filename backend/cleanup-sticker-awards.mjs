import { MongoClient } from "mongodb";

const MONGODB_URI =
  "mongodb+srv://ITExperience:itexperience%2E2025@cluster0.atplvzn.mongodb.net/ITExperience?appName=Cluster0";
const DB_NAME = "ITExperience";

async function cleanupStickerAwards() {
  const client = new MongoClient(MONGODB_URI);

  try {
    console.log("🔗 Conectando a MongoDB Atlas...");
    await client.connect();
    const db = client.db(DB_NAME);

    console.log("🗑️  Eliminando todos los documentos de sticker_awards...");
    const result = await db.collection("sticker_awards").deleteMany({});
    console.log(`✅ sticker_awards eliminadas: ${result.deletedCount}`);

    const remaining = await db.collection("sticker_awards").countDocuments({});
    console.log(`🔎 sticker_awards restantes: ${remaining}`);
  } catch (error) {
    console.error("❌ Error durante la limpieza:", error);
    process.exitCode = 1;
  } finally {
    await client.close();
  }
}

cleanupStickerAwards().catch((error) => {
  console.error("❌ Error inesperado:", error);
  process.exit(1);
});
