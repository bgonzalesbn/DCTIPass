import "dotenv/config";
import { MongoClient, ObjectId } from "mongodb";

const MONGODB_URI = process.env.MONGODB_URI;
const DB_NAME = process.env.DB_NAME || "ITExperience";
const IT_ACTIVITY_NAME = process.env.IT_ACTIVITY_NAME || "IT Experience";
const MIN_COMPLETED_SESSIONS = 2;

const DRY_RUN = process.argv.includes("--dry-run");

if (!MONGODB_URI) {
  console.error("❌ Falta la variable de entorno MONGODB_URI");
  process.exit(1);
}

function buildActivityProgressEntry({ activityId, totalSubActivities }) {
  return {
    activityId,
    completedSubActivities: totalSubActivities,
    totalSubActivities,
    completed: false,
    completedAt: null,
  };
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

    if (!activity) {
      throw new Error(
        `No se encontró la actividad activa \"${IT_ACTIVITY_NAME}\"`,
      );
    }

    const subActivities = (activity.subActivities || []).filter(
      (sub) => sub?.active !== false,
    );

    if (subActivities.length === 0) {
      throw new Error("La actividad IT Experience no tiene sesiones activas");
    }

    const activityId = activity._id;
    const activityStickerId = activity.stickerId?.toString() || null;
    const totalSubActivities = subActivities.length;

    const subActivityIdSet = new Set(
      subActivities.map((sub) => sub._id.toString()),
    );

    const subActivityStickerIds = subActivities
      .map((sub) => sub.stickerId?.toString())
      .filter(Boolean)
      .filter((stickerId) => stickerId !== activityStickerId);

    const users = await db
      .collection("users")
      .find({ active: true, deletedAt: null })
      .project({
        _id: 1,
        employeeNumber: 1,
        firstName: 1,
        lastName: 1,
        earnedStickers: 1,
        subActivityProgress: 1,
        activityProgress: 1,
      })
      .toArray();

    let evaluated = 0;
    let eligible = 0;
    let updated = 0;
    let skippedNoChanges = 0;

    const bulkOps = [];

    for (const user of users) {
      evaluated += 1;

      const existingSubProgress = Array.isArray(user.subActivityProgress)
        ? user.subActivityProgress
        : [];

      const completedSessionIds = new Set(
        existingSubProgress
          .filter(
            (entry) =>
              entry?.completed &&
              entry?.subActivityId &&
              subActivityIdSet.has(entry.subActivityId.toString()),
          )
          .map((entry) => entry.subActivityId.toString()),
      );

      if (
        completedSessionIds.size < MIN_COMPLETED_SESSIONS ||
        completedSessionIds.size >= totalSubActivities
      ) {
        continue;
      }

      eligible += 1;

      const now = new Date();

      const subProgressById = new Map();
      for (const entry of existingSubProgress) {
        if (!entry?.subActivityId) {
          continue;
        }
        subProgressById.set(entry.subActivityId.toString(), entry);
      }

      let touchedSubActivity = false;
      for (const sub of subActivities) {
        const subId = sub._id.toString();
        const existingEntry = subProgressById.get(subId);

        if (!existingEntry) {
          touchedSubActivity = true;
          subProgressById.set(subId, {
            subActivityId: new ObjectId(subId),
            completed: true,
            completedAt: now,
            earnedStickerId: sub.stickerId ? new ObjectId(sub.stickerId) : null,
          });
          continue;
        }

        if (!existingEntry.completed) {
          touchedSubActivity = true;
          existingEntry.completed = true;
          existingEntry.completedAt = existingEntry.completedAt || now;
        }

        if (!existingEntry.earnedStickerId && sub.stickerId) {
          touchedSubActivity = true;
          existingEntry.earnedStickerId = new ObjectId(sub.stickerId);
        }
      }

      const nextSubActivityProgress = [
        ...existingSubProgress.filter(
          (entry) =>
            !entry?.subActivityId ||
            !subActivityIdSet.has(entry.subActivityId.toString()),
        ),
        ...subActivities.map((sub) => subProgressById.get(sub._id.toString())),
      ];

      const existingEarnedStickers = Array.isArray(user.earnedStickers)
        ? user.earnedStickers
        : [];
      const earnedStickerSet = new Set(
        existingEarnedStickers.map((stickerId) => stickerId.toString()),
      );

      let touchedEarnedStickers = false;
      for (const subStickerId of subActivityStickerIds) {
        if (!earnedStickerSet.has(subStickerId)) {
          touchedEarnedStickers = true;
          earnedStickerSet.add(subStickerId);
        }
      }

      const nextEarnedStickers = Array.from(earnedStickerSet).map(
        (id) => new ObjectId(id),
      );

      const existingActivityProgress = Array.isArray(user.activityProgress)
        ? user.activityProgress
        : [];

      const activityProgressIndex = existingActivityProgress.findIndex(
        (progress) =>
          progress?.activityId &&
          progress.activityId.toString() === activityId.toString(),
      );

      let touchedActivityProgress = false;
      const nextActivityProgress = [...existingActivityProgress];

      const normalizedEntry = buildActivityProgressEntry({
        activityId,
        totalSubActivities,
      });

      if (activityProgressIndex >= 0) {
        const current = existingActivityProgress[activityProgressIndex];
        const currentCompletedAt = current?.completedAt
          ? new Date(current.completedAt).getTime()
          : null;
        const normalizedCompletedAt = normalizedEntry?.completedAt
          ? new Date(normalizedEntry.completedAt).getTime()
          : null;
        if (
          current.completedSubActivities !== totalSubActivities ||
          current.totalSubActivities !== totalSubActivities ||
          current.completed !== false ||
          currentCompletedAt !== normalizedCompletedAt
        ) {
          touchedActivityProgress = true;
          nextActivityProgress[activityProgressIndex] = normalizedEntry;
        }
      } else {
        touchedActivityProgress = true;
        nextActivityProgress.push(normalizedEntry);
      }

      if (
        !touchedSubActivity &&
        !touchedEarnedStickers &&
        !touchedActivityProgress
      ) {
        skippedNoChanges += 1;
        continue;
      }

      updated += 1;

      const userLabel =
        `${user.employeeNumber || "N/A"} - ${user.firstName || ""} ${user.lastName || ""}`.trim();
      console.log(
        `🛠️  ${DRY_RUN ? "[DRY-RUN]" : ""} Usuario objetivo: ${userLabel}`,
      );

      const updatePayload = {
        subActivityProgress: nextSubActivityProgress,
        activityProgress: nextActivityProgress,
        earnedStickers: nextEarnedStickers,
      };

      if (!DRY_RUN) {
        bulkOps.push({
          updateOne: {
            filter: { _id: user._id },
            update: { $set: updatePayload },
          },
        });
      }
    }

    if (!DRY_RUN && bulkOps.length > 0) {
      await db.collection("users").bulkWrite(bulkOps, { ordered: false });
    }

    console.log("\n📊 Resumen:");
    console.log(`- Usuarios evaluados: ${evaluated}`);
    console.log(
      `- Usuarios elegibles (>= ${MIN_COMPLETED_SESSIONS} y < ${totalSubActivities} sesiones): ${eligible}`,
    );
    console.log(`- Usuarios actualizados: ${updated}`);
    console.log(`- Elegibles sin cambios necesarios: ${skippedNoChanges}`);
    console.log(
      `- Modo: ${DRY_RUN ? "DRY-RUN (sin persistir cambios)" : "APLICADO"}`,
    );

    console.log("\n✅ Proceso finalizado");
    console.log(
      "ℹ️  Regla aplicada: NO asignar insignia final IT Experience y NO marcar actividad como completada.",
    );
  } catch (error) {
    console.error("\n❌ Error ejecutando script:", error);
    process.exit(1);
  } finally {
    await client.close();
  }
}

run().catch((error) => {
  console.error("\n❌ Error fatal:", error);
  process.exit(1);
});
