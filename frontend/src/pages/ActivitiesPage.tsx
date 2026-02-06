import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { usersAPI } from "../services/api";

interface Sticker {
  _id: string;
  name: string;
  description: string;
  icon?: string;
  imageUrl?: string;
  active: boolean;
}

interface SubActivity {
  _id: string;
  name: string;
  description: string;
  color: string;
  stickerId?: Sticker | string;
  active: boolean;
  order: number;
}

interface Activity {
  _id: string;
  name: string;
  description: string;
  color: string;
  stickerId?: Sticker | string;
  subActivities: SubActivity[];
  active: boolean;
}

interface SubActivitySchedule {
  subActivityId: SubActivity;
  startTime: string;
  endTime: string;
}

interface Schedule {
  _id: string;
  title: string;
  date: string;
  startTime: string;
  endTime: string;
  activityId: Activity;
  subActivitySchedules: SubActivitySchedule[];
}

interface Group {
  _id: string;
  name: string;
  shift: string;
  scheduleId?: Schedule;
}

// Helper para obtener el icono/imagen del sticker
const getStickerDisplay = (
  stickerId?: Sticker | string,
  defaultIcon: string = "🎯",
) => {
  if (!stickerId || typeof stickerId === "string") {
    return { type: "emoji" as const, value: defaultIcon };
  }
  if (stickerId.imageUrl) {
    return { type: "image" as const, value: stickerId.imageUrl };
  }
  if (stickerId.icon) {
    return { type: "emoji" as const, value: stickerId.icon };
  }
  return { type: "emoji" as const, value: defaultIcon };
};

// Componente para mostrar el sticker
const StickerIcon = ({
  stickerId,
  defaultIcon = "🎯",
  className = "text-4xl",
  imgClassName = "",
}: {
  stickerId?: Sticker | string;
  defaultIcon?: string;
  className?: string;
  imgClassName?: string;
}) => {
  const display = getStickerDisplay(stickerId, defaultIcon);
  if (display.type === "image") {
    return (
      <img
        src={display.value}
        alt="sticker"
        className={`object-contain ${imgClassName || (className.includes("text-5xl") ? "w-16 h-16" : "w-10 h-10")}`}
      />
    );
  }
  return <span className={className}>{display.value}</span>;
};

