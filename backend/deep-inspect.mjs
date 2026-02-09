import { MongoClient, ObjectId } from "mongodb";

const MONGODB_URI =
  "mongodb+srv://ITExperience:itexperience%2E2025@cluster0.atplvzn.mongodb.net/ITExperience?appName=Cluster0";
const DB_NAME = "ITExperience";

async function deepInspect() {
  const client = new MongoClient(MONGODB_URI);

  try {
    console.log("🔗 Conectando a MongoDB Atlas...");
    await client.connect();
    const db = client.db(DB_NAME);

    // PASO 1: Obtener usuario
    console.log("\n📋 Buscando usuario con employeeNumber 18732...");
    const usuario = await db
      .collection("users")
      .findOne({ employeeNumber: "18732" });

    if (!usuario) {
      console.log("❌ Usuario NO encontrado");
      return;
    }

    const userId = usuario._id;
    console.log("✅ Usuario encontrado:");
    console.log(`   _id: ${userId}`);
    console.log(`   firstName: ${usuario.firstName}`);
    console.log(`   lastName: ${usuario.lastName}`);
    console.log(`   employeeNumber: ${usuario.employeeNumber}`);

    // PASO 2: Inspeccionar TODAS las colecciones
    console.log("\n" + "=".repeat(70));
    console.log("📊 BÚSQUEDA EN TODAS LAS COLECCIONES:");
    console.log("=".repeat(70));

    const collections = [
      "users",
      "user_badges",
      "activity_progress",
      "subactivity_progress",
      "earned_stickers",
      "sticker_awards",
      "user_awards",
      "challenge_progress",
      "schecule",
      "schedules",
      "activities",
      "badges",
      "group_membership",
    ];

    for (const collName of collections) {
      try {
        // Contar documentos con userId = userId
        const count1 = await db
          .collection(collName)
          .countDocuments({ userId: userId });

        // Contar documentos con userId = string del ID
        const count2 = await db
          .collection(collName)
          .countDocuments({ userId: userId.toString() });

        // Contar documentos con user = userId
        const count3 = await db
          .collection(collName)
          .countDocuments({ user: userId });

        // Contar documentos con _id = userId
        const count4 = await db
          .collection(collName)
          .countDocuments({ _id: userId });

        const totalDocs = await db.collection(collName).countDocuments({});

        console.log(`\n🔍 Colección: ${collName}`);
        console.log(`   Total documentos: ${totalDocs}`);

        if (count1 > 0) {
          console.log(`   ✅ Con userId (ObjectId): ${count1}`);
          const sample = await db
            .collection(collName)
            .findOne({ userId: userId });
          console.log(
            `      Ejemplo:`,
            JSON.stringify(sample, null, 2).substring(0, 300),
          );
        }

        if (count2 > 0) {
          console.log(`   ✅ Con userId (String): ${count2}`);
          const sample = await db
            .collection(collName)
            .findOne({ userId: userId.toString() });
          console.log(
            `      Ejemplo:`,
            JSON.stringify(sample, null, 2).substring(0, 300),
          );
        }

        if (count3 > 0) {
          console.log(`   ✅ Con user (ObjectId): ${count3}`);
          const sample = await db
            .collection(collName)
            .findOne({ user: userId });
          console.log(
            `      Ejemplo:`,
            JSON.stringify(sample, null, 2).substring(0, 300),
          );
        }

        if (count4 > 0) {
          console.log(`   ✅ Con _id: ${count4}`);
        }

        if (
          count1 === 0 &&
          count2 === 0 &&
          count3 === 0 &&
          count4 === 0 &&
          totalDocs > 0
        ) {
          console.log(`   ❌ No hay documentos con userId = ${userId}`);
          // Mostrar primero doc para ver estructura
          const first = await db.collection(collName).findOne({});
          if (first) {
            console.log(
              `   📄 Estructura primer documento:`,
              Object.keys(first).join(", "),
            );
          }
        }
      } catch (err) {
        console.log(`   ⚠️  Error: ${err.message}`);
      }
    }
  } catch (error) {
    console.error("\n❌ Error:", error.message);
  } finally {
    await client.close();
  }
}

deepInspect();
