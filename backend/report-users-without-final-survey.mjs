import "dotenv/config";
import { MongoClient } from "mongodb";

const MONGODB_URI = process.env.MONGODB_URI;
const DB_NAME = process.env.DB_NAME || "ITExperience";
const IT_ACTIVITY_NAME = process.env.IT_ACTIVITY_NAME || "IT Experience";

if (!MONGODB_URI) {
  console.error("❌ Falta la variable de entorno MONGODB_URI");
  process.exit(1);
}

async function run() {
  const client = new MongoClient(MONGODB_URI);

  try {
    console.log("🔗 Conectando a MongoDB...");
    await client.connect();
    const db = client.db(DB_NAME);

    const activity = await db.collection("activities").findOne({
      name: IT_ACTIVITY_NAME,
      active: true,
    });

    if (!activity?._id) {
      throw new Error(
        `No se encontró la actividad activa \"${IT_ACTIVITY_NAME}\"`,
      );
    }

    const activeUsers = await db
      .collection("users")
      .find({ active: true, deletedAt: null })
      .project({ employeeNumber: 1, firstName: 1, lastName: 1, email: 1 })
      .toArray();

    const responses = await db
      .collection("final_survey_responses")
      .find({ activityId: activity._id })
      .project({ userId: 1 })
      .toArray();

    const respondedUserIdSet = new Set(
      responses.map((response) => response.userId?.toString()).filter(Boolean),
    );

    const missingUsers = activeUsers
      .filter((user) => !respondedUserIdSet.has(user._id.toString()))
      .sort((a, b) =>
        (a.employeeNumber || "").localeCompare(b.employeeNumber || ""),
      );

    console.log("\n📊 Resultado de revisión (users vs final_survey_responses)");
    console.log(`- Actividad evaluada: ${IT_ACTIVITY_NAME}`);
    console.log(`- Usuarios activos totales: ${activeUsers.length}`);
    console.log(`- Usuarios con encuesta final: ${respondedUserIdSet.size}`);
    console.log(`- Usuarios SIN encuesta final: ${missingUsers.length}`);

    if (missingUsers.length > 0) {
      console.log("\n🧾 Usuarios sin encuesta final:");
      for (const user of missingUsers) {
        console.log(
          `- ${user.employeeNumber || "N/A"} | ${user.firstName || ""} ${user.lastName || ""} | ${user.email || "sin-email"}`,
        );
      }
    }
  } catch (error) {
    console.error("\n❌ Error:", error);
    process.exit(1);
  } finally {
    await client.close();
  }
}

run().catch((error) => {
  console.error("\n❌ Error fatal:", error);
  process.exit(1);
});
