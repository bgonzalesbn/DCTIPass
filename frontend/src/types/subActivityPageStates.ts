/**
 * REFACTORING DE ESTADOS EN SubActivitiesPage.tsx
 *
 * Objetivo: Consolidar 23 useState en 2-3 objetos coherentes
 * Beneficio: Reducir re-renders y mejorar mantenibilidad
 *
 * ESTADO ACTUAL (23 useState):
 * - activity, subActivities, userSchedule, userGroup
 * - completedSubActivityIds, awardsStatus
 * - loading, error, selectedActivity
 * - showQuestionModal, showCompletedModal
 * - currentAward, answerResult
 * - answeringLoading, answeringSubActivity
 * - ... etc
 *
 * ESTADO PROPUESTO (3 objetos):
 * 1. ActivityState - datos de la actividad
 * 2. UIState - modales y UI
 * 3. AwardState - estado de preguntas/respuestas
 */

import type { Activity, Schedule, Group } from "./index";

// NUEVO: Tipos consolidados
// Local type definitions (defined in SubActivitiesPage.tsx - included here for reference)
interface SubActivityWithStatus {
  _id: string;
  name: string;
  description?: string;
  points?: number;
  isUnlocked?: boolean;
  isActive?: boolean;
  isCompleted?: boolean;
  completed?: boolean;
  progress?: number;
  earnedSticker?: any;
  startTime?: string;
  endTime?: string;
  [key: string]: any;
}

interface Sticker {
  _id?: string;
  name?: string;
  imageUrl?: string;
  icon?: string;
  [key: string]: any;
}

interface ActivityState {
  activity: Activity | null;
  subActivities: SubActivityWithStatus[];
  userSchedule: Schedule | null;
  userGroup: Group | null;
  completedSubActivityIds: string[];
  awardsStatus: Record<string, { hasAward: boolean; completed: boolean }>;
  selectedActivity: SubActivityWithStatus | null;
  loading: boolean;
  error: string;
}

interface UIState {
  showQuestionModal: boolean;
  showCompletedModal: boolean;
}

interface AwardState {
  currentAward: {
    _id: string;
    question: string;
    options: string[];
    stickerId?: Sticker;
  } | null;
  answerResult: {
    isCorrect: boolean;
    pointsEarned: number;
    sticker: Sticker | null;
    explanation: string;
    alreadyCompleted?: boolean;
  } | null;
  answeringLoading: boolean;
  answeringSubActivity: SubActivityWithStatus | null;
}

// VALORES INICIALES
const initialActivityState: ActivityState = {
  activity: null,
  subActivities: [],
  userSchedule: null,
  userGroup: null,
  completedSubActivityIds: [],
  awardsStatus: {},
  selectedActivity: null,
  loading: true,
  error: "",
};

const initialUIState: UIState = {
  showQuestionModal: false,
  showCompletedModal: false,
};

const initialAwardState: AwardState = {
  currentAward: null,
  answerResult: null,
  answeringLoading: false,
  answeringSubActivity: null,
};

// EN SubActivitiesPage.tsx:
// const [activityState, setActivityState] = useState<ActivityState>(initialActivityState);
// const [uiState, setUIState] = useState<UIState>(initialUIState);
// const [awardState, setAwardState] = useState<AwardState>(initialAwardState);

// BENEFICIOS DE ESTA REFACTORIZACIÓN:
// ✅ Menos useState (3 vs 23)
// ✅ Menos re-renders (actualizar 3 objetos vs 23 variables)
// ✅ Mejor enfoque (lógica relacionada agrupada)
// ✅ Actualización más simple:
//    // ANTES: setLoading(false); setError(""); setActivity(data);
//    // DESPUÉS: setActivityState(prev => ({
//    //   ...prev,
//    //   loading: false,
//    //   error: "",
//    //   activity: data,
//    // }));

export type { ActivityState, UIState, AwardState };
export { initialActivityState, initialUIState, initialAwardState };
