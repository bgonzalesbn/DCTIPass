import { MongoClient } from "mongodb";

const MONGODB_URI =
  "mongodb+srv://ITExperience:itexperience%2E2025@cluster0.atplvzn.mongodb.net/ITExperience?appName=Cluster0";
const DB_NAME = "ITExperience";

async function inspectStickerAwards() {
  const client = new MongoClient(MONGODB_URI);

  try {
    console.log("🔗 Conectando a MongoDB...");
    await client.connect();
    const db = client.db(DB_NAME);

    console.log("\n🎫 ESTRUCTURA DE STICKER_AWARDS:");
    console.log("=".repeat(70));

    const stickerAwards = await db
      .collection("sticker_awards")
      .find({})
      .limit(5)
      .toArray();

    console.log(
      `Total de sticker_awards: ${await db.collection("sticker_awards").countDocuments({})}`,
    );

    stickerAwards.forEach((award, i) => {
      console.log(`\n📋 Sticker Award ${i + 1}:`);
      console.log(JSON.stringify(award, null, 2));
    });

    // Buscar dónde está el dato del usuario
    console.log("\n\n🔍 BUSCANDO DATOS DEL USUARIO EN FRONTEND...");
    console.log("=".repeat(70));

    // Buscar en localStorage qué datos tiene
    console.log("\nPara que vea qué está en el caché del frontend:");
    console.log(`
1. Abre DevTools (F12) en https://dcti-pass.vercel.app
2. Ve a Application → Local Storage
3. Busca "cacheStore" o "authStore"
4. Expande y copia el contenido completo
5. Muéstrame qué tiene en earnedStickers o badges
    `);
  } catch (error) {
    console.error("\n❌ Error:", error.message);
  } finally {
    await client.close();
  }
}

inspectStickerAwards();
