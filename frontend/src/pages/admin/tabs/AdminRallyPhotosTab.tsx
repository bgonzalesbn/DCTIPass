import { useCallback, useEffect, useState } from "react";
import { adminAPI } from "../../../services/api";
import type {
  AdminPagination,
  AdminRallyPhoto,
  AdminRallyPhotosResponse,
} from "../../../types";

const DEFAULT_PAGINATION: AdminPagination = {
  page: 1,
  limit: 12,
  totalItems: 0,
  totalPages: 1,
  hasNextPage: false,
  hasPrevPage: false,
};

const getErrorMessage = (err: unknown): string => {
  const error = err as { response?: { data?: { message?: string } } };
  return error.response?.data?.message || "Error inesperado";
};

const formatDate = (dateStr: string): string => {
  if (!dateStr) return "Sin fecha";
  const date = new Date(dateStr);
  if (Number.isNaN(date.getTime())) return "Sin fecha";

  return date.toLocaleDateString("es-MX", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const getImageExtension = (imageData: string): string => {
  const match = imageData.match(/^data:image\/([a-zA-Z0-9.+-]+);base64,/);
  if (!match?.[1]) return "jpg";

  const ext = match[1].toLowerCase();
  if (ext === "jpeg") return "jpg";
  if (ext === "svg+xml") return "svg";
  return ext;
};

const buildFileName = (photo: AdminRallyPhoto): string => {
  const safeEmployee = (photo.employeeNumber || "empleado")
    .replace(/[^a-zA-Z0-9_-]/g, "")
    .slice(0, 32);

  const date = new Date(photo.createdAt);
  const timestamp = Number.isNaN(date.getTime())
    ? Date.now().toString()
    : date
        .toISOString()
        .replace(/[^0-9]/g, "")
        .slice(0, 14);

  return `rally-photo-${safeEmployee || "empleado"}-${timestamp}.${getImageExtension(photo.imageData)}`;
};

const getPaginationItems = (
  currentPage: number,
  totalPages: number,
): Array<number | string> => {
  if (totalPages <= 1) return [1];

  const pages = new Set<number>([
    1,
    totalPages,
    Math.max(1, currentPage - 1),
    currentPage,
    Math.min(totalPages, currentPage + 1),
  ]);

  const sortedPages = Array.from(pages).sort((a, b) => a - b);
  const items: Array<number | string> = [];

  sortedPages.forEach((pageNumber, index) => {
    if (index > 0 && pageNumber - sortedPages[index - 1] > 1) {
      items.push(`dots-${pageNumber}`);
    }
    items.push(pageNumber);
  });

  return items;
};

export default function AdminRallyPhotosTab() {
  const [photos, setPhotos] = useState<AdminRallyPhoto[]>([]);
  const [pagination, setPagination] =
    useState<AdminPagination>(DEFAULT_PAGINATION);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  const loadPhotos = useCallback(async (page: number, limit: number) => {
    setLoading(true);
    setError("");

    try {
      const res = await adminAPI.getRallyPhotos(page, limit);
      const data = res.data as AdminRallyPhotosResponse;

      setPhotos(data.items || []);
      setPagination(data.pagination || DEFAULT_PAGINATION);
    } catch (err) {
      console.error(err);
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadPhotos(DEFAULT_PAGINATION.page, DEFAULT_PAGINATION.limit);
  }, [loadPhotos]);

  const handlePageChange = (nextPage: number) => {
    if (
      nextPage < 1 ||
      nextPage > pagination.totalPages ||
      nextPage === pagination.page
    ) {
      return;
    }
    loadPhotos(nextPage, pagination.limit);
  };

  const handleLimitChange = (nextLimit: number) => {
    if (nextLimit === pagination.limit) return;
    loadPhotos(1, nextLimit);
  };

  const handleDownload = async (photo: AdminRallyPhoto) => {
    setDownloadingId(photo._id);
    try {
      const response = await adminAPI.downloadRallyPhoto(photo._id);
      const blob = response.data as Blob;
      const objectUrl = window.URL.createObjectURL(blob);
      const link = document.createElement("a");

      link.href = objectUrl;
      link.download = buildFileName(photo);
      document.body.appendChild(link);
      link.click();
      link.remove();

      window.URL.revokeObjectURL(objectUrl);
    } catch (err) {
      alert(getErrorMessage(err));
    } finally {
      setDownloadingId(null);
    }
  };

  const paginationItems = getPaginationItems(
    pagination.page,
    pagination.totalPages,
  );

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h2 className="text-lg font-bold text-gray-900">Fotos del Rally</h2>
            <p className="text-sm text-gray-500">
              Visualiza fotos almacenadas en BD y descarga cada imagen.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <select
              value={pagination.limit}
              onChange={(e) => handleLimitChange(Number(e.target.value))}
              className="border rounded-lg px-3 py-2 text-sm"
            >
              <option value={8}>8 por pagina</option>
              <option value={12}>12 por pagina</option>
              <option value={20}>20 por pagina</option>
            </select>
            <button
              type="button"
              onClick={() => loadPhotos(pagination.page, pagination.limit)}
              className="bg-[#113780] hover:bg-[#0C2A5C] text-white px-3 py-2 rounded-lg text-sm"
            >
              Actualizar
            </button>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-8 text-center text-gray-500">
          Cargando fotos...
        </div>
      ) : error ? (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-4 text-sm">
          {error}
        </div>
      ) : photos.length === 0 ? (
        <div className="bg-white rounded-lg shadow-sm border border-gray-100 p-8 text-center text-gray-500">
          No hay fotos registradas para mostrar.
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
            {photos.map((photo) => (
              <article
                key={photo._id}
                className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden"
              >
                <img
                  src={photo.imageData}
                  alt={photo.caption || "Foto del Rally"}
                  className="w-full h-52 object-cover bg-gray-100"
                />
                <div className="p-4 space-y-2">
                  <p className="text-sm font-medium text-gray-900 line-clamp-2 min-h-[40px]">
                    {photo.caption?.trim() ? photo.caption : "Sin comentario"}
                  </p>
                  <p className="text-xs text-gray-500">
                    <span className="font-semibold text-gray-700">
                      Empleado:
                    </span>{" "}
                    {photo.employeeNumber || "N/A"}
                  </p>
                  <p className="text-xs text-gray-500">
                    {formatDate(photo.createdAt)}
                  </p>
                  <button
                    type="button"
                    onClick={() => handleDownload(photo)}
                    disabled={downloadingId === photo._id}
                    className="w-full bg-blue-50 hover:bg-blue-100 text-[#113780] font-medium py-2 rounded-lg text-sm disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    {downloadingId === photo._id
                      ? "Descargando..."
                      : "Descargar foto"}
                  </button>
                </div>
              </article>
            ))}
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-100 px-4 py-3 flex flex-col sm:flex-row items-center justify-between gap-3">
            <span className="text-xs text-gray-500">
              Mostrando {(pagination.page - 1) * pagination.limit + 1}-
              {Math.min(
                pagination.page * pagination.limit,
                pagination.totalItems,
              )}{" "}
              de {pagination.totalItems} fotos
            </span>

            {pagination.totalPages > 1 && (
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => handlePageChange(pagination.page - 1)}
                  disabled={!pagination.hasPrevPage}
                  className="px-2 py-1 text-xs rounded border bg-white hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  ← Anterior
                </button>

                {paginationItems.map((item, index) =>
                  typeof item === "string" ? (
                    <span
                      key={`${item}-${index}`}
                      className="px-1 text-xs text-gray-400"
                    >
                      ...
                    </span>
                  ) : (
                    <button
                      key={item}
                      type="button"
                      onClick={() => handlePageChange(item)}
                      className={`px-2 py-1 text-xs rounded border ${
                        pagination.page === item
                          ? "bg-[#113780] text-white border-[#113780]"
                          : "bg-white hover:bg-gray-100"
                      }`}
                    >
                      {item}
                    </button>
                  ),
                )}

                <button
                  type="button"
                  onClick={() => handlePageChange(pagination.page + 1)}
                  disabled={!pagination.hasNextPage}
                  className="px-2 py-1 text-xs rounded border bg-white hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  Siguiente →
                </button>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
