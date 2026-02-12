import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { usersAPI } from "../services/api";
import { useAuthStore } from "../store/authStore";

interface User {
  id: string;
  employeeNumber: string;
  firstName: string;
  lastName: string;
  email: string;
  direction: string;
  points: number;
  level: number;
  isAdmin: boolean;
}

export default function HomePage() {
  const [user, setUser] = useState<User | null>(null);
  const navigate = useNavigate();
  const { setUser: setStoreUser } = useAuthStore();

  useEffect(() => {
    const token = localStorage.getItem("token");
    const userId = localStorage.getItem("userId");

    if (!token || !userId) {
      navigate("/login");
      return;
    }

    // Cargar datos del usuario desde el backend
    usersAPI
      .getMe()
      .then((response) => {
        const userDat = response.data;
        const userData: User = {
          id: userDat.id || userDat._id || userId,
          employeeNumber: userDat.employeeNumber || "",
          firstName: userDat.firstName || "",
          lastName: userDat.lastName || "",
          email: userDat.email || "",
          direction: userDat.direction || "",
          points: userDat.progress?.activitiesCompleted || userDat.points || 0,
          level: userDat.level || 1,
          isAdmin: userDat.isAdmin === true,
        };
        setUser(userData);
        setStoreUser(userData);

        // Admin users go directly to admin panel
        if (userData.isAdmin) {
          navigate("/admin", { replace: true });
        }
      })
      .catch((error) => {
        console.error("Error loading user data:", error);
        const userData: User = {
          id: userId,
          employeeNumber: "",
          firstName: "",
          lastName: "",
          email: localStorage.getItem("userEmail") || "",
          direction: "",
          points: 0,
          level: 1,
          isAdmin: false,
        };
        setUser(userData);
      });
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("userId");
    localStorage.removeItem("userEmail");
    navigate("/login");
  };

  if (!user) {
    return <div>Cargando...</div>;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-[#113780] to-[#0C2A5C]">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 pt-5 pb-16">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-lg sm:text-xl font-semibold text-white truncate">
              DCTI Pass
            </h1>
            <button
              onClick={handleLogout}
              className="bg-white/15 hover:bg-white/25 text-white px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200"
            >
              Cerrar Sesión
            </button>
          </div>

          <div className="flex items-center gap-3">
            <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-white/20 border border-white/30 flex items-center justify-center text-white text-lg sm:text-xl font-bold">
              {`${user.firstName?.charAt(0) || ""}${user.lastName?.charAt(0) || ""}`.toUpperCase()}
            </div>
            <div className="text-white">
              <h2 className="text-lg sm:text-xl font-semibold">
                Hola, {user.firstName}
              </h2>
              <p className="text-blue-200 text-sm">Bienvenido de vuelta</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content — overlaps the hero */}
      <main className="max-w-2xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8 -mt-12 pb-8 relative z-20">
        <div className="space-y-3">
          <button
            onClick={() => navigate("/activities")}
            className="w-full bg-white rounded-2xl shadow-md border border-gray-100 p-5 sm:p-6 text-left transition-all duration-200 hover:shadow-lg hover:-translate-y-0.5 group flex items-center gap-4"
          >
            <div className="w-12 h-12 rounded-xl bg-[#113780]/10 flex items-center justify-center text-2xl flex-shrink-0 group-hover:bg-[#113780]/15 transition">
              ✅
            </div>
            <div className="min-w-0">
              <h2 className="text-base sm:text-lg font-bold text-gray-900 group-hover:text-[#113780] transition">
                Actividades
              </h2>
              <p className="text-gray-500 text-sm">
                Completa actividades y gana puntos
              </p>
            </div>
            <svg
              className="w-5 h-5 text-gray-300 group-hover:text-[#113780] transition ml-auto flex-shrink-0"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 5l7 7-7 7"
              />
            </svg>
          </button>

          <button
            onClick={() => navigate("/badges")}
            className="w-full bg-white rounded-2xl shadow-md border border-gray-100 p-5 sm:p-6 text-left transition-all duration-200 hover:shadow-lg hover:-translate-y-0.5 group flex items-center gap-4"
          >
            <div className="w-12 h-12 rounded-xl bg-[#113780]/10 flex items-center justify-center text-2xl flex-shrink-0 group-hover:bg-[#113780]/15 transition">
              🏆
            </div>
            <div className="min-w-0">
              <h2 className="text-base sm:text-lg font-bold text-gray-900 group-hover:text-[#113780] transition">
                Insignias
              </h2>
              <p className="text-gray-500 text-sm">
                Obtén insignias y reconocimiento
              </p>
            </div>
            <svg
              className="w-5 h-5 text-gray-300 group-hover:text-[#113780] transition ml-auto flex-shrink-0"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 5l7 7-7 7"
              />
            </svg>
          </button>

          <button
            onClick={() => navigate("/profile")}
            className="w-full bg-white rounded-2xl shadow-md border border-gray-100 p-5 sm:p-6 text-left transition-all duration-200 hover:shadow-lg hover:-translate-y-0.5 group flex items-center gap-4"
          >
            <div className="w-12 h-12 rounded-xl bg-[#113780]/10 flex items-center justify-center text-2xl flex-shrink-0 group-hover:bg-[#113780]/15 transition">
              👤
            </div>
            <div className="min-w-0">
              <h2 className="text-base sm:text-lg font-bold text-gray-900 group-hover:text-[#113780] transition">
                Perfil
              </h2>
              <p className="text-gray-500 text-sm">
                Gestiona tu información personal
              </p>
            </div>
            <svg
              className="w-5 h-5 text-gray-300 group-hover:text-[#113780] transition ml-auto flex-shrink-0"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 5l7 7-7 7"
              />
            </svg>
          </button>

          <button
            onClick={() => navigate("/suggestions")}
            className="w-full bg-white rounded-2xl shadow-md border border-gray-100 p-5 sm:p-6 text-left transition-all duration-200 hover:shadow-lg hover:-translate-y-0.5 group flex items-center gap-4"
          >
            <div className="w-12 h-12 rounded-xl bg-[#113780]/10 flex items-center justify-center text-2xl flex-shrink-0 group-hover:bg-[#113780]/15 transition">
              📬
            </div>
            <div className="min-w-0">
              <h2 className="text-base sm:text-lg font-bold text-gray-900 group-hover:text-[#113780] transition">
                Buzón de sugerencias
              </h2>
              <p className="text-gray-500 text-sm">
                Envía tus sugerencias y comentarios
              </p>
            </div>
            <svg
              className="w-5 h-5 text-gray-300 group-hover:text-[#113780] transition ml-auto flex-shrink-0"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 5l7 7-7 7"
              />
            </svg>
          </button>
        </div>
      </main>
    </div>
  );
}
