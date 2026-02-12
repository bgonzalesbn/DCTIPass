import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { rallyPhotosAPI } from "../services/api";

interface RallyPhoto {
  _id: string;
  imageData: string;
  caption: string;
  createdAt: string;
}

export default function RallyPhotosPage() {
  const [photos, setPhotos] = useState<RallyPhoto[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [caption, setCaption] = useState("");
  const [preview, setPreview] = useState<string | null>(null);
  const [selectedPhoto, setSelectedPhoto] = useState<RallyPhoto | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  const loadPhotos = async () => {
    try {
      setLoading(true);
      const res = await rallyPhotosAPI.getMyPhotos();
      setPhotos(res.data);
    } catch (err) {
      console.error("Error loading photos:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/login");
      return;
    }
    loadPhotos();
  }, [navigate]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      alert("Por favor selecciona una imagen");
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      alert("La imagen no debe superar los 10MB");
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setPreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleUpload = async () => {
    if (!preview) return;

    setUploading(true);
    try {
      await rallyPhotosAPI.upload(preview, caption);
      setPreview(null);
      setCaption("");
      if (fileInputRef.current) fileInputRef.current.value = "";
      await loadPhotos();
      alert("¡Foto subida exitosamente!");
    } catch (err) {
      console.error("Error uploading photo:", err);
      alert("Error al subir la foto");
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (photoId: string) => {
    if (!confirm("¿Eliminar esta foto?")) return;
    try {
      await rallyPhotosAPI.delete(photoId);
      await loadPhotos();
    } catch (err) {
      console.error("Error deleting photo:", err);
      alert("Error al eliminar la foto");
    }
  };

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString("es-MX", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-[#113780] to-[#0C2A5C]">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 pt-5 pb-16">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-lg sm:text-xl font-semibold text-white truncate">
              📸 Fotos del Rally
            </h1>
            <button
              onClick={() => navigate("/home")}
              className="bg-white/15 hover:bg-white/25 text-white px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200"
            >
              ← Volver
            </button>
          </div>
          <p className="text-blue-200 text-sm">
            Sube tus mejores fotos del Rally DCTI
          </p>
        </div>
      </div>

      <main className="max-w-2xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8 -mt-12 pb-8 relative z-20">
        {/* Upload Section */}
        <div className="bg-white rounded-2xl shadow-md border border-gray-100 p-5 sm:p-6 mb-6">
          <h2 className="text-lg font-bold text-gray-900 mb-4">
            Subir nueva foto
          </h2>

          {!preview ? (
            <div
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center cursor-pointer hover:border-[#113780] hover:bg-blue-50/50 transition-all"
            >
              <div className="text-4xl mb-2">📷</div>
              <p className="text-gray-600 font-medium">
                Toca para seleccionar una foto
              </p>
              <p className="text-xs text-gray-400 mt-1">
                JPG, PNG o HEIC · Máximo 10MB
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="relative rounded-xl overflow-hidden">
                <img
                  src={preview}
                  alt="Preview"
                  className="w-full max-h-64 object-cover rounded-xl"
                />
                <button
                  onClick={() => {
                    setPreview(null);
                    if (fileInputRef.current) fileInputRef.current.value = "";
                  }}
                  className="absolute top-2 right-2 bg-black/50 text-white w-8 h-8 rounded-full flex items-center justify-center hover:bg-black/70"
                >
                  ✕
                </button>
              </div>
              <input
                type="text"
                placeholder="Agrega un comentario (opcional)"
                value={caption}
                onChange={(e) => setCaption(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-[#113780] focus:border-transparent"
              />
              <button
                onClick={handleUpload}
                disabled={uploading}
                className="w-full bg-[#113780] hover:bg-[#0C2A5C] text-white font-semibold py-3 rounded-lg transition disabled:opacity-50"
              >
                {uploading ? "Subiendo..." : "📤 Subir Foto"}
              </button>
            </div>
          )}

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            onChange={handleFileSelect}
            className="hidden"
          />
        </div>

        {/* Photos Gallery */}
        <h2 className="text-lg font-bold text-gray-900 mb-3">
          Mis fotos ({photos.length})
        </h2>

        {loading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#113780] mx-auto mb-2"></div>
            <p className="text-gray-500 text-sm">Cargando fotos...</p>
          </div>
        ) : photos.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-md border border-gray-100 p-8 text-center">
            <div className="text-4xl mb-2">📸</div>
            <p className="text-gray-500">Aún no has subido fotos</p>
            <p className="text-gray-400 text-sm mt-1">
              ¡Sube tu primera foto del Rally!
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {photos.map((photo) => (
              <div
                key={photo._id}
                className="bg-white rounded-xl shadow-md overflow-hidden cursor-pointer hover:shadow-lg transition"
                onClick={() => setSelectedPhoto(photo)}
              >
                <img
                  src={photo.imageData}
                  alt={photo.caption || "Foto del Rally"}
                  className="w-full h-32 sm:h-40 object-cover"
                />
                <div className="p-2">
                  {photo.caption && (
                    <p className="text-xs text-gray-700 font-medium truncate">
                      {photo.caption}
                    </p>
                  )}
                  <p className="text-[10px] text-gray-400">
                    {formatDate(photo.createdAt)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Photo Detail Modal */}
        {selectedPhoto && (
          <div
            className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4"
            onClick={() => setSelectedPhoto(null)}
          >
            <div
              className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <img
                src={selectedPhoto.imageData}
                alt={selectedPhoto.caption || "Foto del Rally"}
                className="w-full max-h-[60vh] object-contain bg-gray-100"
              />
              <div className="p-4">
                {selectedPhoto.caption && (
                  <p className="text-sm text-gray-800 font-medium mb-2">
                    {selectedPhoto.caption}
                  </p>
                )}
                <p className="text-xs text-gray-400 mb-4">
                  {formatDate(selectedPhoto.createdAt)}
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={() => setSelectedPhoto(null)}
                    className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-700 font-semibold py-2.5 rounded-lg transition text-sm"
                  >
                    Cerrar
                  </button>
                  <button
                    onClick={() => {
                      handleDelete(selectedPhoto._id);
                      setSelectedPhoto(null);
                    }}
                    className="bg-red-100 hover:bg-red-200 text-red-600 font-semibold py-2.5 px-4 rounded-lg transition text-sm"
                  >
                    🗑 Eliminar
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
