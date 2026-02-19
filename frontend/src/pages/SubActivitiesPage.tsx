import { useState, useEffect, useCallback } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { activitiesAPI, usersAPI, awardsAPI } from "../services/api";
import ClarityQuestionModal from "../components/ClarityQuestionModal";
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
  location?: string;
  progress?: number;
  completed?: boolean;
  startTime?: string;
  endTime?: string;
  enableClarityQuestion?: boolean;
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
  groupSessions?: {
    groupId: { _id: string } | string;
    sessions: {
      subActivityId: string;
      subActivityName: string;
      startTime: string;
      endTime: string;
      order: number;
      enableClarityQuestion?: boolean;
    }[];
  }[];
  order: number;
  active: boolean;
}

type GroupSession = NonNullable<Schedule["groupSessions"]>[number];
type GroupSessionItem = GroupSession["sessions"][number];

interface Group {
  _id: string;
  name: string;
  shift: string;
}

const IT_EXPERIENCE_BADGE_ID = "69823bf0d6bd58d3ea14ba91";

const FINAL_SURVEY_QUESTIONS = [
  "¿Entiendo cómo las direcciones de TI se conectan para generar valor?",
  "¿Tengo claridad de cómo mi trabajo impacta a otras áreas dentro de TI?",
  "¿Me siento parte de un sistema integrado dentro de TI?",
];

const LIKERT_OPTIONS = [
  { value: 1, label: "Totalmente en desacuerdo" },
  { value: 2, label: "En desacuerdo" },
  { value: 3, label: "Neutral" },
  { value: 4, label: "De acuerdo" },
  { value: 5, label: "Totalmente de acuerdo" },
];

const getShiftLabel = (shift?: string | null) => {
  if (shift === "Morning") return "Mañana";
  if (shift === "Afternoon") return "Tarde";
  return shift || "";
};

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

