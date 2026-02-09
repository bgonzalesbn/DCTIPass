import { useState, useEffect } from "react";
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

  const filteredUsers = users.filter((u) => {
    if (!search) return true;
    const s = search.toLowerCase();
    return (
      u.firstName.toLowerCase().includes(s) ||
      u.lastName.toLowerCase().includes(s) ||
      u.employeeNumber.includes(s) ||
      u.email.toLowerCase().includes(s)
    );
  });

  if (loading) return <div className="text-center py-8">Cargando...</div>;

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-bold text-gray-900">Gestión de Usuarios</h2>
        <div className="flex gap-2">
          <input
            type="text"
            placeholder="Buscar usuario..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="border rounded-lg px-3 py-2 text-sm w-48"
          />
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
              {filteredUsers.map((u) => (
                <tr key={u._id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-sm font-mono">
                    {u.employeeNumber}
                  </td>
                  <td className="px-4 py-3 text-sm font-medium">
                    {u.firstName} {u.lastName}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-500">{u.email}</td>
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
                    colSpan={7}
                    className="px-4 py-8 text-center text-gray-500"
                  >
                    No se encontraron usuarios
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        <div className="px-4 py-2 bg-gray-50 text-xs text-gray-500 border-t">
          {filteredUsers.length} de {users.length} usuarios
        </div>
      </div>
    </div>
  );
}
