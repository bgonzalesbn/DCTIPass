import { create } from "zustand";
import type { Activity, Badge, Schedule } from "../types";

interface CacheStore {
  // Cache data
  activities: Activity[];
  badges: Badge[];
  schedules: Schedule[];
  profile: any;

  // Cache timestamps para saber si son viejos
  activitiesTime: number;
  badgesTime: number;
  schedulesTime: number;
  profileTime: number;

  // Cache duration en ms (5 minutos)
  CACHE_DURATION: number;

  // Actions
  setActivities: (activities: Activity[]) => void;
  setBadges: (badges: Badge[]) => void;
  setSchedules: (schedules: Schedule[]) => void;
  setProfile: (profile: any) => void;

  // Getters con validación de caché
  getActivities: () => Activity[] | null;
  getBadges: () => Badge[] | null;
  getSchedules: () => Schedule[] | null;
  getProfile: () => any | null;

  // Clear cache
  clearCache: () => void;
}

export const useCacheStore = create<CacheStore>((set, get) => ({
  activities: [],
  badges: [],
  schedules: [],
  profile: null,
  activitiesTime: 0,
  badgesTime: 0,
  schedulesTime: 0,
  profileTime: 0,
  CACHE_DURATION: 5 * 60 * 1000, // 5 minutos

  setActivities: (activities) =>
    set({ activities, activitiesTime: Date.now() }),
  setBadges: (badges) => set({ badges, badgesTime: Date.now() }),
  setSchedules: (schedules) => set({ schedules, schedulesTime: Date.now() }),
  setProfile: (profile) => set({ profile, profileTime: Date.now() }),

  getActivities: () => {
    const state = get();
    if (Date.now() - state.activitiesTime > state.CACHE_DURATION) {
      return null; // Cache expirado
    }
    return state.activities.length > 0 ? state.activities : null;
  },

  getBadges: () => {
    const state = get();
    if (Date.now() - state.badgesTime > state.CACHE_DURATION) {
      return null;
    }
    return state.badges.length > 0 ? state.badges : null;
  },

  getSchedules: () => {
    const state = get();
    if (Date.now() - state.schedulesTime > state.CACHE_DURATION) {
      return null;
    }
    return state.schedules.length > 0 ? state.schedules : null;
  },

  getProfile: () => {
    const state = get();
    if (Date.now() - state.profileTime > state.CACHE_DURATION) {
      return null;
    }
    return state.profile;
  },

  clearCache: () =>
    set({
      activities: [],
      badges: [],
      schedules: [],
      profile: null,
      activitiesTime: 0,
      badgesTime: 0,
      schedulesTime: 0,
      profileTime: 0,
    }),
}));
