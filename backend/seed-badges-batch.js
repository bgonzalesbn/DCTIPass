const fs = require("fs");
const path = require("path");
const http = require("http");

const downloadsPath = "C:\\Users\\bgonzalezs\\Downloads";

const badgeMap = {
  "Arquitectura - esqueleto .png": "Esqueleto Aro",
  "Entrega - musculo .png": "Musculos Entrega",
  "Estrategia digital - mente.png": "Mente Estrate",
  "Gente BN - doctores.png": "Doctores Genl",
  "Gestion y mejora - Sangre.png": "Sangre Gestion",
  "IT Experience - D tecnologia.png": "Experience DT",
  "Operaciones - Corazon.png": "Corazon Opera",
  "Supervision y control - sistema nervioso.png": "Sistema Nervioso Super",
};

async function sendBadge(badge) {
  return new Promise((resolve, reject) => {
    const payload = JSON.stringify([badge]);

    const options = {
      hostname: "127.0.0.1",
      port: 3000,
      path: "/badges/seed",
      method: "POST",
      family: 4,
      headers: {
        "Content-Type": "application/json",
        "Content-Length": Buffer.byteLength(payload),
      },
    };

    const req = http.request(options, (res) => {
      let data = "";
      res.on("data", (chunk) => {
        data += chunk;
      });
      res.on("end", () => {
        console.log(`  ✓ ${badge.name} enviado (HTTP ${res.statusCode})`);
        resolve(data);
      });
    });

    req.on("error", (err) => {
      console.error(`  ✗ ${badge.name}: ${err.message}`);
      reject(err);
    });

    req.setTimeout(30000);
    req.write(payload);
    req.end();
  });
}

async function main() {
  console.log("Leyendo y enviando badges uno por uno...\n");

  for (const [fileName, badgeName] of Object.entries(badgeMap)) {
    const filePath = path.join(downloadsPath, fileName);

    try {
      console.log(`Procesando: ${badgeName}`);
      const imageBuffer = fs.readFileSync(filePath);
      const base64Image = imageBuffer.toString("base64");
      const dataUrl = `data:image/png;base64,${base64Image}`;

      const badge = {
        name: badgeName,
        imageUrl: dataUrl,
      };

      await sendBadge(badge);

      // Pequeña pausa entre requests
      await new Promise((resolve) => setTimeout(resolve, 500));
    } catch (err) {
      console.log(`  ✗ Error: ${err.message}\n`);
    }
  }

  console.log("\n✓ Seeding completado!");
  process.exit(0);
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
