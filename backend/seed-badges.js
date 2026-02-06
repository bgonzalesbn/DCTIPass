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

const badges = [];

console.log("Leyendo imágenes...\n");

for (const [fileName, badgeName] of Object.entries(badgeMap)) {
  const filePath = path.join(downloadsPath, fileName);

  try {
    console.log(`Procesando: ${badgeName}`);
    const imageBuffer = fs.readFileSync(filePath);
    const base64Image = imageBuffer.toString("base64");
    const dataUrl = `data:image/png;base64,${base64Image}`;

    badges.push({
      name: badgeName,
      imageUrl: dataUrl,
    });

    console.log(`  ✓ OK (${base64Image.length} caracteres)\n`);
  } catch (err) {
    console.log(`  ✗ Error: ${err.message}\n`);
  }
}

const payload = JSON.stringify(badges);

console.log(
  `\nEnviando ${badges.length} badges a http://localhost:3000/badges/seed...`,
);
console.log(`Payload size: ${(payload.length / 1024 / 1024).toFixed(2)} MB\n`);

const options = {
  hostname: "127.0.0.1", // Usar explícitamente IPv4
  port: 3000,
  path: "/badges/seed",
  method: "POST",
  family: 4, // Force IPv4
  headers: {
    "Content-Type": "application/json",
    "Content-Length": Buffer.byteLength(payload),
  },
};

const req = http.request(options, (res) => {
  let data = "";

  console.log(`Status: ${res.statusCode}`);

  res.on("data", (chunk) => {
    data += chunk;
  });

  res.on("end", () => {
    console.log("\n✓ EXITO!\n");
    console.log("Respuesta:");
    console.log(data);
    process.exit(0);
  });
});

req.on("error", (err) => {
  console.error("✗ ERROR:", err.message);
  console.error("Code:", err.code);
  console.error("Full error:", err);
  process.exit(1);
});

req.on("timeout", () => {
  console.error("✗ TIMEOUT: Request took too long");
  req.destroy();
  process.exit(1);
});

req.setTimeout(60000); // 60 segundo timeout

try {
  req.write(payload);
  req.end();
} catch (err) {
  console.error("✗ Error writing payload:", err.message);
  process.exit(1);
}
