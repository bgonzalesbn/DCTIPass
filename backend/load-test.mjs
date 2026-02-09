/**
 * Load Testing Script
 * Simula 50 usuarios concurrentes haciendo login y accediendo a actividades
 *
 * Uso: node load-test.mjs <backend-url> [num-users]
 * Ejemplo: node load-test.mjs https://dctipass-backend.onrender.com 50
 */

import axios from "axios";

const args = process.argv.slice(2);
const baseURL = args[0] || "http://localhost:3000";
const numUsers = parseInt(args[1]) || 50;

console.log(`\n🚀 LOAD TEST - ${numUsers} Usuarios Concurrentes`);
console.log(`📍 Backend: ${baseURL}`);
console.log(`⏱️  Timestamp: ${new Date().toLocaleString()}\n`);

// Datos de prueba
const testUsers = Array.from({ length: numUsers }, (_, i) => ({
  employeeNumber: String(18000 + i),
  password: "Test@123",
}));

const metrics = {
  totalRequests: 0,
  successfulLogins: 0,
  failedLogins: 0,
  successfulActivities: 0,
  failedActivities: 0,
  rateLimitedRequests: 0,
  loginTimes: [],
  activitiesTimes: [],
  errors: [],
};

async function testUser(user, index) {
  try {
    // 1. LOGIN
    const loginStart = Date.now();
    let loginToken = null;

    try {
      const loginResponse = await axios.post(`${baseURL}/auth/login`, {
        employeeNumber: user.employeeNumber,
        password: user.password,
      });

      const loginTime = Date.now() - loginStart;
      metrics.loginTimes.push(loginTime);
      metrics.successfulLogins++;

      if (loginResponse.status === 200) {
        loginToken = loginResponse.data?.access_token;
      }
    } catch (error) {
      const loginTime = Date.now() - loginStart;
      metrics.loginTimes.push(loginTime);

      if (error.response?.status === 429) {
        metrics.rateLimitedRequests++;
        console.log(
          `⚠️  [User ${index + 1}] Rate Limited (429) - ${loginTime}ms`,
        );
      } else if (error.response?.status === 401) {
        metrics.failedLogins++;
      } else {
        metrics.failedLogins++;
        metrics.errors.push(
          `User ${index + 1}: ${error.response?.status || error.message}`,
        );
      }
      return; // No continuar si login falló
    }

    // 2. GET ACTIVITIES
    if (loginToken) {
      const activitiesStart = Date.now();
      try {
        const activitiesResponse = await axios.get(
          `${baseURL}/activities?page=1&limit=20`,
          {
            headers: {
              Authorization: `Bearer ${loginToken}`,
            },
          },
        );

        const activitiesTime = Date.now() - activitiesStart;
        metrics.activitiesTimes.push(activitiesTime);
        metrics.successfulActivities++;

        // Check si la respuesta tiene estructura correcta
        if (
          activitiesResponse.data?.data &&
          activitiesResponse.data?.pagination
        ) {
          // ✅ Estructura correcta
        } else if (Array.isArray(activitiesResponse.data)) {
          // ⚠️ Estructura antigua (sin paginación)
          console.warn(
            `⚠️  [User ${index + 1}] Respuesta sin paginación (estructura antigua)`,
          );
        }
      } catch (error) {
        const activitiesTime = Date.now() - activitiesStart;
        metrics.activitiesTimes.push(activitiesTime);
        metrics.failedActivities++;

        if (error.response?.status !== 429) {
          metrics.errors.push(
            `User ${index + 1} Activities: ${error.response?.status || error.message}`,
          );
        }
      }
    }

    metrics.totalRequests += 2;
  } catch (error) {
    metrics.errors.push(
      `User ${index + 1}: Unexpected error - ${error.message}`,
    );
  }
}

