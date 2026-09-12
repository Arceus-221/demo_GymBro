import { create } from 'zustand';

/**
 * Backs the global OfflineBanner. Path A reads/writes work offline by
 * Firestore's own design, so this only gates Path B (AI) calls, which have
 * no offline story at all.
 */
export const useConnectivityStore = create((set) => ({
  isOnline: true,
  isFromCache: false,

  setOnline: (isOnline) => set({ isOnline }),
  setFromCache: (isFromCache) => set({ isFromCache }),
}));
