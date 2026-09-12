import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

/**
 * Device-local display preferences.
 *
 * Deliberately NOT part of users/{uid}: these are per-device presentation
 * choices, not account data. Keeping them out of Firestore means toggling one
 * costs no round trip and no write quota, and the same account can render
 * differently on two devices.
 *
 * Storage is always kg regardless of `weightUnit` — see constants/units.js.
 */
export const useSettingsStore = create(
  persist(
    (set) => ({
      weightUnit: 'kg', // 'kg' | 'lb'

      setWeightUnit: (weightUnit) => set({ weightUnit }),
    }),
    {
      name: 'gymbro-settings',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
