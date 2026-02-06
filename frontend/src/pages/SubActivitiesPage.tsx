import { useState, useEffect, useCallback } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { activitiesAPI, usersAPI, awardsAPI } from "../services/api";
import QuestionModal from "../components/QuestionModal";
import CompletedModal from "../components/CompletedModal";

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
  progress?: number;
  completed?: boolean;
  startTime?: string;
  endTime?: string;
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
  _id: string;
  subActivityId: string;
  name: string;
  startTime: string;
  endTime: string;
  order: number;
}

interface Schedule {
  _id: string;
  activityId: Activity | string;
  title: string;
  date: string;
  startTime: string;
  endTime: string;
  subActivitySchedules: SubActivitySchedule[];
  order: number;
  active: boolean;
}

interface Group {
  _id: string;
  name: string;
  shift: string;
}

interface SubActivityWithStatus extends SubActivity {
  isUnlocked: boolean;
  isActive: boolean;
  isCompleted: boolean;
  earnedSticker?: Sticker | null;
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
        className={`object-contain ${imgClassName || (className.includes("text-5xl") ? "w-12 h-12" : "w-10 h-10")}`}
      />
    );
  }
  return <span className={className}>{display.value}</span>;
};

// Componente de candado para subactividades bloqueadas
const LockIcon = ({ className = "w-8 h-8" }: { className?: string }) => (
  <svg className={className} fill="currentColor" viewBox="0 0 24 24">
    <path d="M12 17a2 2 0 002-2v-2a2 2 0 00-4 0v2a2 2 0 002 2zm6-9h-1V6a5 5 0 00-10 0v2H6a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V10a2 2 0 00-2-2zm-9-2a3 3 0 116 0v2H9V6z" />
  </svg>
);

