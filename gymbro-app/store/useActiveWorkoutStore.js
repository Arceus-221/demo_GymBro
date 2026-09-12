import { create } from 'zustand';

/**
 * The entire in-progress workout session (Phase 3 §3.2). This is the single
 * source of truth during a session — Firestore is not touched per-set, so
 * set logging stays instant on bad gym Wi-Fi and doesn't burn write quota.
 * One batched write happens at "Finish Workout".
 */
export const useActiveWorkoutStore = create((set, get) => ({
  isActive: false,
  planId: null,
  sessionName: '',
  startTime: null,
  exercises: [], // [{ exerciseId, name, primaryMuscleGroup, restSeconds, sets: [...] }]
  exerciseIndex: 0,

  startSession: ({ planId, sessionName, exercises }) =>
    set({
      isActive: true,
      planId,
      sessionName,
      startTime: Date.now(),
      exerciseIndex: 0,
      exercises: exercises.map((ex) => ({
        exerciseId: ex.exerciseId,
        name: ex.name,
        // Denormalized at session start so the Progress screen's volume chart
        // can group by muscle group without re-joining the plan document.
        primaryMuscleGroup: ex.primaryMuscleGroup ?? null,
        restSeconds: ex.restSeconds ?? 90,
        repsRange: ex.repsRange ?? '',
        formCue: ex.formCue ?? '',
        sets: Array.from({ length: ex.sets ?? 3 }, (_, i) => ({
          setNumber: i + 1,
          repsCompleted: parseTargetReps(ex.repsRange),
          weightKg: 0,
          isWarmupSet: false,
          completed: false,
        })),
      })),
    }),

  setExerciseIndex: (exerciseIndex) => set({ exerciseIndex }),

  updateSet: (exerciseIndex, setIndex, patch) =>
    set((state) => {
      const exercises = state.exercises.map((ex, i) => {
        if (i !== exerciseIndex) return ex;
        return {
          ...ex,
          sets: ex.sets.map((s, j) => (j === setIndex ? { ...s, ...patch } : s)),
        };
      });
      return { exercises };
    }),

  logCurrentSet: (exerciseIndex, setIndex) =>
    get().updateSet(exerciseIndex, setIndex, { completed: true }),

  /** Shape matches dailyLogs/{date}.workoutSession.exercises (Phase 1 §2). */
  buildSessionPayload: ({ perceivedExertion, notes, voiceLogTranscript }) => {
    const state = get();
    const endTime = Date.now();
    return {
      planId: state.planId,
      sessionName: state.sessionName,
      startTime: new Date(state.startTime),
      endTime: new Date(endTime),
      durationMinutes: Math.max(1, Math.round((endTime - state.startTime) / 60000)),
      perceivedExertion: perceivedExertion ?? 5,
      completionStatus: state.exercises.every((ex) => ex.sets.every((s) => s.completed))
        ? 'completed'
        : 'partial',
      notes: notes || null,
      voiceLogTranscript: voiceLogTranscript || null,
      exercises: state.exercises.map((ex) => ({
        exerciseId: ex.exerciseId,
        name: ex.name,
        primaryMuscleGroup: ex.primaryMuscleGroup,
        sets: ex.sets,
      })),
    };
  },

  endSession: () =>
    set({
      isActive: false,
      planId: null,
      sessionName: '',
      startTime: null,
      exercises: [],
      exerciseIndex: 0,
    }),
}));

/** '8-12' -> 8, '5' -> 5, 'AMRAP'/'30s' -> 0 (user fills it in). */
function parseTargetReps(repsRange) {
  if (!repsRange) return 0;
  const match = String(repsRange).match(/\d+/);
  return match ? Number(match[0]) : 0;
}
