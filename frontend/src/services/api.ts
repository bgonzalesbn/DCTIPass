import axios from "axios";
import type { AxiosInstance } from "axios";

// Usar URL de producción en Vercel, localhost en desarrollo
const API_BASE_URL =
  import.meta.env.MODE === "production"
    ? import.meta.env.VITE_API_URL || "https://api.dctpass.com"
    : "http://localhost:3000";

// Crear instancia de axios
const apiClient: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Interceptor para agregar el token en las peticiones
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  },
);

// Interceptor para manejar respuestas
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      window.location.href = "/login";
    }
    return Promise.reject(error);
  },
);

// Types
interface RegisterData {
  employeeNumber: string;
  email: string;
  firstName: string;
  lastName: string;
  direction: string;
  hobbies?: string[];
  password: string;
  survey_question_1: number;
  survey_question_2: number;
  survey_question_3: number;
}

interface UpdateProfileData {
  email?: string;
  hobbies?: string[];
  direction?: string;
}

interface ActivityData {
  name: string;
  description?: string;
  icon?: string;
  color?: string;
  stickerId?: string;
  subActivities?: SubActivityData[];
}

interface SubActivityData {
  name: string;
  description?: string;
  icon?: string;
  color?: string;
  points?: number;
  stickerId?: string;
  order?: number;
}

interface ScheduleEventData {
  title: string;
  startDate: string;
  endDate: string;
  location?: string;
}

// Auth endpoints
export const authAPI = {
  login: (employeeNumber: string, password: string) =>
    apiClient.post("/auth/login", { employeeNumber, password }),
  register: (data: RegisterData) => apiClient.post("/auth/register", data),
  logout: () => apiClient.post("/auth/logout", {}),
  // Password reset (security questions)
  verifyIdentity: (employeeNumber: string, email: string) =>
    apiClient.post("/auth/password-reset/verify-identity", {
      employeeNumber,
      email,
    }),
  verifySecurityAnswer: (employeeNumber: string, securityAnswer: string) =>
    apiClient.post("/auth/password-reset/verify-answer", {
      employeeNumber,
      answer: securityAnswer,
    }),
  resetPasswordFirstTime: (
    employeeNumber: string,
    email: string,
    newPassword: string,
  ) =>
    apiClient.post("/auth/password-reset/reset-first-time", {
      employeeNumber,
      email,
      newPassword,
    }),
  resetPasswordWithAnswer: (
    employeeNumber: string,
    securityAnswer: string,
    newPassword: string,
  ) =>
    apiClient.post("/auth/password-reset/reset-with-answer", {
      employeeNumber,
      answer: securityAnswer,
      newPassword,
    }),
  setSecurityQuestion: (
    employeeNumber: string,
    securityQuestion: string,
    securityAnswer: string,
  ) =>
    apiClient.post("/auth/password-reset/set-security-question", {
      employeeNumber,
      securityQuestion,
      securityAnswer,
    }),
};

// Users endpoints
export const usersAPI = {
  getMe: () => apiClient.get("/users/me"),
  getProfile: () => apiClient.get("/users/me"),
  updateProfile: (data: UpdateProfileData) =>
    apiClient.put("/users/profile", data),
  getUsers: (params?: Record<string, string | number | boolean>) =>
    apiClient.get("/users", { params }),
  // Nuevos endpoints de progreso
  getProgress: () => apiClient.get("/users/progress"),
  getCompletedSubActivities: () =>
    apiClient.get("/users/completed-subactivities"),
  getEarnedStickers: () => apiClient.get("/users/earned-stickers"),
  completeSubActivity: (data: {
    activityId: string;
    subActivityId: string;
    stickerId?: string;
    points?: number;
  }) => apiClient.post("/users/complete-subactivity", data),
  saveClarityResponse: (data: {
    subActivityId: string;
    scheduleId: string;
    response: string;
  }) => apiClient.post("/users/clarity-response", data),
  submitFinalSurvey: (data: {
    activityId: string;
    answers: { question: string; value: number }[];
  }) => apiClient.post("/users/final-survey", data),
};

