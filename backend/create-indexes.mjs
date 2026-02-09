import { MongoClient } from "mongodb";

const MONGO_URI =
  process.env.MONGO_URI ||
  "mongodb+srv://bgonzalesbn:N3wP%40ssw0rd2025@cluster.mongodb.net/dctipass?retryWrites=true&w=majority";

async function createIndexes() {
  const client = new MongoClient(MONGO_URI);

  try {
    await client.connect();
    console.log("✅ Conectado a MongoDB");

    const db = client.db("dctipass");

    // Crear índices para Activities
    console.log("\n📍 Creando índices para 'activities'...");
    await db.collection("activities").createIndex({ active: 1 });
    console.log("  ✓ Índice en 'active' creado");

    await db.collection("activities").createIndex({ name: 1 });
    console.log("  ✓ Índice en 'name' creado");

    // Crear índices para Stickers
    console.log("\n📍 Creando índices para 'stickers'...");
    await db.collection("stickers").createIndex({ _id: 1 });
    console.log("  ✓ Índice en '_id' creado");

    await db.collection("stickers").createIndex({ name: 1 });
    console.log("  ✓ Índice en 'name' creado");

    // Crear índices para Users
    console.log("\n📍 Creando índices para 'users'...");
    await db
      .collection("users")
      .createIndex({ employeeNumber: 1 }, { unique: true });
    console.log("  ✓ Índice único en 'employeeNumber' creado");

    await db.collection("users").createIndex({ email: 1 }, { unique: true });
    console.log("  ✓ Índice único en 'email' creado");

    // Crear índices para Schedules
    console.log("\n📍 Creando índices para 'schedules'...");
    await db.collection("schedules").createIndex({ date: 1 });
    console.log("  ✓ Índice en 'date' creado");

    await db.collection("schedules").createIndex({ activityId: 1 });
    console.log("  ✓ Índice en 'activityId' creado");

    // Crear índices para ActivityProgress
    console.log("\n📍 Creando índices para 'activity_progress'...");
    await db.collection("activity_progress").createIndex({ userId: 1 });
    console.log("  ✓ Índice en 'userId' creado");

    await db.collection("activity_progress").createIndex({ activityId: 1 });
    console.log("  ✓ Índice en 'activityId' creado");

    console.log("\n✅ Todos los índices han sido creados exitosamente");
    console.log("   Mejora esperada: Queries 10x más rápidas");
  } catch (error) {
    console.error("❌ Error al crear índices:", error.message);
    process.exit(1);
  } finally {
    await client.close();
    console.log("\n✅ Conexión cerrada");
  }
}

createIndexes();
