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

const getShiftLabel = (shift?: string | null) => {
  if (shift === "Morning") return "Mañana";
  if (shift === "Afternoon") return "Tarde";
  return shift || "";
};

const IT_EXPERIENCE_BADGE_ID = "69823bf0d6bd58d3ea14ba91";

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

const activityGradientMap: Record<string, string> = {
  "from-indigo-600 to-purple-600": "from-indigo-600 to-purple-600",
  "from-blue-500 to-blue-600": "from-blue-500 to-blue-600",
  "from-purple-500 to-purple-600": "from-purple-500 to-purple-600",
  "from-green-500 to-green-600": "from-green-500 to-green-600",
  "from-orange-500 to-orange-600": "from-orange-500 to-orange-600",
  "from-indigo-500 to-indigo-600": "from-indigo-500 to-indigo-600",
  "from-pink-500 to-pink-600": "from-pink-500 to-pink-600",
  "from-gray-500 to-gray-600": "from-gray-500 to-gray-600",
};

const getActivityGradient = (color?: string) =>
  activityGradientMap[color || ""] || "from-[#113780] to-[#0C2A5C]";

export default function ActivitiesPage() {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [userGroup, setUserGroup] = useState<Group | null>(null);
  const [completedSubActivityIds, setCompletedSubActivityIds] = useState<
    string[]
  >([]);
  const [finalSurveysMap, setFinalSurveysMap] = useState<
    Record<string, { submittedAt: string }>
  >({});
  const [earnedStickerIds, setEarnedStickerIds] = useState<string[]>([]);
  const [activityProgressMap, setActivityProgressMap] = useState<
    Record<
      string,
      {
        completed: boolean;
        completedAt?: string;
        completedSubActivities?: number;
        totalSubActivities?: number;
      }
    >
  >({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [noGroupAssigned, setNoGroupAssigned] = useState(false);
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
      setNoGroupAssigned(false);

      // Obtener perfil del usuario con su grupo y schedule
      const profileResponse = await usersAPI.getProfile();
      const userData = profileResponse.data;

      // Obtener subactividades completadas
      try {
        const completedResponse = await usersAPI.getCompletedSubActivities();
        setCompletedSubActivityIds(completedResponse.data || []);
      } catch (err) {
        // Silenciar - sin data
      }

      const surveysMap: Record<string, { submittedAt: string }> = {};
      (userData.finalSurveys || []).forEach((survey: any) => {
        if (survey.activityId) {
          surveysMap[survey.activityId] = survey;
        }
      });
      setFinalSurveysMap(surveysMap);
      setEarnedStickerIds(userData.earnedStickers || []);

      const progressMap: Record<string, any> = {};
      (userData.activityProgress || []).forEach((progress: any) => {
        if (progress.activityId) {
          progressMap[progress.activityId] = progress;
        }
      });
      setActivityProgressMap(progressMap);

      if (userData.group && userData.schedule) {
        setUserGroup(userData.group);

        // Si el schedule tiene una actividad asignada, mostrar solo esa
        if (userData.schedule.activityId) {
          const activity = userData.schedule.activityId;
          setActivities([activity]);
        } else {
          setActivities([]);
        }
      } else {
        setUserGroup(null);
        // Si el usuario no tiene grupo asignado, mostrar mensaje
        setActivities([]);
        setError("No tienes un grupo asignado");
        setNoGroupAssigned(true);
      }
    } catch (err) {
      console.error("Error loading user activities:", err);
      setError("Error cargando las actividades");
      setNoGroupAssigned(false);
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
      <div className="flex justify-center items-center min-h-screen bg-gradient-to-br from-gray-50 to-blue-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#113780] mx-auto mb-4"></div>
          <p className="text-lg text-gray-600">Cargando actividades...</p>
        </div>
      </div>
    );
  }

  if (error) {
    const handleErrorAction = () => {
      if (noGroupAssigned) {
        navigate("/home");
        return;
      }
      loadUserActivities();
    };

    return (
      <div className="flex justify-center items-center min-h-screen bg-gradient-to-br from-gray-50 to-blue-50">
        <div className="text-center">
          <p className="text-lg text-red-600 mb-4">{error}</p>
          <button
            onClick={handleErrorAction}
            className="bg-[#113780] hover:bg-[#0C2A5C] text-white px-6 py-2 rounded-lg"
          >
            {noGroupAssigned ? "Volver al menu principal" : "Reintentar"}
          </button>
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
              Actividades
            </h1>
            <button
              onClick={() => navigate("/")}
              className="bg-white/15 hover:bg-white/25 text-white px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200"
            >
              ← Volver
            </button>
          </div>
          <p className="text-blue-200 text-sm">
            Explora las actividades y completa desafíos para ganar puntos e
            insignias
          </p>
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-2xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8 -mt-12 pb-8 relative z-20">
        {/* Información del Grupo */}
        {userGroup && (
          <div className="bg-white rounded-2xl shadow-md border border-gray-100 p-4 sm:p-5 mb-4 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-[#113780]/10 flex items-center justify-center text-xl flex-shrink-0">
              👥
            </div>
            <div className="min-w-0">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                Tu Grupo
              </p>
              <p className="text-base sm:text-lg font-bold text-gray-900 truncate">
                {userGroup.name}
              </p>
              <p className="text-xs sm:text-sm text-[#113780]">
                {getShiftLabel(userGroup.shift)}
              </p>
            </div>
          </div>
        )}

        {/* Activities Grid */}
        <div className="space-y-4">
          {activities.map((activity) => {
            const progress = calculateProgress(activity);
            const gradientClasses = getActivityGradient(activity.color);
            const totalSubActivities = activity.subActivities?.length || 0;
            const completedSessions = activity.subActivities
              ? activity.subActivities.filter((sub) =>
                  completedSubActivityIds.includes(sub._id),
                ).length
              : 0;
            const allSessionsComplete =
              totalSubActivities > 0 &&
              completedSessions === totalSubActivities;
            const surveyDone = Boolean(finalSurveysMap[activity._id]);
            const activityStickerId =
              typeof activity.stickerId === "string"
                ? activity.stickerId
                : activity.stickerId?._id;
            const requiredBadgeId = activityStickerId || IT_EXPERIENCE_BADGE_ID;
            const badgeEarned = requiredBadgeId
              ? earnedStickerIds.includes(requiredBadgeId)
              : false;
            const fullyCompleted =
              Boolean(activityProgressMap[activity._id]?.completed) ||
              (allSessionsComplete && surveyDone && badgeEarned);
            return (
              <div
                key={activity._id}
                onClick={() => handleActivityClick(activity)}
                className="bg-white rounded-2xl shadow-md border border-gray-100 overflow-hidden cursor-pointer transition-all duration-200 hover:shadow-lg hover:-translate-y-0.5 group"
              >
                {/* Card Header con gradiente */}
                <div
                  className={`bg-gradient-to-r ${gradientClasses} p-4 sm:p-6`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <StickerIcon
                      stickerId={activity.stickerId}
                      defaultIcon="🏢"
                      className="text-4xl sm:text-5xl"
                      imgClassName="w-12 h-12 sm:w-16 sm:h-16"
                    />
                    <div className="bg-white/20 rounded-lg px-3 py-1.5 text-white text-xs sm:text-sm font-semibold whitespace-nowrap">
                      {activity.subActivities?.length || 0} Sesiones
                    </div>
                  </div>
                </div>

                {/* Card Body */}
                <div className="p-4 sm:p-6">
                  <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-2 group-hover:text-[#113780] transition-colors">
                    {activity.name}
                  </h3>
                  <p className="text-gray-500 mb-4 line-clamp-2 text-sm">
                    {activity.description}
                  </p>

                  {fullyCompleted && (
                    <div className="mb-4 rounded-2xl bg-emerald-50 text-emerald-700 px-4 py-2 text-sm font-semibold flex items-center gap-2">
                      <span>🎉</span>
                      <span>Actividad completada</span>
                    </div>
                  )}

                  {!fullyCompleted && allSessionsComplete && !surveyDone && (
                    <div className="mb-4 rounded-2xl bg-orange-50 text-orange-700 px-4 py-2 text-sm font-semibold flex items-center gap-2">
                      <span>📝</span>
                      <span>Responde la encuesta final para concluir</span>
                    </div>
                  )}

                  {/* Progress Bar */}
                  <div className="mb-4">
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-gray-400">Progreso</span>
                      <span className="font-semibold text-[#113780]">
                        {progress}%
                      </span>
                    </div>
                    <div className="w-full bg-gray-100 rounded-full h-2">
                      <div
                        className={`bg-gradient-to-r ${gradientClasses} h-2 rounded-full transition-all duration-500`}
                        style={{ width: `${progress}%` }}
                      ></div>
                    </div>
                  </div>

                  {/* Footer */}
                  <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                    <div
                      className={`flex items-center gap-2 text-sm ${fullyCompleted ? "text-emerald-600 font-semibold" : allSessionsComplete && !surveyDone ? "text-orange-500 font-semibold" : "text-gray-400"}`}
                    >
                      <span>
                        {fullyCompleted
                          ? "🏁"
                          : allSessionsComplete && !surveyDone
                            ? "📝"
                            : "🏆"}
                      </span>
                      <span>
                        {fullyCompleted
                          ? "Actividad completada"
                          : allSessionsComplete && !surveyDone
                            ? "Encuesta final pendiente"
                            : "Insignias disponibles"}
                      </span>
                    </div>
                    <span
                      className={`${fullyCompleted ? "text-emerald-600" : "text-[#113780]"} font-semibold group-hover:translate-x-1 transition-transform flex items-center gap-1 text-sm`}
                    >
                      {fullyCompleted ? "Ver detalles" : "Explorar"}
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
          <div className="bg-white rounded-2xl shadow-md border border-gray-100 p-12 text-center">
            <div className="text-5xl mb-4">📭</div>
            <h3 className="text-lg font-semibold text-gray-700 mb-2">
              No hay actividades disponibles
            </h3>
            <p className="text-gray-400 text-sm">
              Las actividades aparecerán aquí cuando estén disponibles.
            </p>
          </div>
        )}
      </main>
    </div>
  );
}
