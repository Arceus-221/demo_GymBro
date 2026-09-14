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

      // 'system' follows the OS setting and is the default, so the app matches
      // whatever the device already does before the user expresses a choice.
      themeMode: 'system', // 'system' | 'light' | 'dark'

      setWeightUnit: (weightUnit) => set({ weightUnit }),
      setThemeMode: (themeMode) => set({ themeMode }),
    }),
    {
      name: 'gymbro-settings',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