export default function SubActivitiesPage() {
  const { activityId } = useParams<{ activityId: string }>();
  const [activity, setActivity] = useState<Activity | null>(null);
  const [subActivities, setSubActivities] = useState<SubActivityWithStatus[]>(
    [],
  );
  const [userSchedule, setUserSchedule] = useState<Schedule | null>(null);
  const [userGroup, setUserGroup] = useState<Group | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedActivity, setSelectedActivity] =
    useState<SubActivityWithStatus | null>(null);
  const [completedSubActivityIds, setCompletedSubActivityIds] = useState<
    string[]
  >([]);

  // States for Awards/Questions
  const [showQuestionModal, setShowQuestionModal] = useState(false);
  const [showCompletedModal, setShowCompletedModal] = useState(false);
  const [currentAward, setCurrentAward] = useState<{
    _id: string;
    question: string;
    options: string[];
    stickerId?: Sticker;
  } | null>(null);
  const [answerResult, setAnswerResult] = useState<{
    isCorrect: boolean;
    pointsEarned: number;
    sticker: Sticker | null;
    explanation: string;
    alreadyCompleted?: boolean;
  } | null>(null);
  const [answeringLoading, setAnsweringLoading] = useState(false);
  const [awardsStatus, setAwardsStatus] = useState<
    Record<string, { hasAward: boolean; completed: boolean }>
  >({});
  // Referencia a la subactividad que está respondiendo (no se limpia al abrir modal de pregunta)
  const [answeringSubActivity, setAnsweringSubActivity] =
    useState<SubActivityWithStatus | null>(null);

  const navigate = useNavigate();

  // Función para verificar si estamos en el día correcto del schedule
  const isScheduleDay = useCallback((schedule: Schedule | null): boolean => {
    if (!schedule?.date) {
      return true; // Si no hay schedule, asumimos que es válido
    }

    const today = new Date();
    const scheduleDate = new Date(schedule.date);

    // Comparar solo año, mes y día
    return (
      today.getFullYear() === scheduleDate.getFullYear() &&
      today.getMonth() === scheduleDate.getMonth() &&
      today.getDate() === scheduleDate.getDate()
    );
  }, []);

  // Función para verificar si una subactividad está dentro de su horario
  const isWithinSchedule = useCallback(
    (subActivity: SubActivity, schedule: Schedule | null): boolean => {
      // Primero verificar si estamos en el día correcto
      if (!isScheduleDay(schedule)) {
        console.log(`No es el día del schedule para ${subActivity.name}`);
        return false;
      }

      // Si la subactividad no tiene horario específico, está disponible todo el día del schedule
      if (!subActivity.startTime || !subActivity.endTime) {
        console.log(
          `${subActivity.name} no tiene horario específico, disponible todo el día`,
        );
        return true;
      }

      const now = new Date();
      const currentTime = `${now.getHours().toString().padStart(2, "0")}:${now.getMinutes().toString().padStart(2, "0")}`;

      // Para la subactividad, solo verificamos que ya haya comenzado su horario
      // (no bloqueamos si ya pasó la hora de fin, para permitir completarla tarde)
      const hasStarted = currentTime >= subActivity.startTime;
      console.log(
        `${subActivity.name}: hora actual ${currentTime}, inicio ${subActivity.startTime}, ya inició: ${hasStarted}`,
      );

      return hasStarted;
    },
    [isScheduleDay],
  );

  // Función para determinar el estado de cada subactividad
  const calculateSubActivityStatus = useCallback(
    (
      subActivitiesData: SubActivity[],
      completedIds: string[],
      awardsStatusData: Record<
        string,
        { hasAward: boolean; completed: boolean }
      >,
      schedule: Schedule | null,
    ): SubActivityWithStatus[] => {
      let foundFirstUnlocked = false;

      // Verificar si es el día del schedule
      const isTodayScheduleDay = isScheduleDay(schedule);
      console.log(`¿Es hoy el día del schedule? ${isTodayScheduleDay}`);

      return subActivitiesData.map((sub, index) => {
        const isCompleted =
          completedIds.includes(sub._id) ||
          awardsStatusData[sub._id]?.completed;

        // La primera subactividad siempre puede estar desbloqueada si es el día del schedule
        // Las siguientes solo si la anterior está completada Y está en horario
        let isUnlocked = false;

        if (index === 0) {
          // Primera subactividad: desbloqueada si es el día del schedule y está en horario (o no tiene horario específico)
          isUnlocked = isWithinSchedule(sub, schedule);
        } else {
          // Verificar si la subactividad anterior está completada
          const previousSub = subActivitiesData[index - 1];
          const previousCompleted =
            completedIds.includes(previousSub._id) ||
            awardsStatusData[previousSub._id]?.completed;
          isUnlocked = previousCompleted && isWithinSchedule(sub, schedule);
        }

        // Una subactividad completada siempre está "desbloqueada"
        if (isCompleted) {
          isUnlocked = true;
        }

        // Solo la primera subactividad desbloqueada y no completada está "activa"
        let isActive = false;
        if (isUnlocked && !isCompleted && !foundFirstUnlocked) {
          isActive = true;
          foundFirstUnlocked = true;
        }

        return {
          ...sub,
          isUnlocked,
          isActive,
          isCompleted,
          completed: isCompleted,
          progress: isCompleted ? 100 : isActive ? 50 : 0,
        };
      });
    },
    [isWithinSchedule, isScheduleDay],
  );

  const loadActivityData = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      // Primero obtenemos el perfil del usuario para obtener su schedule
      const profileResponse = await usersAPI.getProfile();
      const userData = profileResponse.data;

      if (userData.group) {
        setUserGroup(userData.group);
      }

      if (userData.schedule) {
        setUserSchedule(userData.schedule);
      }

      // Obtener subactividades completadas del usuario
      let completedIds: string[] = [];
      try {
        const completedResponse = await usersAPI.getCompletedSubActivities();
        completedIds = completedResponse.data || [];
        setCompletedSubActivityIds(completedIds);
      } catch (err) {
        console.log("No completed subactivities found");
      }

      // Obtener la actividad
      const response = await activitiesAPI.getActivity(activityId!);
      const activityData = response.data;
      setActivity(activityData);

      // Combinar subactividades con horarios del schedule del usuario
      const subActivitiesWithSchedule = activityData.subActivities.map(
        (sub: SubActivity) => {
          // Buscar el horario de esta subactividad en el schedule del usuario
          let scheduleInfo = null;
          if (userData.schedule?.subActivitySchedules) {
            scheduleInfo = userData.schedule.subActivitySchedules.find(
              (sas: SubActivitySchedule) =>
                sas.subActivityId === sub._id || sas.name === sub.name,
            );
          }

          return {
            ...sub,
            startTime: scheduleInfo?.startTime,
            endTime: scheduleInfo?.endTime,
          };
        },
      );

      // Ordenar por hora de inicio si tienen horario
      subActivitiesWithSchedule.sort((a: SubActivity, b: SubActivity) => {
        if (a.startTime && b.startTime) {
          return a.startTime.localeCompare(b.startTime);
        }
        return a.order - b.order;
      });

      // Cargar estado de awards para las subactividades
      const subActivityIds = subActivitiesWithSchedule.map(
        (s: SubActivity) => s._id,
      );

      let awardsStatusData: Record<
        string,
        { hasAward: boolean; completed: boolean }
      > = {};
      if (subActivityIds.length > 0) {
        try {
          const statusResponse =
            await awardsAPI.getSubActivityAwardsStatus(subActivityIds);
          awardsStatusData = statusResponse.data;
          setAwardsStatus(awardsStatusData);
        } catch (err) {
          console.log("No awards status available");
        }
      }

      // Calcular estado de cada subactividad
      const subActivitiesWithStatus = calculateSubActivityStatus(
        subActivitiesWithSchedule,
        completedIds,
        awardsStatusData,
        userData.schedule,
      );

      setSubActivities(subActivitiesWithStatus);
    } catch (err) {
      console.error("Error loading activity:", err);
      setError("Error cargando la actividad");
    } finally {
      setLoading(false);
    }
  }, [activityId, calculateSubActivityStatus]);

  useEffect(() => {
    const token = localStorage.getItem("token");
    const userId = localStorage.getItem("userId");

    if (!token || !userId) {
      navigate("/login");
      return;
    }

    if (activityId) {
      loadActivityData();
    }
  }, [navigate, activityId, loadActivityData]);

  const handleSubActivityClick = (subActivity: SubActivityWithStatus) => {
    // Solo permitir click en subactividades desbloqueadas
    if (!subActivity.isUnlocked) {
      return;
    }
    setSelectedActivity(subActivity);
  };

  const closeModal = () => {
    setSelectedActivity(null);
  };

  // Función para abrir el modal de pregunta
  const handleAnswerQuestion = async (subActivity: SubActivityWithStatus) => {
    try {
      const response = await awardsAPI.getAwardBySubActivity(subActivity._id);
      if (response.data) {
        setAnsweringSubActivity(subActivity); // Guardar referencia antes de cerrar el modal
        setCurrentAward(response.data);
        setShowQuestionModal(true);
        setSelectedActivity(null);
      } else {
        alert("No hay reto disponible para esta subactividad");
      }
    } catch (err) {
      console.error("Error loading award:", err);
      alert("Error al cargar el reto");
    }
  };

  // Función para enviar respuesta
  const handleSubmitAnswer = async (answer: string) => {
    if (!currentAward) return;

    setAnsweringLoading(true);
    try {
      const response = await awardsAPI.answerAward(currentAward._id, answer);
      setAnswerResult(response.data);
      setShowQuestionModal(false);
      setShowCompletedModal(true);

      // Si fue correcta, actualizar el estado local usando answeringSubActivity
      if (response.data.isCorrect && answeringSubActivity) {
        const completedId = answeringSubActivity._id;
        console.log(
          `[handleSubmitAnswer] Respuesta correcta para subactividad: ${completedId}`,
        );
        console.log(
          `[handleSubmitAnswer] answeringSubActivity:`,
          answeringSubActivity,
        );
        console.log(`[handleSubmitAnswer] userSchedule:`, userSchedule);

        // Actualizar completedSubActivityIds
        setCompletedSubActivityIds((prev) => {
          const newIds = [...prev, completedId];
          console.log(
            `[handleSubmitAnswer] completedSubActivityIds actualizado:`,
            newIds,
          );
          return newIds;
        });

        // Actualizar awardsStatus
        const newAwardsStatus = {
          ...awardsStatus,
          [completedId]: { hasAward: true, completed: true },
        };
        setAwardsStatus(newAwardsStatus);
        console.log(
          `[handleSubmitAnswer] awardsStatus actualizado:`,
          newAwardsStatus,
        );

        // Actualizar directamente las subactividades para reflejar el cambio inmediatamente
        setSubActivities((prevSubActivities) => {
          let foundFirstUnlocked = false;
          const updatedCompletedIds = [...completedSubActivityIds, completedId];
          console.log(
            `[setSubActivities] updatedCompletedIds:`,
            updatedCompletedIds,
          );

          const result = prevSubActivities.map((sub, index) => {
            const isCompleted =
              updatedCompletedIds.includes(sub._id) ||
              newAwardsStatus[sub._id]?.completed;

            let isUnlocked = false;
            if (index === 0) {
              isUnlocked = isWithinSchedule(sub, userSchedule);
            } else {
              const previousSub = prevSubActivities[index - 1];
              const previousCompleted =
                updatedCompletedIds.includes(previousSub._id) ||
                newAwardsStatus[previousSub._id]?.completed;
              isUnlocked =
                previousCompleted && isWithinSchedule(sub, userSchedule);
            }

            if (isCompleted) {
              isUnlocked = true;
            }

            let isActive = false;
            if (isUnlocked && !isCompleted && !foundFirstUnlocked) {
              isActive = true;
              foundFirstUnlocked = true;
            }

            const newSub = {
              ...sub,
              isUnlocked,
              isActive,
              isCompleted,
              completed: isCompleted,
              progress: isCompleted ? 100 : isActive ? 50 : 0,
            };

            console.log(
              `[setSubActivities] ${sub.name}: isCompleted=${isCompleted}, isUnlocked=${isUnlocked}, isActive=${isActive}, progress=${newSub.progress}`,
            );
            return newSub;
          });

          return result;
        });
      }
    } catch (err) {
      console.error("Error submitting answer:", err);
      alert("Error al enviar la respuesta");
    } finally {
      setAnsweringLoading(false);
    }
  };

  // Cerrar modal de completado
  const handleCloseCompletedModal = () => {
    setShowCompletedModal(false);
    setAnswerResult(null);
    setCurrentAward(null);
    setAnsweringSubActivity(null); // Limpiar la referencia
    // Recargar datos para actualizar el progreso
    loadActivityData();
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("es-CR", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const formatTime = (time: string) => {
    const [hours, minutes] = time.split(":");
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? "PM" : "AM";
    const hour12 = hour % 12 || 12;
    return `${hour12}:${minutes} ${ampm}`;
  };

  // Calcular estadísticas
  const completedCount = subActivities.filter((s) => s.isCompleted).length;
  const totalCount = subActivities.length;
  const progressPercentage =
    totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;
  const earnedBadgesCount = Object.values(awardsStatus).filter(
    (s) => s.completed,
  ).length;

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#113780] mx-auto mb-4"></div>
          <p className="text-lg text-gray-600">Cargando subactividades...</p>
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
            onClick={loadActivityData}
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
              {activity?.name || "Actividad"}
            </h1>
            <p className="text-sm sm:text-base text-gray-600">
              {activity?.description ||
                "Explora las subactividades y completa desafíos"}
            </p>
          </div>
          <button
            onClick={() => navigate("/activities")}
            className="text-[#113780] hover:text-[#0C2A5C] font-semibold flex items-center gap-2 text-sm sm:text-base self-start sm:self-auto"
          >
            ← Volver
          </button>
        </div>

        {/* Activity Header Card */}
        <div className="bg-gradient-to-r from-[#113780] to-[#0C2A5C] rounded-xl sm:rounded-2xl shadow-xl p-4 sm:p-8 mb-6 sm:mb-8 text-white">
          <div className="flex items-center gap-3 sm:gap-4 mb-4">
            <div className="text-4xl sm:text-5xl flex-shrink-0">
              <StickerIcon
                stickerId={activity?.stickerId}
                defaultIcon="🏢"
                className="text-4xl sm:text-5xl"
                imgClassName="w-12 h-12 sm:w-16 sm:h-16"
              />
            </div>
            <div className="min-w-0">
              <h2 className="text-xl sm:text-3xl font-bold text-white truncate">
                {activity?.name || "IT Experience"}
              </h2>
              <p className="text-blue-200 mt-1 text-sm sm:text-base line-clamp-2">
                {activity?.description ||
                  "Programa principal de desarrollo tecnológico"}
              </p>
            </div>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-4 mt-4 sm:mt-6">
            <div className="bg-white/20 rounded-lg p-3 sm:p-4 text-center">
              <div className="text-lg sm:text-2xl font-bold text-white">
                {totalCount}
              </div>
              <div className="text-xs sm:text-sm text-blue-200">
                Sub-actividades
              </div>
            </div>
            <div className="bg-white/20 rounded-lg p-3 sm:p-4 text-center">
              <div className="text-lg sm:text-2xl font-bold text-white">
                {completedCount}
              </div>
              <div className="text-xs sm:text-sm text-blue-200">
                Completadas
              </div>
            </div>
            <div className="bg-white/20 rounded-lg p-3 sm:p-4 text-center">
              <div className="text-lg sm:text-2xl font-bold text-white">
                {progressPercentage}%
              </div>
              <div className="text-xs sm:text-sm text-blue-200">
                Progreso Total
              </div>
            </div>
            <div className="bg-white/20 rounded-lg p-3 sm:p-4 text-center">
              <div className="text-lg sm:text-2xl font-bold text-white">
                {earnedBadgesCount} 🏆
              </div>
              <div className="text-xs sm:text-sm text-blue-200">
                Insignias Ganadas
              </div>
            </div>
          </div>
          {/* Barra de progreso general */}
          <div className="mt-4 sm:mt-6">
            <div className="flex justify-between text-sm text-blue-200 mb-2">
              <span>Progreso de la Actividad</span>
              <span>
                {completedCount}/{totalCount}
              </span>
            </div>
            <div className="w-full bg-white/20 rounded-full h-3">
              <div
                className="bg-green-400 h-3 rounded-full transition-all duration-500"
                style={{ width: `${progressPercentage}%` }}
              ></div>
            </div>
          </div>
        </div>

        {/* User Group & Schedule Info */}
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
                    {formatDate(userSchedule.date)} •{" "}
                    {formatTime(userSchedule.startTime)} -{" "}
                    {formatTime(userSchedule.endTime)}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Sub-Activities Grid */}
        <h3 className="text-lg sm:text-2xl font-bold text-gray-800 mb-3 sm:mb-4">
          📋 Sub-actividades del día
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {subActivities.map((subActivity) => (
            <div
              key={subActivity._id}
              onClick={() => handleSubActivityClick(subActivity)}
              className={`rounded-xl shadow-lg transition-all duration-300 overflow-hidden relative
                ${
                  subActivity.isCompleted
                    ? "bg-gradient-to-br from-green-50 to-emerald-100 border-2 border-green-400 transform scale-[0.98]"
                    : subActivity.isActive
                      ? "bg-gradient-to-br from-white via-blue-50 to-indigo-50 hover:shadow-2xl cursor-pointer transform hover:-translate-y-2 ring-4 ring-[#113780] ring-offset-2 animate-pulse-slow"
                      : subActivity.isUnlocked
                        ? "bg-white hover:shadow-xl cursor-pointer transform hover:-translate-y-1"
                        : "bg-gray-100 cursor-not-allowed opacity-60"
                }
              `}
            >
              {/* Banner de estado */}
              {subActivity.isCompleted && (
                <div className="absolute top-0 right-0 bg-green-500 text-white text-xs font-bold px-3 py-1 rounded-bl-lg z-10">
                  ✅ COMPLETADO
                </div>
              )}
              {subActivity.isActive && !subActivity.isCompleted && (
                <div className="absolute top-0 right-0 bg-gradient-to-r from-orange-500 to-red-500 text-white text-xs font-bold px-3 py-1 rounded-bl-lg z-10 animate-bounce shadow-lg">
                  🔔 ACTIVO
                </div>
              )}

              {/* Header con color/grayscale */}
              <div
                className={`p-3 sm:p-4 relative ${
                  subActivity.isUnlocked
                    ? `bg-gradient-to-r ${subActivity.color}`
                    : "bg-gradient-to-r from-gray-400 to-gray-500"
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <div className={subActivity.isUnlocked ? "" : "grayscale"}>
                    <StickerIcon
                      stickerId={subActivity.stickerId}
                      defaultIcon="🎯"
                      imgClassName="w-8 h-8 sm:w-10 sm:h-10"
                    />
                  </div>

                  {/* Mostrar candado si está bloqueada */}
                  {!subActivity.isUnlocked && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/30 rounded-t-xl">
                      <div className="bg-white/90 rounded-full p-3">
                        <LockIcon className="w-8 h-8 text-gray-600" />
                      </div>
                    </div>
                  )}

                  {subActivity.startTime &&
                    subActivity.endTime &&
                    subActivity.isUnlocked && (
                      <span className="bg-white/90 text-gray-800 text-xs sm:text-sm font-semibold px-2 sm:px-3 py-1 rounded-full flex items-center gap-1 whitespace-nowrap">
                        🕐 {formatTime(subActivity.startTime)} -{" "}
                        {formatTime(subActivity.endTime)}
                      </span>
                    )}
                </div>
              </div>

              {/* Contenido */}
              <div
                className={`p-4 sm:p-5 ${!subActivity.isUnlocked ? "grayscale" : ""}`}
              >
                <h4
                  className={`text-lg sm:text-xl font-bold mb-2 ${
                    subActivity.isCompleted ? "text-green-700" : "text-gray-800"
                  }`}
                >
                  {subActivity.name}
                </h4>
                <p className="text-gray-600 text-xs sm:text-sm mb-3 sm:mb-4 line-clamp-2">
                  {subActivity.description}
                </p>

                {/* Progress Bar */}
                <div className="w-full bg-gray-200 rounded-full h-2.5">
                  <div
                    className={`h-2.5 rounded-full transition-all duration-500 ${
                      subActivity.isCompleted
                        ? "bg-green-500"
                        : subActivity.isActive
                          ? "bg-gradient-to-r from-[#113780] to-[#0C2A5C]"
                          : "bg-gray-400"
                    }`}
                    style={{ width: `${subActivity.progress || 0}%` }}
                  ></div>
                </div>

                <div className="mt-4 flex items-center justify-between text-sm">
                  <span
                    className={
                      subActivity.isCompleted
                        ? "text-green-600 font-semibold"
                        : subActivity.isActive
                          ? "text-[#113780] font-semibold"
                          : "text-gray-400"
                    }
                  >
                    {subActivity.isCompleted
                      ? "Completado"
                      : subActivity.isActive
                        ? "🎯 ¡Tu turno!"
                        : subActivity.isUnlocked
                          ? "🔓 Disponible"
                          : "🔒 Bloqueado"}
                  </span>
                  {subActivity.isActive && !subActivity.isCompleted && (
                    <span className="text-orange-500 font-bold hover:text-orange-600 flex items-center gap-1 animate-pulse">
                      Iniciar →
                    </span>
                  )}
                </div>

                {/* Banner llamativo para cards activos */}
                {subActivity.isActive && !subActivity.isCompleted && (
                  <div className="mt-4 bg-gradient-to-r from-orange-500 to-red-500 text-white text-center py-2 px-3 rounded-lg animate-pulse shadow-md">
                    <span className="text-sm font-bold">
                      🎯 ¡Responde la pregunta para completar!
                    </span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Modal for SubActivity Details */}
        {selectedActivity && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden max-h-[90vh] overflow-y-auto">
              {/* Si está completado, mostrar solo la insignia ganada */}
              {selectedActivity.isCompleted ? (
                <>
                  <div className="bg-gradient-to-r from-green-500 to-emerald-600 p-6 text-white">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-2xl font-bold">
                          {selectedActivity.name}
                        </h3>
                        <span className="text-green-100 text-sm">
                          Subactividad completada
                        </span>
                      </div>
                      <button
                        onClick={closeModal}
                        className="text-white/80 hover:text-white text-2xl"
                      >
                        ✕
                      </button>
                    </div>
                  </div>
                  <div className="p-6 text-center">
                    <div className="mb-4">
                      <span className="text-6xl">🏆</span>
                    </div>
                    <h4 className="text-xl font-bold text-gray-800 mb-2">
                      ¡Insignia Ganada!
                    </h4>
                    <div className="flex justify-center my-6">
                      <div className="bg-gradient-to-br from-yellow-100 to-yellow-200 p-6 rounded-2xl shadow-lg border-4 border-yellow-400">
                        <StickerIcon
                          stickerId={selectedActivity.stickerId}
                          defaultIcon="🏅"
                          className="text-7xl"
                          imgClassName="w-24 h-24"
                        />
                      </div>
                    </div>
                    <p className="text-gray-600 mb-6">
                      Has completado esta subactividad exitosamente.
                    </p>
                    <button
                      onClick={closeModal}
                      className="w-full bg-green-500 hover:bg-green-600 text-white font-semibold py-3 rounded-lg transition"
                    >
                      ¡Genial! Cerrar
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <div
                    className={`bg-gradient-to-r ${selectedActivity.color || "from-[#113780] to-[#0C2A5C]"} p-6 text-white`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <StickerIcon
                          stickerId={selectedActivity.stickerId}
                          defaultIcon="🎯"
                          className="text-5xl"
                          imgClassName="w-12 h-12"
                        />
                        <div>
                          <h3 className="text-2xl font-bold">
                            {selectedActivity.name}
                          </h3>
                        </div>
                      </div>
                      <button
                        onClick={closeModal}
                        className="text-white/80 hover:text-white text-2xl"
                      >
                        ✕
                      </button>
                    </div>
                  </div>
                  <div className="p-6">
                    <p className="text-gray-600 mb-6">
                      {selectedActivity.description}
                    </p>

                    {selectedActivity.startTime && selectedActivity.endTime && (
                      <div className="bg-blue-50 rounded-lg p-4 mb-4">
                        <div className="flex items-center gap-2 text-[#113780]">
                          <span>🕐</span>
                          <span className="font-semibold">
                            Horario: {formatTime(selectedActivity.startTime)} -{" "}
                            {formatTime(selectedActivity.endTime)}
                          </span>
                        </div>
                      </div>
                    )}

                    {awardsStatus[selectedActivity._id]?.hasAward && (
                      <div className="mt-2 p-4 bg-yellow-50 rounded-lg border-2 border-yellow-300">
                        <div className="flex items-center gap-2 text-yellow-700">
                          <span className="text-2xl">⭐</span>
                          <span className="font-semibold">
                            Contesta la pregunta para completar esta
                            subactividad y ganar tu insignia
                          </span>
                        </div>
                      </div>
                    )}

                    <div className="mt-6 flex flex-col gap-3">
                      {awardsStatus[selectedActivity._id]?.hasAward &&
                        !awardsStatus[selectedActivity._id]?.completed && (
                          <button
                            onClick={() =>
                              handleAnswerQuestion(selectedActivity)
                            }
                            className="w-full bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white font-semibold py-4 rounded-lg transition flex items-center justify-center gap-2 shadow-lg animate-pulse"
                          >
                            <span className="text-xl">🎯</span>
                            <span className="text-lg">
                              Contestar Pregunta y Completar
                            </span>
                          </button>
                        )}

                      <button
                        onClick={closeModal}
                        className="w-full bg-gray-200 hover:bg-gray-300 text-gray-700 font-semibold py-3 rounded-lg transition"
                      >
                        Cerrar
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        )}

        {/* Question Modal */}
        <QuestionModal
          isOpen={showQuestionModal}
          onClose={() => {
            setShowQuestionModal(false);
            setCurrentAward(null);
            setAnsweringSubActivity(null);
          }}
          question={currentAward?.question || ""}
          options={currentAward?.options || []}
          onAnswer={handleSubmitAnswer}
          loading={answeringLoading}
          subActivityName={answeringSubActivity?.name || ""}
          sticker={currentAward?.stickerId}
        />

        {/* Completed Modal */}
        <CompletedModal
          isOpen={showCompletedModal}
          onClose={handleCloseCompletedModal}
          isCorrect={answerResult?.isCorrect || false}
          sticker={answerResult?.sticker}
          pointsEarned={answerResult?.pointsEarned || 0}
          explanation={answerResult?.explanation}
          subActivityName={answeringSubActivity?.name || ""}
          alreadyCompleted={answerResult?.alreadyCompleted}
        />
      </div>
    </div>
  );
}
