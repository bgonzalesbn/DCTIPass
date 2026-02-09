import { useState, useEffect, useRef } from "react";
import { adminAPI } from "../../../services/api";
import type {
  AdminGroup,
  AdminGroupMember,
  AdminSchedule,
} from "../../../types";

interface AvailableUser {
  _id: string;
  employeeNumber: string;
  firstName: string;
  lastName: string;
  email: string;
}

const getErrorMessage = (err: unknown): string => {
  const error = err as { response?: { data?: { message?: string } } };
  return error.response?.data?.message || "Error inesperado";
};

export default function AdminGroupsTab() {
  const [groups, setGroups] = useState<AdminGroup[]>([]);
  const [schedules, setSchedules] = useState<AdminSchedule[]>([]);
  const [availableUsers, setAvailableUsers] = useState<AvailableUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [expandedGroup, setExpandedGroup] = useState<string | null>(null);
  const [members, setMembers] = useState<AdminGroupMember[]>([]);
  const [loadingMembers, setLoadingMembers] = useState(false);

  // Dropdown de miembros
  const [memberDropdownOpen, setMemberDropdownOpen] = useState(false);
  const [memberSearch, setMemberSearch] = useState("");
  const memberDropdownRef = useRef<HTMLDivElement>(null);

  const [form, setForm] = useState({
    name: "",
    capacityMax: 25,
    scheduleId: "",
  });

  const loadData = async () => {
    setLoading(true);
    try {
      const [grpRes, schedRes, usersRes] = await Promise.all([
        adminAPI.getGroups(),
        adminAPI.getSchedules(),
        adminAPI.getAvailableUsers(),
      ]);
      setGroups(grpRes.data);
      setSchedules(schedRes.data);
      setAvailableUsers(usersRes.data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Cerrar dropdown al click fuera
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        memberDropdownRef.current &&
        !memberDropdownRef.current.contains(event.target as Node)
      ) {
        setMemberDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
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
    setForm({ name: "", capacityMax: 25, scheduleId: "" });
    setEditingId(null);
    setShowForm(false);
  };

  const handleEdit = (g: AdminGroup) => {
    setForm({
      name: g.name,
      capacityMax: g.capacityMax,
      scheduleId: g.scheduleId?._id || "",
    });
    setEditingId(g._id);
    setShowForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const data: Record<string, unknown> = {
        name: form.name,
        capacityMax: form.capacityMax,
      };
      if (form.scheduleId) data.scheduleId = form.scheduleId;

      if (editingId) {
        await adminAPI.updateGroup(editingId, data);
      } else {
        await adminAPI.createGroup(data);
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

  const handleAssignUser = async (groupId: string, user: AvailableUser) => {
    try {
      await adminAPI.assignUserToGroup(groupId, user.employeeNumber);
      setMemberSearch("");
      setMemberDropdownOpen(false);
      loadMembers(groupId);
      const [usersRes, grpRes] = await Promise.all([
        adminAPI.getAvailableUsers(),
        adminAPI.getGroups(),
      ]);
      setAvailableUsers(usersRes.data);
      setGroups(grpRes.data);
    } catch (err) {
      alert(getErrorMessage(err));
    }
  };

  const handleRemoveMember = async (groupId: string, userId: string) => {
    if (!confirm("¿Remover este usuario del grupo?")) return;
    try {
      await adminAPI.removeUserFromGroup(groupId, userId);
      loadMembers(groupId);
      const [usersRes, grpRes] = await Promise.all([
        adminAPI.getAvailableUsers(),
        adminAPI.getGroups(),
      ]);
      setAvailableUsers(usersRes.data);
      setGroups(grpRes.data);
    } catch (err) {
      alert(getErrorMessage(err));
    }
  };

  const filteredUsers = availableUsers.filter((u) => {
    const search = memberSearch.toLowerCase();
    return (
      u.firstName.toLowerCase().includes(search) ||
      u.lastName.toLowerCase().includes(search) ||
      u.employeeNumber.toLowerCase().includes(search) ||
      u.email.toLowerCase().includes(search)
    );
  });

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
                Horario
              </label>
              <select
                value={form.scheduleId}
                onChange={(e) =>
                  setForm({ ...form, scheduleId: e.target.value })
                }
                className="w-full border rounded-lg px-3 py-2 text-sm"
              >
                <option value="">Sin horario</option>
                {schedules.map((s) => (
                  <option key={s._id} value={s._id}>
                    {s.title} — {s.startTime} a {s.endTime}
                  </option>
                ))}
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
        {groups.map((g) => {
          const isFull = g.memberCount >= g.capacityMax;

          return (
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
                      {g.memberCount}/{g.capacityMax} miembros
                      {g.scheduleId && ` · 📅 ${g.scheduleId.title}`}
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
                  {/* Dropdown para agregar miembros */}
                  {!isFull && (
                    <div ref={memberDropdownRef} className="relative mb-3">
                      <button
                        type="button"
                        onClick={() =>
                          setMemberDropdownOpen(!memberDropdownOpen)
                        }
                        className="w-full border rounded-lg px-3 py-2 text-sm text-left flex justify-between items-center bg-white"
                      >
                        <span className="text-gray-400">
                          Agregar miembro...
                        </span>
                        <svg
                          className={`w-4 h-4 transition-transform ${memberDropdownOpen ? "rotate-180" : ""}`}
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M19 9l-7 7-7-7"
                          />
                        </svg>
                      </button>
                      {memberDropdownOpen && (
                        <div className="absolute z-10 mt-1 w-full bg-white border rounded-lg shadow-lg">
                          <div className="p-2 border-b">
                            <input
                              type="text"
                              placeholder="Buscar por nombre, número o email..."
                              value={memberSearch}
                              onChange={(e) => setMemberSearch(e.target.value)}
                              className="w-full border rounded px-2 py-1 text-sm"
                              autoFocus
                            />
                          </div>
                          <div className="max-h-48 overflow-y-auto">
                            {filteredUsers.length === 0 ? (
                              <p className="px-3 py-2 text-sm text-gray-400">
                                No hay usuarios disponibles
                              </p>
                            ) : (
                              filteredUsers.map((u) => (
                                <button
                                  key={u._id}
                                  type="button"
                                  onClick={() => handleAssignUser(g._id, u)}
                                  className="w-full text-left px-3 py-2 text-sm hover:bg-blue-50 flex justify-between items-center"
                                >
                                  <span>
                                    <span className="font-medium">
                                      {u.firstName} {u.lastName}
                                    </span>
                                    <span className="text-gray-500 ml-2">
                                      ({u.employeeNumber})
                                    </span>
                                  </span>
                                  <span className="text-green-600 text-xs">
                                    + Agregar
                                  </span>
                                </button>
                              ))
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                  {isFull && (
                    <p className="text-sm text-amber-600 mb-3">
                      ⚠️ El grupo está a capacidad máxima
                    </p>
                  )}

                  {/* Lista de miembros */}
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
          );
        })}
        {groups.length === 0 && (
          <div className="text-center py-8 text-gray-500">No hay grupos</div>
        )}
      </div>
    </div>
  );
}
