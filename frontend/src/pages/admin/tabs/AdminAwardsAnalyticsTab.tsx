import { useEffect, useMemo, useState } from "react";
import { adminAPI } from "../../../services/api";
import type {
  AdminAwardAnalyticsItem,
  AdminAwardAnalyticsResponse,
} from "../../../types";

type SessionGroup = {
  key: string;
  scheduleTitle: string;
  scheduleDate: string | null;
  sessionName: string;
  items: AdminAwardAnalyticsItem[];
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

export default function AdminAwardsAnalyticsTab() {
  const [data, setData] = useState<AdminAwardAnalyticsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError("");
      try {
        const res = await adminAPI.getAwardsAnalytics();
        setData(res.data);
      } catch {
        setError("No fue posible cargar el análisis de retos.");
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  const groupedBySession = useMemo<SessionGroup[]>(() => {
    if (!data?.items?.length) return [];

    const groups = new Map<string, SessionGroup>();

    for (const item of data.items) {
      const key = `${item.scheduleId || item.scheduleTitle}-${item.subActivityId}`;
      const current = groups.get(key);

      if (current) {
        current.items.push(item);
        continue;
      }

      groups.set(key, {
        key,
        scheduleTitle: item.scheduleTitle,
        scheduleDate: item.scheduleDate,
        sessionName: item.sessionName,
        items: [item],
      });
    }

    return Array.from(groups.values())
      .map((group) => ({
        ...group,
        items: [...group.items].sort(
          (a, b) =>
            b.totalResponses - a.totalResponses ||
            a.correctRate - b.correctRate,
        ),
      }))
      .sort((a, b) => {
        const dateA = a.scheduleDate ? new Date(a.scheduleDate).getTime() : 0;
        const dateB = b.scheduleDate ? new Date(b.scheduleDate).getTime() : 0;
        return dateA - dateB;
      });
  }, [data]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#113780]" />
        <span className="ml-3 text-gray-500">Cargando análisis...</span>
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
        Sin datos de análisis disponibles.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
        <h2 className="text-lg font-bold text-gray-900">
          Análisis de Retos por Sesión
        </h2>
        <p className="text-sm text-gray-500 mt-1">
          Recomendación: usar barras apiladas horizontales por pregunta para
          comparar respuestas correctas vs incorrectas.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-4">
          <div className="bg-blue-50 rounded-lg p-3">
            <p className="text-xs text-blue-700">Retos configurados</p>
            <p className="text-xl font-bold text-[#113780]">
              {data.totalChallenges}
            </p>
          </div>
          <div className="bg-green-50 rounded-lg p-3">
            <p className="text-xs text-green-700">Retos con respuestas</p>
            <p className="text-xl font-bold text-green-700">
              {data.answeredChallenges}
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
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
          <h3 className="font-semibold text-gray-900">
            Mayor número de correctas
          </h3>
          <ul className="mt-3 space-y-2 text-sm">
            {data.mostCorrect.length === 0 && (
              <li className="text-gray-500">No hay respuestas todavía.</li>
            )}
            {data.mostCorrect.map((item) => (
              <li
                key={item.awardId}
                className="border border-gray-100 rounded-lg p-2"
              >
                <p className="font-medium text-gray-800 line-clamp-2">
                  {item.question}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  {item.scheduleTitle} • {item.sessionName}
                </p>
                <p className="text-xs text-green-700 mt-1">
                  Correctas: {item.correctResponses} de {item.totalResponses} (
                  {item.correctRate}%)
                </p>
              </li>
            ))}
          </ul>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
          <h3 className="font-semibold text-gray-900">
            Menor certeza al responder
          </h3>
          <ul className="mt-3 space-y-2 text-sm">
            {data.leastCertainty.length === 0 && (
              <li className="text-gray-500">No hay respuestas todavía.</li>
            )}
            {data.leastCertainty.map((item) => (
              <li
                key={item.awardId}
                className="border border-gray-100 rounded-lg p-2"
              >
                <p className="font-medium text-gray-800 line-clamp-2">
                  {item.question}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  {item.scheduleTitle} • {item.sessionName}
                </p>
                <p className="text-xs text-red-700 mt-1">
                  Incorrectas: {item.incorrectResponses} de{" "}
                  {item.totalResponses} ({100 - item.correctRate}%)
                </p>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {groupedBySession.length === 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 text-sm text-gray-500">
          No hay retos registrados para analizar.
        </div>
      )}

      {groupedBySession.map((group) => (
        <div
          key={group.key}
          className="bg-white rounded-xl shadow-sm border border-gray-100 p-4"
        >
          <div className="mb-3">
            <h3 className="font-semibold text-gray-900">{group.sessionName}</h3>
            <p className="text-xs text-gray-500">
              {group.scheduleTitle} • {formatDate(group.scheduleDate)}
            </p>
          </div>

          <div className="space-y-3">
            {group.items.map((item) => {
              const total = item.totalResponses || 1;
              const correctWidth = `${(item.correctResponses / total) * 100}%`;
              const incorrectWidth = `${(item.incorrectResponses / total) * 100}%`;

              return (
                <div
                  key={item.awardId}
                  className="border border-gray-100 rounded-lg p-3"
                >
                  <p className="text-sm font-medium text-gray-800">
                    {item.question}
                  </p>
                  <div className="mt-2 h-3 w-full rounded-full overflow-hidden bg-gray-100 flex">
                    <div
                      className="bg-green-500"
                      style={{ width: correctWidth }}
                    />
                    <div
                      className="bg-red-500"
                      style={{ width: incorrectWidth }}
                    />
                  </div>
                  <div className="mt-2 grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                    <span className="text-gray-600">
                      Respondieron: {item.totalResponses}
                    </span>
                    <span className="text-green-700">
                      Correctas: {item.correctResponses}
                    </span>
                    <span className="text-red-700">
                      Incorrectas: {item.incorrectResponses}
                    </span>
                    <span className="text-[#113780]">
                      Acierto: {item.correctRate}%
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="mt-4 overflow-x-auto">
            <table className="min-w-full text-sm border border-gray-100 rounded-lg overflow-hidden">
              <thead className="bg-gray-50 text-gray-600">
                <tr>
                  <th className="text-left px-3 py-2 font-medium">Pregunta</th>
                  <th className="text-right px-3 py-2 font-medium">
                    Respondieron
                  </th>
                  <th className="text-right px-3 py-2 font-medium">
                    Correctas
                  </th>
                  <th className="text-right px-3 py-2 font-medium">
                    Incorrectas
                  </th>
                </tr>
              </thead>
              <tbody>
                {group.items.map((item) => (
                  <tr
                    key={`${group.key}-${item.awardId}`}
                    className="border-t border-gray-100"
                  >
                    <td className="px-3 py-2 text-gray-800">{item.question}</td>
                    <td className="px-3 py-2 text-right text-gray-700">
                      {item.totalResponses}
                    </td>
                    <td className="px-3 py-2 text-right text-green-700">
                      {item.correctResponses}
                    </td>
                    <td className="px-3 py-2 text-right text-red-700">
                      {item.incorrectResponses}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ))}
    </div>
  );
}