export default function ActivitiesPage() {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [userGroup, setUserGroup] = useState<Group | null>(null);
  const [userSchedule, setUserSchedule] = useState<Schedule | null>(null);
  const [completedSubActivityIds, setCompletedSubActivityIds] = useState<
    string[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem("token");
    const userId = localStorage.getItem("userId");

    if (!token || !userId) {
      navigate("/login");
      return;
    }

    loadUserActivities();
  }, [navigate]);

  const loadUserActivities = async () => {
    try {
      setLoading(true);
      setError("");

      // Obtener perfil del usuario con su grupo y schedule
      const profileResponse = await usersAPI.getProfile();
      const userData = profileResponse.data;

      // Obtener subactividades completadas
      try {
        const completedResponse = await usersAPI.getCompletedSubActivities();
        setCompletedSubActivityIds(completedResponse.data || []);
      } catch (err) {
        console.log("No completed subactivities found");
      }

      if (userData.group && userData.schedule) {
        setUserGroup(userData.group);
        setUserSchedule(userData.schedule);

        // Si el schedule tiene una actividad asignada, mostrar solo esa
        if (userData.schedule.activityId) {
          const activity = userData.schedule.activityId;
          setActivities([activity]);
        } else {
          setActivities([]);
        }
      } else {
        // Si el usuario no tiene grupo asignado, mostrar mensaje
        setActivities([]);
        setError("No tienes un grupo asignado. Contacta al administrador.");
      }
    } catch (err) {
      console.error("Error loading user activities:", err);
      setError("Error cargando las actividades");
    } finally {
      setLoading(false);
    }
  };

  const handleActivityClick = (activity: Activity) => {
    navigate(`/activities/${activity._id}`);
  };

  const calculateProgress = (activity: Activity) => {
    if (!activity.subActivities || activity.subActivities.length === 0) {
      return 0;
    }
    // Calcular progreso real basado en subactividades completadas
    const totalSubActivities = activity.subActivities.length;
    const completedCount = activity.subActivities.filter((sub) =>
      completedSubActivityIds.includes(sub._id),
    ).length;

    return totalSubActivities > 0
      ? Math.round((completedCount / totalSubActivities) * 100)
      : 0;
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#113780] mx-auto mb-4"></div>
          <p className="text-lg text-gray-600">Cargando actividades...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="text-center">
          <p className="text-lg text-red-600 mb-4">{error}</p>
          <button
            onClick={loadUserActivities}
            className="bg-[#113780] hover:bg-[#0C2A5C] text-white px-6 py-2 rounded-lg"
          >
            Reintentar
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-3 sm:p-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6 sm:mb-8">
          <div>
            <h1 className="text-2xl sm:text-4xl font-bold text-gray-800 mb-1 sm:mb-2">
              🎮 Actividades
            </h1>
            <p className="text-sm sm:text-base text-gray-600">
              Explora las actividades y completa desafíos para ganar puntos e
              insignias
            </p>
          </div>
          <button
            onClick={() => navigate("/")}
            className="text-[#113780] hover:text-[#0C2A5C] font-semibold flex items-center gap-2 text-sm sm:text-base self-start sm:self-auto"
          >
            ← Volver
          </button>
        </div>

        {/* Información del Grupo y Horario */}
        {userGroup && userSchedule && (
          <div className="bg-white rounded-xl shadow-md p-3 sm:p-4 mb-4 sm:mb-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
              <div className="flex items-center gap-3 sm:gap-4">
                <div className="bg-[#113780]/10 rounded-full p-2 sm:p-3 flex-shrink-0">
                  <span className="text-xl sm:text-2xl">👥</span>
                </div>
                <div className="min-w-0">
                  <p className="text-xs sm:text-sm text-gray-500">Tu Grupo</p>
                  <p className="text-base sm:text-lg font-bold text-gray-800 truncate">
                    {userGroup.name}
                  </p>
                  <p className="text-xs sm:text-sm text-[#113780]">
                    {userGroup.shift}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3 sm:gap-4">
                <div className="bg-green-100 rounded-full p-2 sm:p-3 flex-shrink-0">
                  <span className="text-xl sm:text-2xl">📅</span>
                </div>
                <div className="min-w-0">
                  <p className="text-xs sm:text-sm text-gray-500">Tu Horario</p>
                  <p className="text-base sm:text-lg font-bold text-gray-800 truncate">
                    {userSchedule.title}
                  </p>
                  <p className="text-xs sm:text-sm text-green-600">
                    {new Date(userSchedule.date).toLocaleDateString("es-CR")} •{" "}
                    {userSchedule.startTime} - {userSchedule.endTime}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Activities Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {activities.map((activity) => {
            const progress = calculateProgress(activity);
            return (
              <div
                key={activity._id}
                onClick={() => handleActivityClick(activity)}
                className="bg-white rounded-xl sm:rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 cursor-pointer transform hover:-translate-y-2 overflow-hidden group"
              >
                {/* Card Header con gradiente */}
                <div
                  className={`bg-gradient-to-r ${activity.color || "from-[#113780] to-[#0C2A5C]"} p-4 sm:p-6`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <StickerIcon
                      stickerId={activity.stickerId}
                      defaultIcon="🏢"
                      className="text-4xl sm:text-5xl"
                      imgClassName="w-12 h-12 sm:w-16 sm:h-16"
                    />
                    <div className="bg-white/20 rounded-full px-3 py-1 sm:px-4 sm:py-2 text-white text-xs sm:text-sm font-semibold whitespace-nowrap">
                      {activity.subActivities?.length || 0} sub-actividades
                    </div>
                  </div>
                </div>

                {/* Card Body */}
                <div className="p-4 sm:p-6">
                  <h3 className="text-xl sm:text-2xl font-bold text-gray-800 mb-2 group-hover:text-[#113780] transition-colors">
                    {activity.name}
                  </h3>
                  <p className="text-gray-600 mb-4 line-clamp-2 text-sm sm:text-base">
                    {activity.description}
                  </p>

                  {/* Progress Bar */}
                  <div className="mb-4">
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-gray-500">Progreso</span>
                      <span className="font-semibold text-[#113780]">
                        {progress}%
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2.5">
                      <div
                        className={`bg-gradient-to-r ${activity.color || "from-[#113780] to-[#0C2A5C]"} h-2.5 rounded-full transition-all duration-500`}
                        style={{ width: `${progress}%` }}
                      ></div>
                    </div>
                  </div>

                  {/* Footer */}
                  <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                    <div className="flex items-center gap-2 text-gray-500 text-sm">
                      <span>🏆</span>
                      <span>Insignias disponibles</span>
                    </div>
                    <span className="text-[#113780] font-semibold group-hover:translate-x-1 transition-transform flex items-center gap-1">
                      Explorar
                      <svg
                        className="w-4 h-4"
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
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Empty State */}
        {activities.length === 0 && (
          <div className="text-center py-16">
            <div className="text-6xl mb-4">📭</div>
            <h3 className="text-xl font-semibold text-gray-700 mb-2">
              No hay actividades disponibles
            </h3>
            <p className="text-gray-500">
              Las actividades aparecerán aquí cuando estén disponibles.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
