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
  position?: string;
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
          console.log("Profile data received:", data);

          const userData: User = {
            id: userId,
            employeeNumber: data.employeeNumber || "",
            firstName: data.firstName || "",
            lastName: data.lastName || "",
            email: data.email || userEmail || "",
            position: data.position || "",
            group: data.group || undefined,
            schedule: data.schedule || undefined,
            hobbies: data.hobbies || [],
            points: data.progress?.stickerCount || 0,
            level: 1,
          };
          console.log("Setting user state:", userData);
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
            position: "",
            group: "",
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
      const response = await usersAPI.updateProfile({
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

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8 py-3 sm:py-4 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 sm:gap-4">
          <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-[#113780]">
            Mi Perfil
          </h1>
          <button
            onClick={() => navigate("/home")}
            className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 sm:px-4 py-2 rounded-lg text-sm sm:text-base self-start sm:self-auto"
          >
            ← Volver
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-2xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8 py-4 sm:py-6 md:py-8">
        <div className="bg-white rounded-lg shadow p-4 sm:p-6 md:p-8">
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-4 sm:mb-6 md:mb-8">
            Mi Perfil
          </h2>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-600 text-sm mb-6">
              {error}
            </div>
          )}

          {success && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-green-600 text-sm mb-6">
              {success}
            </div>
          )}

          {!isEditing ? (
            <div className="space-y-4 sm:space-y-6">
              {/* Employee Number Card */}
              <div className="bg-orange-50 rounded-lg p-3 sm:p-4">
                <p className="text-gray-600 text-xs sm:text-sm mb-1 sm:mb-2">
                  Número de Empleado
                </p>
                <p className="text-xl sm:text-2xl font-bold text-orange-600">
                  {user.employeeNumber || "N/A"}
                </p>
              </div>

              {/* User Info Table */}
              <div className="border-t pt-4 sm:pt-6">
                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 pb-4 border-b">
                    <div>
                      <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
                        Nombre
                      </label>
                      <p className="text-base sm:text-lg font-medium text-gray-900">
                        {user.firstName}
                      </p>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
                        Apellido
                      </label>
                      <p className="text-base sm:text-lg font-medium text-gray-900">
                        {user.lastName}
                      </p>
                    </div>
                  </div>

                  <div className="pb-4 border-b">
                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                      Correo Electrónico
                    </label>
                    <p className="text-base sm:text-lg font-medium text-gray-900 break-all">
                      {user.email}
                    </p>
                  </div>

                  {user.group && (
                    <div className="pb-4 border-b">
                      <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                        Grupo Asignado
                      </label>
                      <div className="bg-[#113780]/10 rounded-lg p-3 sm:p-4">
                        <div className="flex items-center gap-2 sm:gap-3 mb-2">
                          <span className="text-xl sm:text-2xl">👥</span>
                          <div className="min-w-0">
                            <p className="text-base sm:text-lg font-bold text-[#113780] truncate">
                              {user.group.name}
                            </p>
                            {user.group.description && (
                              <p className="text-xs sm:text-sm text-gray-600">
                                {user.group.description}
                              </p>
                            )}
                          </div>
                        </div>
                        <div className="flex flex-wrap gap-2 sm:gap-4 text-xs sm:text-sm text-gray-600">
                          <span className="bg-white px-2 sm:px-3 py-1 rounded-full">
                            🌅{" "}
                            {user.group.shift === "Morning"
                              ? "Mañana"
                              : "Tarde"}
                          </span>
                          <span className="bg-white px-2 sm:px-3 py-1 rounded-full">
                            👤 Capacidad: {user.group.capacityMax}
                          </span>
                        </div>
                      </div>
                    </div>
                  )}

                  {user.schedule && (
                    <div className="pb-4 border-b">
                      <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                        Cronograma Asignado
                      </label>
                      <div className="bg-gradient-to-r from-[#113780] to-[#0C2A5C] rounded-lg p-3 sm:p-4 text-white">
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-3">
                          <h4 className="font-bold text-base sm:text-lg">
                            {user.schedule.title}
                          </h4>
                          <span className="bg-white/20 px-2 sm:px-3 py-1 rounded-full text-xs sm:text-sm self-start sm:self-auto">
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
                        <div className="flex items-center gap-2 mb-3 sm:mb-4 text-red-100 text-sm sm:text-base">
                          <span>🕐</span>
                          <span>
                            {formatTime(user.schedule.startTime)} -{" "}
                            {formatTime(user.schedule.endTime)}
                          </span>
                        </div>
                        {user.schedule.subActivitySchedules &&
                          user.schedule.subActivitySchedules.length > 0 && (
                            <div className="bg-white/10 rounded-lg p-3">
                              <p className="text-sm text-red-100 mb-2">
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
                                      <span className="text-red-200">
                                        {formatTime(sub.startTime)}
                                      </span>
                                    </div>
                                  ))}
                                {user.schedule.subActivitySchedules.length >
                                  3 && (
                                  <p className="text-xs text-red-200 mt-1">
                                    +{" "}
                                    {user.schedule.subActivitySchedules.length -
                                      3}{" "}
                                    más...
                                  </p>
                                )}
                              </div>
                            </div>
                          )}
                      </div>
                    </div>
                  )}

                  <div className="pb-4">
                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                      Hobbies
                    </label>
                    {user.hobbies && user.hobbies.length > 0 ? (
                      <div className="flex flex-wrap gap-2">
                        {user.hobbies.map((hobby, idx) => (
                          <span
                            key={idx}
                            className="inline-block bg-[#113780]/10 text-[#113780] text-sm font-medium px-3 py-1 rounded-full"
                          >
                            {hobby}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <p className="text-gray-500 italic">
                        No hay hobbies agregados
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="border-t pt-6 flex gap-4">
                <button
                  onClick={() => {
                    setIsEditing(true);
                    setHobbies(user.hobbies || []);
                  }}
                  className="bg-[#113780] hover:bg-[#0C2A5C] text-white px-6 py-2 rounded-lg font-semibold transition"
                >
                  Editar Perfil
                </button>
                <button
                  onClick={handleLogout}
                  className="bg-gray-600 hover:bg-gray-700 text-white px-6 py-2 rounded-lg font-semibold transition"
                >
                  Cerrar Sesión
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSaveProfile} className="space-y-6">
              {/* Email */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Correo Electrónico
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#113780] focus:border-transparent outline-none transition"
                  required
                />
              </div>

              {/* Hobbies */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
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
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#113780] focus:border-transparent outline-none transition"
                    placeholder="Escribe un hobby y presiona Enter"
                  />
                  <button
                    type="button"
                    onClick={handleAddHobby}
                    className="bg-[#113780] hover:bg-[#0C2A5C] text-white px-4 py-2 rounded-lg font-semibold transition"
                  >
                    Agregar
                  </button>
                </div>

                {hobbies.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {hobbies.map((hobby, idx) => (
                      <span
                        key={idx}
                        className="inline-flex items-center gap-2 bg-[#113780]/10 text-[#113780] text-sm font-medium px-3 py-1 rounded-full"
                      >
                        {hobby}
                        <button
                          type="button"
                          onClick={() => handleRemoveHobby(hobby)}
                          className="ml-1 hover:text-indigo-900 font-bold"
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Buttons */}
              <div className="border-t pt-6 flex gap-4">
                <button
                  type="submit"
                  disabled={loading}
                  className="bg-[#113780] hover:bg-[#0C2A5C] text-white px-6 py-2 rounded-lg font-semibold transition disabled:opacity-50"
                >
                  {loading ? "Guardando..." : "Guardar Cambios"}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIsEditing(false);
                    setEmail(user.email);
                    setHobbies(user.hobbies || []);
                    setHobbyInput("");
                  }}
                  className="bg-gray-200 hover:bg-gray-300 text-gray-700 px-6 py-2 rounded-lg font-semibold transition"
                >
                  Cancelar
                </button>
              </div>
            </form>
          )}
        </div>
      </main>
    </div>
  );
}
