import { useState } from "react";
import { useNavigate } from "react-router-dom";

export default function AdminBadgesUpload() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    file: null as File | null,
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setFormData((prev) => ({
        ...prev,
        file,
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    try {
      if (!formData.name || !formData.file) {
        setMessage("Por favor completa el nombre y selecciona una imagen");
        setLoading(false);
        return;
      }

      const data = new FormData();
      data.append("name", formData.name);
      data.append("description", formData.description);
      data.append("file", formData.file);

      const response = await fetch("http://localhost:3000/badges/upload", {
        method: "POST",
        body: data,
      });

      if (response.ok) {
        setMessage(`✅ Badge "${formData.name}" cargado exitosamente!`);
        setFormData({ name: "", description: "", file: null });

        // Limpiar el input de archivo
        const fileInput = document.getElementById(
          "file-input",
        ) as HTMLInputElement;
        if (fileInput) fileInput.value = "";

        // Redirigir a badges después de 2 segundos
        setTimeout(() => navigate("/badges"), 2000);
      } else {
        const error = await response.json();
        setMessage(`❌ Error: ${error.message}`);
      }
    } catch (error) {
      setMessage(`❌ Error: ${(error as Error).message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-blue-100 p-6">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => navigate("/badges")}
            className="text-indigo-600 hover:text-indigo-700 font-semibold mb-4 inline-flex items-center"
          >
            ← Volver a Insignias
          </button>
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            Cargar Nueva Insignia
          </h1>
          <p className="text-gray-600">
            Sube una imagen PNG/JPG para crear una nueva insignia
          </p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-lg shadow-lg p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Nombre */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Nombre de la Insignia *
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                placeholder="Ej: Esqueleto Aro"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                disabled={loading}
              />
            </div>

            {/* Descripción */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Descripción (opcional)
              </label>
              <input
                type="text"
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                placeholder="Descripción de la insignia"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                disabled={loading}
              />
            </div>

            {/* File Upload */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Seleccionar Imagen (PNG/JPG) *
              </label>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-indigo-500 transition cursor-pointer">
                <input
                  id="file-input"
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="hidden"
                  disabled={loading}
                />
                <label htmlFor="file-input" className="cursor-pointer block">
                  {formData.file ? (
                    <div>
                      <div className="text-2xl mb-2">✅</div>
                      <p className="text-sm font-semibold text-gray-900">
                        {formData.file.name}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        {(formData.file.size / 1024).toFixed(2)} KB
                      </p>
                    </div>
                  ) : (
                    <div>
                      <div className="text-4xl mb-2">📸</div>
                      <p className="text-gray-600 font-medium">
                        Haz clic para seleccionar una imagen
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        PNG, JPG o GIF (máx 10MB)
                      </p>
                    </div>
                  )}
                </label>
              </div>
            </div>

            {/* Message */}
            {message && (
              <div
                className={`p-4 rounded-lg ${
                  message.includes("✅")
                    ? "bg-green-50 text-green-700 border border-green-200"
                    : "bg-red-50 text-red-700 border border-red-200"
                }`}
              >
                {message}
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-400 text-white font-bold py-3 rounded-lg transition"
            >
              {loading ? "Cargando..." : "Cargar Insignia"}
            </button>
          </form>

          {/* Info Box */}
          <div className="mt-8 p-4 bg-blue-50 rounded-lg border border-blue-200">
            <h3 className="font-semibold text-blue-900 mb-2">💡 Consejos:</h3>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• Las imágenes se guardan en base64 en MongoDB</li>
              <li>• Usa imágenes cuadradas (500x500px) para mejor resultado</li>
              <li>• El tamaño máximo recomendado es 500KB</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
