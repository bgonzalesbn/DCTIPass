import { create } from "zustand";
import { authAPI, usersAPI } from "../services/api";

interface User {
  id: string;
  employeeNumber: string;
  firstName: string;
  lastName: string;
  email: string;
  direction: string;
  points: number;
  level: number;
  isAdmin: boolean;
}

interface AuthStore {
  user: User | null;
  token: string | null;
  loading: boolean;
  error: string | null;

  // Actions
  login: (employeeNumber: string, password: string) => Promise<void>;
  logout: () => void;
  setToken: (token: string) => void;
  setUser: (user: User) => void;
  clearError: () => void;

  // Selectors
  isAuthenticated: () => boolean;
}

export const useAuthStore = create<AuthStore>((set, get) => ({
  user: null,
  token: localStorage.getItem("token") || null,
  loading: false,
  error: null,

  login: async (employeeNumber: string, password: string) => {
    set({ loading: true, error: null });
    try {
      const response = await authAPI.login(employeeNumber, password);
      const { accessToken, userId, email: userEmail, isAdmin } = response.data;

      // Crear objeto usuario básico con la información del login
      const user: User = {
        id: userId,
        employeeNumber: employeeNumber,
        firstName: "",
        lastName: "",
        email: userEmail,
        direction: "",
        points: 0,
        level: 1,
        isAdmin: isAdmin || false,
      };

      localStorage.setItem("token", accessToken);
      localStorage.setItem("userId", userId);
      localStorage.setItem("userEmail", userEmail);

      set({
        token: accessToken,
        user,
        loading: false,
        error: null,
      });

      // Cargar perfil completo en segundo plano
      try {
        const profileRes = await usersAPI.getMe();
        const profile = profileRes.data;
        set({
          user: {
            id: profile.id || userId,
            employeeNumber: profile.employeeNumber || employeeNumber,
            firstName: profile.firstName || "",
            lastName: profile.lastName || "",
            email: profile.email || userEmail,
            direction: profile.direction || "",
            points: profile.progress?.activitiesCompleted || 0,
            level: 1,
            isAdmin: profile.isAdmin || false,
          },
        });
      } catch {
        // Si falla el perfil, mantener datos del login
      }
    } catch (error) {
      const err = error as { response?: { data?: { message?: string } } };
      const errorMessage = err.response?.data?.message || "Error en el login";
      set({
        loading: false,
        error: errorMessage,
      });
      throw error;
    }
  },

  logout: () => {
    localStorage.removeItem("token");
    localStorage.removeItem("userId");
    localStorage.removeItem("userEmail");
    set({
      user: null,
      token: null,
      error: null,
    });
  },

  setToken: (token: string) => {
    localStorage.setItem("token", token);
    set({ token });
  },

  setUser: (user: User) => {
    localStorage.setItem("user", JSON.stringify(user));
    set({ user });
  },

  clearError: () => {
    set({ error: null });
  },

  isAuthenticated: () => {
    const { token } = get();
    return !!token;
  },
}));
