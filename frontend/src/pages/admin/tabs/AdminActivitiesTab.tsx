import { useState, useEffect, useRef } from "react";
import { adminAPI } from "../../../services/api";
import type {
  AdminActivity,
  AdminSticker,
  AdminSubActivity,
  AdminGroup,
  AdminSchedule,
} from "../../../types";

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

interface TimeSlot {
  startTime: string;
  endTime: string;
}

export default function AdminActivitiesTab() {
  const [activities, setActivities] = useState<AdminActivity[]>([]);
  const [stickers, setStickers] = useState<AdminSticker[]>([]);
  const [groups, setGroups] = useState<AdminGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [expandedActivity, setExpandedActivity] = useState<string | null>(null);
  const [expandedSection, setExpandedSection] = useState<
    "sub" | "schedules" | null
  >("sub");
  const [showSubForm, setShowSubForm] = useState<string | null>(null);
  const [editingSubId, setEditingSubId] = useState<string | null>(null);

  // Horarios state
  const [activitySchedules, setActivitySchedules] = useState<AdminSchedule[]>(
    [],
  );
  const [loadingSchedules, setLoadingSchedules] = useState(false);
  const [showBulkForm, setShowBulkForm] = useState(false);
  const [bulkForm, setBulkForm] = useState({
    title: "",
    dates: [""] as string[],
    timeSlots: [{ startTime: "", endTime: "" }] as TimeSlot[],
    groupIds: [] as string[],
  });
  const [groupDropdownOpen, setGroupDropdownOpen] = useState(false);
  const groupDropdownRef = useRef<HTMLDivElement>(null);

  const [form, setForm] = useState({
    name: "",
    description: "",
    stickerId: "",
  });
  const [subForm, setSubForm] = useState({
    name: "",
    description: "",
    stickerId: "",
    order: 0,
  });

  const loadData = async () => {
    setLoading(true);
    try {
      const [actRes, stkRes, grpRes] = await Promise.all([
        adminAPI.getActivities(),
        adminAPI.getStickers(),
        adminAPI.getGroups(),
      ]);
      setActivities(actRes.data);
      setStickers(stkRes.data);
      setGroups(grpRes.data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const loadActivitySchedules = async (activityId: string) => {
    setLoadingSchedules(true);
    try {
      const res = await adminAPI.getActivitySchedules(activityId);
      setActivitySchedules(res.data);
    } catch (e) {
      console.error(e);
      setActivitySchedules([]);
    } finally {
      setLoadingSchedules(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (expandedActivity && expandedSection === "schedules") {
      loadActivitySchedules(expandedActivity);
    }
  }, [expandedActivity, expandedSection]);

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
    setForm({ name: "", description: "", stickerId: "" });
    setEditingId(null);
    setShowForm(false);
  };

  const resetSubForm = () => {
    setSubForm({ name: "", description: "", stickerId: "", order: 0 });
    setEditingSubId(null);
    setShowSubForm(null);
  };

  const resetBulkForm = () => {
    setBulkForm({
      title: "",
      dates: [""],
      timeSlots: [{ startTime: "", endTime: "" }],
      groupIds: [],
    });
    setShowBulkForm(false);
    setGroupDropdownOpen(false);
  };

  const handleEdit = (a: AdminActivity) => {
    setForm({
      name: a.name,
      description: a.description || "",
      stickerId: a.stickerId?._id || "",
    });
    setEditingId(a._id);
    setShowForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const data: Record<string, unknown> = {
        name: form.name,
        description: form.description,
      };
      if (form.stickerId) data.stickerId = form.stickerId;

      if (editingId) {
        await adminAPI.updateActivity(editingId, data);
      } else {
        await adminAPI.createActivity(data);
      }
      resetForm();
      loadData();
    } catch (err) {
      alert(getErrorMessage(err));
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("¿Eliminar esta actividad?")) return;
    try {
      await adminAPI.deleteActivity(id);
      loadData();
    } catch (err) {
      alert(getErrorMessage(err));
    }
  };

  // Sub-activity handlers
  const handleEditSub = (activityId: string, sub: AdminSubActivity) => {
    setSubForm({
      name: sub.name,
      description: sub.description || "",
      stickerId: sub.stickerId?._id || "",
      order: sub.order || 0,
    });
    setEditingSubId(sub._id);
    setShowSubForm(activityId);
  };

  const handleSubSubmit = async (e: React.FormEvent, activityId: string) => {
    e.preventDefault();
    try {
      const data: Record<string, unknown> = {
        name: subForm.name,
        description: subForm.description,
        order: subForm.order,
      };
      if (subForm.stickerId) data.stickerId = subForm.stickerId;

      if (editingSubId) {
        await adminAPI.updateSubActivity(activityId, editingSubId, data);
      } else {
        await adminAPI.addSubActivity(activityId, data);
      }
      resetSubForm();
      loadData();
    } catch (err) {
      alert(getErrorMessage(err));
    }
  };

  const handleDeleteSub = async (activityId: string, subId: string) => {
    if (!confirm("¿Eliminar esta subactividad?")) return;
    try {
      await adminAPI.deleteSubActivity(activityId, subId);
      loadData();
    } catch (err) {
      alert(getErrorMessage(err));
    }
  };

  // Bulk schedule handlers
  const addDate = () =>
    setBulkForm({ ...bulkForm, dates: [...bulkForm.dates, ""] });
  const removeDate = (idx: number) =>
    setBulkForm({
      ...bulkForm,
      dates: bulkForm.dates.filter((_, i) => i !== idx),
    });
  const updateDate = (idx: number, value: string) => {
    const newDates = [...bulkForm.dates];
    newDates[idx] = value;
    setBulkForm({ ...bulkForm, dates: newDates });
  };

  const addTimeSlot = () =>
    setBulkForm({
      ...bulkForm,
      timeSlots: [...bulkForm.timeSlots, { startTime: "", endTime: "" }],
    });
  const removeTimeSlot = (idx: number) =>
    setBulkForm({
      ...bulkForm,
      timeSlots: bulkForm.timeSlots.filter((_, i) => i !== idx),
    });
  const updateTimeSlot = (
    idx: number,
    field: "startTime" | "endTime",
    value: string,
  ) => {
    const newSlots = [...bulkForm.timeSlots];
    newSlots[idx] = { ...newSlots[idx], [field]: value };
    setBulkForm({ ...bulkForm, timeSlots: newSlots });
  };

  const toggleGroupId = (groupId: string) => {
    setBulkForm((prev) => ({
      ...prev,
      groupIds: prev.groupIds.includes(groupId)
        ? prev.groupIds.filter((id) => id !== groupId)
        : [...prev.groupIds, groupId],
    }));
  };

  const handleBulkSubmit = async (e: React.FormEvent, activityId: string) => {
    e.preventDefault();
    const validDates = bulkForm.dates.filter((d) => d.trim() !== "");
    const validSlots = bulkForm.timeSlots.filter(
      (s) => s.startTime && s.endTime,
    );
    if (validDates.length === 0 || validSlots.length === 0) {
      alert("Agrega al menos una fecha y un rango horario");
      return;
    }
    try {
      await adminAPI.bulkCreateSchedules(activityId, {
        title: bulkForm.title,
        dates: validDates.map((d) => d + "T12:00:00.000Z"),
        timeSlots: validSlots,
        groupIds: bulkForm.groupIds,
      });
      resetBulkForm();
      loadActivitySchedules(activityId);
      alert(
        `Se crearon ${validDates.length * validSlots.length} horarios exitosamente`,
      );
    } catch (err) {
      alert(getErrorMessage(err));
    }
  };

  const handleDeleteSchedule = async (
    scheduleId: string,
    activityId: string,
  ) => {
    if (!confirm("¿Eliminar este horario?")) return;
    try {
      await adminAPI.deleteSchedule(scheduleId);
      loadActivitySchedules(activityId);
    } catch (err) {
      alert(getErrorMessage(err));
    }
  };

  if (loading) return <div className="text-center py-8">Cargando...</div>;

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-bold text-gray-900">
          Gestión de Actividades
        </h2>
        <button
          onClick={() => {
            resetForm();
            setShowForm(true);
          }}
          className="bg-[#113780] hover:bg-[#0C2A5C] text-white px-4 py-2 rounded-lg text-sm"
        >
          + Nueva Actividad
        </button>
      </div>

      {showForm && (
        <div className="bg-white rounded-lg shadow p-4 mb-4">
          <h3 className="font-semibold mb-3">
            {editingId ? "Editar" : "Crear"} Actividad
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
                Sticker (opcional)
              </label>
              <select
                value={form.stickerId}
                onChange={(e) =>
                  setForm({ ...form, stickerId: e.target.value })
                }
                className="w-full border rounded-lg px-3 py-2 text-sm"
              >
                <option value="">Sin sticker</option>
                {stickers.map((s) => (
                  <option key={s._id} value={s._id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Descripción
              </label>
              <textarea
                value={form.description}
                onChange={(e) =>
                  setForm({ ...form, description: e.target.value })
                }
                className="w-full border rounded-lg px-3 py-2 text-sm"
                rows={2}
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
        {activities.map((a) => (
          <div key={a._id} className="bg-white rounded-lg shadow">
            <div className="p-4 flex items-center justify-between">
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <button
                  onClick={() => {
                    if (expandedActivity === a._id) {
                      setExpandedActivity(null);
                    } else {
                      setExpandedActivity(a._id);
                      setExpandedSection("sub");
                    }
                  }}
                  className="text-gray-500 hover:text-gray-700 font-mono"
                >
                  {expandedActivity === a._id ? "▼" : "▶"}
                </button>
                <div className="min-w-0">
                  <h3 className="font-semibold text-gray-900 truncate">
                    {a.name}
                  </h3>
                  <p className="text-xs text-gray-500">
                    {a.subActivities?.length || 0} subactividades ·{" "}
                    {a.active ? "Activa" : "Inactiva"}
                  </p>
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => handleEdit(a)}
                  className="text-blue-600 hover:text-blue-800 text-sm"
                >
                  Editar
                </button>
                <button
                  onClick={() => handleDelete(a._id)}
                  className="text-red-600 hover:text-red-800 text-sm"
                >
                  Eliminar
                </button>
              </div>
            </div>

            {expandedActivity === a._id && (
              <div className="border-t">
                {/* Pestañas Sub / Horarios */}
                <div className="flex border-b bg-gray-50">
                  <button
                    onClick={() => setExpandedSection("sub")}
                    className={`px-4 py-2 text-sm font-medium ${
                      expandedSection === "sub"
                        ? "text-[#113780] border-b-2 border-[#113780] bg-white"
                        : "text-gray-500 hover:text-gray-700"
                    }`}
                  >
                    Subactividades ({a.subActivities?.length || 0})
                  </button>
                  <button
                    onClick={() => setExpandedSection("schedules")}
                    className={`px-4 py-2 text-sm font-medium ${
                      expandedSection === "schedules"
                        ? "text-[#113780] border-b-2 border-[#113780] bg-white"
                        : "text-gray-500 hover:text-gray-700"
                    }`}
                  >
                    Horarios
                  </button>
                </div>

                {/* ===== SECCIÓN SUBACTIVIDADES ===== */}
                {expandedSection === "sub" && (
                  <div className="px-4 py-3 bg-gray-50">
                    <div className="flex justify-between items-center mb-3">
                      <h4 className="text-sm font-semibold text-gray-700">
                        Subactividades
                      </h4>
                      <button
                        onClick={() => {
                          resetSubForm();
                          setShowSubForm(a._id);
                        }}
                        className="text-sm bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded"
                      >
                        + Subactividad
                      </button>
                    </div>

                    {showSubForm === a._id && (
                      <div className="bg-white rounded border p-3 mb-3">
                        <form
                          onSubmit={(e) => handleSubSubmit(e, a._id)}
                          className="grid grid-cols-1 sm:grid-cols-2 gap-2"
                        >
                          <div>
                            <label className="block text-xs font-medium text-gray-700 mb-1">
                              Nombre
                            </label>
                            <input
                              type="text"
                              value={subForm.name}
                              onChange={(e) =>
                                setSubForm({ ...subForm, name: e.target.value })
                              }
                              className="w-full border rounded px-2 py-1 text-sm"
                              required
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-gray-700 mb-1">
                              Orden
                            </label>
                            <input
                              type="number"
                              value={subForm.order}
                              onChange={(e) =>
                                setSubForm({
                                  ...subForm,
                                  order: +e.target.value,
                                })
                              }
                              className="w-full border rounded px-2 py-1 text-sm"
                            />
                          </div>
                          <div className="sm:col-span-2">
                            <label className="block text-xs font-medium text-gray-700 mb-1">
                              Descripción
                            </label>
                            <input
                              type="text"
                              value={subForm.description}
                              onChange={(e) =>
                                setSubForm({
                                  ...subForm,
                                  description: e.target.value,
                                })
                              }
                              className="w-full border rounded px-2 py-1 text-sm"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-gray-700 mb-1">
                              Sticker
                            </label>
                            <select
                              value={subForm.stickerId}
                              onChange={(e) =>
                                setSubForm({
                                  ...subForm,
                                  stickerId: e.target.value,
                                })
                              }
                              className="w-full border rounded px-2 py-1 text-sm"
                            >
                              <option value="">Sin sticker</option>
                              {stickers.map((s) => (
                                <option key={s._id} value={s._id}>
                                  {s.name}
                                </option>
                              ))}
                            </select>
                          </div>
                          <div className="sm:col-span-2 flex gap-2 justify-end">
                            <button
                              type="button"
                              onClick={resetSubForm}
                              className="px-3 py-1 bg-gray-200 rounded text-sm"
                            >
                              Cancelar
                            </button>
                            <button
                              type="submit"
                              className="px-3 py-1 bg-green-600 text-white rounded text-sm"
                            >
                              {editingSubId ? "Actualizar" : "Agregar"}
                            </button>
                          </div>
                        </form>
                      </div>
                    )}

                    {a.subActivities?.length > 0 ? (
                      <div className="space-y-2">
                        {a.subActivities
                          .sort((x, y) => x.order - y.order)
                          .map((sub) => (
                            <div
                              key={sub._id}
                              className="flex items-center justify-between bg-white rounded border p-2"
                            >
                              <div>
                                <span className="text-xs text-gray-400 mr-2">
                                  #{sub.order}
                                </span>
                                <span className="text-sm font-medium">
                                  {sub.name}
                                </span>
                                {sub.description && (
                                  <span className="text-xs text-gray-500 ml-2">
                                    - {sub.description}
                                  </span>
                                )}
                              </div>
                              <div className="flex gap-2">
                                <button
                                  onClick={() => handleEditSub(a._id, sub)}
                                  className="text-xs text-blue-600 hover:text-blue-800"
                                >
                                  Editar
                                </button>
                                <button
                                  onClick={() =>
                                    handleDeleteSub(a._id, sub._id)
                                  }
                                  className="text-xs text-red-600 hover:text-red-800"
                                >
                                  Eliminar
                                </button>
                              </div>
                            </div>
                          ))}
                      </div>
                    ) : (
                      <p className="text-sm text-gray-400 text-center py-2">
                        Sin subactividades
                      </p>
                    )}
                  </div>
                )}

                {/* ===== SECCIÓN HORARIOS ===== */}
                {expandedSection === "schedules" && (
                  <div className="px-4 py-3 bg-gray-50">
                    <div className="flex justify-between items-center mb-3">
                      <h4 className="text-sm font-semibold text-gray-700">
                        Horarios asociados
                      </h4>
                      <button
                        onClick={() => {
                          resetBulkForm();
                          setBulkForm((prev) => ({ ...prev, title: a.name }));
                          setShowBulkForm(true);
                        }}
                        className="text-sm bg-[#113780] hover:bg-[#0C2A5C] text-white px-3 py-1 rounded"
                      >
                        + Generar Horarios
                      </button>
                    </div>

                    {/* Formulario bulk */}
                    {showBulkForm && (
                      <div className="bg-white rounded border p-4 mb-3">
                        <h5 className="text-sm font-semibold mb-3 text-gray-800">
                          Generar horarios múltiples
                        </h5>
                        <form
                          onSubmit={(e) => handleBulkSubmit(e, a._id)}
                          className="space-y-4"
                        >
                          <div>
                            <label className="block text-xs font-medium text-gray-700 mb-1">
                              Título del horario
                            </label>
                            <input
                              type="text"
                              value={bulkForm.title}
                              onChange={(e) =>
                                setBulkForm({
                                  ...bulkForm,
                                  title: e.target.value,
                                })
                              }
                              className="w-full border rounded px-2 py-1 text-sm"
                              required
                            />
                          </div>

                          {/* Fechas */}
                          <div>
                            <label className="block text-xs font-medium text-gray-700 mb-1">
                              Fechas
                            </label>
                            {bulkForm.dates.map((date, idx) => (
                              <div
                                key={idx}
                                className="flex items-center gap-2 mb-1"
                              >
                                <input
                                  type="date"
                                  value={date}
                                  onChange={(e) =>
                                    updateDate(idx, e.target.value)
                                  }
                                  className="flex-1 border rounded px-2 py-1 text-sm"
                                  required
                                />
                                {bulkForm.dates.length > 1 && (
                                  <button
                                    type="button"
                                    onClick={() => removeDate(idx)}
                                    className="text-red-500 hover:text-red-700 text-sm px-1"
                                  >
                                    ✕
                                  </button>
                                )}
                              </div>
                            ))}
                            <button
                              type="button"
                              onClick={addDate}
                              className="text-xs text-blue-600 hover:text-blue-800 mt-1"
                            >
                              + Agregar fecha
                            </button>
                          </div>

                          {/* Rangos horarios */}
                          <div>
                            <label className="block text-xs font-medium text-gray-700 mb-1">
                              Rangos horarios
                            </label>
                            {bulkForm.timeSlots.map((slot, idx) => (
                              <div
                                key={idx}
                                className="flex items-center gap-2 mb-1"
                              >
                                <input
                                  type="time"
                                  value={slot.startTime}
                                  onChange={(e) =>
                                    updateTimeSlot(
                                      idx,
                                      "startTime",
                                      e.target.value,
                                    )
                                  }
                                  className="border rounded px-2 py-1 text-sm"
                                  required
                                />
                                <span className="text-xs text-gray-500">a</span>
                                <input
                                  type="time"
                                  value={slot.endTime}
                                  onChange={(e) =>
                                    updateTimeSlot(
                                      idx,
                                      "endTime",
                                      e.target.value,
                                    )
                                  }
                                  className="border rounded px-2 py-1 text-sm"
                                  required
                                />
                                {bulkForm.timeSlots.length > 1 && (
                                  <button
                                    type="button"
                                    onClick={() => removeTimeSlot(idx)}
                                    className="text-red-500 hover:text-red-700 text-sm px-1"
                                  >
                                    ✕
                                  </button>
                                )}
                              </div>
                            ))}
                            <button
                              type="button"
                              onClick={addTimeSlot}
                              className="text-xs text-blue-600 hover:text-blue-800 mt-1"
                            >
                              + Agregar rango horario
                            </button>
                          </div>

                          {/* Grupos dropdown */}
                          <div ref={groupDropdownRef}>
                            <label className="block text-xs font-medium text-gray-700 mb-1">
                              Grupos (opcional)
                            </label>
                            <div className="relative">
                              <button
                                type="button"
                                onClick={() =>
                                  setGroupDropdownOpen(!groupDropdownOpen)
                                }
                                className="w-full border rounded px-2 py-1 text-sm text-left bg-white flex items-center justify-between"
                              >
                                <span className="truncate">
                                  {bulkForm.groupIds.length === 0
                                    ? "Seleccionar grupos..."
                                    : `${bulkForm.groupIds.length} grupo(s) seleccionado(s)`}
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
                                <div className="absolute z-10 mt-1 w-full bg-white border rounded shadow-lg max-h-40 overflow-y-auto">
                                  {groups.map((g) => (
                                    <label
                                      key={g._id}
                                      className="flex items-center px-3 py-1.5 hover:bg-gray-50 cursor-pointer text-sm"
                                    >
                                      <input
                                        type="checkbox"
                                        checked={bulkForm.groupIds.includes(
                                          g._id,
                                        )}
                                        onChange={() => toggleGroupId(g._id)}
                                        className="mr-2"
                                      />
                                      {g.name}
                                    </label>
                                  ))}
                                  {groups.length === 0 && (
                                    <p className="px-3 py-2 text-xs text-gray-400">
                                      No hay grupos
                                    </p>
                                  )}
                                </div>
                              )}
                            </div>
                          </div>

                          {/* Preview */}
                          {bulkForm.dates.filter((d) => d).length > 0 &&
                            bulkForm.timeSlots.filter(
                              (s) => s.startTime && s.endTime,
                            ).length > 0 && (
                              <div className="bg-blue-50 border border-blue-200 rounded p-2">
                                <p className="text-xs text-blue-700 font-medium">
                                  Se crearán{" "}
                                  {bulkForm.dates.filter((d) => d).length *
                                    bulkForm.timeSlots.filter(
                                      (s) => s.startTime && s.endTime,
                                    ).length}{" "}
                                  horario(s)
                                </p>
                              </div>
                            )}

                          <div className="flex gap-2 justify-end">
                            <button
                              type="button"
                              onClick={resetBulkForm}
                              className="px-3 py-1 bg-gray-200 rounded text-sm"
                            >
                              Cancelar
                            </button>
                            <button
                              type="submit"
                              className="px-3 py-1 bg-[#113780] text-white rounded text-sm"
                            >
                              Generar
                            </button>
                          </div>
                        </form>
                      </div>
                    )}

                    {/* Lista de horarios */}
                    {loadingSchedules ? (
                      <p className="text-sm text-gray-400 text-center py-2">
                        Cargando horarios...
                      </p>
                    ) : activitySchedules.length > 0 ? (
                      <div className="space-y-2">
                        {activitySchedules.map((sch) => (
                          <div
                            key={sch._id}
                            className="flex items-center justify-between bg-white rounded border p-2"
                          >
                            <div className="flex-1 min-w-0">
                              <span className="text-sm font-medium">
                                {formatDateDDMMYYYY(sch.date)}
                              </span>
                              <span className="text-sm text-gray-600 ml-2">
                                {sch.startTime} - {sch.endTime}
                              </span>
                              {sch.groupIds && sch.groupIds.length > 0 && (
                                <span className="text-xs text-gray-400 ml-2">
                                  ·{" "}
                                  {sch.groupIds.length === 1
                                    ? sch.groupIds[0].name
                                    : `${sch.groupIds.length} grupos`}
                                </span>
                              )}
                            </div>
                            <button
                              onClick={() =>
                                handleDeleteSchedule(sch._id, a._id)
                              }
                              className="text-xs text-red-600 hover:text-red-800 ml-2"
                            >
                              Eliminar
                            </button>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-gray-400 text-center py-2">
                        Sin horarios asociados
                      </p>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
        {activities.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            No hay actividades
          </div>
        )}
      </div>
    </div>
  );
}
