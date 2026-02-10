import { useState, useEffect, useMemo } from "react";
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
  const [filterActivityId, setFilterActivityId] = useState("");
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    stickerId: "",
    activityId: "",
    subActivityId: "",
    question: "",
    options: ["", ""],
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
      options: ["", ""],
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
      options:
        a.options.length >= 2
          ? [...a.options]
          : [...a.options, "", ""].slice(0, 2),
      correctAnswer: a.correctAnswer,
      explanation: a.explanation || "",
      points: a.points,
    });
    setEditingId(a._id);
    setShowForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const filteredOptions = form.options.filter((o) => o.trim());
    if (filteredOptions.length < 2) {
      alert("Debes tener al menos 2 opciones de respuesta");
      return;
    }
    if (!form.correctAnswer || !filteredOptions.includes(form.correctAnswer)) {
      alert("Debes seleccionar una respuesta correcta de las opciones");
      return;
    }
    setSaving(true);
    try {
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
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (
      !confirm(
        "¿Eliminar este reto? Los usuarios que ya lo completaron conservarán su progreso.",
      )
    )
      return;
    try {
      await adminAPI.deleteAward(id);
      loadData();
    } catch (err) {
      alert(getErrorMessage(err));
    }
  };

  const addOption = () => {
    if (form.options.length >= 6) return;
    setForm({ ...form, options: [...form.options, ""] });
  };

  const removeOption = (idx: number) => {
    if (form.options.length <= 2) return;
    const newOpts = form.options.filter((_, i) => i !== idx);
    const removedVal = form.options[idx];
    const newCorrect =
      form.correctAnswer === removedVal ? "" : form.correctAnswer;
    setForm({ ...form, options: newOpts, correctAnswer: newCorrect });
  };

  const updateOption = (idx: number, val: string) => {
    const oldVal = form.options[idx];
    const newOpts = [...form.options];
    newOpts[idx] = val;
    const newCorrect = form.correctAnswer === oldVal ? val : form.correctAnswer;
    setForm({ ...form, options: newOpts, correctAnswer: newCorrect });
  };

  const selectedActivity = activities.find((a) => a._id === form.activityId);

  const getSubActivityName = (award: AdminAward) => {
    const activity = activities.find(
      (a) => a._id === (award.activityId?._id || award.activityId),
    );
    if (!activity) return award.subActivityId || "-";
    const sub = activity.subActivities?.find(
      (s) => String(s._id) === String(award.subActivityId),
    );
    return sub?.name || award.subActivityId || "-";
  };

  const filteredAwards = useMemo(() => {
    if (!filterActivityId) return awards;
    return awards.filter((a) => {
      const aId =
        typeof a.activityId === "object" ? a.activityId._id : a.activityId;
      return aId === filterActivityId;
    });
  }, [awards, filterActivityId]);

  const subActivityHasQuiz = (subActivityId: string) => {
    return awards.some(
      (a) => String(a.subActivityId) === subActivityId && a.active !== false,
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#113780]"></div>
        <span className="ml-3 text-gray-500">Cargando retos...</span>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-4">
        <div>
          <h2 className="text-lg font-bold text-gray-900">Gestión de Retos</h2>
          <p className="text-sm text-gray-500 mt-0.5">
            Crea preguntas para cada sub-actividad. Al responder correctamente,
            el usuario gana el sticker asignado.
          </p>
        </div>
        <button
          onClick={() => {
            resetForm();
            setShowForm(true);
          }}
          className="bg-[#113780] hover:bg-[#0C2A5C] text-white px-4 py-2 rounded-lg text-sm font-medium shadow-sm transition whitespace-nowrap"
        >
          + Nuevo Reto
        </button>
      </div>

      {/* Form */}
      {showForm && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 mb-5">
          <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <span className="text-lg">📝</span>
            {editingId ? "Editar Reto" : "Crear Nuevo Reto"}
          </h3>
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Activity/SubActivity/Sticker selectors - only for new */}
            {!editingId && (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Actividad <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={form.activityId}
                    onChange={(e) => {
                      setForm({
                        ...form,
                        activityId: e.target.value,
                        subActivityId: "",
                        stickerId: "",
                      });
                    }}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-[#113780] focus:border-transparent"
                    required
                  >
                    <option value="">Seleccionar actividad...</option>
                    {activities.map((a) => (
                      <option key={a._id} value={a._id}>
                        {a.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Sub-actividad <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={form.subActivityId}
                    onChange={(e) => {
                      const subId = e.target.value;
                      const sub = selectedActivity?.subActivities?.find(
                        (s) => String(s._id) === subId,
                      );
                      const autoSticker = sub?.stickerId
                        ? String(sub.stickerId)
                        : "";
                      setForm({
                        ...form,
                        subActivityId: subId,
                        stickerId: autoSticker || form.stickerId,
                      });
                    }}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-[#113780] focus:border-transparent"
                    required
                    disabled={!form.activityId}
                  >
                    <option value="">Seleccionar sub-actividad...</option>
                    {selectedActivity?.subActivities
                      ?.filter((s) => s.active !== false)
                      .map((s) => {
                        const hasQuiz = subActivityHasQuiz(String(s._id));
                        return (
                          <option
                            key={String(s._id)}
                            value={String(s._id)}
                            disabled={hasQuiz}
                          >
                            {s.name}
                            {hasQuiz ? " (ya tiene reto)" : ""}
                          </option>
                        );
                      })}
                  </select>
                  {form.subActivityId &&
                    subActivityHasQuiz(form.subActivityId) && (
                      <p className="text-xs text-amber-600 mt-1">
                        Esta sub-actividad ya tiene un reto asignado
                      </p>
                    )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Sticker (premio) <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={form.stickerId}
                    onChange={(e) =>
                      setForm({ ...form, stickerId: e.target.value })
                    }
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-[#113780] focus:border-transparent"
                    required
                  >
                    <option value="">Seleccionar sticker...</option>
                    {stickers.map((s) => (
                      <option key={s._id} value={s._id}>
                        {s.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            )}

            {/* Question */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Pregunta <span className="text-red-500">*</span>
              </label>
              <textarea
                value={form.question}
                onChange={(e) => setForm({ ...form, question: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-[#113780] focus:border-transparent"
                rows={3}
                placeholder="Escribe la pregunta que verá el usuario..."
                required
              />
            </div>

            {/* Options */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-medium text-gray-700">
                  Opciones de respuesta <span className="text-red-500">*</span>
                  <span className="text-xs text-gray-400 ml-2">
                    (mín. 2, máx. 6)
                  </span>
                </label>
                {form.options.length < 6 && (
                  <button
                    type="button"
                    onClick={addOption}
                    className="text-sm text-[#113780] hover:text-[#0C2A5C] font-medium flex items-center gap-1"
                  >
                    <span className="text-lg leading-none">+</span> Agregar
                    opción
                  </button>
                )}
              </div>
              <div className="space-y-2">
                {form.options.map((opt, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setForm({ ...form, correctAnswer: opt })}
                      className={`flex-shrink-0 w-5 h-5 rounded-full border-2 flex items-center justify-center transition ${
                        opt.trim() && form.correctAnswer === opt
                          ? "border-green-500 bg-green-500"
                          : "border-gray-300 hover:border-green-400"
                      }`}
                      title={
                        opt.trim() && form.correctAnswer === opt
                          ? "Respuesta correcta"
                          : "Marcar como correcta"
                      }
                      disabled={!opt.trim()}
                    >
                      {opt.trim() && form.correctAnswer === opt && (
                        <svg
                          className="w-3 h-3 text-white"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path
                            fillRule="evenodd"
                            d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                            clipRule="evenodd"
                          />
                        </svg>
                      )}
                    </button>
                    <input
                      type="text"
                      value={opt}
                      onChange={(e) => updateOption(idx, e.target.value)}
                      className={`flex-1 border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-[#113780] focus:border-transparent ${
                        opt.trim() && form.correctAnswer === opt
                          ? "border-green-400 bg-green-50"
                          : "border-gray-300"
                      }`}
                      placeholder={`Opción ${idx + 1}`}
                      required={idx < 2}
                    />
                    {form.options.length > 2 && (
                      <button
                        type="button"
                        onClick={() => removeOption(idx)}
                        className="flex-shrink-0 w-7 h-7 rounded-full text-gray-400 hover:text-red-500 hover:bg-red-50 flex items-center justify-center transition"
                        title="Eliminar opción"
                      >
                        ✕
                      </button>
                    )}
                  </div>
                ))}
              </div>
              {!form.correctAnswer && form.options.some((o) => o.trim()) && (
                <p className="text-xs text-amber-600 mt-2">
                  Haz clic en el círculo para marcar la respuesta correcta
                </p>
              )}
              {form.correctAnswer && (
                <p className="text-xs text-green-600 mt-2">
                  Respuesta correcta: <strong>{form.correctAnswer}</strong>
                </p>
              )}
            </div>

            {/* Points & Explanation */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Puntos
                </label>
                <input
                  type="number"
                  min={1}
                  value={form.points}
                  onChange={(e) =>
                    setForm({ ...form, points: +e.target.value })
                  }
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-[#113780] focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Explicación{" "}
                  <span className="text-xs text-gray-400">
                    (opcional, se muestra al responder)
                  </span>
                </label>
                <input
                  type="text"
                  value={form.explanation}
                  onChange={(e) =>
                    setForm({ ...form, explanation: e.target.value })
                  }
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-[#113780] focus:border-transparent"
                  placeholder="Explicación de la respuesta..."
                />
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-2 justify-end pt-2 border-t border-gray-100">
              <button
                type="button"
                onClick={resetForm}
                className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm text-gray-700 transition"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={saving}
                className="px-5 py-2 bg-[#113780] hover:bg-[#0C2A5C] text-white rounded-lg text-sm font-medium shadow-sm transition disabled:opacity-50"
              >
                {saving
                  ? "Guardando..."
                  : editingId
                    ? "Actualizar Reto"
                    : "Crear Reto"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Filter & Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        {/* Filter bar */}
        <div className="px-4 py-3 border-b border-gray-100 bg-gray-50/50">
          <div className="flex items-center gap-3">
            <label className="text-sm text-gray-600 whitespace-nowrap">
              Filtrar por actividad:
            </label>
            <select
              value={filterActivityId}
              onChange={(e) => setFilterActivityId(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:ring-2 focus:ring-[#113780] focus:border-transparent"
            >
              <option value="">Todas las actividades</option>
              {activities.map((a) => (
                <option key={a._id} value={a._id}>
                  {a.name}
                </option>
              ))}
            </select>
            <span className="text-sm text-gray-400 ml-auto">
              {filteredAwards.length} reto
              {filteredAwards.length !== 1 ? "s" : ""}
            </span>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Pregunta
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actividad
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Sub-actividad
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Sticker
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Opciones
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Pts
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredAwards.map((a) => (
                <tr key={a._id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3 text-sm max-w-[200px]">
                    <p
                      className="truncate text-gray-900 font-medium"
                      title={a.question}
                    >
                      {a.question}
                    </p>
                    <p
                      className="text-xs text-green-600 truncate mt-0.5"
                      title={a.correctAnswer}
                    >
                      ✓ {a.correctAnswer}
                    </p>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600">
                    {a.activityId?.name || "-"}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600">
                    {getSubActivityName(a)}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600">
                    <span className="inline-flex items-center gap-1">
                      {a.stickerId?.imageUrl && (
                        <img
                          src={a.stickerId.imageUrl}
                          alt=""
                          className="w-5 h-5 rounded"
                        />
                      )}
                      {a.stickerId?.name || "-"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-500">
                    {a.options?.length || 0}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600 font-medium">
                    {a.points}
                  </td>
                  <td className="px-4 py-3 text-sm">
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleEdit(a)}
                        className="text-[#113780] hover:text-[#0C2A5C] font-medium text-xs bg-blue-50 hover:bg-blue-100 px-2.5 py-1 rounded-md transition"
                      >
                        Editar
                      </button>
                      <button
                        onClick={() => handleDelete(a._id)}
                        className="text-red-600 hover:text-red-700 font-medium text-xs bg-red-50 hover:bg-red-100 px-2.5 py-1 rounded-md transition"
                      >
                        Eliminar
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filteredAwards.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center">
                    <div className="text-gray-400">
                      <span className="text-3xl block mb-2">🎯</span>
                      <p className="font-medium text-gray-500">
                        No hay retos creados
                      </p>
                      <p className="text-sm mt-1">
                        Crea un reto para asignarlo a una sub-actividad
                      </p>
                    </div>
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
