const mongoose = require("mongoose");
require("dotenv").config();

async function resetProgress() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("Conectado a MongoDB");

    // Limpiar progreso de todos los usuarios
    const userResult = await mongoose.connection.db
      .collection("users")
      .updateMany(
        {},
        {
          $set: {
            earnedStickers: [],
            subActivityProgress: [],
            activityProgress: [],
            totalPoints: 0,
            completedChallenges: 0,
            badges: [],
          },
        },
      );
    console.log("Usuarios actualizados:", userResult.modifiedCount);

    // Limpiar UserAwards (respuestas de retos)
    const awardsResult = await mongoose.connection.db
      .collection("userawards")
      .deleteMany({});
    console.log("UserAwards eliminados:", awardsResult.deletedCount);

    // Limpiar ActivityCompletions
    const completionsResult = await mongoose.connection.db
      .collection("activitycompletions")
      .deleteMany({});
    console.log(
      "ActivityCompletions eliminados:",
      completionsResult.deletedCount,
    );

    // Limpiar StickerAwards del usuario (si existe)
    const stickerAwardsResult = await mongoose.connection.db
      .collection("stickerawards")
      .updateMany({}, { $unset: { userId: "" } });
    console.log("StickerAwards limpiados:", stickerAwardsResult.modifiedCount);

    console.log("✅ Progreso reiniciado exitosamente");

    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error("Error:", error);
    process.exit(1);
  }
}

resetProgress();
