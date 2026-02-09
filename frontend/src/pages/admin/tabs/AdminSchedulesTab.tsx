import { useState, useEffect, useRef } from "react";
import { adminAPI } from "../../../services/api";
import type { AdminSchedule, AdminActivity, AdminGroup } from "../../../types";

const getErrorMessage = (err: unknown): string => {
  const error = err as { response?: { data?: { message?: string } } };
  return error.response?.data?.message || "Error inesperado";
};

/** Formato dd-MM-yyyy usando UTC para evitar desfase de timezone */
const formatDateDDMMYYYY = (dateStr: string): string => {
  if (!dateStr) return "-";
  const d = new Date(dateStr);
  const dd = String(d.getUTCDate()).padStart(2, "0");
  const mm = String(d.getUTCMonth() + 1).padStart(2, "0");
  const yyyy = d.getUTCFullYear();
  return `${dd}-${mm}-${yyyy}`;
};

export default function AdminSchedulesTab() {
  const [schedules, setSchedules] = useState<AdminSchedule[]>([]);
  const [activities, setActivities] = useState<AdminActivity[]>([]);
  const [groups, setGroups] = useState<AdminGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [groupDropdownOpen, setGroupDropdownOpen] = useState(false);
  const groupDropdownRef = useRef<HTMLDivElement>(null);
  const [form, setForm] = useState({
    title: "",
    activityId: "",
    groupIds: [] as string[],
    date: "",
    startTime: "",
    endTime: "",
    order: 1,
  });

  const loadData = async () => {
    setLoading(true);
    try {
      const [schedRes, actRes, grpRes] = await Promise.all([
        adminAPI.getSchedules(),
        adminAPI.getActivities(),
        adminAPI.getGroups(),
      ]);
      setSchedules(schedRes.data);
      setActivities(actRes.data);
      setGroups(grpRes.data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Cerrar dropdown de grupos al hacer click fuera
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        groupDropdownRef.current &&
        !groupDropdownRef.current.contains(event.target as Node)
      ) {
        setGroupDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const resetForm = () => {
    setForm({
      title: "",
      activityId: "",
      groupIds: [],
      date: "",
      startTime: "",
      endTime: "",
      order: 1,
    });
    setEditingId(null);
    setShowForm(false);
  };

  const handleEdit = (s: AdminSchedule) => {
    setForm({
      title: s.title,
      activityId: s.activityId?._id || "",
      groupIds: (s.groupIds || []).map((g) => g._id),
      date: s.date ? s.date.split("T")[0] : "",
      startTime: s.startTime,
      endTime: s.endTime,
      order: s.order || 1,
    });
    setEditingId(s._id);
    setShowForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const data: Record<string, unknown> = {
        title: form.title,
        activityId: form.activityId,
        date: form.date + "T12:00:00.000Z",
        startTime: form.startTime,
        endTime: form.endTime,
        order: form.order,
      };
      if (form.groupIds.length > 0) data.groupIds = form.groupIds;

      if (editingId) {
        await adminAPI.updateSchedule(editingId, data);
      } else {
        await adminAPI.createSchedule(data);
      }
      resetForm();
      loadData();
    } catch (err) {
      alert(getErrorMessage(err));
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("¿Eliminar este horario?")) return;
    try {
      await adminAPI.deleteSchedule(id);
      loadData();
    } catch (err) {
      alert(getErrorMessage(err));
    }
  };

  if (loading) return <div className="text-center py-8">Cargando...</div>;

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-bold text-gray-900">Gestión de Horarios</h2>
        <button
          onClick={() => {
            resetForm();
            setShowForm(true);
          }}
          className="bg-[#113780] hover:bg-[#0C2A5C] text-white px-4 py-2 rounded-lg text-sm"
        >
          + Nuevo Horario
        </button>
      </div>

      {showForm && (
        <div className="bg-white rounded-lg shadow p-4 mb-4">
          <h3 className="font-semibold mb-3">
            {editingId ? "Editar" : "Crear"} Horario
          </h3>
          <form
            onSubmit={handleSubmit}
            className="grid grid-cols-1 sm:grid-cols-2 gap-3"
          >
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Título
              </label>
              <input
                type="text"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                className="w-full border rounded-lg px-3 py-2 text-sm"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Actividad
              </label>
              <select
                value={form.activityId}
                onChange={(e) =>
                  setForm({ ...form, activityId: e.target.value })
                }
                className="w-full border rounded-lg px-3 py-2 text-sm"
                required
              >
                <option value="">Seleccionar...</option>
                {activities.map((a) => (
                  <option key={a._id} value={a._id}>
                    {a.name}
                  </option>
                ))}
              </select>
            </div>
            <div ref={groupDropdownRef} className="relative">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Grupos
              </label>
              <button
                type="button"
                onClick={() => setGroupDropdownOpen(!groupDropdownOpen)}
                className="w-full border rounded-lg px-3 py-2 text-sm text-left flex justify-between items-center bg-white"
              >
                <span
                  className={
                    form.groupIds.length === 0
                      ? "text-gray-400"
                      : "text-gray-900"
                  }
                >
                  {form.groupIds.length === 0
                    ? "Seleccionar grupos..."
                    : `${form.groupIds.length} grupo${form.groupIds.length > 1 ? "s" : ""} seleccionado${form.groupIds.length > 1 ? "s" : ""}`}
                </span>
                <svg
                  className={`w-4 h-4 transition-transform ${groupDropdownOpen ? "rotate-180" : ""}`}
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
              {groupDropdownOpen && (
                <div className="absolute z-10 mt-1 w-full bg-white border rounded-lg shadow-lg max-h-48 overflow-y-auto">
                  {groups.length === 0 && (
                    <p className="px-3 py-2 text-sm text-gray-400">
                      No hay grupos
                    </p>
                  )}
                  {groups.map((g) => (
                    <label
                      key={g._id}
                      className="flex items-center gap-2 px-3 py-2 text-sm cursor-pointer hover:bg-gray-50"
                    >
                      <input
                        type="checkbox"
                        checked={form.groupIds.includes(g._id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setForm({
                              ...form,
                              groupIds: [...form.groupIds, g._id],
                            });
                          } else {
                            setForm({
                              ...form,
                              groupIds: form.groupIds.filter(
                                (id) => id !== g._id,
                              ),
                            });
                          }
                        }}
                        className="rounded border-gray-300"
                      />
                      {g.name}
                    </label>
                  ))}
                </div>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Fecha
              </label>
              <input
                type="date"
                value={form.date}
                onChange={(e) => setForm({ ...form, date: e.target.value })}
                className="w-full border rounded-lg px-3 py-2 text-sm"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Hora inicio
              </label>
              <input
                type="time"
                value={form.startTime}
                onChange={(e) =>
                  setForm({ ...form, startTime: e.target.value })
                }
                className="w-full border rounded-lg px-3 py-2 text-sm"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Hora fin
              </label>
              <input
                type="time"
                value={form.endTime}
                onChange={(e) => setForm({ ...form, endTime: e.target.value })}
                className="w-full border rounded-lg px-3 py-2 text-sm"
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

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Título
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Actividad
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Grupos
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Fecha
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Horario
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {schedules.map((s) => (
                <tr key={s._id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-sm">{s.title}</td>
                  <td className="px-4 py-3 text-sm">
                    {s.activityId?.name || "-"}
                  </td>
                  <td className="px-4 py-3 text-sm">
                    {s.groupIds && s.groupIds.length > 0
                      ? s.groupIds.map((g) => g.name).join(", ")
                      : "General"}
                  </td>
                  <td className="px-4 py-3 text-sm">
                    {formatDateDDMMYYYY(s.date)}
                  </td>
                  <td className="px-4 py-3 text-sm">
                    {s.startTime} - {s.endTime}
                  </td>
                  <td className="px-4 py-3 text-sm">
                    <button
                      onClick={() => handleEdit(s)}
                      className="text-blue-600 hover:text-blue-800 mr-3"
                    >
                      Editar
                    </button>
                    <button
                      onClick={() => handleDelete(s._id)}
                      className="text-red-600 hover:text-red-800"
                    >
                      Eliminar
                    </button>
                  </td>
                </tr>
              ))}
              {schedules.length === 0 && (
                <tr>
                  <td
                    colSpan={6}
                    className="px-4 py-8 text-center text-gray-500"
                  >
                    No hay horarios
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
