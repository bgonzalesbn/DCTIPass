import { MongoClient } from "mongodb";
import bcrypt from "bcryptjs";

const MONGO_URI =
  process.env.MONGO_URI ||
  "mongodb+srv://bgonzalesbn:N3wP%40ssw0rd2025@cluster.mongodb.net/dctipass?retryWrites=true&w=majority";

async function createTestUsers() {
  const client = new MongoClient(MONGO_URI);

  try {
    await client.connect();
    console.log("✅ Conectado a MongoDB\n");

    const db = client.db("dctipass");
    const usersCollection = db.collection("users");

    // Hash de Test@123
    const hashedPassword = await bcrypt.hash("Test@123", 10);

    // Crear 50 usuarios de prueba
    const testUsers = Array.from({ length: 50 }, (_, i) => ({
      employeeNumber: String(18000 + i),
      email: `testuser${18000 + i}@example.com`,
      name: `Test User ${18000 + i}`,
      password: hashedPassword,
      department: "IT",
      active: true,
      activityProgress: [],
      subActivityProgress: [],
      earnedStickers: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    }));

    // Insertar usuarios
    console.log(`📍 Insertando ${testUsers.length} usuarios de prueba...`);
    const result = await usersCollection.insertMany(testUsers, {
      ordered: false,
    });

    console.log(`✅ ${result.insertedCount} usuarios creados`);

    // Verificar que se crearon
    const count = await usersCollection.countDocuments({
      employeeNumber: { $gte: "18000", $lte: "18049" },
    });

    console.log(`\n📊 Usuarios de prueba disponibles: ${count}`);
    console.log(`   IDs de empleado: 18000 - 18049`);
    console.log(`   Contraseña: Test@123`);
  } catch (error) {
    if (error.code === 11000) {
      console.log("⚠️  Algunos usuarios ya existen (ignoring duplicates)");
      const count = await db
        .collection("users")
        .countDocuments({ employeeNumber: { $gte: "18000", $lte: "18049" } });
      console.log(`✅ Usuarios de prueba disponibles: ${count}`);
    } else {
      console.error("❌ Error al crear usuarios:", error.message);
      process.exit(1);
    }
  } finally {
    await client.close();
    console.log("\n✅ Conexión cerrada\n");
  }
}

createTestUsers();
