/**
 * Health Check Script
 * Verifica endpoints disponibles en el backend
 */

import axios from "axios";

const baseURL = "https://dctipass-backend.onrender.com";

const endpointsToTest = [
  { path: "/", name: "Root" },
  { path: "/health", name: "Health Check" },
  { path: "/activities", name: "Activities (GET)" },
  { path: "/auth/login", name: "Login (POST)" },
  { path: "/api/activities", name: "API Activities" },
  { path: "/api/v1/activities", name: "API v1 Activities" },
];

async function checkEndpoint(endpoint) {
  try {
    const response = await axios.get(baseURL + endpoint.path, {
      timeout: 5000,
      validateStatus: () => true, // Accept all status codes
    });
    return {
      endpoint: endpoint.name,
      path: endpoint.path,
      status: response.status,
      statusText: response.statusText,
      available: response.status < 400,
    };
  } catch (error) {
    return {
      endpoint: endpoint.name,
      path: endpoint.path,
      status: error.response?.status || "ERROR",
      statusText: error.code || error.message,
      available: false,
    };
  }
}

async function runHealthCheck() {
  console.log(`\n🏥 HEALTH CHECK - ${baseURL}\n`);
  console.log("Verificando disponibilidad de endpoints...\n");

  const results = await Promise.all(
    endpointsToTest.map((endpoint) => checkEndpoint(endpoint)),
  );

  console.log("📋 RESULTADOS:");
  console.log("─".repeat(70));

  results.forEach((result) => {
    const status =
      result.status < 300
        ? "✅"
        : result.status < 400
          ? "⏭️ "
          : result.status < 500
            ? "❌"
            : "⚠️ ";
    console.log(
      `${status} ${result.endpoint.padEnd(30)} ${String(result.status).padEnd(5)} ${result.statusText}`,
    );
  });

  console.log("─".repeat(70));
  console.log("\n📊 RESUMEN:");

  const available = results.filter((r) => r.available).length;
  console.log(`   Endpoints disponibles: ${available}/${results.length}`);

  if (available === 0) {
    console.log("\n❌ Backend NO está respondiendo correctamente");
    console.log("   Posibles causas:");
    console.log("   1. Backend no está corriendo en Render");
    console.log("   2. Deployment falló");
    console.log("   3. Cold start (Render está iniciando la app)");
  } else if (available < 3) {
    console.log("\n⚠️  Backend está respondiendo parcialmente");
  } else {
    console.log("\n✅ Backend está funcionando correctamente");
  }

  console.log("\n");
}

runHealthCheck().catch((error) => {
  console.error("❌ Error:", error.message);
});