// Activities endpoints
export const activitiesAPI = {
  getActivities: (params?: Record<string, string | number | boolean>) =>
    apiClient.get("/activities", { params }),
  getActivity: (id: string) => apiClient.get(`/activities/${id}`),
  getActivityByName: (name: string) =>
    apiClient.get(`/activities/name/${encodeURIComponent(name)}`),
  createActivity: (data: ActivityData) => apiClient.post("/activities", data),
  updateActivity: (id: string, data: ActivityData) =>
    apiClient.put(`/activities/${id}`, data),
  deleteActivity: (id: string) => apiClient.delete(`/activities/${id}`),
  addSubActivity: (activityId: string, data: SubActivityData) =>
    apiClient.post(`/activities/${activityId}/subactivities`, data),
  removeSubActivity: (activityId: string, subActivityId: string) =>
    apiClient.delete(
      `/activities/${activityId}/subactivities/${subActivityId}`,
    ),
  seedITExperience: () => apiClient.get("/activities/seed/it-experience"),
  completeActivity: (id: string) =>
    apiClient.post(`/activities/${id}/complete`, {}),
};

// Badges/Stickers endpoints
export const stickersAPI = {
  getAllBadges: () => apiClient.get("/badges"),
  getUserBadges: () => apiClient.get("/badges/mine"),
};

// Schedule endpoints
export const scheduleAPI = {
  getSchedules: (params?: Record<string, string | number | boolean>) =>
    apiClient.get("/schedule", { params }),
  getScheduleById: (id: string) => apiClient.get(`/schedule/${id}`),
  getSchedulesByActivity: (activityId: string) =>
    apiClient.get("/schedule", { params: { activityId } }),
  seedITExperienceSchedules: () =>
    apiClient.get("/schedule/seed/it-experience"),
  createSchedule: (data: ScheduleEventData) =>
    apiClient.post("/schedule", data),
  updateSchedule: (id: string, data: ScheduleEventData) =>
    apiClient.patch(`/schedule/${id}`, data),
  deleteSchedule: (id: string) => apiClient.delete(`/schedule/${id}`),
};

// Groups endpoints
export const groupsAPI = {
  getGroups: () => apiClient.get("/groups"),
  getGroup: (id: string) => apiClient.get(`/groups/${id}`),
  getGroupByName: (name: string) =>
    apiClient.get(`/groups/name/${encodeURIComponent(name)}`),
  getGroupMembers: (groupId: string) =>
    apiClient.get(`/groups/${groupId}/members`),
  seedGroups: () => apiClient.get("/groups/seed"),
  assignEmployeeToGroup: (groupId: string, employeeNumber: string) =>
    apiClient.post(`/groups/${groupId}/assign-employee`, { employeeNumber }),
  assignScheduleToGroup: (groupId: string, scheduleId: string) =>
    apiClient.post(`/groups/${groupId}/assign-schedule`, { scheduleId }),
};

// Awards endpoints
export const awardsAPI = {
  // Obtener reto por subactividad
  getAwardBySubActivity: (subActivityId: string, scheduleId?: string) =>
    apiClient.get(
      `/awards/subactivity/${subActivityId}${scheduleId ? `?scheduleId=${encodeURIComponent(scheduleId)}` : ""}`,
    ),
  // Obtener todos los retos de una actividad
  getAwardsByActivity: (activityId: string) =>
    apiClient.get(`/awards/activity/${activityId}`),
  // Responder a un reto
  answerAward: (stickerAwardId: string, answer: string) =>
    apiClient.post("/awards/answer", { stickerAwardId, answer }),
  // Obtener mis stickers ganados
  getMyAwards: () => apiClient.get("/awards/my-awards"),
  // Obtener progreso en actividad
  getProgress: (activityId: string) =>
    apiClient.get(`/awards/progress/${activityId}`),
  // Obtener estado de retos para subactividades
  getSubActivityAwardsStatus: (subActivityIds: string[], scheduleId?: string) =>
    apiClient.get(
      `/awards/status?subActivityIds=${subActivityIds.join(",")}${
        scheduleId ? `&scheduleId=${encodeURIComponent(scheduleId)}` : ""
      }`,
    ),
  // Verificar si completó un reto
  hasCompletedAward: (stickerAwardId: string) =>
    apiClient.get(`/awards/completed/${stickerAwardId}`),
  // Admin: crear reto
  createAward: (data: {
    stickerId: string;
    activityId: string;
    subActivityId: string;
    question: string;
    options: string[];
    correctAnswer: string;
    explanation?: string;
    points?: number;
  }) => apiClient.post("/awards", data),
  // Admin: obtener todos los retos
  getAllAwards: () => apiClient.get("/awards/admin/all"),
};

