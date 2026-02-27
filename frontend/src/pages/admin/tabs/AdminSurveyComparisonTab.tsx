import { useEffect, useState } from "react";
import { adminAPI } from "../../../services/api";
import type {
  AdminSurveysComparisonResponse,
  SurveyDistributionItem,
} from "../../../types";

const barColor = "bg-[#113780]";

const DistributionChart = ({
  title,
  subtitle,
  average,
  data,
}: {
  title: string;
  subtitle: string;
  average: number;
  data: SurveyDistributionItem[];
}) => {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
      <h3 className="font-semibold text-gray-900">{title}</h3>
      <p className="text-xs text-gray-500 mt-1">{subtitle}</p>
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
  const [data, setData] = useState<AdminSurveysComparisonResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

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
    <div className="space-y-4">
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
        <h2 className="text-lg font-bold text-gray-900">
          Comparación: Encuesta General vs Encuesta Final
        </h2>
        <p className="text-sm text-gray-500 mt-1">
          Distribución de respuestas de ambas encuestas para identificar
          tendencias y diferencias significativas.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-4">
          <div className="bg-blue-50 rounded-lg p-3">
            <p className="text-xs text-blue-700">
              Encuesta general (respuestas)
            </p>
            <p className="text-xl font-bold text-[#113780]">
              {data.generalSurvey.totalResponses}
            </p>
          </div>
          <div className="bg-indigo-50 rounded-lg p-3">
            <p className="text-xs text-indigo-700">
              Encuesta final (respuestas)
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
          data={data.generalSurvey.distribution}
        />

        <DistributionChart
          title="Encuesta Final"
          subtitle={`Participantes: ${data.finalSurvey.participants}`}
          average={data.finalSurvey.averageScore}
          data={data.finalSurvey.distribution}
        />
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
