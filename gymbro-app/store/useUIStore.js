import { create } from 'zustand';

/**
 * Global toast surface so any screen can raise an AI error (Phase 2 §7.6)
 * without prop-drilling a dispatcher.
 */
export const useUIStore = create((set) => ({
  toast: null, // { message, tone: 'error' | 'success' | 'info' }

  showToast: (message, tone = 'info') => set({ toast: { message, tone } }),
  showError: (message) => set({ toast: { message, tone: 'error' } }),
  clearToast: () => set({ toast: null }),
}));
