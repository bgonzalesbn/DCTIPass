const mongoose = require("mongoose");

const mongoUri =
  "mongodb+srv://ITExperience:itexperience.2025@cluster0.atplvzn.mongodb.net/ITExperience?appName=Cluster0";

async function cleanCollections() {
  try {
    console.log("🔌 Conectando a MongoDB...");
    await mongoose.connect(mongoUri);

    const db = mongoose.connection;

    console.log("🗑️  Eliminando documentos de users...");
    const usersResult = await db.collection("users").deleteMany({});
    console.log(
      `✅ Eliminados ${usersResult.deletedCount} documentos de users`,
    );

    console.log("🗑️  Eliminando documentos de auth_credentials...");
    const authResult = await db.collection("auth_credentials").deleteMany({});
    console.log(
      `✅ Eliminados ${authResult.deletedCount} documentos de auth_credentials`,
    );

    console.log("\n✨ Limpieza completada exitosamente");

    await mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.error("❌ Error durante la limpieza:", error);
    process.exit(1);
  }
}

cleanCollections();
