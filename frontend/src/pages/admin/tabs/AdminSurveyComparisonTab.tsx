import { useEffect, useMemo, useRef, useState } from "react";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { adminAPI } from "../../../services/api";
import type {
  AdminSurveysComparisonResponse,
  SurveyDistributionItem,
} from "../../../types";

const barColor = "bg-[#113780]";
const PDF_THEME_COLOR: [number, number, number] = [17, 55, 128];
const PDF_FONT_SIZE = {
  title: 16,
  section: 12,
  body: 10,
  table: 9,
  footnote: 9,
};

const sanitizePdfText = (value: string) => {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[¿¡]/g, "")
    .replace(/→/g, "->")
    .replace(/Δ/g, "Delta")
    .replace(/•/g, "-")
    .replace(/“|”/g, '"')
    .replace(/‘|’/g, "'")
    .replace(/\u00A0/g, " ");
};

const s = (value: string | number) => sanitizePdfText(String(value));

type JsPdfWithAutoTable = jsPDF & {
  lastAutoTable?: {
    finalY: number;
  };
};

type DynamicSurveyAnalysis = {
  generatedSummary: string;
  insightItems: string[];
  recommendations: string[];
  adaptiveNote: string;
};

type ExecutiveTrafficLight = {
  status: "Verde" | "Amarillo" | "Rojo";
  color: [number, number, number];
  interpretation: string;
};

const round2 = (value: number) => Number(value.toFixed(2));

const percentage = (value: number, total: number) => {
  if (total <= 0) return 0;
  return round2((value / total) * 100);
};

const getCountForValues = (
  distribution: SurveyDistributionItem[],
  values: number[],
) => {
  return distribution.reduce((sum, item) => {
    if (values.includes(item.value)) {
      return sum + item.count;
    }
    return sum;
  }, 0);
};

const average = (values: number[]) => {
  if (!values.length) return 0;
  const total = values.reduce((sum, value) => sum + value, 0);
  return total / values.length;
};

const median = (values: number[]) => {
  if (!values.length) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);
  if (sorted.length % 2 === 0) {
    return (sorted[middle - 1] + sorted[middle]) / 2;
  }
  return sorted[middle];
};

const getExecutiveTrafficLight = (
  deltaAverage: number,
): ExecutiveTrafficLight => {
  if (deltaAverage >= 0.3) {
    return {
      status: "Verde",
      color: [22, 163, 74],
      interpretation:
        "Impacto alto: el aprendizaje percibido crece de forma consistente.",
    };
  }

  if (deltaAverage >= 0.1) {
    return {
      status: "Amarillo",
      color: [245, 158, 11],
      interpretation:
        "Impacto moderado: hay mejora, pero con margen claro de optimización.",
    };
  }

  return {
    status: "Rojo",
    color: [239, 68, 68],
    interpretation:
      "Impacto bajo o negativo: se recomienda intervención prioritaria.",
  };
};

