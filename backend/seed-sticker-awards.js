// Script para insertar sticker_awards de prueba en MongoDB
// Ejecutar: node seed-sticker-awards.js

const { MongoClient, ObjectId } = require("mongodb");

const MONGODB_URI =
  process.env.MONGODB_URI ||
  "mongodb+srv://ITExperience:itexperience%2E2025@cluster0.atplvzn.mongodb.net/ITExperience?appName=Cluster0";

async function seedStickerAwards() {
  const client = new MongoClient(MONGODB_URI);

  try {
    await client.connect();
    console.log("Conectado a MongoDB");

    const db = client.db();

    // Obtener actividad IT Experience
    const activity = await db
      .collection("activities")
      .findOne({ name: "IT Experience" });
    if (!activity) {
      console.error("No se encontró la actividad IT Experience");
      return;
    }
    console.log("Actividad encontrada:", activity.name);

    // Obtener subactividades
    const subActivities = activity.subActivities || [];
    if (subActivities.length === 0) {
      console.error("No hay subactividades");
      return;
    }
    console.log(`Subactividades encontradas: ${subActivities.length}`);

    // Obtener stickers disponibles
    const stickers = await db
      .collection("stickers")
      .find({ active: true })
      .toArray();
    if (stickers.length === 0) {
      console.error("No hay stickers disponibles");
      return;
    }
    console.log(`Stickers encontrados: ${stickers.length}`);

    // Preguntas para cada subactividad
    const questions = [
      {
        question:
          "¿Cuál es el objetivo principal de la Estrategia Digital del Banco Nacional?",
        options: [
          "Reducir costos operativos",
          "Transformar digitalmente los servicios para mejorar la experiencia del cliente",
          "Eliminar las sucursales físicas",
          "Aumentar las tasas de interés",
        ],
        correctAnswer:
          "Transformar digitalmente los servicios para mejorar la experiencia del cliente",
        explanation:
          "La estrategia digital busca transformar los servicios para ofrecer una mejor experiencia al cliente, manteniendo la seguridad y eficiencia.",
        points: 10,
      },
      {
        question:
          '¿Qué significa "Supervisión y Gestión" en el contexto de TI?',
        options: [
          "Solo revisar reportes mensuales",
          "Monitoreo continuo y control de procesos tecnológicos para garantizar su correcto funcionamiento",
          "Despedir empleados con bajo rendimiento",
          "Comprar nuevo software",
        ],
        correctAnswer:
          "Monitoreo continuo y control de procesos tecnológicos para garantizar su correcto funcionamiento",
        explanation:
          "La supervisión y gestión en TI implica el monitoreo constante de sistemas y procesos para asegurar disponibilidad y eficiencia.",
        points: 10,
      },
      {
        question: '¿Cuál es el valor más importante de "Gente BN"?',
        options: [
          "La productividad individual",
          "El trabajo en equipo y desarrollo del talento humano",
          "Las horas extra trabajadas",
          "El cumplimiento estricto de horarios",
        ],
        correctAnswer: "El trabajo en equipo y desarrollo del talento humano",
        explanation:
          "Gente BN se enfoca en el desarrollo integral del talento humano y la colaboración efectiva entre equipos.",
        points: 10,
      },
      {
        question: '¿Qué busca la "Gestión y Mejora" continua?',
        options: [
          "Mantener todo igual para evitar riesgos",
          "Identificar oportunidades de mejora e implementar cambios positivos",
          "Reducir personal",
          "Aumentar la burocracia",
        ],
        correctAnswer:
          "Identificar oportunidades de mejora e implementar cambios positivos",
        explanation:
          "La gestión y mejora continua se basa en identificar áreas de oportunidad e implementar mejoras de forma constante.",
        points: 10,
      },
      {
        question: '¿Cuál es el rol de "Arquitectura" en TI?',
        options: [
          "Diseñar edificios para oficinas",
          "Diseñar la estructura tecnológica que soporta los sistemas y aplicaciones",
          "Decorar las oficinas",
          "Contratar personal",
        ],
        correctAnswer:
          "Diseñar la estructura tecnológica que soporta los sistemas y aplicaciones",
        explanation:
          "La arquitectura de TI define cómo se estructuran e integran los sistemas tecnológicos de la organización.",
        points: 10,
      },
      {
        question: '¿Qué implica la "Entrega de Soluciones"?',
        options: [
          "Solo entregar reportes",
          "Desarrollar e implementar soluciones tecnológicas que resuelvan necesidades del negocio",
          "Enviar correos electrónicos",
          "Organizar reuniones",
        ],
        correctAnswer:
          "Desarrollar e implementar soluciones tecnológicas que resuelvan necesidades del negocio",
        explanation:
          "La entrega de soluciones comprende todo el ciclo de desarrollo e implementación de sistemas que generan valor.",
        points: 10,
      },
      {
        question:
          '¿Cuál es la importancia de la "Seguridad" en el Banco Nacional?',
        options: [
          "Es opcional",
          "Proteger la información y activos del banco y sus clientes",
          "Solo aplica para el área de TI",
          "Es responsabilidad exclusiva del área de seguridad",
        ],
        correctAnswer:
          "Proteger la información y activos del banco y sus clientes",
        explanation:
          "La seguridad es responsabilidad de todos y es fundamental para proteger la información sensible del banco y sus clientes.",
        points: 10,
      },
    ];

    // Eliminar sticker_awards existentes
    await db.collection("sticker_awards").deleteMany({});
    console.log("Colección sticker_awards limpiada");

    // Crear sticker_awards para cada subactividad
    const stickerAwards = [];

    for (let i = 0; i < Math.min(subActivities.length, questions.length); i++) {
      const subActivity = subActivities[i];
      const question = questions[i];
      const sticker = stickers[i % stickers.length];

      stickerAwards.push({
        stickerId: sticker._id,
        activityId: activity._id,
        subActivityId: subActivity._id,
        question: question.question,
        options: question.options,
        correctAnswer: question.correctAnswer,
        explanation: question.explanation,
        points: question.points,
        active: true,
        deletedAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    }

    if (stickerAwards.length > 0) {
      const result = await db
        .collection("sticker_awards")
        .insertMany(stickerAwards);
      console.log(`✅ Se insertaron ${result.insertedCount} sticker_awards`);

      // Mostrar resumen
      console.log("\n📋 Resumen de retos creados:");
      for (let i = 0; i < stickerAwards.length; i++) {
        const sa = stickerAwards[i];
        const subAct = subActivities.find(
          (s) => s._id.toString() === sa.subActivityId.toString(),
        );
        console.log(
          `  ${i + 1}. ${subAct?.name || "Subactividad"}: "${sa.question.substring(0, 50)}..."`,
        );
      }
    }
  } catch (error) {
    console.error("Error:", error);
  } finally {
    await client.close();
    console.log("\nConexión cerrada");
  }
}

seedStickerAwards();
