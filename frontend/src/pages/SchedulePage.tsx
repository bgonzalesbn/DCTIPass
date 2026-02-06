import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { scheduleAPI, activitiesAPI, stickersAPI } from "../services/api";

interface Activity {
  _id: string;
  name: string;
  stickerId: string;
}

interface Badge {
  _id: string;
  name: string;
  imageUrl: string;
}

interface ScheduleEvent {
  _id: string;
  activityId: string;
  date: string;
  startTime: string;
  endTime: string;
  order: number;
  activity?: Activity;
  badge?: Badge;
}

export default function SchedulePage() {
  const [scheduleEvents, setScheduleEvents] = useState<ScheduleEvent[]>([]);
  const [selectedDate, setSelectedDate] = useState<string>(
    new Date().toISOString().split("T")[0],
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [completedActivities, setCompletedActivities] = useState<Set<string>>(
    new Set(),
  );
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/login");
      return;
    }

    loadData();
  }, [navigate, selectedDate]);

  const loadData = async () => {
    try {
      setLoading(true);
      setError("");

      // Obtener horario del día
      const scheduleResponse = await scheduleAPI.getSchedules({
        date: selectedDate,
      });
      const events = Array.isArray(scheduleResponse.data)
        ? scheduleResponse.data
        : scheduleResponse.data.data || [];

      // Obtener todas las actividades
      const activitiesResponse = await activitiesAPI.getActivities();
      const activitiesData = Array.isArray(activitiesResponse.data)
        ? activitiesResponse.data
        : activitiesResponse.data.data || [];

      const activitiesMap = new Map();
      activitiesData.forEach((activity: Activity) => {
        activitiesMap.set(activity._id, activity);
      });
      setActivities(activitiesMap);

      // Obtener todas las insignias
      const badgesResponse = await stickersAPI.getAllBadges();
      const badgesData = Array.isArray(badgesResponse.data)
        ? badgesResponse.data
        : badgesResponse.data.data || [];

      const badgesMap = new Map();
      badgesData.forEach((badge: Badge) => {
        badgesMap.set(badge._id, badge);
      });
      setBadges(badgesMap);

      // Obtener insignias ganadas del usuario
      const userBadgesResponse = await stickersAPI.getUserBadges();
      const userBadges = Array.isArray(userBadgesResponse.data)
        ? userBadgesResponse.data
        : userBadgesResponse.data.data || [];

      const completedSet = new Set<string>();
      userBadges.forEach((badge: { stickerId?: string; _id?: string }) => {
        completedSet.add(badge.stickerId || badge._id || "");
      });
      setCompletedActivities(completedSet);

      // Enriquecer eventos con datos de actividad y insignia
      const enrichedEvents = events.map((event: ScheduleEvent) => {
        const activity = activitiesMap.get(event.activityId);
        const badge = activity ? badgesMap.get(activity.stickerId) : null;
        return {
          ...event,
          activity,
          badge,
        };
      });

      setScheduleEvents(enrichedEvents);
    } catch (err) {
      const error = err as {
        response?: { data?: { message?: string } };
      };
      setError(error.response?.data?.message || "Error al cargar el horario");
    } finally {
      setLoading(false);
    }
  };

  const handleCompleteActivity = async (
    _scheduleId: string,
    activityId: string,
  ) => {
    try {
      await activitiesAPI.completeActivity(activityId);
      setCompletedActivities(new Set([...completedActivities, activityId]));
    } catch (err) {
      const error = err as {
        response?: { data?: { message?: string } };
      };
      setError(error.response?.data?.message || "Error al completar actividad");
    }
  };

  const handlePreviousDay = () => {
    const date = new Date(selectedDate);
    date.setDate(date.getDate() - 1);
    setSelectedDate(date.toISOString().split("T")[0]);
  };

  const handleNextDay = () => {
    const date = new Date(selectedDate);
    date.setDate(date.getDate() + 1);
    setSelectedDate(date.toISOString().split("T")[0]);
  };

  const handleToday = () => {
    setSelectedDate(new Date().toISOString().split("T")[0]);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const options: Intl.DateTimeFormatOptions = {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    };
    return date.toLocaleDateString("es-ES", options);
  };

  if (!localStorage.getItem("token")) {
    navigate("/login");
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8 py-3 sm:py-4 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 sm:gap-4">
          <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-[#113780]">
            Cronograma
          </h1>
          <button
            onClick={() => navigate("/home")}
            className="px-3 sm:px-4 py-2 text-gray-600 hover:text-gray-900 text-sm sm:text-base self-start sm:self-auto"
          >
            ← Volver
          </button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8 py-4 sm:py-6 md:py-8">
        {/* Selector de fecha */}
        <div className="bg-white rounded-lg shadow-md p-4 sm:p-6 mb-6 sm:mb-8">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <button
              onClick={handlePreviousDay}
              className="w-full sm:w-auto px-3 sm:px-4 py-2 bg-[#113780] text-white rounded-lg hover:bg-[#0C2A5C] transition text-sm sm:text-base"
            >
              ← Día anterior
            </button>

            <div className="text-center order-first sm:order-none w-full sm:w-auto">
              <p className="text-xs sm:text-sm text-gray-600 mb-1">
                Fecha seleccionada
              </p>
              <p className="text-lg sm:text-xl md:text-2xl font-bold text-[#113780] capitalize">
                {formatDate(selectedDate)}
              </p>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="mt-2 px-2 sm:px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#113780] focus:border-transparent outline-none text-sm sm:text-base w-full sm:w-auto"
              />
            </div>

            <button
              onClick={handleNextDay}
              className="w-full sm:w-auto px-3 sm:px-4 py-2 bg-[#113780] text-white rounded-lg hover:bg-[#0C2A5C] transition text-sm sm:text-base"
            >
              Día siguiente →
            </button>
          </div>

          <div className="mt-3 sm:mt-4 flex justify-center">
            <button
              onClick={handleToday}
              className="w-full sm:w-auto px-4 sm:px-6 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition text-sm sm:text-base"
            >
              Hoy
            </button>
          </div>
        </div>

        {/* Mensajes de error */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6 text-red-600">
            {error}
          </div>
        )}

        {/* Cargando */}
        {loading && (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-[#113780]"></div>
            <p className="mt-4 text-gray-600">Cargando cronograma...</p>
          </div>
        )}

        {/* Actividades del día */}
        {!loading && scheduleEvents.length === 0 && (
          <div className="bg-white rounded-lg shadow-md p-8 text-center">
            <p className="text-gray-600 text-lg">
              No hay actividades programadas para este día
            </p>
          </div>
        )}

        {!loading && scheduleEvents.length > 0 && (
          <div className="space-y-4 sm:space-y-6">
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-4 sm:mb-6">
              Actividades del día
            </h2>

            {scheduleEvents.map((event) => (
              <div
                key={event._id}
                className={`bg-white rounded-lg shadow-md overflow-hidden border-l-4 transition-transform hover:shadow-lg ${
                  completedActivities.has(event.activityId)
                    ? "border-l-green-500"
                    : "border-l-[#113780]"
                }`}
              >
                <div className="p-4 sm:p-6">
                  <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 sm:gap-4 mb-3 sm:mb-4">
                    <div className="flex-1 min-w-0">
                      <h3 className="text-lg sm:text-xl font-bold text-gray-900 truncate">
                        {event.activity?.name || "Actividad desconocida"}
                      </h3>
                      <div className="mt-1 sm:mt-2 flex flex-wrap items-center gap-2 sm:gap-4">
                        <div className="flex items-center text-gray-600 text-sm sm:text-base">
                          <span className="font-semibold text-[#113780]">
                            {event.startTime}
                          </span>
                          <span className="mx-1 sm:mx-2">-</span>
                          <span className="font-semibold text-[#113780]">
                            {event.endTime}
                          </span>
                        </div>
                        <span className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm">
                          Orden: {event.order}
                        </span>
                      </div>
                    </div>

                    <button
                      onClick={() =>
                        handleCompleteActivity(event._id, event.activityId)
                      }
                      disabled={completedActivities.has(event.activityId)}
                      className={`px-6 py-2 rounded-lg font-semibold transition ${
                        completedActivities.has(event.activityId)
                          ? "bg-green-100 text-green-700 cursor-not-allowed"
                          : "bg-[#113780] text-white hover:bg-[#0C2A5C]"
                      }`}
                    >
                      {completedActivities.has(event.activityId)
                        ? "✓ Completada"
                        : "Completar"}
                    </button>
                  </div>

                  {/* Insignia */}
                  {event.badge && (
                    <div
                      className={`mt-6 p-4 rounded-lg border-2 ${
                        completedActivities.has(event.activityId)
                          ? "bg-green-50 border-green-200"
                          : "bg-blue-50 border-blue-200"
                      }`}
                    >
                      <div className="flex items-center gap-4">
                        <div className="flex-shrink-0">
                          {event.badge.imageUrl ? (
                            <img
                              src={event.badge.imageUrl}
                              alt={event.badge.name}
                              className="w-16 h-16 object-cover rounded-lg"
                            />
                          ) : (
                            <div className="w-16 h-16 bg-gray-300 rounded-lg flex items-center justify-center">
                              <span className="text-3xl">🏆</span>
                            </div>
                          )}
                        </div>
                        <div className="flex-1">
                          <h4 className="font-semibold text-gray-900">
                            Insignia disponible
                          </h4>
                          <p className="text-gray-600">{event.badge.name}</p>
                          <p className="text-sm text-gray-500 mt-1">
                            {completedActivities.has(event.activityId)
                              ? "¡Ya la ganaste!"
                              : "Completa la actividad para ganarla"}
                          </p>
                        </div>
                        {completedActivities.has(event.activityId) && (
                          <div className="text-3xl">⭐</div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