async function runLoadTest() {
  console.log(`📊 Iniciando test con ${numUsers} usuarios...\n`);

  // Ejecutar todas las pruebas en paralelo
  const startTime = Date.now();
  await Promise.all(testUsers.map((user, index) => testUser(user, index)));
  const totalTime = Date.now() - startTime;

  // Calcular estadísticas
  const avgLoginTime =
    metrics.loginTimes.length > 0
      ? Math.round(
          metrics.loginTimes.reduce((a, b) => a + b, 0) /
            metrics.loginTimes.length,
        )
      : 0;

  const avgActivitiesTime =
    metrics.activitiesTimes.length > 0
      ? Math.round(
          metrics.activitiesTimes.reduce((a, b) => a + b, 0) /
            metrics.activitiesTimes.length,
        )
      : 0;

  const maxLoginTime =
    metrics.loginTimes.length > 0 ? Math.max(...metrics.loginTimes) : 0;
  const minLoginTime =
    metrics.loginTimes.length > 0 ? Math.min(...metrics.loginTimes) : 0;

  // Mostrar resultados
  console.log(`\n✅ TEST COMPLETADO EN ${totalTime}ms\n`);

  console.log("📈 RESULTADOS:");
  console.log("─".repeat(50));
  console.log(`  Usuarios Testados:        ${numUsers}`);
  console.log(
    `  Logins Exitosos:          ${metrics.successfulLogins}/${numUsers}`,
  );
  console.log(`  Logins Fallidos:          ${metrics.failedLogins}`);
  console.log(`  Rate Limited (429):       ${metrics.rateLimitedRequests}`);
  console.log(
    `  Requests Actividades OK:  ${metrics.successfulActivities}/${numUsers}`,
  );

  console.log("\n⏱️  TIEMPOS DE LOGIN:");
  console.log("─".repeat(50));
  console.log(`  Promedio:                 ${avgLoginTime}ms`);
  console.log(`  Mínimo:                   ${minLoginTime}ms`);
  console.log(`  Máximo:                   ${maxLoginTime}ms`);
  console.log(`  Total de tiempo:          ${totalTime}ms`);

  console.log("\n⏱️  TIEMPOS DE ACTIVIDADES:");
  console.log("─".repeat(50));
  console.log(`  Promedio:                 ${avgActivitiesTime}ms`);
  if (metrics.activitiesTimes.length > 0) {
    console.log(
      `  Mínimo:                   ${Math.min(...metrics.activitiesTimes)}ms`,
    );
    console.log(
      `  Máximo:                   ${Math.max(...metrics.activitiesTimes)}ms`,
    );
  }

  // Análisis de rendimiento
  console.log("\n🎯 ANÁLISIS:");
  console.log("─".repeat(50));

  if (avgLoginTime < 500) {
    console.log(`  ✅ Login: ${avgLoginTime}ms es EXCELENTE (< 500ms)`);
  } else if (avgLoginTime < 1000) {
    console.log(`  ✅ Login: ${avgLoginTime}ms es BUENO (< 1s)`);
  } else {
    console.log(`  ⚠️  Login: ${avgLoginTime}ms es LENTO (> 1s)`);
  }

  if (metrics.rateLimitedRequests === 0) {
    console.log(
      `  ✅ Rate Limiting: No hay límites alcanzados (buena capacidad)`,
    );
  } else {
    console.log(
      `  ⚠️  Rate Limiting: ${metrics.rateLimitedRequests} requests limitados`,
    );
  }

  if (metrics.failedLogins === 0) {
    console.log(`  ✅ Logins: 100% exitosos`);
  } else {
    console.log(
      `  ⚠️  Logins: ${metrics.failedLogins} fallidos (${((metrics.failedLogins / numUsers) * 100).toFixed(1)}%)`,
    );
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

  console.log("\n");

  // Salida con código de error si tiene problemas
  if (metrics.failedLogins > numUsers * 0.1 || avgLoginTime > 2000) {
    process.exit(1);
  }
}

runLoadTest().catch((error) => {
  console.error("❌ Error en load test:", error);
  process.exit(1);
});
