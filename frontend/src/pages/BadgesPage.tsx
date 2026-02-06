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
        console.log("User badges response:", response.data);
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
      <div className="flex justify-center items-center min-h-screen">
        <p className="text-lg">Cargando insignias...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FAF9F6] p-4 sm:p-6">
      <div className="max-w-lg mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6 sm:mb-8">
          <button
            onClick={() => navigate("/")}
            className="text-[#113780] hover:text-[#0C2A5C] p-2"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-6 w-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 19l-7-7 7-7"
              />
            </svg>
          </button>
          <h1 className="text-2xl sm:text-3xl font-bold text-[#113780]">
            Insignias
          </h1>
          <div className="w-10">
            {isAdmin && (
              <button
                onClick={() => navigate("/admin/badges/upload")}
                className="text-[#113780] hover:text-[#0C2A5C] p-2"
                title="Cargar Insignia"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-6 w-6"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 4v16m8-8H4"
                  />
                </svg>
              </button>
            )}
          </div>
        </div>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
            {error}
          </div>
        )}

        {/* Badges Grid - 2 columnas */}
        <div className="grid grid-cols-2 gap-4 sm:gap-6">
          {badges.map((badge) => {
            const badgeId = badge.id || badge._id;
            const isEarned = badge.isEarned || false;
            return (
              <div
                key={badgeId}
                className={`bg-white rounded-2xl p-4 sm:p-6 flex flex-col items-center justify-center shadow-sm hover:shadow-md transition-shadow duration-300 ${
                  isEarned ? "ring-2 ring-green-400 bg-green-50" : ""
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
          <div className="text-center py-12">
            <p className="text-gray-600 text-lg">
              No hay insignias disponibles aún
            </p>
          </div>
        )}

        {/* Progress indicator at bottom */}
        <div className="mt-8 text-center">
          <p className="text-sm text-gray-500">
            {earnedCount} de {totalCount} insignias obtenidas
          </p>
          <div className="mt-2 w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-[#113780] h-2 rounded-full transition-all duration-500"
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
  );
}
