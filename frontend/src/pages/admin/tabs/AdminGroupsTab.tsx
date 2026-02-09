import { useState, useEffect } from "react";
import { adminAPI } from "../../../services/api";
import type { AdminGroup, AdminGroupMember } from "../../../types";

const getErrorMessage = (err: unknown): string => {
  const error = err as { response?: { data?: { message?: string } } };
  return error.response?.data?.message || "Error inesperado";
};

export default function AdminGroupsTab() {
  const [groups, setGroups] = useState<AdminGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [expandedGroup, setExpandedGroup] = useState<string | null>(null);
  const [members, setMembers] = useState<AdminGroupMember[]>([]);
  const [loadingMembers, setLoadingMembers] = useState(false);
  const [assignEmployee, setAssignEmployee] = useState("");

  const [form, setForm] = useState({
    name: "",
    description: "",
    capacityMax: 25,
    shift: "Morning",
  });

  const loadData = async () => {
    setLoading(true);
    try {
      const res = await adminAPI.getGroups();
      setGroups(res.data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const loadMembers = async (groupId: string) => {
    setLoadingMembers(true);
    try {
      const res = await adminAPI.getGroupMembers(groupId);
      setMembers(res.data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingMembers(false);
    }
  };

  const toggleExpand = (groupId: string) => {
    if (expandedGroup === groupId) {
      setExpandedGroup(null);
      setMembers([]);
    } else {
      setExpandedGroup(groupId);
      loadMembers(groupId);
    }
  };

  const resetForm = () => {
    setForm({ name: "", description: "", capacityMax: 25, shift: "Morning" });
    setEditingId(null);
    setShowForm(false);
  };

  const handleEdit = (g: AdminGroup) => {
    setForm({
      name: g.name,
      description: g.description || "",
      capacityMax: g.capacityMax,
      shift: g.shift,
    });
    setEditingId(g._id);
    setShowForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingId) {
        await adminAPI.updateGroup(editingId, form);
      } else {
        await adminAPI.createGroup(form);
      }
      resetForm();
      loadData();
    } catch (err) {
      alert(getErrorMessage(err));
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("¿Eliminar este grupo? Los miembros serán desasignados."))
      return;
    try {
      await adminAPI.deleteGroup(id);
      loadData();
    } catch (err) {
      alert(getErrorMessage(err));
    }
  };

  const handleAssign = async (groupId: string) => {
    if (!assignEmployee.trim()) return;
    try {
      await adminAPI.assignUserToGroup(groupId, assignEmployee.trim());
      setAssignEmployee("");
      loadMembers(groupId);
      loadData(); // refresh member counts
    } catch (err) {
      alert(getErrorMessage(err));
    }
  };

  const handleRemoveMember = async (groupId: string, userId: string) => {
    if (!confirm("¿Remover este usuario del grupo?")) return;
    try {
      await adminAPI.removeUserFromGroup(groupId, userId);
      loadMembers(groupId);
      loadData();
    } catch (err) {
      alert(getErrorMessage(err));
    }
  };

  if (loading) return <div className="text-center py-8">Cargando...</div>;

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-bold text-gray-900">Gestión de Grupos</h2>
        <button
          onClick={() => {
            resetForm();
            setShowForm(true);
          }}
          className="bg-[#113780] hover:bg-[#0C2A5C] text-white px-4 py-2 rounded-lg text-sm"
        >
          + Nuevo Grupo
        </button>
      </div>

      {showForm && (
        <div className="bg-white rounded-lg shadow p-4 mb-4">
          <h3 className="font-semibold mb-3">
            {editingId ? "Editar" : "Crear"} Grupo
          </h3>
          <form
            onSubmit={handleSubmit}
            className="grid grid-cols-1 sm:grid-cols-2 gap-3"
          >
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Nombre
              </label>
              <input
                type="text"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="w-full border rounded-lg px-3 py-2 text-sm"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Turno
              </label>
              <select
                value={form.shift}
                onChange={(e) => setForm({ ...form, shift: e.target.value })}
                className="w-full border rounded-lg px-3 py-2 text-sm"
              >
                <option value="Morning">Mañana</option>
                <option value="Afternoon">Tarde</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Capacidad máxima
              </label>
              <input
                type="number"
                value={form.capacityMax}
                onChange={(e) =>
                  setForm({ ...form, capacityMax: +e.target.value })
                }
                className="w-full border rounded-lg px-3 py-2 text-sm"
                min={1}
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Descripción
              </label>
              <input
                type="text"
                value={form.description}
                onChange={(e) =>
                  setForm({ ...form, description: e.target.value })
                }
                className="w-full border rounded-lg px-3 py-2 text-sm"
              />
            </div>
            <div className="sm:col-span-2 flex gap-2 justify-end">
              <button
                type="button"
                onClick={resetForm}
                className="px-4 py-2 bg-gray-200 rounded-lg text-sm"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-[#113780] text-white rounded-lg text-sm"
              >
                {editingId ? "Actualizar" : "Crear"}
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="space-y-3">
        {groups.map((g) => (
          <div key={g._id} className="bg-white rounded-lg shadow">
            <div className="p-4 flex items-center justify-between">
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <button
                  onClick={() => toggleExpand(g._id)}
                  className="text-gray-500 hover:text-gray-700 font-mono"
                >
                  {expandedGroup === g._id ? "▼" : "▶"}
                </button>
                <div className="min-w-0">
                  <h3 className="font-semibold text-gray-900">{g.name}</h3>
                  <p className="text-xs text-gray-500">
                    {g.shift === "Morning" ? "🌅 Mañana" : "🌆 Tarde"} ·{" "}
                    {g.memberCount}/{g.capacityMax} miembros
                    {g.description && ` · ${g.description}`}
                  </p>
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => handleEdit(g)}
                  className="text-blue-600 hover:text-blue-800 text-sm"
                >
                  Editar
                </button>
                <button
                  onClick={() => handleDelete(g._id)}
                  className="text-red-600 hover:text-red-800 text-sm"
                >
                  Eliminar
                </button>
              </div>
            </div>

            {expandedGroup === g._id && (
              <div className="border-t px-4 py-3 bg-gray-50">
                {/* Assign user form */}
                <div className="flex gap-2 mb-3">
                  <input
                    type="text"
                    placeholder="Número de empleado..."
                    value={assignEmployee}
                    onChange={(e) => setAssignEmployee(e.target.value)}
                    className="flex-1 border rounded px-3 py-1 text-sm"
                    onKeyDown={(e) => e.key === "Enter" && handleAssign(g._id)}
                  />
                  <button
                    onClick={() => handleAssign(g._id)}
                    className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded text-sm"
                  >
                    Asignar
                  </button>
                </div>

                {loadingMembers ? (
                  <p className="text-sm text-gray-500 text-center py-2">
                    Cargando miembros...
                  </p>
                ) : members.length > 0 ? (
                  <div className="space-y-1">
                    {members.map((m) => (
                      <div
                        key={m._id}
                        className="flex items-center justify-between bg-white rounded border p-2"
                      >
                        <div className="text-sm">
                          <span className="font-medium">
                            {m.userId.firstName} {m.userId.lastName}
                          </span>
                          <span className="text-gray-500 ml-2">
                            ({m.userId.employeeNumber})
                          </span>
                          <span className="text-gray-400 ml-2 text-xs">
                            {m.userId.email}
                          </span>
                        </div>
                        <button
                          onClick={() =>
                            handleRemoveMember(g._id, m.userId._id)
                          }
                          className="text-xs text-red-600 hover:text-red-800"
                        >
                          Remover
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-gray-400 text-center py-2">
                    Sin miembros asignados
                  </p>
                )}
              </div>
            )}
          </div>
        ))}
        {groups.length === 0 && (
          <div className="text-center py-8 text-gray-500">No hay grupos</div>
        )}
      </div>
    </div>
  );
}