const buildDynamicAnalysis = (
  source: AdminSurveysComparisonResponse,
): DynamicSurveyAnalysis => {
  const participantsInitial = source.generalSurvey.participants;
  const participantsFinal = source.finalSurvey.participants;
  const completionRate = percentage(
    participantsFinal,
    participantsInitial || 1,
  );

  const initialTotalDist = source.generalSurvey.distribution.reduce(
    (sum, item) => sum + item.count,
    0,
  );
  const finalTotalDist = source.finalSurvey.distribution.reduce(
    (sum, item) => sum + item.count,
    0,
  );

  const topBoxInitial = percentage(
    getCountForValues(source.generalSurvey.distribution, [4, 5]),
    initialTotalDist,
  );
  const topBoxFinal = percentage(
    getCountForValues(source.finalSurvey.distribution, [4, 5]),
    finalTotalDist,
  );
  const lowBoxInitial = percentage(
    getCountForValues(source.generalSurvey.distribution, [1, 2]),
    initialTotalDist,
  );
  const lowBoxFinal = percentage(
    getCountForValues(source.finalSurvey.distribution, [1, 2]),
    finalTotalDist,
  );

  const pairedVotes = (source.userVotes || []).filter((vote) => !!vote.final);
  const pairedCount = pairedVotes.length;

  const pairedInitialAverages = pairedVotes.map((vote) => vote.initial.average);
  const pairedFinalAverages = pairedVotes.map(
    (vote) => vote.final?.average || 0,
  );
  const pairedDeltas = pairedVotes.map(
    (vote) => (vote.final?.average || 0) - vote.initial.average,
  );

  const baseInitialAverage =
    pairedCount > 0
      ? average(pairedInitialAverages)
      : source.generalSurvey.averageScore;
  const baseFinalAverage =
    pairedCount > 0
      ? average(pairedFinalAverages)
      : source.finalSurvey.averageScore;
  const knowledgeDelta =
    pairedCount > 0 ? average(pairedDeltas) : source.comparison.averageDelta;

  const improvedCount = pairedDeltas.filter((delta) => delta > 0).length;
  const stableCount = pairedDeltas.filter((delta) => delta === 0).length;
  const declinedCount = pairedDeltas.filter((delta) => delta < 0).length;

  const improvedRate = percentage(improvedCount, pairedCount || 1);
  const stableRate = percentage(stableCount, pairedCount || 1);
  const declinedRate = percentage(declinedCount, pairedCount || 1);

  const knowledgeIndexInitial = round2(baseInitialAverage * 20);
  const knowledgeIndexFinal = round2(baseFinalAverage * 20);
  const knowledgeIndexDelta = round2(
    knowledgeIndexFinal - knowledgeIndexInitial,
  );

  const questionDeltas = (source.questionComparison || []).map((question) => ({
    question: question.question,
    delta: round2(question.finalAverage - question.generalAverage),
  }));

  const topImprovement = [...questionDeltas].sort(
    (a, b) => b.delta - a.delta,
  )[0];
  const topOpportunity = [...questionDeltas].sort(
    (a, b) => a.delta - b.delta,
  )[0];

  const gainText =
    knowledgeDelta >= 0.5
      ? "incremento alto"
      : knowledgeDelta >= 0.2
        ? "incremento moderado"
        : knowledgeDelta > 0
          ? "incremento ligero"
          : knowledgeDelta <= -0.2
            ? "retroceso"
            : "estabilidad";

  const generatedSummary =
    `Con ${participantsInitial} registros iniciales y ${participantsFinal} finales ` +
    `(cobertura final ${completionRate}%), el analisis muestra ${gainText} ` +
    `en conocimiento promedio (${round2(baseInitialAverage)} -> ${round2(baseFinalAverage)}; Delta ${round2(knowledgeDelta)}). ` +
    `La percepcion positiva (respuestas 4-5) paso de ${topBoxInitial}% a ${topBoxFinal}% ` +
    `y la percepcion negativa (1-2) de ${lowBoxInitial}% a ${lowBoxFinal}%.`;

  const insightItems: string[] = [
    `Indice de conocimiento (0-100): inicial ${knowledgeIndexInitial}, final ${knowledgeIndexFinal}, cambio ${knowledgeIndexDelta} puntos.`,
    `Usuarios con mejora: ${improvedCount}/${pairedCount || 0} (${improvedRate}%). Sin cambio: ${stableRate}%. Descenso: ${declinedRate}%.`,
    `Delta mediano por usuario: ${round2(median(pairedDeltas))}. Este valor reduce el efecto de casos atípicos.`,
    `Diferencia global de encuesta final vs inicial: ${round2(source.comparison.averageDelta)} en escala 1-5.`,
  ];

  if (topImprovement) {
    insightItems.push(
      `Mayor avance por pregunta: "${topImprovement.question}" (Δ ${topImprovement.delta}).`,
    );
  }

  if (topOpportunity) {
    insightItems.push(
      `Mayor area de oportunidad: "${topOpportunity.question}" (Delta ${topOpportunity.delta}).`,
    );
  }

  const recommendations: string[] = [];

  if (completionRate < 80) {
    recommendations.push(
      "Aumentar la cobertura de encuesta final con recordatorios por grupo y ventana de cierre más amplia para reducir sesgo de no respuesta.",
    );
  }

  if (knowledgeDelta <= 0) {
    recommendations.push(
      "Reforzar contenidos críticos con microactividades de repaso y evaluación intermedia para asegurar transferencia de conocimiento.",
    );
  } else if (knowledgeDelta < 0.3) {
    recommendations.push(
      "Mantener la estructura actual, pero añadir ejercicios aplicados al final de cada bloque para acelerar el crecimiento de aprendizaje.",
    );
  } else {
    recommendations.push(
      "Escalar los elementos mejor evaluados del programa a más sesiones; los datos indican impacto positivo consistente en aprendizaje.",
    );
  }

  if (declinedRate > 20) {
    recommendations.push(
      "Implementar seguimiento individual para participantes con caída en su puntaje final para identificar barreras de comprensión.",
    );
  }

  if (lowBoxFinal > 15) {
    recommendations.push(
      "Priorizar acciones en experiencia percibida (claridad de instrucciones, ritmo y ejemplos) para disminuir respuestas bajas (1-2).",
    );
  }

  if (!recommendations.length) {
    recommendations.push(
      "Continuar monitoreo semanal y segmentar por área/grupo para detectar tempranamente cambios en tendencia.",
    );
  }

  const adaptiveNote =
    "Este analisis se recalcula automaticamente con cada nueva respuesta de encuesta inicial/final, ajustando metricas, hallazgos y recomendaciones en funcion del comportamiento real de los datos.";

  return {
    generatedSummary,
    insightItems,
    recommendations,
    adaptiveNote,
  };
};

