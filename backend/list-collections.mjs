import { MongoClient } from "mongodb";

const MONGODB_URI =
  "mongodb+srv://ITExperience:itexperience%2E2025@cluster0.atplvzn.mongodb.net/ITExperience?appName=Cluster0";
const DB_NAME = "ITExperience";

async function listCollections() {
  const client = new MongoClient(MONGODB_URI);

  try {
    console.log("🔗 Conectando a MongoDB Atlas...");
    await client.connect();
    const db = client.db(DB_NAME);

    console.log("\n📋 COLECCIONES EN LA BASE DE DATOS:");
    console.log("=".repeat(60));

    const collections = await db.listCollections().toArray();

    for (const collection of collections) {
      const count = await db.collection(collection.name).countDocuments({});
      console.log(`  - ${collection.name}: ${count} documentos`);
    }

    console.log("=".repeat(60) + "\n");
  } catch (error) {
    console.error("\n❌ Error:", error.message);
  } finally {
    await client.close();
  }
}

listCollections();
