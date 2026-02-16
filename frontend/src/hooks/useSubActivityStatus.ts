import { useCallback } from "react";

interface SubActivity {
  _id: string;
  name: string;
  description: string;
  color: string;
  stickerId?: any;
  active: boolean;
  order: number;
  location?: string;
  startTime?: string;
  endTime?: string;
}

interface Schedule {
  _id: string;
  date: string;
  startTime: string;
  endTime: string;
  [key: string]: any;
}

interface SubActivityWithStatus extends SubActivity {
  isUnlocked: boolean;
  isActive: boolean;
  isCompleted: boolean;
  earnedSticker?: any;
  progress: number;
  completed: boolean;
}

interface SubActivityStatusInput {
  subActivities: SubActivity[];
  completedIds: string[];
  awardsStatus: Record<string, { hasAward: boolean; completed: boolean }>;
  schedule: Schedule | null;
}

/**
 * Custom hook para calcular estados de subactividades
 * Consolida la lógica de validación de horarios, bloqueos y progreso
 */
export const useSubActivityStatus = () => {
  // Verifica si estamos en el día correcto del schedule
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

  // Verifica si una subactividad está dentro de su horario
  const isWithinSchedule = useCallback(
    (subActivity: SubActivity, schedule: Schedule | null): boolean => {
      // Primero verificar si estamos en el día correcto
      if (!isScheduleDay(schedule)) {
        return false;
      }

      // Si la subactividad no tiene horario específico, está disponible todo el día del schedule
      if (!subActivity.startTime || !subActivity.endTime) {
        return true;
      }

      const now = new Date();
      const currentTime = `${now.getHours().toString().padStart(2, "0")}:${now.getMinutes().toString().padStart(2, "0")}`;

      // Para la subactividad, solo verificamos que ya haya comenzado su horario
      // (no bloqueamos si ya pasó la hora de fin, para permitir completarla tarde)
      const hasStarted = currentTime >= subActivity.startTime;
      return hasStarted;
    },
    [isScheduleDay],
  );

  // Calcula el estado completo de cada subactividad
  const calculateStatus = useCallback(
    (input: SubActivityStatusInput): SubActivityWithStatus[] => {
      let foundFirstUnlocked = false;

      return input.subActivities.map((sub, index) => {
        const isCompleted =
          input.completedIds.includes(sub._id) ||
          input.awardsStatus[sub._id]?.completed;

        // La primera subactividad siempre puede estar desbloqueada si es el día del schedule
        // Las siguientes solo si la anterior está completada Y está en horario
        let isUnlocked = false;

        if (index === 0) {
          // Primera subactividad: desbloqueada si es el día del schedule y está en horario
          isUnlocked = isWithinSchedule(sub, input.schedule);
        } else {
          // Verificar si la subactividad anterior está completada
          const previousSub = input.subActivities[index - 1];
          const previousCompleted =
            input.completedIds.includes(previousSub._id) ||
            input.awardsStatus[previousSub._id]?.completed;
          isUnlocked =
            previousCompleted && isWithinSchedule(sub, input.schedule);
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
    [isWithinSchedule],
  );

  return { calculateStatus, isWithinSchedule, isScheduleDay };
};