const DistributionChart = ({
  title,
  subtitle,
  average,
  analyzedValues,
  data,
}: {
  title: string;
  subtitle: string;
  average: number;
  analyzedValues?: number;
  data: SurveyDistributionItem[];
}) => {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
      <h3 className="font-semibold text-gray-900">{title}</h3>
      <p className="text-xs text-gray-500 mt-1">{subtitle}</p>
      <p className="text-xs text-gray-500 mt-1">
        Valores analizados para distribución: {analyzedValues ?? 0}
      </p>
      <p className="text-sm text-[#113780] font-semibold mt-2">
        Promedio: {average.toFixed(2)} / 5
      </p>

      <div className="mt-4 space-y-3">
        {data.map((item) => (
          <div key={`${title}-${item.value}`}>
            <div className="flex justify-between text-xs text-gray-600 mb-1">
              <span>Valor {item.value}</span>
              <span>
                {item.count} respuesta(s) • {item.percentage}%
              </span>
            </div>
            <div className="h-3 w-full bg-gray-100 rounded-full overflow-hidden">
              <div
                className={`h-full ${barColor}`}
                style={{ width: `${item.percentage}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default function AdminSurveyComparisonTab() {
  const comparisonScreenRef = useRef<HTMLDivElement | null>(null);
  const [data, setData] = useState<AdminSurveysComparisonResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [exportingPdf, setExportingPdf] = useState(false);
  const [exportingExecutivePdf, setExportingExecutivePdf] = useState(false);
  const [exportingScreenPdf, setExportingScreenPdf] = useState(false);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError("");
      try {
        const res = await adminAPI.getSurveysComparisonReport();
        setData(res.data);
      } catch {
        setError("No fue posible cargar la comparación de encuestas.");
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  const dynamicAnalysis = useMemo(() => {
    if (!data) return null;
    return buildDynamicAnalysis(data);
  }, [data]);

  const handleDownloadPdf = async () => {
    if (!data || !dynamicAnalysis) return;

    setExportingPdf(true);
    try {
      const doc = new jsPDF({ unit: "pt", format: "a4" });
      const pdfDoc = doc as JsPdfWithAutoTable;

      const ensurePageSpace = (requiredHeight: number) => {
        const currentY = (pdfDoc.lastAutoTable?.finalY || 40) + 12;
        if (currentY + requiredHeight > 790) {
          doc.addPage();
        }
      };

      doc.setFont("helvetica", "bold");
      doc.setTextColor(
        PDF_THEME_COLOR[0],
        PDF_THEME_COLOR[1],
        PDF_THEME_COLOR[2],
      );
      doc.setFontSize(PDF_FONT_SIZE.title);
      doc.text(s("Comparativo de Encuesta Inicial y Final"), 40, 40);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(PDF_FONT_SIZE.body);
      doc.setTextColor(90, 90, 90);
      doc.text(s(`Generado: ${new Date().toLocaleString("es-MX")}`), 40, 58);

      autoTable(doc, {
        startY: 72,
        head: [[s("Metrica"), s("Valor")]],
        body: [
          [
            s("Registros encuesta inicial"),
            s(data.generalSurvey.totalResponses),
          ],
          [s("Registros encuesta final"), s(data.finalSurvey.totalResponses)],
          [s("Participantes inicial"), s(data.generalSurvey.participants)],
          [s("Participantes final"), s(data.finalSurvey.participants)],
          [
            s("Promedio inicial (1-5)"),
            s(data.generalSurvey.averageScore.toFixed(2)),
          ],
          [
            s("Promedio final (1-5)"),
            s(data.finalSurvey.averageScore.toFixed(2)),
          ],
          [s("Delta promedio"), s(data.comparison.averageDelta.toFixed(2))],
        ],
        theme: "striped",
        headStyles: {
          fillColor: PDF_THEME_COLOR,
          fontSize: PDF_FONT_SIZE.table,
        },
        styles: { fontSize: PDF_FONT_SIZE.table, cellPadding: 4 },
      });

      ensurePageSpace(90);
      let currentY = (pdfDoc.lastAutoTable?.finalY || 72) + 20;
      doc.setTextColor(20, 20, 20);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(PDF_FONT_SIZE.section);
      doc.text(s("Analisis inteligente de resultados"), 40, currentY);

      doc.setFont("helvetica", "normal");
      doc.setFontSize(PDF_FONT_SIZE.body);
      const summaryLines = doc.splitTextToSize(
        s(dynamicAnalysis.generatedSummary),
        510,
      );
      doc.text(summaryLines, 40, currentY + 16);
      currentY += 16 + summaryLines.length * 12;

      const insightRows = dynamicAnalysis.insightItems.map((item, index) => [
        s(`Hallazgo ${index + 1}`),
        s(item),
      ]);
      autoTable(doc, {
        startY: currentY + 8,
        head: [[s("Tipo"), s("Detalle")]],
        body: insightRows,
        theme: "grid",
        headStyles: {
          fillColor: PDF_THEME_COLOR,
          fontSize: PDF_FONT_SIZE.table,
        },
        styles: { cellPadding: 4, fontSize: PDF_FONT_SIZE.table },
        columnStyles: { 0: { cellWidth: 95 }, 1: { cellWidth: 415 } },
      });

      ensurePageSpace(160);
      currentY = (pdfDoc.lastAutoTable?.finalY || currentY) + 16;
      autoTable(doc, {
        startY: currentY,
        head: [[s("Recomendaciones accionables")]],
        body: dynamicAnalysis.recommendations.map((item) => [s(item)]),
        theme: "grid",
        headStyles: {
          fillColor: PDF_THEME_COLOR,
          fontSize: PDF_FONT_SIZE.table,
        },
        styles: { fontSize: PDF_FONT_SIZE.table, cellPadding: 4 },
      });

      ensurePageSpace(220);
      currentY = (pdfDoc.lastAutoTable?.finalY || currentY) + 16;
      autoTable(doc, {
        startY: currentY,
        head: [
          [
            s("Pregunta"),
            s("Promedio inicial"),
            s("Promedio final"),
            s("Delta"),
          ],
        ],
        body: (data.questionComparison || []).map((question) => {
          const delta = question.finalAverage - question.generalAverage;
          return [
            s(question.question),
            s(question.generalAverage.toFixed(2)),
            s(question.finalAverage.toFixed(2)),
            s(`${delta > 0 ? "+" : ""}${delta.toFixed(2)}`),
          ];
        }),
        theme: "grid",
        headStyles: {
          fillColor: PDF_THEME_COLOR,
          fontSize: PDF_FONT_SIZE.table,
        },
        styles: { fontSize: PDF_FONT_SIZE.table, cellPadding: 4 },
      });

      ensurePageSpace(220);
      currentY = (pdfDoc.lastAutoTable?.finalY || currentY) + 16;
      autoTable(doc, {
        startY: currentY,
        head: [
          [
            "Empleado",
            "Inicial",
            "Final",
            "Promedio Ini",
            "Promedio Fin",
            "Delta",
          ].map((item) => s(item)),
        ],
        body: (data.userVotes || []).map((vote) => [
          s(vote.employeeNumber),
          s(`${vote.initial.q1}/${vote.initial.q2}/${vote.initial.q3}`),
          vote.final
            ? s(`${vote.final.q1}/${vote.final.q2}/${vote.final.q3}`)
            : s("Sin final"),
          s(vote.initial.average.toFixed(2)),
          s(vote.final ? vote.final.average.toFixed(2) : "-"),
          vote.deltaAverage === null
            ? s("-")
            : s(
                `${vote.deltaAverage > 0 ? "+" : ""}${vote.deltaAverage.toFixed(2)}`,
              ),
        ]),
        theme: "grid",
        headStyles: {
          fillColor: PDF_THEME_COLOR,
          fontSize: PDF_FONT_SIZE.table,
        },
        styles: { fontSize: PDF_FONT_SIZE.table, cellPadding: 4 },
      });

      const dateSuffix = new Date().toISOString().slice(0, 10);
      doc.save(`comparativo-encuestas-${dateSuffix}.pdf`);
    } finally {
      setExportingPdf(false);
    }
  };

  const handleDownloadExecutivePdf = async () => {
    if (!data || !dynamicAnalysis) return;

    setExportingExecutivePdf(true);
    try {
      const doc = new jsPDF({ unit: "pt", format: "a4" });
      const pdfDoc = doc as JsPdfWithAutoTable;
      const trafficLight = getExecutiveTrafficLight(
        data.comparison.averageDelta,
      );

      doc.setFont("helvetica", "bold");
      doc.setTextColor(
        PDF_THEME_COLOR[0],
        PDF_THEME_COLOR[1],
        PDF_THEME_COLOR[2],
      );
      doc.setFontSize(PDF_FONT_SIZE.title);
      doc.text(s("Resumen Ejecutivo - Comparativo de Encuestas"), 40, 40);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(PDF_FONT_SIZE.body);
      doc.setTextColor(90, 90, 90);
      doc.text(s(`Generado: ${new Date().toLocaleString("es-MX")}`), 40, 58);

      autoTable(doc, {
        startY: 72,
        head: [[s("Indicador clave"), s("Valor")]],
        body: [
          [
            s("Participantes encuesta inicial"),
            s(data.generalSurvey.participants),
          ],
          [s("Participantes encuesta final"), s(data.finalSurvey.participants)],
          [
            s("Promedio inicial (1-5)"),
            s(data.generalSurvey.averageScore.toFixed(2)),
          ],
          [
            s("Promedio final (1-5)"),
            s(data.finalSurvey.averageScore.toFixed(2)),
          ],
          [s("Delta promedio"), s(data.comparison.averageDelta.toFixed(2))],
          [
            s("Diferencias significativas"),
            s(data.comparison.significantDifferences.length),
          ],
        ],
        theme: "striped",
        headStyles: {
          fillColor: PDF_THEME_COLOR,
          fontSize: PDF_FONT_SIZE.table,
        },
        styles: { fontSize: PDF_FONT_SIZE.table, cellPadding: 4 },
      });

      let currentY = (pdfDoc.lastAutoTable?.finalY || 72) + 20;
      doc.setFont("helvetica", "bold");
      doc.setFontSize(PDF_FONT_SIZE.section);
      doc.setTextColor(20, 20, 20);
      doc.text(s("Semaforo de impacto (segun delta promedio)"), 40, currentY);

      const circleY = currentY + 18;
      doc.setFillColor(229, 231, 235);
      doc.circle(48, circleY, 6, "F");
      doc.circle(68, circleY, 6, "F");
      doc.circle(88, circleY, 6, "F");

      if (trafficLight.status === "Rojo") {
        doc.setFillColor(
          trafficLight.color[0],
          trafficLight.color[1],
          trafficLight.color[2],
        );
        doc.circle(48, circleY, 6, "F");
      }
      if (trafficLight.status === "Amarillo") {
        doc.setFillColor(
          trafficLight.color[0],
          trafficLight.color[1],
          trafficLight.color[2],
        );
        doc.circle(68, circleY, 6, "F");
      }
      if (trafficLight.status === "Verde") {
        doc.setFillColor(
          trafficLight.color[0],
          trafficLight.color[1],
          trafficLight.color[2],
        );
        doc.circle(88, circleY, 6, "F");
      }

      doc.setFont("helvetica", "normal");
      doc.setFontSize(PDF_FONT_SIZE.body);
      doc.setTextColor(55, 65, 81);
      doc.text(
        s(
          `Estado: ${trafficLight.status} (Delta promedio: ${data.comparison.averageDelta.toFixed(2)})`,
        ),
        110,
        circleY + 3,
      );

      const interpretationLines = doc.splitTextToSize(
        s(trafficLight.interpretation),
        440,
      );
      doc.text(interpretationLines, 110, circleY + 18);

      currentY = circleY + 24 + interpretationLines.length * 11;
      doc.setTextColor(20, 20, 20);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(PDF_FONT_SIZE.section);
      doc.text(s("Sintesis ejecutiva"), 40, currentY);

      doc.setFont("helvetica", "normal");
      doc.setFontSize(PDF_FONT_SIZE.body);
      const summaryLines = doc.splitTextToSize(
        s(dynamicAnalysis.generatedSummary),
        510,
      );
      doc.text(summaryLines, 40, currentY + 16);

      currentY += 16 + summaryLines.length * 12;
      autoTable(doc, {
        startY: currentY + 10,
        head: [[s("Hallazgos principales")]],
        body: dynamicAnalysis.insightItems.slice(0, 5).map((item) => [s(item)]),
        theme: "grid",
        headStyles: {
          fillColor: PDF_THEME_COLOR,
          fontSize: PDF_FONT_SIZE.table,
        },
        styles: { fontSize: PDF_FONT_SIZE.table, cellPadding: 4 },
      });

      currentY = (pdfDoc.lastAutoTable?.finalY || currentY) + 14;
      autoTable(doc, {
        startY: currentY,
        head: [[s("Recomendaciones para toma de decision")]],
        body: dynamicAnalysis.recommendations.map((item) => [s(item)]),
        theme: "grid",
        headStyles: {
          fillColor: PDF_THEME_COLOR,
          fontSize: PDF_FONT_SIZE.table,
        },
        styles: { fontSize: PDF_FONT_SIZE.table, cellPadding: 4 },
      });

      currentY = (pdfDoc.lastAutoTable?.finalY || currentY) + 16;
      doc.setFontSize(PDF_FONT_SIZE.footnote);
      doc.setTextColor(100, 100, 100);
      const adaptiveLines = doc.splitTextToSize(
        s(dynamicAnalysis.adaptiveNote),
        510,
      );
      doc.text(adaptiveLines, 40, currentY);

      const dateSuffix = new Date().toISOString().slice(0, 10);
      doc.save(`comparativo-encuestas-resumen-ejecutivo-${dateSuffix}.pdf`);
    } finally {
      setExportingExecutivePdf(false);
    }
  };

  const handleDownloadScreenPdf = async () => {
    if (!comparisonScreenRef.current) return;

    setExportingScreenPdf(true);
    try {
      const target = comparisonScreenRef.current;
      const doc = new jsPDF({
        unit: "pt",
        format: "a4",
        orientation: "portrait",
      });

      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      const margin = 20;
      const printableWidth = pageWidth - margin * 2;
      const printableHeight = pageHeight - margin * 2;
      const totalHeight = target.scrollHeight;
      const totalWidth = target.scrollWidth;
      const chunkHeight = 1200;
      let firstPage = true;

      for (let offset = 0; offset < totalHeight; offset += chunkHeight) {
        const currentChunkHeight = Math.min(chunkHeight, totalHeight - offset);
        const canvas = await html2canvas(target, {
          scale: Math.min(2, window.devicePixelRatio || 1.5),
          useCORS: true,
          backgroundColor: "#ffffff",
          x: 0,
          y: offset,
          width: totalWidth,
          height: currentChunkHeight,
          windowWidth: totalWidth,
          windowHeight: totalHeight,
          scrollX: 0,
          scrollY: -window.scrollY,
        });

        const imageData = canvas.toDataURL("image/png", 1.0);
        const imageHeight = (canvas.height * printableWidth) / canvas.width;

        if (!firstPage) {
          doc.addPage();
        }

        if (imageHeight <= printableHeight) {
          doc.addImage(
            imageData,
            "PNG",
            margin,
            margin,
            printableWidth,
            imageHeight,
            undefined,
            "FAST",
          );
          firstPage = false;
          continue;
        }

        let remainingHeight = imageHeight;
        let offsetY = margin;
        doc.addImage(
          imageData,
          "PNG",
          margin,
          offsetY,
          printableWidth,
          imageHeight,
          undefined,
          "FAST",
        );
        remainingHeight -= printableHeight;

        while (remainingHeight > 0) {
          doc.addPage();
          offsetY = margin - (imageHeight - remainingHeight);
          doc.addImage(
            imageData,
            "PNG",
            margin,
            offsetY,
            printableWidth,
            imageHeight,
            undefined,
            "FAST",
          );
          remainingHeight -= printableHeight;
        }

        firstPage = false;
      }

      const dateSuffix = new Date().toISOString().slice(0, 10);
      doc.save(`comparativo-encuestas-foto-pantalla-${dateSuffix}.pdf`);
    } finally {
      setExportingScreenPdf(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#113780]" />
        <span className="ml-3 text-gray-500">Cargando comparación...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl p-4 text-sm">
        {error}
      </div>
    );
  }

  if (!data) {
    return (
      <div className="bg-gray-50 border border-gray-200 text-gray-700 rounded-xl p-4 text-sm">
        Sin datos de encuestas disponibles.
      </div>
    );
  }

  return (
    <div ref={comparisonScreenRef} className="space-y-4">
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h2 className="text-lg font-bold text-gray-900">
              Comparación: Encuesta General vs Encuesta Final
            </h2>
            <p className="text-sm text-gray-500 mt-1">
              Distribución de respuestas de ambas encuestas para identificar
              tendencias y diferencias significativas.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={handleDownloadExecutivePdf}
              disabled={
                exportingPdf || exportingExecutivePdf || exportingScreenPdf
              }
              className="bg-white border border-[#113780] text-[#113780] hover:bg-blue-50 disabled:opacity-50 disabled:cursor-not-allowed px-4 py-2 rounded-lg text-sm font-medium"
            >
              {exportingExecutivePdf
                ? "Generando ejecutivo..."
                : "PDF Ejecutivo"}
            </button>
            <button
              onClick={handleDownloadScreenPdf}
              disabled={
                exportingPdf || exportingExecutivePdf || exportingScreenPdf
              }
              className="bg-white border border-gray-300 text-gray-700 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed px-4 py-2 rounded-lg text-sm font-medium"
            >
              {exportingScreenPdf
                ? "Generando foto PDF..."
                : "PDF Foto Pantalla"}
            </button>
            <button
              onClick={handleDownloadPdf}
              disabled={
                exportingPdf || exportingExecutivePdf || exportingScreenPdf
              }
              className="bg-[#113780] hover:bg-[#0C2A5C] disabled:opacity-50 disabled:cursor-not-allowed text-white px-4 py-2 rounded-lg text-sm font-medium"
            >
              {exportingPdf ? "Generando PDF..." : "Descargar PDF"}
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-4">
          <div className="bg-blue-50 rounded-lg p-3">
            <p className="text-xs text-blue-700">
              Encuesta general (registros)
            </p>
            <p className="text-xl font-bold text-[#113780]">
              {data.generalSurvey.totalResponses}
            </p>
          </div>
          <div className="bg-indigo-50 rounded-lg p-3">
            <p className="text-xs text-indigo-700">
              Encuesta final (registros)
            </p>
            <p className="text-xl font-bold text-indigo-700">
              {data.finalSurvey.totalResponses}
            </p>
          </div>
          <div className="bg-gray-50 rounded-lg p-3">
            <p className="text-xs text-gray-600">Generado</p>
            <p className="text-sm font-semibold text-gray-800">
              {new Date(data.generatedAt).toLocaleString("es-MX")}
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <DistributionChart
          title="Encuesta General"
          subtitle={`Participantes: ${data.generalSurvey.participants}`}
          average={data.generalSurvey.averageScore}
          analyzedValues={data.generalSurvey.totalAnswerValues}
          data={data.generalSurvey.distribution}
        />

        <DistributionChart
          title="Encuesta Final"
          subtitle={`Participantes: ${data.finalSurvey.participants}`}
          average={data.finalSurvey.averageScore}
          analyzedValues={data.finalSurvey.totalAnswerValues}
          data={data.finalSurvey.distribution}
        />
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
        <h3 className="font-semibold text-gray-900">
          Análisis inteligente de resultados
        </h3>
        <p className="text-sm text-gray-600 mt-1">
          {dynamicAnalysis?.generatedSummary}
        </p>

        <div className="mt-4 grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="bg-blue-50 rounded-lg p-3">
            <p className="text-sm font-semibold text-[#113780]">
              Hallazgos clave
            </p>
            <ul className="mt-2 space-y-1 text-sm text-gray-700 list-disc pl-5">
              {(dynamicAnalysis?.insightItems || []).map((item, index) => (
                <li key={`insight-${index}`}>{item}</li>
              ))}
            </ul>
          </div>
          <div className="bg-emerald-50 rounded-lg p-3">
            <p className="text-sm font-semibold text-emerald-800">
              Recomendaciones accionables
            </p>
            <ul className="mt-2 space-y-1 text-sm text-gray-700 list-disc pl-5">
              {(dynamicAnalysis?.recommendations || []).map((item, index) => (
                <li key={`recommendation-${index}`}>{item}</li>
              ))}
            </ul>
          </div>
        </div>

        <p className="text-xs text-gray-500 mt-3">
          {dynamicAnalysis?.adaptiveNote}
        </p>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
        <h3 className="font-semibold text-gray-900">
          Comparación por pregunta
        </h3>
        <p className="text-sm text-gray-500 mt-1">
          Misma pregunta en encuesta inicial y final para ver tendencias por
          tema.
        </p>

        <div className="mt-4 space-y-4">
          {(data.questionComparison || []).map((questionItem, index) => (
            <div
              key={`question-comparison-${index}`}
              className="border border-gray-100 rounded-lg p-3"
            >
              <p className="text-sm font-medium text-gray-900">
                {questionItem.question}
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-3">
                <div>
                  <p className="text-xs text-gray-500 mb-2">
                    Inicial • Promedio: {questionItem.generalAverage.toFixed(2)}{" "}
                    / 5
                  </p>
                  <div className="space-y-2">
                    {questionItem.generalDistribution.map((dist) => (
                      <div key={`g-${index}-${dist.value}`}>
                        <div className="flex justify-between text-[11px] text-gray-600 mb-1">
                          <span>Valor {dist.value}</span>
                          <span>
                            {dist.count} • {dist.percentage}%
                          </span>
                        </div>
                        <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-blue-500"
                            style={{ width: `${dist.percentage}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <p className="text-xs text-gray-500 mb-2">
                    Final • Promedio: {questionItem.finalAverage.toFixed(2)} / 5
                  </p>
                  <div className="space-y-2">
                    {questionItem.finalDistribution.map((dist) => (
                      <div key={`f-${index}-${dist.value}`}>
                        <div className="flex justify-between text-[11px] text-gray-600 mb-1">
                          <span>Valor {dist.value}</span>
                          <span>
                            {dist.count} • {dist.percentage}%
                          </span>
                        </div>
                        <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-emerald-600"
                            style={{ width: `${dist.percentage}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
        <h3 className="font-semibold text-gray-900">
          Lo que votó cada usuario
        </h3>
        <p className="text-sm text-gray-500 mt-1">
          Comparación por usuario entre encuesta inicial y encuesta final.
        </p>

        <div className="mt-4 overflow-x-auto">
          <table className="min-w-full text-sm border border-gray-100 rounded-lg overflow-hidden">
            <thead className="bg-gray-50 text-gray-600">
              <tr>
                <th className="text-left px-3 py-2 font-medium">Empleado</th>
                <th className="text-right px-3 py-2 font-medium">
                  Inicial Q1/Q2/Q3
                </th>
                <th className="text-right px-3 py-2 font-medium">
                  Final Q1/Q2/Q3
                </th>
                <th className="text-right px-3 py-2 font-medium">
                  Promedio Ini
                </th>
                <th className="text-right px-3 py-2 font-medium">
                  Promedio Fin
                </th>
                <th className="text-right px-3 py-2 font-medium">Delta</th>
              </tr>
            </thead>
            <tbody>
              {(data.userVotes || []).map((vote) => (
                <tr
                  key={`user-vote-${vote.employeeNumber}`}
                  className="border-t border-gray-100"
                >
                  <td className="px-3 py-2 text-gray-800">
                    {vote.employeeNumber}
                  </td>
                  <td className="px-3 py-2 text-right text-gray-700">
                    {vote.initial.q1}/{vote.initial.q2}/{vote.initial.q3}
                  </td>
                  <td className="px-3 py-2 text-right text-gray-700">
                    {vote.final
                      ? `${vote.final.q1}/${vote.final.q2}/${vote.final.q3}`
                      : "Sin final"}
                  </td>
                  <td className="px-3 py-2 text-right text-gray-700">
                    {vote.initial.average.toFixed(2)}
                  </td>
                  <td className="px-3 py-2 text-right text-gray-700">
                    {vote.final ? vote.final.average.toFixed(2) : "-"}
                  </td>
                  <td
                    className={`px-3 py-2 text-right font-semibold ${
                      vote.deltaAverage === null
                        ? "text-gray-500"
                        : vote.deltaAverage > 0
                          ? "text-green-700"
                          : vote.deltaAverage < 0
                            ? "text-red-700"
                            : "text-gray-700"
                    }`}
                  >
                    {vote.deltaAverage === null
                      ? "-"
                      : `${vote.deltaAverage > 0 ? "+" : ""}${vote.deltaAverage.toFixed(2)}`}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
        <h3 className="font-semibold text-gray-900">
          Tendencias y diferencias
        </h3>
        <p className="text-sm text-gray-600 mt-1">{data.comparison.trend}</p>
        <p className="text-sm mt-1 text-[#113780]">
          Delta promedio (final - general):
          <strong> {data.comparison.averageDelta.toFixed(2)}</strong>
        </p>

        <div className="mt-4 overflow-x-auto">
          <table className="min-w-full text-sm border border-gray-100 rounded-lg overflow-hidden">
            <thead className="bg-gray-50 text-gray-600">
              <tr>
                <th className="text-left px-3 py-2 font-medium">Valor</th>
                <th className="text-right px-3 py-2 font-medium">General %</th>
                <th className="text-right px-3 py-2 font-medium">Final %</th>
                <th className="text-right px-3 py-2 font-medium">Diferencia</th>
              </tr>
            </thead>
            <tbody>
              {data.comparison.differences.map((item) => (
                <tr
                  key={`diff-${item.value}`}
                  className="border-t border-gray-100"
                >
                  <td className="px-3 py-2 text-gray-800">{item.value}</td>
                  <td className="px-3 py-2 text-right text-gray-700">
                    {item.generalPercentage}%
                  </td>
                  <td className="px-3 py-2 text-right text-gray-700">
                    {item.finalPercentage}%
                  </td>
                  <td
                    className={`px-3 py-2 text-right font-semibold ${
                      item.deltaPercentage > 0
                        ? "text-green-700"
                        : item.deltaPercentage < 0
                          ? "text-red-700"
                          : "text-gray-700"
                    }`}
                  >
                    {item.deltaPercentage > 0 ? "+" : ""}
                    {item.deltaPercentage}%
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="mt-4">
          <p className="text-sm font-medium text-gray-900">
            Diferencias significativas (|Δ| ≥ 10 pp)
          </p>
          {data.comparison.significantDifferences.length === 0 ? (
            <p className="text-sm text-gray-500 mt-1">
              No se detectaron diferencias significativas entre ambas encuestas.
            </p>
          ) : (
            <ul className="mt-2 space-y-1 text-sm text-gray-700">
              {data.comparison.significantDifferences.map((item) => (
                <li key={`sig-${item.value}`}>
                  Valor {item.value}: General {item.generalPercentage}% vs Final{" "}
                  {item.finalPercentage}% ({item.deltaPercentage > 0 ? "+" : ""}
                  {item.deltaPercentage} pp)
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
