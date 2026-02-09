import { useState, useEffect } from "react";
import { adminAPI } from "../../../services/api";
import type { AdminSticker } from "../../../types";

const getErrorMessage = (err: unknown): string => {
  const error = err as { response?: { data?: { message?: string } } };
  return error.response?.data?.message || "Error inesperado";
};

export default function AdminStickersTab() {
  const [stickers, setStickers] = useState<AdminSticker[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({ name: "", description: "", imageUrl: "" });

  const loadData = async () => {
    setLoading(true);
    try {
      const res = await adminAPI.getStickers();
      setStickers(res.data);
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
    setForm({ name: "", description: "", imageUrl: "" });
    setEditingId(null);
    setShowForm(false);
  };

  const handleEdit = (s: AdminSticker) => {
    setForm({
      name: s.name,
      description: s.description || "",
      imageUrl: s.imageUrl || "",
    });
    setEditingId(s._id);
    setShowForm(true);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      setForm({ ...form, imageUrl: reader.result as string });
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const data: Record<string, unknown> = {
        name: form.name,
        description: form.description,
      };
      if (form.imageUrl) data.imageUrl = form.imageUrl;

      if (editingId) {
        await adminAPI.updateSticker(editingId, data);
      } else {
        await adminAPI.createSticker(data);
      }
      resetForm();
      loadData();
    } catch (err) {
      alert(getErrorMessage(err));
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("¿Eliminar este sticker?")) return;
    try {
      await adminAPI.deleteSticker(id);
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
          Gestión de Stickers / Insignias
        </h2>
        <button
          onClick={() => {
            resetForm();
            setShowForm(true);
          }}
          className="bg-[#113780] hover:bg-[#0C2A5C] text-white px-4 py-2 rounded-lg text-sm"
        >
          + Nuevo Sticker
        </button>
      </div>

      {showForm && (
        <div className="bg-white rounded-lg shadow p-4 mb-4">
          <h3 className="font-semibold mb-3">
            {editingId ? "Editar" : "Crear"} Sticker
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
                Imagen
              </label>
              <input
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                className="w-full border rounded-lg px-3 py-2 text-sm"
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
            {form.imageUrl && (
              <div className="sm:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Vista previa
                </label>
                <img
                  src={form.imageUrl}
                  alt="Preview"
                  className="h-16 w-16 object-contain rounded border"
                />
              </div>
            )}
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

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {stickers.map((s) => (
          <div key={s._id} className="bg-white rounded-lg shadow p-4">
            <div className="flex items-start gap-3">
              {s.imageUrl ? (
                <img
                  src={s.imageUrl}
                  alt={s.name}
                  className="h-12 w-12 object-contain rounded"
                />
              ) : (
                <div className="h-12 w-12 bg-gray-100 rounded flex items-center justify-center text-xl">
                  🏆
                </div>
              )}
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-sm truncate">{s.name}</h3>
                <p className="text-xs text-gray-500 line-clamp-2">
                  {s.description || "Sin descripción"}
                </p>
                <span
                  className={`inline-block mt-1 px-2 py-0.5 rounded-full text-xs ${s.active ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}
                >
                  {s.active ? "Activo" : "Inactivo"}
                </span>
              </div>
            </div>
            <div className="flex gap-2 mt-3 justify-end">
              <button
                onClick={() => handleEdit(s)}
                className="text-xs text-blue-600 hover:text-blue-800"
              >
                Editar
              </button>
              <button
                onClick={() => handleDelete(s._id)}
                className="text-xs text-red-600 hover:text-red-800"
              >
                Eliminar
              </button>
            </div>
          </div>
        ))}
        {stickers.length === 0 && (
          <div className="col-span-full text-center py-8 text-gray-500">
            No hay stickers
          </div>
        )}
      </div>
    </div>
  );
}
