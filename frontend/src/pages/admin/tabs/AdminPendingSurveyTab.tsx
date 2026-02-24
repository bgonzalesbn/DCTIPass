import { useEffect, useMemo, useState } from "react";
import { adminAPI } from "../../../services/api";

type PendingUser = {
  id: string;
  employeeNumber: string;
  fullName: string;
  direction: string;
};

type PendingGroup = {
  groupId: string | null;
  groupName: string;
  shift: string | null;
  totalUsers: number;
  users: PendingUser[];
};

type PendingSurveyReport = {
  activityName: string;
  totalPendingUsers: number;
  totalGroups: number;
  groups: PendingGroup[];
  generatedAt: string;
};

const formatShift = (shift: string | null) => {
  if (shift === "Morning") return "Mañana";
  if (shift === "Afternoon") return "Tarde";
  return "Sin turno";
};

export default function AdminPendingSurveyTab() {
  const [report, setReport] = useState<PendingSurveyReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [groupFilter, setGroupFilter] = useState("");

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await adminAPI.getPendingFinalSurveyByGroup();
      setReport(response.data);
    } catch (err: any) {
      setError(
        err?.response?.data?.message ||
          "No se pudo cargar el reporte de encuesta final.",
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const filteredGroups = useMemo(() => {
    if (!report?.groups) {
      return [];
    }

    if (!groupFilter) {
      return report.groups;
    }

    return report.groups.filter(
      (group) => (group.groupId || "NO_GROUP") === groupFilter,
    );
  }, [report, groupFilter]);

  const filteredTotalUsers = filteredGroups.reduce(
    (acc, group) => acc + group.totalUsers,
    0,
  );

  const handleGeneratePdf = () => {
    if (!report) {
      return;
    }

    const groupsToRender = filteredGroups;

    const sectionsHtml = groupsToRender
      .map((group) => {
        const rows = group.users
          .map(
            (user, index) => `
              <tr class="${index % 2 === 0 ? "row-even" : "row-odd"}">
                <td>${user.employeeNumber}</td>
                <td>${user.fullName}</td>
                <td>${user.direction}</td>
              </tr>
            `,
          )
          .join("");

        return `
          <section class="group-card">
            <div class="group-header">
              <div>
                <h2>${group.groupName}</h2>
                <p>Turno: ${formatShift(group.shift)}</p>
              </div>
              <span class="badge">${group.totalUsers} pendiente${group.totalUsers === 1 ? "" : "s"}</span>
            </div>
            <table>
              <thead>
                <tr>
                  <th>Número de empleado</th>
                  <th>Nombre</th>
                  <th>Dirección</th>
                </tr>
              </thead>
              <tbody>
                ${rows}
              </tbody>
            </table>
          </section>
        `;
      })
      .join("");

    const html = `
      <html>
        <head>
          <meta charset="utf-8" />
          <title>Pendientes encuesta final IT Experience</title>
          <style>
            * { box-sizing: border-box; }
            body {
              margin: 0;
              padding: 24px;
              font-family: "Segoe UI", Tahoma, Geneva, Verdana, sans-serif;
              color: #0f172a;
              background: #f8fafc;
            }
            .cover {
              background: linear-gradient(135deg, #0c2a5c 0%, #113780 50%, #1a4fa0 100%);
              color: #fff;
              border-radius: 16px;
              padding: 28px;
              margin-bottom: 20px;
            }
            .cover h1 {
              margin: 0 0 8px 0;
              font-size: 30px;
            }
            .cover p {
              margin: 0;
              color: #dbeafe;
            }
            .stats {
              display: flex;
              gap: 12px;
              margin-top: 16px;
            }
            .stat-box {
              background: rgba(255, 255, 255, 0.12);
              border: 1px solid rgba(255, 255, 255, 0.22);
              border-radius: 10px;
              padding: 10px 14px;
              min-width: 160px;
            }
            .stat-label {
              display: block;
              font-size: 11px;
              text-transform: uppercase;
              letter-spacing: 0.08em;
              color: #bfdbfe;
            }
            .stat-value {
              font-size: 24px;
              font-weight: 700;
            }
            .group-card {
              background: #fff;
              border-radius: 14px;
              box-shadow: 0 3px 10px rgba(15, 23, 42, 0.08);
              margin-bottom: 18px;
              overflow: hidden;
              page-break-inside: avoid;
            }
            .group-header {
              padding: 16px 18px;
              background: linear-gradient(135deg, #e0e7ff 0%, #ede9fe 100%);
              border-bottom: 1px solid #dbeafe;
              display: flex;
              justify-content: space-between;
              align-items: center;
            }
            .group-header h2 {
              margin: 0;
              font-size: 18px;
              color: #1e3a8a;
            }
            .group-header p {
              margin: 4px 0 0 0;
              font-size: 12px;
              color: #475569;
            }
            .badge {
              background: #113780;
              color: #fff;
              border-radius: 999px;
              padding: 6px 12px;
              font-size: 12px;
              font-weight: 600;
              white-space: nowrap;
            }
            table {
              width: 100%;
              border-collapse: collapse;
            }
            thead tr {
              background: #f8fafc;
            }
            th, td {
              text-align: left;
              padding: 11px 14px;
              border-bottom: 1px solid #e2e8f0;
              font-size: 13px;
            }
            th {
              color: #334155;
              font-weight: 700;
            }
            .row-even { background: #ffffff; }
            .row-odd { background: #f8fafc; }
            .footer {
              margin-top: 20px;
              text-align: center;
              color: #64748b;
              font-size: 12px;
            }
          </style>
        </head>
        <body>
          <div class="cover">
            <h1>Pendientes de Encuesta Final</h1>
            <p>Actividad: ${report.activityName}</p>
            <div class="stats">
              <div class="stat-box">
                <span class="stat-label">Usuarios pendientes</span>
                <span class="stat-value">${filteredTotalUsers}</span>
              </div>
              <div class="stat-box">
                <span class="stat-label">Grupos</span>
                <span class="stat-value">${groupsToRender.length}</span>
              </div>
            </div>
          </div>

          ${sectionsHtml}

          <div class="footer">
            Generado el ${new Date().toLocaleString("es-CR")}
          </div>
        </body>
      </html>
    `;

    const popup = window.open("", "_blank", "width=1200,height=900");
    if (!popup) {
      alert("No se pudo abrir la ventana de impresión.");
      return;
    }

    popup.document.open();
    popup.document.write(html);
    popup.document.close();
    popup.focus();

    setTimeout(() => {
      popup.print();
    }, 300);
  };

  if (loading) {
    return <div className="text-center py-8">Cargando reporte...</div>;
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-red-700">
        <p className="font-semibold">No fue posible cargar el reporte.</p>
        <p className="text-sm mt-1">{error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 sm:p-5">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
          <div>
            <h2 className="text-lg font-bold text-gray-900">
              Pendientes de encuesta final
            </h2>
            <p className="text-sm text-gray-500 mt-1">
              {report?.activityName} • {report?.totalPendingUsers || 0} usuario
              {(report?.totalPendingUsers || 0) === 1 ? "" : "s"} pendientes
            </p>
          </div>
          <button
            onClick={handleGeneratePdf}
            className="bg-gradient-to-r from-[#113780] to-[#0C2A5C] hover:opacity-95 text-white px-4 py-2 rounded-lg text-sm font-medium transition"
          >
            📄 Generar PDF
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-4">
          <div className="bg-blue-50 border border-blue-100 rounded-lg p-3">
            <p className="text-xs text-blue-700 uppercase tracking-wide">
              Total pendientes
            </p>
            <p className="text-2xl font-bold text-[#113780]">
              {filteredTotalUsers}
            </p>
          </div>
          <div className="bg-indigo-50 border border-indigo-100 rounded-lg p-3">
            <p className="text-xs text-indigo-700 uppercase tracking-wide">
              Grupos mostrados
            </p>
            <p className="text-2xl font-bold text-[#113780]">
              {filteredGroups.length}
            </p>
          </div>
          <div className="bg-gray-50 border border-gray-100 rounded-lg p-3">
            <p className="text-xs text-gray-600 uppercase tracking-wide">
              Filtro por grupo
            </p>
            <select
              className="mt-2 w-full border border-gray-200 rounded-md px-2 py-1.5 text-sm"
              value={groupFilter}
              onChange={(e) => setGroupFilter(e.target.value)}
            >
              <option value="">Todos los grupos</option>
              {(report?.groups || []).map((group) => (
                <option
                  key={group.groupId || "NO_GROUP"}
                  value={group.groupId || "NO_GROUP"}
                >
                  {group.groupName}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {filteredGroups.length === 0 ? (
        <div className="bg-white border border-gray-100 rounded-xl p-6 text-center text-gray-600">
          No hay usuarios pendientes para el filtro seleccionado.
        </div>
      ) : (
        filteredGroups.map((group) => (
          <section
            key={group.groupId || "NO_GROUP"}
            className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden"
          >
            <header className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-blue-100 px-4 sm:px-5 py-3 flex items-center justify-between gap-3">
              <div>
                <h3 className="text-base sm:text-lg font-semibold text-[#113780]">
                  {group.groupName}
                </h3>
                <p className="text-xs sm:text-sm text-gray-600">
                  Turno: {formatShift(group.shift)}
                </p>
              </div>
              <span className="bg-[#113780] text-white text-xs font-semibold px-3 py-1 rounded-full whitespace-nowrap">
                {group.totalUsers} pendiente{group.totalUsers === 1 ? "" : "s"}
              </span>
            </header>

            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead className="bg-gray-50 text-gray-700">
                  <tr>
                    <th className="text-left font-semibold px-4 py-3 border-b border-gray-100">
                      Número de empleado
                    </th>
                    <th className="text-left font-semibold px-4 py-3 border-b border-gray-100">
                      Nombre
                    </th>
                    <th className="text-left font-semibold px-4 py-3 border-b border-gray-100">
                      Dirección
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {group.users.map((user, index) => (
                    <tr
                      key={user.id}
                      className={index % 2 === 0 ? "bg-white" : "bg-gray-50"}
                    >
                      <td className="px-4 py-3 border-b border-gray-100 font-medium text-[#113780]">
                        {user.employeeNumber}
                      </td>
                      <td className="px-4 py-3 border-b border-gray-100 text-gray-800">
                        {user.fullName}
                      </td>
                      <td className="px-4 py-3 border-b border-gray-100 text-gray-600">
                        {user.direction}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        ))
      )}
    </div>
  );
}
