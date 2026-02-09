/**
 * Load Testing Script - Public Endpoints
 * Simula 50 usuarios accediendo a actividades SIN autenticación
 *
 * Uso: node load-test-activities.mjs <backend-url> [num-users]
 * Ejemplo: node load-test-activities.mjs https://dctipass-backend.onrender.com 50
 */

import axios from "axios";

const args = process.argv.slice(2);
const baseURL = args[0] || "http://localhost:3000";
const numUsers = parseInt(args[1]) || 50;

console.log(`\n🚀 LOAD TEST - ${numUsers} Usuarios Accediendo a Actividades`);
console.log(`📍 Backend: ${baseURL}`);
console.log(`⏱️  Timestamp: ${new Date().toLocaleString()}\n`);

const metrics = {
  successfulRequests: 0,
  failedRequests: 0,
  rateLimitedRequests: 0,
  responseTimes: [],
  errors: [],
};

async function testActivityRequest(index, page = 1, limit = 20) {
  try {
    const start = Date.now();
    const response = await axios.get(`${baseURL}/activities`, {
      params: { page, limit },
      timeout: 10000,
    });

    const responseTime = Date.now() - start;
    metrics.responseTimes.push(responseTime);
    metrics.successfulRequests++;

    // Validar estructura de paginación
    if (response.data?.data && response.data?.pagination) {
      return { success: true, time: responseTime, hasPagination: true };
    } else if (Array.isArray(response.data)) {
      return { success: true, time: responseTime, hasPagination: false };
    }

    return { success: true, time: responseTime };
  } catch (error) {
    const responseTime = Date.now() - error.config?.timing?.start || 0;

    if (error.response?.status === 429) {
      metrics.rateLimitedRequests++;
      console.log(`⚠️  [User ${index + 1}] Rate Limited (429)`);
    } else if (error.response?.status === 404) {
      metrics.failedRequests++;
      metrics.errors.push(
        `User ${index + 1}: Endpoint not found (404) - URL: ${baseURL}/activities`,
      );
    } else if (error.code === "ECONNREFUSED") {
      metrics.failedRequests++;
      metrics.errors.push(
        `User ${index + 1}: Connection refused - Backend may be down`,
      );
    } else if (error.code === "ENOTFOUND") {
      metrics.failedRequests++;
      metrics.errors.push(`User ${index + 1}: DNS error - Invalid backend URL`);
    } else {
      metrics.failedRequests++;
      metrics.errors.push(
        `User ${index + 1}: ${error.response?.status || error.code || error.message}`,
      );
    }

    return { success: false, time: responseTime || 0 };
  }
}