// Admin endpoints
export const adminAPI = {
  // Dashboard
  getStats: () => apiClient.get("/admin/stats"),

  // Users
  getUsers: () => apiClient.get("/admin/users"),
  getAvailableUsers: () => apiClient.get("/admin/users/available"),
  updateUser: (id: string, data: Record<string, unknown>) =>
    apiClient.patch(`/admin/users/${id}`, data),

  // Schedules
  getSchedules: () => apiClient.get("/admin/schedules"),
  createSchedule: (data: Record<string, unknown>) =>
    apiClient.post("/admin/schedules", data),
  updateSchedule: (id: string, data: Record<string, unknown>) =>
    apiClient.put(`/admin/schedules/${id}`, data),
  deleteSchedule: (id: string) => apiClient.delete(`/admin/schedules/${id}`),

  // Activity Schedules
  getActivitySchedules: (activityId: string) =>
    apiClient.get(`/admin/activities/${activityId}/schedules`),
  bulkCreateSchedules: (activityId: string, data: Record<string, unknown>) =>
    apiClient.post(`/admin/activities/${activityId}/schedules/bulk`, data),
  updateGroupSessions: (scheduleId: string, data: Record<string, unknown>) =>
    apiClient.put(`/admin/schedules/${scheduleId}/group-sessions`, data),

  // Activities
  getActivities: () => apiClient.get("/admin/activities"),
  createActivity: (data: Record<string, unknown>) =>
    apiClient.post("/admin/activities", data),
  updateActivity: (id: string, data: Record<string, unknown>) =>
    apiClient.put(`/admin/activities/${id}`, data),
  deleteActivity: (id: string) => apiClient.delete(`/admin/activities/${id}`),

  // Sub-Activities
  addSubActivity: (activityId: string, data: Record<string, unknown>) =>
    apiClient.post(`/admin/activities/${activityId}/subactivities`, data),
  updateSubActivity: (
    activityId: string,
    subActivityId: string,
    data: Record<string, unknown>,
  ) =>
    apiClient.put(
      `/admin/activities/${activityId}/subactivities/${subActivityId}`,
      data,
    ),
  deleteSubActivity: (activityId: string, subActivityId: string) =>
    apiClient.delete(
      `/admin/activities/${activityId}/subactivities/${subActivityId}`,
    ),

  // Challenges
  getChallenges: () => apiClient.get("/admin/challenges"),
  createChallenge: (data: Record<string, unknown>) =>
    apiClient.post("/admin/challenges", data),
  updateChallenge: (id: string, data: Record<string, unknown>) =>
    apiClient.put(`/admin/challenges/${id}`, data),
  deleteChallenge: (id: string) => apiClient.delete(`/admin/challenges/${id}`),

  // Stickers
  getStickers: () => apiClient.get("/admin/stickers"),
  createSticker: (data: Record<string, unknown>) =>
    apiClient.post("/admin/stickers", data),
  updateSticker: (id: string, data: Record<string, unknown>) =>
    apiClient.put(`/admin/stickers/${id}`, data),
  deleteSticker: (id: string) => apiClient.delete(`/admin/stickers/${id}`),

  // Groups
  getGroups: () => apiClient.get("/admin/groups"),
  createGroup: (data: Record<string, unknown>) =>
    apiClient.post("/admin/groups", data),
  updateGroup: (id: string, data: Record<string, unknown>) =>
    apiClient.put(`/admin/groups/${id}`, data),
  deleteGroup: (id: string) => apiClient.delete(`/admin/groups/${id}`),
  getGroupMembers: (groupId: string) =>
    apiClient.get(`/admin/groups/${groupId}/members`),
  assignUserToGroup: (groupId: string, employeeNumber: string) =>
    apiClient.post(`/admin/groups/${groupId}/assign`, { employeeNumber }),
  removeUserFromGroup: (groupId: string, userId: string) =>
    apiClient.delete(`/admin/groups/${groupId}/members/${userId}`),

  // Awards
  getAwards: () => apiClient.get("/admin/awards"),
  createAward: (data: Record<string, unknown>) =>
    apiClient.post("/admin/awards", data),
  updateAward: (id: string, data: Record<string, unknown>) =>
    apiClient.put(`/admin/awards/${id}`, data),
  deleteAward: (id: string) => apiClient.delete(`/admin/awards/${id}`),
};

// Suggestions endpoints
export const suggestionsAPI = {
  create: (suggestion: string, anonymous?: boolean) =>
    apiClient.post("/suggestions", { suggestion, anonymous }),
  getAll: () => apiClient.get("/suggestions"),
};

// Rally Photos endpoints
export const rallyPhotosAPI = {
  upload: (imageData: string, caption?: string) =>
    apiClient.post("/rally-photos", { imageData, caption }),
  getMyPhotos: () => apiClient.get("/rally-photos/my-photos"),
  delete: (id: string) => apiClient.delete(`/rally-photos/${id}`),
};

export default apiClient;
