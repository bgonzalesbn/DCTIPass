import { MongoClient } from "mongodb";

const MONGODB_URI =
  "mongodb+srv://ITExperience:itexperience%2E2025@cluster0.atplvzn.mongodb.net/ITExperience?appName=Cluster0";
const DB_NAME = "ITExperience";
const INDEX_NAME = "userId_1_stickerId_1";

async function fixStickerAwardsIndex() {
  const client = new MongoClient(MONGODB_URI);

  try {
    console.log("🔗 Conectando a MongoDB Atlas...");
    await client.connect();
    const db = client.db(DB_NAME);
    const collection = db.collection("sticker_awards");

    const indexes = await collection.indexes();
    const hasIndex = indexes.some((index) => index.name === INDEX_NAME);

    if (hasIndex) {
      console.log(`🧹 Eliminando indice ${INDEX_NAME}...`);
      await collection.dropIndex(INDEX_NAME);
      console.log("✅ Indice eliminado");
    } else {
      console.log("ℹ️  Indice no existe, se creara el nuevo.");
    }

    console.log("🛠️  Creando indice parcial userId+stickerId...");
    await collection.createIndex(
      { userId: 1, stickerId: 1 },
      {
        unique: true,
        partialFilterExpression: {
          userId: { $exists: true, $type: "objectId" },
          stickerId: { $exists: true, $type: "objectId" },
        },
      },
    );
    console.log("✅ Indice parcial creado");
  } catch (error) {
    console.error("❌ Error ajustando indices:", error);
    process.exitCode = 1;
  } finally {
    await client.close();
  }
}

fixStickerAwardsIndex().catch((error) => {
  console.error("❌ Error inesperado:", error);
  process.exit(1);
});
