import { create } from 'zustand';

const EMPTY_DRAFT = {
  fitnessGoal: null,
  experienceLevel: null,
  age: null,
  gender: null,
  heightCm: null,
  weightKg: null,
  targetWeightKg: null,
  availableEquipment: [],
  dietaryPreference: 'none',
  workoutDaysPerWeek: 4,
  preferredDurationMinutes: 45,
  medicalNotes: null,
};

/**
 * In-progress profile spanning the 3 onboarding steps. Deliberately never
 * written to Firestore until the final step submits — avoids leaving a
 * half-populated profile behind if the user abandons the flow.
 */
export const useOnboardingDraftStore = create((set) => ({
  draft: { ...EMPTY_DRAFT },

  setField: (key, value) =>
    set((state) => ({ draft: { ...state.draft, [key]: value } })),

  toggleEquipment: (value) =>
    set((state) => {
      const current = state.draft.availableEquipment;
      // bodyweight_only is mutually exclusive with everything else — selecting
      // it clears the rest, and selecting anything else clears it.
      if (value === 'bodyweight_only') {
        return {
          draft: {
            ...state.draft,
            availableEquipment: current.includes(value) ? [] : ['bodyweight_only'],
          },
        };
      }
      const withoutBodyweight = current.filter((v) => v !== 'bodyweight_only');
      return {
        draft: {
          ...state.draft,
          availableEquipment: withoutBodyweight.includes(value)
            ? withoutBodyweight.filter((v) => v !== value)
            : [...withoutBodyweight, value],
        },
      };
    }),

  reset: () => set({ draft: { ...EMPTY_DRAFT } }),
}));
