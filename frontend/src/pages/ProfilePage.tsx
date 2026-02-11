import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { usersAPI } from "../services/api";

interface SubActivitySchedule {
  _id: string;
  subActivityId: string;
  name: string;
  startTime: string;
  endTime: string;
  order: number;
}

interface Schedule {
  _id: string;
  title: string;
  date: string;
  startTime: string;
  endTime: string;
  subActivitySchedules: SubActivitySchedule[];
  activityId?: {
    _id: string;
    name: string;
    description: string;
    color: string;
  };
}

interface Group {
  _id: string;
  name: string;
  description?: string;
  shift: string;
  capacityMax: number;
}

interface User {
  id: string;
  employeeNumber: string;
  firstName: string;
  lastName: string;
  email: string;
  direction?: string;
  group?: Group;
  schedule?: Schedule;
  hobbies?: string[];
  points: number;
  level: number;
}

export default function ProfilePage() {
  const [user, setUser] = useState<User | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [email, setEmail] = useState("");
  const [hobbies, setHobbies] = useState<string[]>([]);
  const [hobbyInput, setHobbyInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const navigate = useNavigate();

  const formatTime = (time: string) => {
    const [hours, minutes] = time.split(":");
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? "PM" : "AM";
    const hour12 = hour % 12 || 12;
    return `${hour12}:${minutes} ${ampm}`;
  };

  useEffect(() => {
    const token = localStorage.getItem("token");
    const userId = localStorage.getItem("userId");
    const userEmail = localStorage.getItem("userEmail");

    if (!token || !userId) {
      navigate("/login");
    } else {
      // Fetch user profile from backend
      usersAPI
        .getProfile()
        .then((response) => {
          // response.data contiene la data del servidor
          const data = response.data;
          // Profile data received

          const userData: User = {
            id: userId,
            employeeNumber: data.employeeNumber || "",
            firstName: data.firstName || "",
            lastName: data.lastName || "",
            email: data.email || userEmail || "",
            direction: data.direction || "",
            group: data.group || undefined,
            schedule: data.schedule || undefined,
            hobbies: data.hobbies || [],
            points: data.progress?.stickerCount || 0,
            level: 1,
          };
          // User state set
          setUser(userData);
          setEmail(data.email || userEmail || "");
          setHobbies(data.hobbies || []);
        })
        .catch((err) => {
          console.error("Error fetching profile:", err);
          // Fallback to localStorage data
          const userData: User = {
            id: userId,
            employeeNumber: "",
            firstName: "",
            lastName: "",
            email: userEmail || "",
            direction: "",
            group: {} as Group,
            hobbies: [],
            points: 0,
            level: 1,
          };
          setUser(userData);
          setEmail(userEmail || "");
        });
    }
  }, [navigate]);

  const handleAddHobby = () => {
    if (hobbyInput.trim() && !hobbies.includes(hobbyInput.trim())) {
      setHobbies([...hobbies, hobbyInput.trim()]);
      setHobbyInput("");
    }
  };

  const handleRemoveHobby = (hobbyToRemove: string) => {
    setHobbies(hobbies.filter((h) => h !== hobbyToRemove));
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");

    try {
      await usersAPI.updateProfile({
        email,
        hobbies,
      });

      const updatedUser = { ...user, email, hobbies } as User;
      setUser(updatedUser);
      localStorage.setItem("userEmail", email);
      setSuccess("Perfil actualizado exitosamente");
      setIsEditing(false);

      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      const error = err as { response?: { data?: { message?: string } } };
      setError(
        error.response?.data?.message || "Error al actualizar el perfil",
      );
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("userId");
    localStorage.removeItem("userEmail");
    navigate("/login");
  };

  if (!user) {
    return <div className="text-center mt-8">Cargando...</div>;
  }

  const initials =
    `${user.firstName?.charAt(0) || ""}${user.lastName?.charAt(0) || ""}`.toUpperCase();

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-[#113780] to-[#0C2A5C]">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 pt-5 pb-16">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-lg sm:text-xl font-semibold text-white">
              Mi Perfil
            </h1>
            <button
              onClick={() => navigate("/home")}
              className="bg-white/15 hover:bg-white/25 text-white px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200"
            >
              ← Volver
            </button>
          </div>

          {/* Avatar + Name */}
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-white/20 border border-white/30 flex items-center justify-center text-white text-lg sm:text-xl font-bold">
              {initials}
            </div>
            <div className="text-white">
              <h2 className="text-lg sm:text-xl font-semibold">
                {user.firstName} {user.lastName}
              </h2>
              <p className="text-blue-100 text-sm">{user.email}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content — overlaps the hero */}
      <main className="max-w-2xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8 -mt-12 pb-8 relative z-20">
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-red-600 text-sm mb-4 shadow-sm">
            {error}
          </div>
        )}
        {success && (
          <div className="bg-green-50 border border-green-200 rounded-xl p-4 text-green-600 text-sm mb-4 shadow-sm">
            {success}
          </div>
        )}

        {!isEditing ? (
          <div className="space-y-4">
            {/* Employee Number Badge */}
            <div className="bg-white rounded-2xl shadow-md border border-gray-100 p-4 sm:p-5 flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-orange-400 to-orange-500 flex items-center justify-center text-white text-xl shadow-sm">
                🪪
              </div>
              <div>
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                  Número de Empleado
                </p>
                <p className="text-xl sm:text-2xl font-bold text-gray-900">
                  {user.employeeNumber || "N/A"}
                </p>
              </div>
            </div>

            {/* Info Cards */}
            <div className="bg-white rounded-2xl shadow-md border border-gray-100 overflow-hidden">
              {/* Personal Info Section */}
              <div className="p-4 sm:p-6">
                <h3 className="text-xs font-bold text-[#113780] uppercase tracking-wider mb-4 flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#113780]"></span>
                  Información Personal
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="bg-gray-50 rounded-xl p-3">
                    <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">
                      Nombre
                    </label>
                    <p className="text-base sm:text-lg font-semibold text-gray-900">
                      {user.firstName}
                    </p>
                  </div>
                  <div className="bg-gray-50 rounded-xl p-3">
                    <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">
                      Apellido
                    </label>
                    <p className="text-base sm:text-lg font-semibold text-gray-900">
                      {user.lastName}
                    </p>
                  </div>
                </div>

                <div className="bg-gray-50 rounded-xl p-3 mt-3">
                  <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">
                    Correo Electrónico
                  </label>
                  <p className="text-base sm:text-lg font-semibold text-gray-900 break-all">
                    {user.email}
                  </p>
                </div>

                {user.direction && (
                  <div className="bg-gray-50 rounded-xl p-3 mt-3">
                    <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">
                      Dirección
                    </label>
                    <p className="text-base sm:text-lg font-semibold text-gray-900">
                      {user.direction}
                    </p>
                  </div>
                )}
              </div>

              {/* Group Section */}
              {user.group && (
                <div className="border-t border-gray-100 p-4 sm:p-6">
                  <h3 className="text-xs font-bold text-[#113780] uppercase tracking-wider mb-4 flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#113780]"></span>
                    Grupo Asignado
                  </h3>
                  <div className="bg-[#113780]/5 rounded-xl p-4 border border-[#113780]/10">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-[#113780] to-[#0C2A5C] flex items-center justify-center text-white text-lg shadow-sm">
                        👥
                      </div>
                      <div className="min-w-0">
                        <p className="text-base sm:text-lg font-bold text-gray-900 truncate">
                          {user.group.name}
                        </p>
                        {user.group.description && (
                          <p className="text-xs sm:text-sm text-gray-500">
                            {user.group.description}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-2 text-xs sm:text-sm">
                      <span className="bg-white px-3 py-1.5 rounded-lg text-gray-600 font-medium shadow-sm">
                        🌅 {user.group.shift === "Morning" ? "Mañana" : "Tarde"}
                      </span>
                      <span className="bg-white px-3 py-1.5 rounded-lg text-gray-600 font-medium shadow-sm">
                        👤 Capacidad: {user.group.capacityMax}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* Schedule Section */}
              {user.schedule && (
                <div className="border-t border-gray-100 p-4 sm:p-6">
                  <h3 className="text-xs font-bold text-[#113780] uppercase tracking-wider mb-4 flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#113780]"></span>
                    Cronograma Asignado
                  </h3>
                  <div className="bg-gradient-to-r from-[#113780] to-[#0C2A5C] rounded-xl p-4 text-white shadow-md">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-3">
                      <h4 className="font-bold text-base sm:text-lg">
                        {user.schedule.title}
                      </h4>
                      <span className="bg-white/20 px-3 py-1 rounded-lg text-xs sm:text-sm self-start sm:self-auto backdrop-blur-sm">
                        {new Date(user.schedule.date).toLocaleDateString(
                          "es-CR",
                          {
                            weekday: "short",
                            day: "numeric",
                            month: "short",
                          },
                        )}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 mb-3 sm:mb-4 text-blue-100 text-sm sm:text-base">
                      <span>🕐</span>
                      <span>
                        {formatTime(user.schedule.startTime)} -{" "}
                        {formatTime(user.schedule.endTime)}
                      </span>
                    </div>
                    {user.schedule.subActivitySchedules &&
                      user.schedule.subActivitySchedules.length > 0 && (
                        <div className="bg-white/10 backdrop-blur-sm rounded-lg p-3">
                          <p className="text-sm text-blue-100 mb-2">
                            📋 {user.schedule.subActivitySchedules.length}{" "}
                            actividades programadas
                          </p>
                          <div className="space-y-1">
                            {user.schedule.subActivitySchedules
                              .sort((a, b) => a.order - b.order)
                              .slice(0, 3)
                              .map((sub) => (
                                <div
                                  key={sub._id}
                                  className="flex justify-between text-sm"
                                >
                                  <span>{sub.name}</span>
                                  <span className="text-blue-200">
                                    {formatTime(sub.startTime)}
                                  </span>
                                </div>
                              ))}
                            {user.schedule.subActivitySchedules.length > 3 && (
                              <p className="text-xs text-blue-200 mt-1">
                                +{" "}
                                {user.schedule.subActivitySchedules.length - 3}{" "}
                                más...
                              </p>
                            )}
                          </div>
                        </div>
                      )}
                  </div>
                </div>
              )}

              {/* Hobbies Section */}
              <div className="border-t border-gray-100 p-4 sm:p-6">
                <h3 className="text-xs font-bold text-[#113780] uppercase tracking-wider mb-4 flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#113780]"></span>
                  Hobbies
                </h3>
                {user.hobbies && user.hobbies.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {user.hobbies.map((hobby, idx) => (
                      <span
                        key={idx}
                        className="inline-block bg-[#113780]/10 text-[#113780] text-sm font-semibold px-4 py-1.5 rounded-full border border-[#113780]/20"
                      >
                        {hobby}
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-400 italic text-sm">
                    No hay hobbies agregados
                  </p>
                )}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 pt-2">
              <button
                onClick={() => {
                  setIsEditing(true);
                  setHobbies(user.hobbies || []);
                }}
                className="flex-1 bg-[#113780] hover:bg-[#0C2A5C] text-white px-6 py-3 rounded-xl font-semibold transition-all duration-200 shadow-md hover:shadow-lg"
              >
                ✏️ Editar Perfil
              </button>
              <button
                onClick={handleLogout}
                className="bg-white hover:bg-gray-50 text-gray-600 px-6 py-3 rounded-xl font-semibold transition-all duration-200 shadow-md border border-gray-200"
              >
                Cerrar Sesión
              </button>
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-2xl shadow-md border border-gray-100 p-5 sm:p-8">
            <h3 className="text-lg font-bold text-gray-900 mb-6">
              Editar Perfil
            </h3>
            <form onSubmit={handleSaveProfile} className="space-y-6">
              {/* Email */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Correo Electrónico
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#113780] focus:border-transparent outline-none transition bg-gray-50 focus:bg-white"
                  required
                />
              </div>

              {/* Hobbies */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Hobbies
                </label>
                <div className="flex gap-2 mb-3">
                  <input
                    type="text"
                    value={hobbyInput}
                    onChange={(e) => setHobbyInput(e.target.value)}
                    onKeyPress={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        handleAddHobby();
                      }
                    }}
                    className="flex-1 px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#113780] focus:border-transparent outline-none transition bg-gray-50 focus:bg-white"
                    placeholder="Escribe un hobby y presiona Enter"
                  />
                  <button
                    type="button"
                    onClick={handleAddHobby}
                    className="bg-[#113780] hover:bg-[#0C2A5C] text-white px-5 py-3 rounded-xl font-semibold transition-all duration-200 shadow-sm"
                  >
                    Agregar
                  </button>
                </div>

                {hobbies.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {hobbies.map((hobby, idx) => (
                      <span
                        key={idx}
                        className="inline-flex items-center gap-2 bg-[#113780]/10 text-[#113780] text-sm font-semibold px-4 py-1.5 rounded-full border border-[#113780]/20"
                      >
                        {hobby}
                        <button
                          type="button"
                          onClick={() => handleRemoveHobby(hobby)}
                          className="ml-1 hover:text-[#0C2A5C] font-bold text-[#113780]/50"
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Buttons */}
              <div className="flex gap-3 pt-4">
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 bg-[#113780] hover:bg-[#0C2A5C] text-white px-6 py-3 rounded-xl font-semibold transition-all duration-200 disabled:opacity-50 shadow-md"
                >
                  {loading ? "Guardando..." : "💾 Guardar Cambios"}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIsEditing(false);
                    setEmail(user.email);
                    setHobbies(user.hobbies || []);
                    setHobbyInput("");
                  }}
                  className="bg-white hover:bg-gray-50 text-gray-600 px-6 py-3 rounded-xl font-semibold transition-all duration-200 shadow-md border border-gray-200"
                >
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        )}
      </main>
    </div>
  );
}
