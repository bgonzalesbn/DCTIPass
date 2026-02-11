import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { stickersAPI } from "../services/api";

// Lista de correos de administradores (puedes modificar esta lista según necesites)
const ADMIN_EMAILS = ["admin@banconacional.cr", "admin@bn.fi.cr"];

interface Badge {
  _id?: string;
  id?: string;
  name: string;
  description?: string;
  icon?: string;
  imageUrl?: string;
  active?: boolean;
  createdAt?: string;
  isEarned?: boolean;
  earnedAt?: string;
}

export default function BadgesPage() {
  const [badges, setBadges] = useState<Badge[]>([]);
  const [earnedCount, setEarnedCount] = useState(0);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [isAdmin, setIsAdmin] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem("token");
    const userId = localStorage.getItem("userId");
    const userEmail = localStorage.getItem("userEmail");

    if (!token || !userId) {
      navigate("/login");
      return;
    }

    // Verificar si el usuario es administrador
    if (userEmail && ADMIN_EMAILS.includes(userEmail.toLowerCase())) {
      setIsAdmin(true);
    }

    // Fetch user badges (incluye estado de earned)
    stickersAPI
      .getUserBadges()
      .then((response) => {
        // Badge data loaded
        const data = response.data;
        setBadges(data.badges || []);
        setEarnedCount(data.earned || 0);
        setTotalCount(data.total || 0);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Error loading badges:", err);
        setError("Error cargando las insignias");
        setLoading(false);
      });
  }, [navigate]);

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-gradient-to-br from-gray-50 to-blue-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#113780] mx-auto mb-4"></div>
          <p className="text-lg text-gray-600">Cargando insignias...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-[#113780] to-[#0C2A5C]">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 pt-5 pb-16">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-lg sm:text-xl font-semibold text-white">
              Insignias
            </h1>
            <div className="flex items-center gap-2">
              {isAdmin && (
                <button
                  onClick={() => navigate("/admin/badges/upload")}
                  className="bg-white/15 hover:bg-white/25 text-white px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200"
                  title="Cargar Insignia"
                >
                  + Nueva
                </button>
              )}
              <button
                onClick={() => navigate("/")}
                className="bg-white/15 hover:bg-white/25 text-white px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200"
              >
                ← Volver
              </button>
            </div>
          </div>

          {/* Progress in header */}
          <div className="flex items-center gap-3">
            <div className="flex-1">
              <div className="flex justify-between text-sm mb-1">
                <span className="text-blue-200">Progreso</span>
                <span className="text-white font-semibold">
                  {earnedCount} de {totalCount}
                </span>
              </div>
              <div className="w-full bg-white/20 rounded-full h-2">
                <div
                  className="bg-white h-2 rounded-full transition-all duration-500"
                  style={{
                    width:
                      totalCount > 0
                        ? `${(earnedCount / totalCount) * 100}%`
                        : "0%",
                  }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-2xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8 -mt-12 pb-8 relative z-20">
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-red-600 text-sm mb-4 shadow-sm">
            {error}
          </div>
        )}

        {/* Badges Grid */}
        <div className="grid grid-cols-2 gap-3 sm:gap-4">
          {badges.map((badge) => {
            const badgeId = badge.id || badge._id;
            const isEarned = badge.isEarned || false;
            return (
              <div
                key={badgeId}
                className={`bg-white rounded-2xl p-4 sm:p-6 flex flex-col items-center justify-center shadow-md border transition-all duration-200 ${
                  isEarned
                    ? "border-green-200 ring-1 ring-green-400"
                    : "border-gray-100"
                }`}
              >
                <div className="relative w-24 h-24 sm:w-28 sm:h-28">
                  {badge.imageUrl ? (
                    <>
                      <img
                        src={badge.imageUrl}
                        alt={badge.name}
                        className={`w-full h-full object-contain ${
                          !isEarned ? "grayscale opacity-40" : ""
                        }`}
                      />
                      {/* Candado para insignias no obtenidas */}
                      {!isEarned && (
                        <div className="absolute inset-0 flex items-center justify-center">
                          <div className="bg-gray-300 rounded-full p-4 sm:p-5">
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              className="h-8 w-8 sm:h-10 sm:w-10 text-gray-500"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                              strokeWidth={1.5}
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                              />
                            </svg>
                          </div>
                        </div>
                      )}
                      {/* Checkmark para insignias obtenidas */}
                      {isEarned && (
                        <div className="absolute -top-2 -right-2 bg-green-500 rounded-full p-1">
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="h-5 w-5 text-white"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                            strokeWidth={3}
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              d="M5 13l4 4L19 7"
                            />
                          </svg>
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      {isEarned ? (
                        <span className="text-5xl sm:text-6xl">🏆</span>
                      ) : (
                        <div className="bg-gray-300 rounded-full p-4 sm:p-5">
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="h-8 w-8 sm:h-10 sm:w-10 text-gray-500"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                            strokeWidth={1.5}
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                            />
                          </svg>
                        </div>
                      )}
                    </div>
                  )}
                </div>
                {/* Nombre de la insignia */}
                <p
                  className={`mt-2 text-sm text-center font-medium ${
                    isEarned ? "text-green-700" : "text-gray-400"
                  }`}
                >
                  {badge.name}
                </p>
              </div>
            );
          })}
        </div>

        {badges.length === 0 && (
          <div className="bg-white rounded-2xl shadow-md border border-gray-100 p-12 text-center col-span-2">
            <div className="text-5xl mb-4">🏆</div>
            <p className="text-gray-500 text-base">
              No hay insignias disponibles aún
            </p>
          </div>
        )}
        </div>
      </main>
    </div>
  );
}
