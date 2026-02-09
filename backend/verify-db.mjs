import { MongoClient, ObjectId } from "mongodb";

const MONGODB_URI =
  "mongodb+srv://ITExperience:itexperience%2E2025@cluster0.atplvzn.mongodb.net/ITExperience?appName=Cluster0";
const DB_NAME = "ITExperience";

async function verifyDatabase() {
  const client = new MongoClient(MONGODB_URI);

  try {
    console.log("🔗 Conectando a MongoDB Atlas...");
    await client.connect();
    const db = client.db(DB_NAME);

    // Verificar conexión
    const adminDb = client.db("admin");
    const result = await adminDb.command({ ping: 1 });
    console.log("✅ Conexión exitosa a MongoDB");

    // PASO 1: Obtener usuario 18732
    console.log("\n📋 Buscando usuario con IdEmployee 18732...");
    const usuario = await db
      .collection("users")
      .findOne({ employeeNumber: "18732" });

    if (!usuario) {
      console.log("❌ Usuario NO encontrado con employeeNumber 18732");
      console.log("\n🔍 Usuarios en la BD:");
      const allUsers = await db.collection("users").find({}).limit(5).toArray();
      console.log(
        allUsers.map((u) => ({
          _id: u._id,
          employeeNumber: u.employeeNumber,
          firstName: u.firstName,
        })),
      );
      return;
    }

    const userId = usuario._id;
    console.log("✅ Usuario encontrado:", userId);
    console.log("   Nombre:", usuario.firstName, usuario.lastName);
    console.log("   IdEmployee:", usuario.employeeNumber);

    // PASO 2: Verificar colecciones
    console.log("\n📊 ESTADO ACTUAL DE COLECCIONES:");
    console.log("=".repeat(55));

    const userBadges = await db
      .collection("user_badges")
      .countDocuments({ userId: userId });
    console.log(`📌 user_badges para usuario 18732: ${userBadges}`);
    if (userBadges > 0) {
      const sample = await db
        .collection("user_badges")
        .findOne({ userId: userId });
      console.log("   Ejemplo:", sample);
    }

    const activityProgress = await db
      .collection("activity_progress")
      .countDocuments({ userId: userId });
    console.log(`📝 activity_progress para usuario 18732: ${activityProgress}`);
    if (activityProgress > 0) {
      const sample = await db
        .collection("activity_progress")
        .findOne({ userId: userId });
      console.log("   Ejemplo:", sample);
    }

    const subactivityProgress = await db
      .collection("subactivity_progress")
      .countDocuments({ userId: userId });
    console.log(
      `📋 subactivity_progress para usuario 18732: ${subactivityProgress}`,
    );
    if (subactivityProgress > 0) {
      const sample = await db
        .collection("subactivity_progress")
        .findOne({ userId: userId });
      console.log("   Ejemplo:", sample);
    }

    const userAwards = await db.collection("user_awards").countDocuments({});
    console.log(`🏆 user_awards (total): ${userAwards}`);

    const schedules = await db
      .collection("schedules")
      .countDocuments({ date: new Date("2026-02-06T06:00:00.000Z") });
    console.log(`📅 schedules con fecha 2026-02-06: ${schedules}`);

    const schedulesOldDate = await db
      .collection("schedules")
      .countDocuments({ date: new Date("2026-02-05T06:00:00.000Z") });
    console.log(`📅 schedules con fecha 2026-02-05: ${schedulesOldDate}`);

    // Verificar índices
    console.log("\n🔍 ÍNDICES EN COLECCIONES:");
    console.log("=".repeat(55));
    const stickerAwardsIndexes = await db
      .collection("sticker_awards")
      .getIndexes();
    console.log("Índices en sticker_awards:");
    Object.entries(stickerAwardsIndexes).forEach(([name, spec]) => {
      console.log(`  - ${name}:`, spec);
    });
  } catch (error) {
    console.error("\n❌ Error:", error.message);
    console.error("Stack:", error.stack);
  } finally {
    await client.close();
    console.log("\n✅ Desconectado de MongoDB");
  }
}

verifyDatabase();
