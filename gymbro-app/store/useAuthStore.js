import { create } from 'zustand';

/**
 * Auth identity, hydrated by the onAuthStateChanged listener in app/_layout.jsx.
 * `isInitializing` stays true until Firebase reports the first auth state, so
 * the root layout can hold routing decisions until we actually know.
 */
export const useAuthStore = create((set) => ({
  user: null,
  isInitializing: true,

  setUser: (user) => set({ user, isInitializing: false }),
  clear: () => set({ user: null }),
}));
