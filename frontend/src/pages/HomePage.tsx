import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { usersAPI } from "../services/api";

interface User {
  id: string;
  employeeNumber: string;
  firstName: string;
  lastName: string;
  email: string;
  position: string;
  points: number;
  level: number;
}

export default function HomePage() {
  const [user, setUser] = useState<User | null>(null);
  const navigate = useNavigate();

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
        setUser({
          id: userDat._id || userId,
          employeeNumber: userDat.employeeNumber || "",
          firstName: userDat.firstName || "",
          lastName: userDat.lastName || "",
          email: userDat.email || "",
          position: userDat.position || "",
          points: userDat.points || 0,
          level: userDat.level || 1,
        });
      })
      .catch((error) => {
        console.error("Error loading user data:", error);
        // Fallback a datos locales
        const userData: User = {
          id: userId,
          employeeNumber: "",
          firstName: "",
          lastName: "",
          email: localStorage.getItem("userEmail") || "",
          position: "",
          points: 0,
          level: 1,
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
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8 py-3 sm:py-4 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 sm:gap-4">
          <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-[#113780] truncate">
            Hola, {user.firstName}
          </h1>
          <div className="flex items-center gap-4">
            <button
              onClick={handleLogout}
              className="bg-[#113780] hover:bg-[#0C2A5C] text-white px-3 sm:px-4 py-2 rounded-lg text-sm sm:text-base w-full sm:w-auto"
            >
              Cerrar Sesión
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8 py-4 sm:py-6 md:py-8">
        {/* Navigation Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
          <button
            onClick={() => navigate("/schedule")}
            className="bg-white rounded-lg shadow hover:shadow-lg p-4 sm:p-6 md:p-8 text-left transition group"
          >
            <div className="text-3xl sm:text-4xl mb-2 sm:mb-4">📅</div>
            <h2 className="text-lg sm:text-xl md:text-2xl font-bold text-gray-900 group-hover:text-[#113780]">
              Horario
            </h2>
            <p className="text-gray-600 mt-1 sm:mt-2 text-sm sm:text-base">
              Visualiza tu horario de clases y actividades
            </p>
          </button>

          <button
            onClick={() => navigate("/activities")}
            className="bg-white rounded-lg shadow hover:shadow-lg p-4 sm:p-6 md:p-8 text-left transition group"
          >
            <div className="text-3xl sm:text-4xl mb-2 sm:mb-4">✅</div>
            <h2 className="text-lg sm:text-xl md:text-2xl font-bold text-gray-900 group-hover:text-[#113780]">
              Actividades
            </h2>
            <p className="text-gray-600 mt-1 sm:mt-2 text-sm sm:text-base">
              Completa actividades y gana puntos
            </p>
          </button>

          <button
            onClick={() => navigate("/badges")}
            className="bg-white rounded-lg shadow hover:shadow-lg p-4 sm:p-6 md:p-8 text-left transition group"
          >
            <div className="text-3xl sm:text-4xl mb-2 sm:mb-4">🏆</div>
            <h2 className="text-lg sm:text-xl md:text-2xl font-bold text-gray-900 group-hover:text-[#113780]">
              Insignias
            </h2>
            <p className="text-gray-600 mt-1 sm:mt-2 text-sm sm:text-base">
              Obtén insignias y reconocimiento
            </p>
          </button>

          <button
            onClick={() => navigate("/profile")}
            className="bg-white rounded-lg shadow hover:shadow-lg p-4 sm:p-6 md:p-8 text-left transition group"
          >
            <div className="text-3xl sm:text-4xl mb-2 sm:mb-4">👤</div>
            <h2 className="text-lg sm:text-xl md:text-2xl font-bold text-gray-900 group-hover:text-[#113780]">
              Perfil
            </h2>
            <p className="text-gray-600 mt-1 sm:mt-2 text-sm sm:text-base">
              Gestiona tu información personal
            </p>
          </button>
        </div>
      </main>
    </div>
  );
}
