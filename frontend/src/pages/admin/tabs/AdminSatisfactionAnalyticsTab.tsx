import { useEffect, useMemo, useState } from "react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { adminAPI } from "../../../services/api";
import type {
  AdminSatisfactionReportResponse,
  SatisfactionSessionChart,
} from "../../../types";

type JsPdfWithAutoTable = jsPDF & {
  lastAutoTable?: {
    finalY: number;
  };
};

const formatDate = (date: string | null) => {
  if (!date) return "Sin fecha";
  const parsed = new Date(date);
  if (Number.isNaN(parsed.getTime())) return "Sin fecha";
  return parsed.toLocaleDateString("es-MX", {
    year: "numeric",
    month: "short",
    day: "2-digit",
  });
};

const optionColor = (label: string) => {
  switch (label) {
    case "Nada claro":
      return "bg-red-500";
    case "Claro":
      return "bg-amber-500";
    case "Muy claro":
      return "bg-blue-500";
    case "Clarísimo":
      return "bg-green-600";
    default:
      return "bg-gray-500";
  }
};

export default function AdminSatisfactionAnalyticsTab() {
  const [data, setData] = useState<AdminSatisfactionReportResponse | null>(
    null,
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [exportingPdf, setExportingPdf] = useState(false);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError("");
      try {
        const res = await adminAPI.getSatisfactionBySessionReport();
        setData(res.data);
      } catch {
        setError("No fue posible cargar la analítica de satisfacción.");
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  const sortedCharts = useMemo(() => {
    if (!data?.sessionCharts) return [];
    return [...data.sessionCharts].sort((a, b) => {
      const dateA = a.scheduleDate ? new Date(a.scheduleDate).getTime() : 0;
      const dateB = b.scheduleDate ? new Date(b.scheduleDate).getTime() : 0;
      return dateA - dateB;
    });
  }, [data]);

  const handleDownloadPdf = async () => {
    if (!data) return;

    setExportingPdf(true);
    try {
      const doc = new jsPDF({ unit: "pt", format: "a4" });
      const pdfDoc = doc as JsPdfWithAutoTable;

      doc.setFontSize(16);
      doc.text("Informe de Satisfacción por Stand y Sesión", 40, 40);
      doc.setFontSize(10);
      doc.setTextColor(90, 90, 90);
      doc.text(`Generado: ${new Date().toLocaleString("es-MX")}`, 40, 58);

      autoTable(doc, {
        startY: 72,
        head: [["Métrica", "Valor"]],
        body: [
          ["Total respuestas", String(data.totalResponses)],
          ["Sesiones analizadas", String(data.sessionCharts.length)],
          ["Stands analizados", String(data.standSummary.length)],
        ],
        theme: "striped",
        headStyles: { fillColor: [17, 55, 128] },
      });

      let currentY = (pdfDoc.lastAutoTable?.finalY || 72) + 18;

      doc.setFontSize(12);
      doc.setTextColor(20, 20, 20);
      doc.text("Resumen por stand", 40, currentY);
      autoTable(doc, {
        startY: currentY + 8,
        head: [["Stand", "Respuestas", "Promedio satisfacción (1-4)"]],
        body: data.standSummary.map((row) => [
          row.standName,
          String(row.totalResponses),
          row.averageScore.toFixed(2),
        ]),
        theme: "grid",
        headStyles: { fillColor: [17, 55, 128] },
      });

      currentY = (pdfDoc.lastAutoTable?.finalY || currentY + 8) + 16;

      const renderChartBars = (
        session: SatisfactionSessionChart,
        startY: number,
      ) => {
        doc.setFontSize(10);
        doc.setTextColor(30, 30, 30);
        doc.text(
          `${session.standName} - ${session.sessionName} (${session.scheduleTitle})`,
          40,
          startY,
        );

        let y = startY + 12;
        const barMaxWidth = 280;

        for (const metric of session.responsesByOption) {
          const width = Math.max(2, (metric.percentage / 100) * barMaxWidth);

          doc.setFontSize(9);
          doc.setTextColor(70, 70, 70);
          doc.text(metric.label, 40, y + 8);

          let rgb: [number, number, number] = [107, 114, 128];
          if (metric.label === "Nada claro") rgb = [239, 68, 68];
          if (metric.label === "Claro") rgb = [245, 158, 11];
          if (metric.label === "Muy claro") rgb = [59, 130, 246];
          if (metric.label === "Clarísimo") rgb = [22, 163, 74];

          doc.setFillColor(rgb[0], rgb[1], rgb[2]);
          doc.rect(130, y, width, 10, "F");

          doc.setTextColor(55, 65, 81);
          doc.text(`${metric.count} (${metric.percentage}%)`, 420, y + 8);

          y += 16;
        }

        doc.setFontSize(9);
        doc.setTextColor(31, 41, 55);
        doc.text(
          `Total: ${session.totalResponses} | Promedio: ${session.averageScore.toFixed(2)} / 4`,
          40,
          y + 2,
        );

        return y + 10;
      };

      for (const session of sortedCharts) {
        if (currentY > 700) {
          doc.addPage();
          currentY = 40;
        }

        currentY = renderChartBars(session, currentY);
      }

      const dateSuffix = new Date().toISOString().slice(0, 10);
      doc.save(`informe-satisfaccion-stands-${dateSuffix}.pdf`);
    } finally {
      setExportingPdf(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#113780]" />
        <span className="ml-3 text-gray-500">Cargando satisfacción...</span>
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
        Sin datos de satisfacción disponibles.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h2 className="text-lg font-bold text-gray-900">
              Satisfacción por Stand y Sesión
            </h2>
            <p className="text-sm text-gray-500 mt-1">
              Gráfico por sesión considerando todos los horarios disponibles.
            </p>
          </div>
          <button
            onClick={handleDownloadPdf}
            disabled={exportingPdf || sortedCharts.length === 0}
            className="bg-[#113780] hover:bg-[#0C2A5C] disabled:opacity-50 disabled:cursor-not-allowed text-white px-4 py-2 rounded-lg text-sm font-medium"
          >
            {exportingPdf ? "Generando PDF..." : "Descargar PDF"}
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-4">
          <div className="bg-blue-50 rounded-lg p-3">
            <p className="text-xs text-blue-700">Total respuestas</p>
            <p className="text-xl font-bold text-[#113780]">
              {data.totalResponses}
            </p>
          </div>
          <div className="bg-indigo-50 rounded-lg p-3">
            <p className="text-xs text-indigo-700">Sesiones analizadas</p>
            <p className="text-xl font-bold text-indigo-700">
              {sortedCharts.length}
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

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
        <h3 className="font-semibold text-gray-900">Resumen por stand</h3>
        <div className="mt-3 overflow-x-auto">
          <table className="min-w-full text-sm border border-gray-100 rounded-lg overflow-hidden">
            <thead className="bg-gray-50 text-gray-600">
              <tr>
                <th className="text-left px-3 py-2 font-medium">Stand</th>
                <th className="text-right px-3 py-2 font-medium">Respuestas</th>
                <th className="text-right px-3 py-2 font-medium">
                  Promedio (1-4)
                </th>
              </tr>
            </thead>
            <tbody>
              {data.standSummary.map((row) => (
                <tr key={row.standName} className="border-t border-gray-100">
                  <td className="px-3 py-2 text-gray-800">{row.standName}</td>
                  <td className="px-3 py-2 text-right text-gray-700">
                    {row.totalResponses}
                  </td>
                  <td className="px-3 py-2 text-right text-[#113780] font-semibold">
                    {row.averageScore.toFixed(2)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {sortedCharts.length === 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 text-sm text-gray-500">
          No hay respuestas de satisfacción registradas.
        </div>
      )}

      {sortedCharts.map((session) => (
        <div
          key={`${session.scheduleId}-${session.sessionId}`}
          className="bg-white rounded-xl shadow-sm border border-gray-100 p-4"
        >
          <div className="mb-3">
            <h3 className="font-semibold text-gray-900">{session.standName}</h3>
            <p className="text-sm text-gray-700">{session.sessionName}</p>
            <p className="text-xs text-gray-500">
              {session.scheduleTitle} • {formatDate(session.scheduleDate)}
            </p>
          </div>

          <div className="space-y-3">
            {session.responsesByOption.map((metric) => (
              <div key={`${session.sessionId}-${metric.label}`}>
                <div className="flex justify-between text-xs text-gray-600 mb-1">
                  <span>{metric.label}</span>
                  <span>
                    {metric.count} respuesta(s) • {metric.percentage}%
                  </span>
                </div>
                <div className="h-3 w-full bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className={`h-full ${optionColor(metric.label)}`}
                    style={{ width: `${metric.percentage}%` }}
                  />
                </div>
              </div>
            ))}
          </div>

          <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
            <span className="text-gray-700">
              Total respuestas: <strong>{session.totalResponses}</strong>
            </span>
            <span className="text-[#113780]">
              Promedio satisfacción:{" "}
              <strong>{session.averageScore.toFixed(2)} / 4</strong>
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}
