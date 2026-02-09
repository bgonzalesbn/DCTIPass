import { useState, useEffect } from "react";
import { adminAPI } from "../../../services/api";
import type { AdminAward, AdminActivity, AdminSticker } from "../../../types";

const getErrorMessage = (err: unknown): string => {
  const error = err as { response?: { data?: { message?: string } } };
  return error.response?.data?.message || "Error inesperado";
};

export default function AdminAwardsTab() {
  const [awards, setAwards] = useState<AdminAward[]>([]);
  const [activities, setActivities] = useState<AdminActivity[]>([]);
  const [stickers, setStickers] = useState<AdminSticker[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [selectedActivityId, setSelectedActivityId] = useState("");

  const [form, setForm] = useState({
    stickerId: "",
    activityId: "",
    subActivityId: "",
    question: "",
    options: ["", "", "", ""],
    correctAnswer: "",
    explanation: "",
    points: 10,
  });

  const loadData = async () => {
    setLoading(true);
    try {
      const [awRes, actRes, stkRes] = await Promise.all([
        adminAPI.getAwards(),
        adminAPI.getActivities(),
        adminAPI.getStickers(),
      ]);
      setAwards(awRes.data);
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
    setForm({
      stickerId: "",
      activityId: "",
      subActivityId: "",
      question: "",
      options: ["", "", "", ""],
      correctAnswer: "",
      explanation: "",
      points: 10,
    });
    setEditingId(null);
    setShowForm(false);
  };

  const handleEdit = (a: AdminAward) => {
    setForm({
      stickerId: a.stickerId?._id || "",
      activityId: a.activityId?._id || "",
      subActivityId: a.subActivityId || "",
      question: a.question,
      options: [...a.options, "", "", "", ""].slice(0, 4),
      correctAnswer: a.correctAnswer,
      explanation: a.explanation || "",
      points: a.points,
    });
    setSelectedActivityId(a.activityId?._id || "");
    setEditingId(a._id);
    setShowForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const filteredOptions = form.options.filter((o) => o.trim());
      if (editingId) {
        await adminAPI.updateAward(editingId, {
          question: form.question,
          options: filteredOptions,
          correctAnswer: form.correctAnswer,
          explanation: form.explanation,
          points: form.points,
        });
      } else {
        await adminAPI.createAward({
          stickerId: form.stickerId,
          activityId: form.activityId,
          subActivityId: form.subActivityId,
          question: form.question,
          options: filteredOptions,
          correctAnswer: form.correctAnswer,
          explanation: form.explanation,
          points: form.points,
        });
      }
      resetForm();
      loadData();
    } catch (err) {
      alert(getErrorMessage(err));
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("¿Eliminar este premio/reto?")) return;
    try {
      await adminAPI.deleteAward(id);
      loadData();
    } catch (err) {
      alert(getErrorMessage(err));
    }
  };

  const updateOption = (idx: number, val: string) => {
    const newOpts = [...form.options];
    newOpts[idx] = val;
    setForm({ ...form, options: newOpts });
  };

  const selectedActivity = activities.find(
    (a) => a._id === (form.activityId || selectedActivityId),
  );

  if (loading) return <div className="text-center py-8">Cargando...</div>;

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-bold text-gray-900">
          Gestión de Premios (Quiz Awards)
        </h2>
        <button
          onClick={() => {
            resetForm();
            setShowForm(true);
          }}
          className="bg-[#113780] hover:bg-[#0C2A5C] text-white px-4 py-2 rounded-lg text-sm"
        >
          + Nuevo Premio
        </button>
      </div>

      {showForm && (
        <div className="bg-white rounded-lg shadow p-4 mb-4">
          <h3 className="font-semibold mb-3">
            {editingId ? "Editar" : "Crear"} Premio
          </h3>
          <form
            onSubmit={handleSubmit}
            className="grid grid-cols-1 sm:grid-cols-2 gap-3"
          >
            {!editingId && (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Actividad
                  </label>
                  <select
                    value={form.activityId}
                    onChange={(e) => {
                      setForm({
                        ...form,
                        activityId: e.target.value,
                        subActivityId: "",
                      });
                      setSelectedActivityId(e.target.value);
                    }}
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
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Sub-actividad
                  </label>
                  <select
                    value={form.subActivityId}
                    onChange={(e) =>
                      setForm({ ...form, subActivityId: e.target.value })
                    }
                    className="w-full border rounded-lg px-3 py-2 text-sm"
                    required
                  >
                    <option value="">Seleccionar...</option>
                    {selectedActivity?.subActivities?.map((s) => (
                      <option key={s._id} value={s._id}>
                        {s.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Sticker
                  </label>
                  <select
                    value={form.stickerId}
                    onChange={(e) =>
                      setForm({ ...form, stickerId: e.target.value })
                    }
                    className="w-full border rounded-lg px-3 py-2 text-sm"
                    required
                  >
                    <option value="">Seleccionar...</option>
                    {stickers.map((s) => (
                      <option key={s._id} value={s._id}>
                        {s.name}
                      </option>
                    ))}
                  </select>
                </div>
              </>
            )}
            <div className={editingId ? "sm:col-span-2" : ""}>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Puntos
              </label>
              <input
                type="number"
                value={form.points}
                onChange={(e) => setForm({ ...form, points: +e.target.value })}
                className="w-full border rounded-lg px-3 py-2 text-sm"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Pregunta
              </label>
              <textarea
                value={form.question}
                onChange={(e) => setForm({ ...form, question: e.target.value })}
                className="w-full border rounded-lg px-3 py-2 text-sm"
                rows={2}
                required
              />
            </div>
            {form.options.map((opt, idx) => (
              <div key={idx}>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Opción {idx + 1}
                </label>
                <input
                  type="text"
                  value={opt}
                  onChange={(e) => updateOption(idx, e.target.value)}
                  className="w-full border rounded-lg px-3 py-2 text-sm"
                  required={idx < 2}
                />
              </div>
            ))}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Respuesta correcta
              </label>
              <select
                value={form.correctAnswer}
                onChange={(e) =>
                  setForm({ ...form, correctAnswer: e.target.value })
                }
                className="w-full border rounded-lg px-3 py-2 text-sm"
                required
              >
                <option value="">Seleccionar...</option>
                {form.options
                  .filter((o) => o.trim())
                  .map((o, i) => (
                    <option key={i} value={o}>
                      {o}
                    </option>
                  ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Explicación
              </label>
              <input
                type="text"
                value={form.explanation}
                onChange={(e) =>
                  setForm({ ...form, explanation: e.target.value })
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

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Pregunta
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Actividad
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Sticker
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Puntos
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {awards.map((a) => (
                <tr key={a._id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-sm max-w-xs truncate">
                    {a.question}
                  </td>
                  <td className="px-4 py-3 text-sm">
                    {a.activityId?.name || "-"}
                  </td>
                  <td className="px-4 py-3 text-sm">
                    {a.stickerId?.name || "-"}
                  </td>
                  <td className="px-4 py-3 text-sm">{a.points}</td>
                  <td className="px-4 py-3 text-sm">
                    <button
                      onClick={() => handleEdit(a)}
                      className="text-blue-600 hover:text-blue-800 mr-3"
                    >
                      Editar
                    </button>
                    <button
                      onClick={() => handleDelete(a._id)}
                      className="text-red-600 hover:text-red-800"
                    >
                      Eliminar
                    </button>
                  </td>
                </tr>
              ))}
              {awards.length === 0 && (
                <tr>
                  <td
                    colSpan={5}
                    className="px-4 py-8 text-center text-gray-500"
                  >
                    No hay premios
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