async function runLoadTest() {
  console.log(
    `📊 Iniciando test con ${numUsers} usuarios accediendo a actividades\n`,
  );

  // Ejecutar todas las pruebas en paralelo
  const startTime = Date.now();
  const promises = Array.from({ length: numUsers }, (_, i) =>
    testActivityRequest(i, 1, 20),
  );
  await Promise.all(promises);
  const totalTime = Date.now() - startTime;

  // Calcular estadísticas
  const avgResponseTime =
    metrics.responseTimes.length > 0
      ? Math.round(
          metrics.responseTimes.reduce((a, b) => a + b, 0) /
            metrics.responseTimes.length,
        )
      : 0;

  const maxResponseTime =
    metrics.responseTimes.length > 0 ? Math.max(...metrics.responseTimes) : 0;
  const minResponseTime =
    metrics.responseTimes.length > 0 ? Math.min(...metrics.responseTimes) : 0;

  const successRate = ((metrics.successfulRequests / numUsers) * 100).toFixed(
    1,
  );

  // Mostrar resultados
  console.log(`\n✅ TEST COMPLETADO EN ${totalTime}ms\n`);

  console.log("📈 RESULTADOS:");
  console.log("─".repeat(50));
  console.log(`  Usuarios Testados:        ${numUsers}`);
  console.log(
    `  Requests Exitosos:        ${metrics.successfulRequests}/${numUsers} (${successRate}%)`,
  );
  console.log(`  Requests Fallidos:        ${metrics.failedRequests}`);
  console.log(`  Rate Limited (429):       ${metrics.rateLimitedRequests}`);

  console.log("\n⏱️  TIEMPOS DE RESPUESTA:");
  console.log("─".repeat(50));
  console.log(`  Promedio:                 ${avgResponseTime}ms`);
  console.log(`  Mínimo:                   ${minResponseTime}ms`);
  console.log(`  Máximo:                   ${maxResponseTime}ms`);
  console.log(`  Total de tiempo:          ${totalTime}ms`);
  console.log(
    `  Throughput:               ${Math.round(numUsers / (totalTime / 1000))} req/sec`,
  );

  // Análisis de rendimiento
  console.log("\n🎯 ANÁLISIS:");
  console.log("─".repeat(50));

  if (avgResponseTime < 200) {
    console.log(`  ✅ Performance: ${avgResponseTime}ms es PERFECTO (< 200ms)`);
  } else if (avgResponseTime < 500) {
    console.log(
      `  ✅ Performance: ${avgResponseTime}ms es EXCELENTE (< 500ms)`,
    );
  } else if (avgResponseTime < 1000) {
    console.log(`  ✅ Performance: ${avgResponseTime}ms es BUENO (< 1s)`);
  } else {
    console.log(`  ⚠️  Performance: ${avgResponseTime}ms es LENTO (> 1s)`);
  }

  if (metrics.rateLimitedRequests === 0) {
    console.log(
      `  ✅ Rate Limiting: No hay límites alcanzados (excelente capacidad)`,
    );
  } else {
    console.log(
      `  ⚠️  Rate Limiting: ${metrics.rateLimitedRequests} requests limitados (${((metrics.rateLimitedRequests / numUsers) * 100).toFixed(1)}%)`,
    );
  }

  if (successRate >= 99) {
    console.log(`  ✅ Disponibilidad: ${successRate}% (EXCELENTE)`);
  } else if (successRate >= 95) {
    console.log(`  ✅ Disponibilidad: ${successRate}% (BUENO)`);
  } else if (successRate >= 90) {
    console.log(`  ⚠️  Disponibilidad: ${successRate}% (ACEPTABLE)`);
  } else {
    console.log(`  ❌ Disponibilidad: ${successRate}% (PROBLEMAS)`);
  }

  // Mostrar errores si los hay
  if (metrics.errors.length > 0) {
    console.log("\n⚠️  ERRORES (primeros 5):");
    console.log("─".repeat(50));
    metrics.errors.slice(0, 5).forEach((error) => console.log(`  • ${error}`));
    if (metrics.errors.length > 5) {
      console.log(`  ... y ${metrics.errors.length - 5} más`);
    }
  }

  // Capacidad de usuarios
  console.log("\n📊 CAPACIDAD:");
  console.log("─".repeat(50));
  if (successRate >= 99 && avgResponseTime < 500) {
    console.log(
      `  ✅ RECOMENDACIÓN: Soporta ${numUsers}+ usuarios simultáneos`,
    );
    console.log(
      `     Con ${numUsers} usuarios: ${avgResponseTime}ms avg, ${totalTime}ms total`,
    );
  } else if (successRate >= 90 && avgResponseTime < 1000) {
    console.log(
      `  ✅ RECOMENDACIÓN: Soporta ~${Math.round(numUsers * 0.9)} usuarios simultáneos`,
    );
  } else {
    console.log(`  ⚠️  RECOMENDACIÓN: Necesita optimizaciones adicionales`);
  }

  console.log("\n");

  // Salida con código de error si tiene problemas
  if (successRate < 90 || avgResponseTime > 2000) {
    process.exit(1);
  }
}

runLoadTest().catch((error) => {
  console.error("❌ Error en load test:", error.message);
  process.exit(1);
});