// Componente de candado para sesiones bloqueadas
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
    correctAnswer?: string;
  } | null>(null);
  const [pendingAwardResult, setPendingAwardResult] = useState<{
    isCorrect: boolean;
    pointsEarned: number;
    sticker: Sticker | null;
    explanation: string;
    alreadyCompleted?: boolean;
    correctAnswer?: string;
  } | null>(null);
  const [answeringLoading, setAnsweringLoading] = useState(false);
  const [awardsStatus, setAwardsStatus] = useState<
    Record<string, { hasAward: boolean; completed: boolean }>
  >({});
  // Referencia a la subactividad que está respondiendo (no se limpia al abrir modal de pregunta)
  const [answeringSubActivity, setAnsweringSubActivity] =
    useState<SubActivityWithStatus | null>(null);
  const [enableClarityQuestion, setEnableClarityQuestion] = useState(false);
  const [skipChallenge, setSkipChallenge] = useState(false);
  const [finalSurveyAnswers, setFinalSurveyAnswers] = useState<number[]>(
    Array(FINAL_SURVEY_QUESTIONS.length).fill(0),
  );
  const [finalSurveySubmitting, setFinalSurveySubmitting] = useState(false);
  const [finalSurveySubmittedAt, setFinalSurveySubmittedAt] = useState<
    string | null
  >(null);
  const [badgeUnlocked, setBadgeUnlocked] = useState(false);
  const [finalSurveyFeedback, setFinalSurveyFeedback] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  const navigate = useNavigate();

  const loadActivityData = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      // OPTIMIZACIÓN: Paralelizar las primeras 3 llamadas API
      // Antes: secuencial (4 llamadas esperaban una a la otra = 1.4s)
      // Ahora: paralelo (solo la más lenta = 0.5s)
      const [profileRes, activityRes, completedRes] = await Promise.all([
        usersAPI.getProfile(),
        activitiesAPI.getActivity(activityId!),
        usersAPI.getCompletedSubActivities().catch(() => ({ data: [] })),
      ]);

      const userData = profileRes.data;
      const activityData = activityRes.data;
      const completedIds = completedRes.data || [];

      if (userData.group) {
        setUserGroup(userData.group);
      }

      if (userData.schedule) {
        setUserSchedule(userData.schedule);
      }

      setCompletedSubActivityIds(completedIds);
      setActivity(activityData);
      const finalSurveyEntry = (userData.finalSurveys || []).find(
        (survey: any) => survey.activityId === activityData._id,
      );
      setFinalSurveySubmittedAt(finalSurveyEntry?.submittedAt || null);
      setBadgeUnlocked(
        (userData.earnedStickers || []).some(
          (stickerId: string) => stickerId === IT_EXPERIENCE_BADGE_ID,
        ),
      );
      setFinalSurveyFeedback(null);

      // Combinar subactividades con horarios del schedule del usuario
      const subActivitiesWithSchedule = activityData.subActivities.map(
        (sub: SubActivity) => {
          const groupId = userData.group?._id;
          const groupSessions = userData.schedule?.groupSessions || [];
          const groupSession = groupId
            ? groupSessions.find((gs: GroupSession) => {
                const gsGroupId =
                  typeof gs.groupId === "string" ? gs.groupId : gs.groupId?._id;
                return gsGroupId && String(gsGroupId) === String(groupId);
              })
            : null;

          let scheduleInfo = null;
          if (groupSession?.sessions?.length) {
            scheduleInfo = groupSession.sessions.find(
              (session: GroupSessionItem) =>
                session.subActivityId === sub._id ||
                session.subActivityName === sub.name,
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
          const statusResponse = await awardsAPI.getSubActivityAwardsStatus(
            subActivityIds,
            userData.schedule?._id,
          );
          awardsStatusData = statusResponse.data;
          setAwardsStatus(awardsStatusData);
        } catch (err) {
          console.log("No awards status available");
        }
      }

      // Calcular estado secuencial de cada subactividad (sin bloqueo por horario)
      let foundFirstUnlocked = false;
      const completedIdsSet = new Set(completedIds);
      const subActivitiesWithStatus = subActivitiesWithSchedule.map(
        (sub: SubActivity, index: number) => {
          const isCompleted =
            completedIdsSet.has(sub._id) ||
            awardsStatusData[sub._id]?.completed;

          let isUnlocked = index === 0;
          if (index > 0) {
            const previousSub = subActivitiesWithSchedule[index - 1];
            const previousCompleted =
              completedIdsSet.has(previousSub._id) ||
              awardsStatusData[previousSub._id]?.completed;
            isUnlocked = previousCompleted;
          }

          if (isCompleted) {
            isUnlocked = true;
          }

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
        },
      );

      setSubActivities(subActivitiesWithStatus);
    } catch (err) {
      console.error("Error loading activity:", err);
      setError("Error cargando la actividad");
    } finally {
      setLoading(false);
    }
  }, [activityId]);

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
      const response = await awardsAPI.getAwardBySubActivity(
        subActivity._id,
        userSchedule?._id,
      );
      const award = response.data;
      const hasValidAward =
        !!award?.question &&
        Array.isArray(award?.options) &&
        award.options.length > 0;
      const clarityEnabled = subActivity.enableClarityQuestion || false;

      console.log("[DEBUG] Clarity Question Check:", {
        subActivityId: subActivity._id,
        subActivityName: subActivity.name,
        enableClarityQuestion: clarityEnabled,
        hasValidAward,
      });

      if (hasValidAward) {
        setAnsweringSubActivity(subActivity); // Guardar referencia antes de cerrar el modal
        setCurrentAward(award);
        setEnableClarityQuestion(clarityEnabled);
        setShowQuestionModal(true);
        setSelectedActivity(null);
        return;
      }

      // No hay reto válido: si hay claridad, solo evaluación; si no, completar directo
      if (clarityEnabled) {
        setAnsweringSubActivity(subActivity);
        setCurrentAward(null);
        setEnableClarityQuestion(true);
        setSkipChallenge(true);
        setShowQuestionModal(true);
        setSelectedActivity(null);
        return;
      }

      await completeSubActivityWithoutAward(subActivity, true);
    } catch (err) {
      console.error("Error loading award:", err);
      alert("Error al cargar el reto");
    }
  };

  const completeSubActivityWithoutAward = async (
    subActivity: SubActivityWithStatus,
    showAlert: boolean = true,
  ) => {
    try {
      // Extract stickerId - handle both string and object formats
      let stickerId: string | undefined;
      if (typeof subActivity.stickerId === "string") {
        stickerId = subActivity.stickerId;
      } else if (
        typeof subActivity.stickerId === "object" &&
        subActivity.stickerId?._id
      ) {
        stickerId = subActivity.stickerId._id;
      }
      await usersAPI.completeSubActivity({
        activityId: activityId!,
        subActivityId: subActivity._id,
        stickerId,
        points: 10,
      });

      const completedId = subActivity._id;
      setCompletedSubActivityIds((prev) =>
        prev.includes(completedId) ? prev : [...prev, completedId],
      );

      const newAwardsStatus = {
        ...awardsStatus,
        [completedId]: { hasAward: false, completed: true },
      };
      setAwardsStatus(newAwardsStatus);

      // Recalcular estados
      setSubActivities((prevSubActivities) => {
        let foundFirstUnlocked = false;
        const updatedCompletedIds = new Set([
          ...completedSubActivityIds,
          completedId,
        ]);

        return prevSubActivities.map((sub, index) => {
          const isCompleted =
            updatedCompletedIds.has(sub._id) ||
            newAwardsStatus[sub._id]?.completed;

          let isUnlocked = false;
          if (index === 0) {
            isUnlocked = true;
          } else {
            const previousSub = prevSubActivities[index - 1];
            const previousCompleted =
              updatedCompletedIds.has(previousSub._id) ||
              newAwardsStatus[previousSub._id]?.completed;
            isUnlocked = previousCompleted;
          }

          if (isCompleted) isUnlocked = true;

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
      });

      setSelectedActivity(null);
      if (showAlert) {
        alert("¡Sesión completada exitosamente!");
      }
    } catch (err) {
      console.error("Error completing session:", err);
      alert("Error al completar la sesión");
    }
  };

  // Función para completar una sesión sin reto
  const handleCompleteWithoutChallenge = async (
    subActivity: SubActivityWithStatus,
  ) => {
    if (subActivity.enableClarityQuestion) {
      setAnsweringSubActivity(subActivity);
      setEnableClarityQuestion(true);
      setSkipChallenge(true);
      setShowQuestionModal(true);
      setSelectedActivity(null);
      return;
    }

    try {
      let stickerId: string | undefined;
      if (typeof subActivity.stickerId === "string") {
        stickerId = subActivity.stickerId;
      } else if (
        typeof subActivity.stickerId === "object" &&
        subActivity.stickerId?._id
      ) {
        stickerId = subActivity.stickerId._id;
      }

      await usersAPI.completeSubActivity({
        activityId: activityId!,
        subActivityId: subActivity._id,
        stickerId,
        points: 10,
      });

      const completedId = subActivity._id;
      setCompletedSubActivityIds((prev) =>
        prev.includes(completedId) ? prev : [...prev, completedId],
      );

      const newAwardsStatus = {
        ...awardsStatus,
        [completedId]: { hasAward: false, completed: true },
      };
      setAwardsStatus(newAwardsStatus);

      // Recalcular estados
      setSubActivities((prevSubActivities) => {
        let foundFirstUnlocked = false;
        const updatedCompletedIds = new Set([
          ...completedSubActivityIds,
          completedId,
        ]);

        return prevSubActivities.map((sub, index) => {
          const isCompleted =
            updatedCompletedIds.has(sub._id) ||
            newAwardsStatus[sub._id]?.completed;

          let isUnlocked = false;
          if (index === 0) {
            isUnlocked = true;
          } else {
            const previousSub = prevSubActivities[index - 1];
            const previousCompleted =
              updatedCompletedIds.has(previousSub._id) ||
              newAwardsStatus[previousSub._id]?.completed;
            isUnlocked = previousCompleted;
          }

          if (isCompleted) isUnlocked = true;

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
      });

      // Mostrar modal de Felicitades con el sticker
      setAnsweringSubActivity(subActivity);
      const sticker =
        typeof subActivity.stickerId === "object"
          ? (subActivity.stickerId as Sticker)
          : null;

      setAnswerResult({
        isCorrect: true,
        pointsEarned: 10,
        sticker,
        explanation: "",
      });
      setSelectedActivity(null);
      setShowCompletedModal(true);
    } catch (err) {
      console.error("Error completing session:", err);
      alert("Error al completar la sesión");
    }
  };

  const handleSurveyAnswerChange = (questionIndex: number, value: number) => {
    setFinalSurveyAnswers((prev) => {
      const updated = [...prev];
      updated[questionIndex] = value;
      return updated;
    });
  };

  const handleSubmitFinalSurvey = async () => {
    if (!activityId || finalSurveySubmitting) {
      return;
    }

    const pendingIndex = finalSurveyAnswers.findIndex((value) => value === 0);
    if (pendingIndex !== -1) {
      setFinalSurveyFeedback({
        type: "error",
        message: "Responde todas las preguntas antes de enviar.",
      });
      return;
    }

    setFinalSurveySubmitting(true);
    setFinalSurveyFeedback(null);
    try {
      await usersAPI.submitFinalSurvey({
        activityId,
        answers: FINAL_SURVEY_QUESTIONS.map((question, index) => ({
          question,
          value: finalSurveyAnswers[index],
        })),
      });

      const submittedAt = new Date().toISOString();
      setFinalSurveySubmittedAt(submittedAt);
      setBadgeUnlocked(true);
      setFinalSurveyAnswers(Array(FINAL_SURVEY_QUESTIONS.length).fill(0));
      setFinalSurveyFeedback({
        type: "success",
        message: "¡Gracias por compartir tu experiencia final!",
      });
      await loadActivityData();
    } catch (err: any) {
      console.error("Error submitting final survey:", err);
      setFinalSurveyFeedback({
        type: "error",
        message:
          err?.response?.data?.message ||
          "No se pudo enviar la encuesta final. Intenta de nuevo.",
      });
    } finally {
      setFinalSurveySubmitting(false);
    }
  };

  const applyAwardResult = () => {
    if (!answeringSubActivity) return;

    const completedId = answeringSubActivity._id;

    // Actualizar completedSubActivityIds
    setCompletedSubActivityIds((prev) =>
      prev.includes(completedId) ? prev : [...prev, completedId],
    );

    // Actualizar awardsStatus
    const newAwardsStatus = {
      ...awardsStatus,
      [completedId]: {
        hasAward: awardsStatus[completedId]?.hasAward ?? true,
        completed: true,
      },
    };
    setAwardsStatus(newAwardsStatus);

    // Actualizar directamente las subactividades para reflejar el cambio inmediatamente
    setSubActivities((prevSubActivities) => {
      let foundFirstUnlocked = false;
      const updatedCompletedIds = new Set([
        ...completedSubActivityIds,
        completedId,
      ]);

      const result = prevSubActivities.map((sub, index) => {
        const isCompleted =
          updatedCompletedIds.has(sub._id) ||
          newAwardsStatus[sub._id]?.completed;

        let isUnlocked = false;
        if (index === 0) {
          isUnlocked = true;
        } else {
          const previousSub = prevSubActivities[index - 1];
          const previousCompleted =
            updatedCompletedIds.has(previousSub._id) ||
            newAwardsStatus[previousSub._id]?.completed;
          isUnlocked = previousCompleted;
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
  };

  const handleValidateChallengeAnswer = async (answer: string) => {
    if (!currentAward) {
      return {
        isCorrect: false,
        pointsEarned: 0,
        sticker: null,
        explanation: "",
      };
    }

    setAnsweringLoading(true);
    try {
      const response = await awardsAPI.answerAward(currentAward._id, answer);
      const result = {
        ...response.data,
        correctAnswer: response.data.correctAnswer || "",
      };
      setPendingAwardResult(result);
      applyAwardResult();

      // Si es respuesta incorrecta pero hay claridad, continuar con la evaluación
      if (!result.isCorrect && enableClarityQuestion) {
        // Mantener el modal abierto, solo ir a la evaluación de claridad
        return result;
      }

      // Si es respuesta incorrecta y sin claridad, cerrar el modal
      if (!result.isCorrect) {
        setShowQuestionModal(false);
        // No mostrar completado modal para respuesta incorrecta
        // El sticker ya fue asignado por applyAwardResult()
        return result;
      }

      // Si es correcta y hay claridad, esperar a clarity
      if (enableClarityQuestion) {
        // No mostrar completado aún, esperar a submitClarity
        return result;
      }

      // Si es correcta y sin claridad, mostrar completado
      setAnswerResult(result);
      setShowQuestionModal(false);
      setShowCompletedModal(true);

      return result;
    } catch (err) {
      console.error("Error submitting answer:", err);
      alert("Error al enviar la respuesta");
      return {
        isCorrect: false,
        pointsEarned: 0,
        sticker: null,
        explanation: "",
      };
    } finally {
      setAnsweringLoading(false);
    }
  };

  const handleSubmitClarity = async (clarityResponse: string) => {
    setAnsweringLoading(true);
    try {
      if (clarityResponse && answeringSubActivity && userSchedule) {
        try {
          await usersAPI.saveClarityResponse({
            subActivityId: answeringSubActivity._id,
            scheduleId: userSchedule._id,
            response: clarityResponse,
          });
        } catch (err) {
          console.error("Error saving clarity response:", err);
        }
      }

      if (skipChallenge && answeringSubActivity) {
        await completeSubActivityWithoutAward(answeringSubActivity, false);
        const sticker =
          typeof answeringSubActivity.stickerId === "object"
            ? (answeringSubActivity.stickerId as Sticker)
            : null;

        setAnswerResult({
          isCorrect: true,
          pointsEarned: 10,
          sticker,
          explanation: "",
        });
        setShowQuestionModal(false);
        setShowCompletedModal(true);
        setSkipChallenge(false);
        setEnableClarityQuestion(false);
        setPendingAwardResult(null);
        await loadActivityData();
        return;
      }

      // Ensure local progress is applied even if modal flow resets state
      applyAwardResult();

      if (pendingAwardResult) {
        setAnswerResult(pendingAwardResult);
        setShowQuestionModal(false);
        setShowCompletedModal(true);
      }

      // Refresh server-backed progress to keep UI in sync
      setEnableClarityQuestion(false);
      setShowQuestionModal(false);
      await loadActivityData();
    } catch (err) {
      console.error("Error saving clarity response:", err);
      alert("Error al guardar la evaluación");
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
    setEnableClarityQuestion(false);
    setShowQuestionModal(false);
    // Recargar datos para actualizar el progreso y el resumen
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
  // Contar insignias ganadas desde subActivities que tiene la información correcta
  const earnedBadgesCount = subActivities.filter((s) => s.isCompleted).length;
  const allSessionsCompleted = totalCount > 0 && completedCount === totalCount;
  const surveyCompleted = Boolean(finalSurveySubmittedAt);
  const activityFullyCompleted =
    allSessionsCompleted && surveyCompleted && badgeUnlocked;

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-gradient-to-br from-gray-50 to-blue-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#113780] mx-auto mb-4"></div>
          <p className="text-lg text-gray-600">Cargando sesiones...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-gradient-to-br from-gray-50 to-blue-50">
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
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-[#113780] to-[#0C2A5C]">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 pt-5 pb-16">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-lg sm:text-xl font-semibold text-white truncate">
              {activity?.name || "Actividad"}
            </h1>
            <button
              onClick={() => navigate("/activities")}
              className="bg-white/15 hover:bg-white/25 text-white px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 flex-shrink-0"
            >
              ← Volver
            </button>
          </div>
          <p className="text-blue-200 text-sm">
            {activity?.description ||
              "Explora las sesiones y completa desafíos"}
          </p>
        </div>
      </div>

      <main className="max-w-2xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8 -mt-12 pb-8 relative z-20">
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
                {activity?.name || "DCTI Pass"}
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
              <div className="text-xs sm:text-sm text-blue-200">Sesiones</div>
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

          {activityFullyCompleted && (
            <div className="mt-4 sm:mt-6 bg-white/20 rounded-xl px-4 py-3 text-center">
              <p className="text-sm uppercase tracking-widest text-blue-100 font-semibold">
                Actividad completada
              </p>
              <p className="text-xl sm:text-2xl font-bold text-white mt-1">
                ¡Felicitaciones, obtuviste la insignia IT Experience!
              </p>
            </div>
          )}
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
                    {getShiftLabel(userGroup.shift)}
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

        {allSessionsCompleted && (
          <div className="bg-white rounded-2xl shadow-xl border border-emerald-100 p-5 sm:p-6 mb-6">
            {!surveyCompleted ? (
              <>
                <div className="text-center mb-6">
                  <p className="text-sm uppercase tracking-widest text-emerald-500 font-semibold">
                    🎉 ¡Sesiones completadas!
                  </p>
                  <h3 className="text-2xl sm:text-3xl font-bold text-gray-900 mt-2">
                    Comparte tu experiencia final
                  </h3>
                  <p className="text-gray-500 mt-2">
                    En una escala del 1 al 5, cuéntanos cómo te sientes al
                    finalizar todas las sesiones.
                  </p>
                </div>

                <div className="space-y-5">
                  {FINAL_SURVEY_QUESTIONS.map((question, questionIndex) => (
                    <div
                      key={question}
                      className="border border-gray-100 rounded-2xl p-4 sm:p-5"
                    >
                      <p className="text-base sm:text-lg font-semibold text-gray-900">
                        {questionIndex + 1}. {question}
                      </p>
                      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mt-4">
                        {LIKERT_OPTIONS.map((option) => {
                          const isSelected =
                            finalSurveyAnswers[questionIndex] === option.value;
                          return (
                            <button
                              type="button"
                              key={`${questionIndex}-${option.value}`}
                              onClick={() =>
                                handleSurveyAnswerChange(
                                  questionIndex,
                                  option.value,
                                )
                              }
                              className={`rounded-2xl border px-3 py-3 text-sm font-semibold transition flex flex-col items-center justify-center text-center shadow-sm ${isSelected ? "bg-emerald-500 text-white border-emerald-500 shadow-lg" : "bg-white border-gray-200 text-gray-600 hover:border-emerald-300"}`}
                            >
                              <span className="text-xl font-bold">
                                {option.value}
                              </span>
                              <span className="text-[11px] leading-tight mt-1 opacity-80">
                                {option.label}
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>

                {finalSurveyFeedback && (
                  <div
                    className={`mt-6 rounded-2xl border px-4 py-3 text-sm font-medium ${finalSurveyFeedback.type === "success" ? "bg-emerald-50 border-emerald-200 text-emerald-700" : "bg-red-50 border-red-200 text-red-700"}`}
                  >
                    {finalSurveyFeedback.message}
                  </div>
                )}

                <button
                  onClick={handleSubmitFinalSurvey}
                  disabled={finalSurveySubmitting}
                  className={`w-full mt-6 bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-semibold py-4 rounded-2xl shadow-xl transition-all duration-200 flex items-center justify-center gap-2 ${finalSurveySubmitting ? "opacity-70 cursor-not-allowed" : "hover:from-emerald-600 hover:to-teal-600"}`}
                >
                  {finalSurveySubmitting ? (
                    <>
                      <span className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></span>
                      Enviando encuesta...
                    </>
                  ) : (
                    <>
                      <span>Enviar encuesta final</span>
                      <span>→</span>
                    </>
                  )}
                </button>
              </>
            ) : (
              <div className="text-center space-y-4">
                <div className="text-5xl">🥳</div>
                <h3 className="text-2xl font-bold text-gray-900">
                  ¡Gracias por completar la encuesta final!
                </h3>
                <p className="text-gray-600 max-w-xl mx-auto">
                  Tu retroalimentación es clave para seguir mejorando el
                  programa.{" "}
                  {badgeUnlocked
                    ? "La insignia 'IT Experience' ya está en tu perfil."
                    : "Estamos procesando tu insignia 'IT Experience'."}
                </p>
                <div className="flex flex-col items-center gap-3 mt-4">
                  <div className="bg-gradient-to-br from-yellow-100 to-yellow-200 rounded-3xl p-6 shadow-inner">
                    <StickerIcon
                      stickerId={activity?.stickerId}
                      defaultIcon="🏅"
                      className="text-6xl"
                      imgClassName="w-20 h-20"
                    />
                  </div>
                  {finalSurveySubmittedAt && (
                    <p className="text-xs uppercase tracking-wide text-gray-400">
                      Enviado el{" "}
                      {new Date(finalSurveySubmittedAt).toLocaleString(
                        "es-CR",
                        {
                          dateStyle: "medium",
                          timeStyle: "short",
                        },
                      )}
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Sessions Grid */}
        <h3 className="text-lg sm:text-2xl font-bold text-gray-800 mb-3 sm:mb-4">
          📋 Sesiones del día
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
                {subActivity.location && (
                  <p className="text-xs text-blue-600 mb-1 flex items-center gap-1">
                    <span>📍</span> {subActivity.location}
                  </p>
                )}
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
                          ? "📝 Disponible"
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
                          Sesión completada
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
                      Has completado esta sesión exitosamente.
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
                            Contesta la pregunta para completar esta sesión y
                            ganar tu insignia
                          </span>
                        </div>
                      </div>
                    )}

                    {!awardsStatus[selectedActivity._id]?.hasAward &&
                      selectedActivity.enableClarityQuestion && (
                        <div className="mt-2 p-4 bg-blue-50 rounded-lg border-2 border-blue-200">
                          <div className="flex items-center gap-2 text-blue-700">
                            <span className="text-2xl">💭</span>
                            <span className="font-semibold">
                              Esta sesión requiere evaluación al stand para
                              completarse
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

                      {!awardsStatus[selectedActivity._id]?.hasAward &&
                        !selectedActivity.isCompleted && (
                          <button
                            onClick={() =>
                              handleCompleteWithoutChallenge(selectedActivity)
                            }
                            className="w-full bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-semibold py-4 rounded-lg transition flex items-center justify-center gap-2 shadow-lg"
                          >
                            <span className="text-xl">✅</span>
                            <span className="text-lg">
                              {selectedActivity.enableClarityQuestion
                                ? "Responder evaluación al stand"
                                : "Completar Sesión"}
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
        <ClarityQuestionModal
          isOpen={showQuestionModal}
          onClose={() => {
            setShowQuestionModal(false);
            setCurrentAward(null);
            setAnsweringSubActivity(null);
            setEnableClarityQuestion(false);
            setPendingAwardResult(null);
            setSkipChallenge(false);
          }}
          challengeQuestion={currentAward?.question || ""}
          challengeOptions={currentAward?.options || []}
          onValidateChallenge={handleValidateChallengeAnswer}
          onSubmitClarity={handleSubmitClarity}
          loading={answeringLoading}
          subActivityName={answeringSubActivity?.name || ""}
          sticker={currentAward?.stickerId}
          enableClarityQuestion={enableClarityQuestion}
          skipChallenge={skipChallenge}
        />

        {/* Completed Modal */}
        <CompletedModal
          isOpen={showCompletedModal}
          onClose={handleCloseCompletedModal}
          isCorrect={answerResult?.isCorrect || false}
          sticker={answerResult?.sticker}
          pointsEarned={answerResult?.pointsEarned || 0}
          explanation={answerResult?.explanation}
          correctAnswer={answerResult?.correctAnswer}
          subActivityName={answeringSubActivity?.name || ""}
          alreadyCompleted={answerResult?.alreadyCompleted}
        />
      </main>
    </div>
  );
}
