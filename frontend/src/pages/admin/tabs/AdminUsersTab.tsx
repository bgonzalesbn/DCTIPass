import { useState, useEffect, useMemo } from "react";
import { adminAPI } from "../../../services/api";
import type { AdminUser } from "../../../types";

const getErrorMessage = (err: unknown): string => {
  const error = err as { response?: { data?: { message?: string } } };
  return error.response?.data?.message || "Error inesperado";
};

export default function AdminUsersTab() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [directionFilter, setDirectionFilter] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const USERS_PER_PAGE = 20;

  const loadData = async () => {
    setLoading(true);
    try {
      const res = await adminAPI.getUsers();
      setUsers(res.data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleDownloadPdf = () => {
    const grouped = users.reduce<Record<string, AdminUser[]>>((acc, u) => {
      const key = u.direction?.trim() || "Sin dirección";
      if (!acc[key]) acc[key] = [];
      acc[key].push(u);
      return acc;
    }, {});

    const sortedDirections = Object.keys(grouped).sort((a, b) =>
      a.localeCompare(b),
    );

    const normalizeNumber = (value: string) => {
      const num = Number.parseInt(value, 10);
      return Number.isNaN(num) ? value : num;
    };

    sortedDirections.forEach((dir) => {
      grouped[dir].sort((a, b) => {
        const aNum = normalizeNumber(a.employeeNumber);
        const bNum = normalizeNumber(b.employeeNumber);
        if (typeof aNum === "number" && typeof bNum === "number") {
          return aNum - bNum;
        }
        return String(a.employeeNumber).localeCompare(String(b.employeeNumber));
      });
    });

    const rows = sortedDirections
      .map((dir) => {
        const directionUsers = grouped[dir];
        const usersRows = directionUsers
          .map(
            (u, idx) => `
              <tr class="${idx % 2 === 0 ? "even" : "odd"}">
                <td>${u.employeeNumber}</td>
                <td>${u.firstName} ${u.lastName}</td>
                <td>${u.direction || "Sin dirección"}</td>
              </tr>`,
          )
          .join("");

        return `
          <div class="section">
            <div class="direction-header">
              <h2>${dir}</h2>
              <div class="direction-count">
                <span class="count-badge">${directionUsers.length} usuario${directionUsers.length !== 1 ? "s" : ""}</span>
              </div>
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
                ${usersRows}
              </tbody>
            </table>
          </div>
        `;
      })
      .join("");

    const html = `
      <html>
        <head>
          <meta charset="utf-8" />
          <title>Usuarios registrados por Dirección</title>
          <style>
            * { margin: 0; padding: 0; }
            html, body { 
              font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; 
              color: #222; 
              background-color: #f5f7fa;
            }
            body { 
              padding: 30px; 
              line-height: 1.6;
            }
            
            .header {
              background: linear-gradient(135deg, #2563eb 0%, #1e40af 100%);
              color: white;
              padding: 40px 30px;
              border-radius: 8px;
              margin-bottom: 30px;
              box-shadow: 0 4px 6px rgba(0,0,0,0.1);
            }
            
            .header h1 {
              font-size: 32px;
              margin-bottom: 8px;
              font-weight: 700;
              letter-spacing: -0.5px;
            }
            
            .header p {
              font-size: 13px;
              opacity: 0.95;
              margin-bottom: 15px;
            }
            
            .total-stats {
              background: rgba(255,255,255,0.2);
              padding: 12px 15px;
              border-radius: 6px;
              width: fit-content;
              font-weight: 600;
              font-size: 14px;
            }
            
            .section {
              margin-bottom: 28px;
              background: white;
              border-radius: 6px;
              overflow: hidden;
              box-shadow: 0 2px 4px rgba(0,0,0,0.08);
            }
            
            .direction-header {
              background: linear-gradient(135deg, #e0e7ff 0%, #f3e8ff 100%);
              padding: 20px 25px;
              display: flex;
              justify-content: space-between;
              align-items: center;
              border-bottom: 2px solid #c7d2fe;
            }
            
            .direction-header h2 {
              font-size: 16px;
              font-weight: 600;
              color: #1e3a8a;
              margin: 0;
              letter-spacing: -0.3px;
            }
            
            .count-badge {
              background: #2563eb;
              color: white;
              padding: 6px 14px;
              border-radius: 20px;
              font-size: 13px;
              font-weight: 600;
              white-space: nowrap;
            }
            
            table {
              width: 100%;
              border-collapse: collapse;
              font-size: 13px;
            }
            
            thead tr {
              background: #f8fafc;
              border-bottom: 2px solid #e2e8f0;
            }
            
            th {
              padding: 12px 15px;
              text-align: left;
              font-weight: 600;
              color: #1e293b;
              letter-spacing: 0.3px;
            }
            
            tbody tr.even {
              background: #ffffff;
            }
            
            tbody tr.odd {
              background: #f9fafb;
            }
            
            tbody tr:hover {
              background: #f0f4fa;
            }
            
            td {
              padding: 11px 15px;
              border-bottom: 1px solid #e2e8f0;
            }
            
            td:first-child {
              font-weight: 500;
              color: #2563eb;
            }
            
            .footer {
              text-align: center;
              margin-top: 40px;
              padding-top: 20px;
              border-top: 2px solid #e2e8f0;
              font-size: 12px;
              color: #666;
            }
            
            @media print {
              body { background: white; }
              .section { page-break-inside: avoid; }
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>Usuarios Registrados por Dirección</h1>
            <p>Reporte de empleados activos en el sistema</p>
            <div class="total-stats">
              👥 Total de usuarios: <strong>${users.length}</strong>
            </div>
          </div>
          
          ${rows}
          
          <div class="footer">
            <p>📅 Generado: ${new Date().toLocaleString("es-CR")}</p>
          </div>
        </body>
      </html>
    `;

    const win = window.open("", "_blank", "width=1000,height=800");
    if (!win) {
      alert("No se pudo abrir la ventana de impresión.");
      return;
    }
    win.document.open();
    win.document.write(html);
    win.document.close();
    win.focus();
    setTimeout(() => {
      win.print();
    }, 300);
  };

  const toggleAdmin = async (user: AdminUser) => {
    const action = user.isAdmin ? "quitar admin" : "hacer admin";
    if (!confirm(`¿${action} a ${user.firstName} ${user.lastName}?`)) return;
    try {
      await adminAPI.updateUser(user._id, { isAdmin: !user.isAdmin });
      loadData();
    } catch (err) {
      alert(getErrorMessage(err));
    }
  };

  const toggleActive = async (user: AdminUser) => {
    const action = user.active ? "desactivar" : "activar";
    if (!confirm(`¿${action} a ${user.firstName} ${user.lastName}?`)) return;
    try {
      await adminAPI.updateUser(user._id, { active: !user.active });
      loadData();
    } catch (err) {
      alert(getErrorMessage(err));
    }
  };

  const availableDirections = useMemo(() => {
    const values = new Set<string>();
    users.forEach((u) => {
      if (u.direction) {
        values.add(u.direction);
      }
    });
    return Array.from(values).sort();
  }, [users]);

  const filteredUsers = users.filter((u) => {
    const matchesSearch = (() => {
      if (!search) return true;
      const s = search.toLowerCase();
      return (
        u.firstName.toLowerCase().includes(s) ||
        u.lastName.toLowerCase().includes(s) ||
        u.employeeNumber.includes(s) ||
        u.email.toLowerCase().includes(s) ||
        (u.direction ? u.direction.toLowerCase().includes(s) : false)
      );
    })();

    const matchesDirection = directionFilter
      ? u.direction === directionFilter
      : true;

    return matchesSearch && matchesDirection;
  });

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [search, directionFilter]);

  const totalPages = Math.ceil(filteredUsers.length / USERS_PER_PAGE);
  const paginatedUsers = filteredUsers.slice(
    (currentPage - 1) * USERS_PER_PAGE,
    currentPage * USERS_PER_PAGE,
  );

  if (loading) return <div className="text-center py-8">Cargando...</div>;

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-bold text-gray-900">Gestión de Usuarios</h2>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={handleDownloadPdf}
            className="bg-[#113780] hover:bg-[#0C2A5C] text-white px-3 py-2 rounded-lg text-sm"
          >
            Descargar PDF
          </button>
          <input
            type="text"
            placeholder="Buscar usuario..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="border rounded-lg px-3 py-2 text-sm w-48"
          />
          <select
            value={directionFilter}
            onChange={(e) => setDirectionFilter(e.target.value)}
            className="border rounded-lg px-3 py-2 text-sm"
          >
            <option value="">Todas las direcciones</option>
            {availableDirections.map((direction) => (
              <option key={direction} value={direction}>
                {direction}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Empleado
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Nombre
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Email
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Dirección
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Puntos
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Admin
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Estado
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {paginatedUsers.map((u) => (
                <tr key={u._id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-sm font-mono">
                    {u.employeeNumber}
                  </td>
                  <td className="px-4 py-3 text-sm font-medium">
                    {u.firstName} {u.lastName}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-500">{u.email}</td>
                  <td className="px-4 py-3 text-sm">
                    {u.direction ? (
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-blue-50 text-blue-700">
                        {u.direction}
                      </span>
                    ) : (
                      <span className="text-xs text-gray-500">
                        Sin dirección
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-sm">{u.totalPoints}</td>
                  <td className="px-4 py-3 text-sm">
                    <span
                      className={`px-2 py-1 rounded-full text-xs ${u.isAdmin ? "bg-purple-100 text-purple-700" : "bg-gray-100 text-gray-600"}`}
                    >
                      {u.isAdmin ? "Admin" : "Usuario"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm">
                    <span
                      className={`px-2 py-1 rounded-full text-xs ${u.active ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}
                    >
                      {u.active ? "Activo" : "Inactivo"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm">
                    <button
                      onClick={() => toggleAdmin(u)}
                      className="text-purple-600 hover:text-purple-800 mr-3 text-xs"
                    >
                      {u.isAdmin ? "Quitar Admin" : "Hacer Admin"}
                    </button>
                    <button
                      onClick={() => toggleActive(u)}
                      className={`text-xs ${u.active ? "text-red-600 hover:text-red-800" : "text-green-600 hover:text-green-800"}`}
                    >
                      {u.active ? "Desactivar" : "Activar"}
                    </button>
                  </td>
                </tr>
              ))}
              {filteredUsers.length === 0 && (
                <tr>
                  <td
                    colSpan={8}
                    className="px-4 py-8 text-center text-gray-500"
                  >
                    No se encontraron usuarios
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <div className="px-4 py-3 bg-gray-50 border-t flex flex-col sm:flex-row items-center justify-between gap-2">
          <span className="text-xs text-gray-500">
            Mostrando{" "}
            {paginatedUsers.length > 0
              ? (currentPage - 1) * USERS_PER_PAGE + 1
              : 0}
            -{Math.min(currentPage * USERS_PER_PAGE, filteredUsers.length)} de{" "}
            {filteredUsers.length} usuarios
            {filteredUsers.length !== users.length &&
              ` (${users.length} total)`}
          </span>
          {totalPages > 1 && (
            <div className="flex items-center gap-1">
              <button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="px-2 py-1 text-xs rounded border bg-white hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                ← Anterior
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1)
                .filter(
                  (p) =>
                    p === 1 ||
                    p === totalPages ||
                    Math.abs(p - currentPage) <= 1,
                )
                .reduce<(number | string)[]>((acc, p, i, arr) => {
                  if (i > 0 && p - (arr[i - 1] as number) > 1) acc.push("...");
                  acc.push(p);
                  return acc;
                }, [])
                .map((p, i) =>
                  typeof p === "string" ? (
                    <span
                      key={`dots-${i}`}
                      className="px-1 text-xs text-gray-400"
                    >
                      ...
                    </span>
                  ) : (
                    <button
                      key={p}
                      onClick={() => setCurrentPage(p)}
                      className={`px-2 py-1 text-xs rounded border ${
                        currentPage === p
                          ? "bg-[#113780] text-white border-[#113780]"
                          : "bg-white hover:bg-gray-100"
                      }`}
                    >
                      {p}
                    </button>
                  ),
                )}
              <button
                onClick={() =>
                  setCurrentPage((p) => Math.min(totalPages, p + 1))
                }
                disabled={currentPage === totalPages}
                className="px-2 py-1 text-xs rounded border bg-white hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Siguiente →
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
