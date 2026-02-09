import { useState, useEffect } from "react";
import { adminAPI } from "../../../services/api";
import type {
  AdminActivity,
  AdminSticker,
  AdminSubActivity,
} from "../../../types";

const getErrorMessage = (err: unknown): string => {
  const error = err as { response?: { data?: { message?: string } } };
  return error.response?.data?.message || "Error inesperado";
};

export default function AdminActivitiesTab() {
  const [activities, setActivities] = useState<AdminActivity[]>([]);
  const [stickers, setStickers] = useState<AdminSticker[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [expandedActivity, setExpandedActivity] = useState<string | null>(null);
  const [showSubForm, setShowSubForm] = useState<string | null>(null);
  const [editingSubId, setEditingSubId] = useState<string | null>(null);

  const [form, setForm] = useState({
    name: "",
    description: "",
    color: "",
    stickerId: "",
  });
  const [subForm, setSubForm] = useState({
    name: "",
    description: "",
    color: "",
    stickerId: "",
    order: 0,
  });

  const loadData = async () => {
    setLoading(true);
    try {
      const [actRes, stkRes] = await Promise.all([
        adminAPI.getActivities(),
        adminAPI.getStickers(),
      ]);
      setActivities(actRes.data);
      setStickers(stkRes.data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const resetForm = () => {
    setForm({ name: "", description: "", color: "", stickerId: "" });
    setEditingId(null);
    setShowForm(false);
  };

  const resetSubForm = () => {
    setSubForm({
      name: "",
      description: "",
      color: "",
      stickerId: "",
      order: 0,
    });
    setEditingSubId(null);
    setShowSubForm(null);
  };

  const handleEdit = (a: AdminActivity) => {
    setForm({
      name: a.name,
      description: a.description || "",
      color: a.color || "",
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
        color: form.color,
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
      color: sub.color || "",
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
        color: subForm.color,
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
                Color (gradiente CSS)
              </label>
              <input
                type="text"
                value={form.color}
                onChange={(e) => setForm({ ...form, color: e.target.value })}
                className="w-full border rounded-lg px-3 py-2 text-sm"
                placeholder="from-indigo-600 to-purple-600"
              />
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
                  onClick={() =>
                    setExpandedActivity(
                      expandedActivity === a._id ? null : a._id,
                    )
                  }
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
              <div className="border-t px-4 py-3 bg-gray-50">
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
                            setSubForm({ ...subForm, order: +e.target.value })
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
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">
                          Color
                        </label>
                        <input
                          type="text"
                          value={subForm.color}
                          onChange={(e) =>
                            setSubForm({ ...subForm, color: e.target.value })
                          }
                          className="w-full border rounded px-2 py-1 text-sm"
                          placeholder="from-blue-500 to-blue-600"
                        />
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
                              onClick={() => handleDeleteSub(a._id, sub._id)}
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
