/**
 * Client-side daily targets for the calorie ring and macro bars.
 * Mifflin-St Jeor BMR with a moderate activity factor, adjusted by goal.
 * This is display-only — no AI call backs it, and the backend's meal plan
 * does its own independent calorie reasoning.
 */
const GOAL_ADJUSTMENT = {
  fat_loss: -0.18,
  muscle_gain: 0.12,
  endurance: 0.05,
  maintenance: 0,
};

const DEFAULT_TARGETS = { calories: 2000, proteinG: 140, carbsG: 220, fatsG: 60 };

export function computeDailyTargets(profile) {
  if (!profile?.weightKg || !profile?.heightCm || !profile?.age) return DEFAULT_TARGETS;

  const { weightKg, heightCm, age, gender, fitnessGoal, workoutDaysPerWeek } = profile;
  const genderOffset = gender === 'female' ? -161 : 5;
  const bmr = 10 * weightKg + 6.25 * heightCm - 5 * age + genderOffset;

  // Activity factor scales with programmed training days rather than asking
  // the user a separate lifestyle question during onboarding.
  const activityFactor = 1.35 + Math.min(6, workoutDaysPerWeek ?? 3) * 0.03;
  const maintenance = bmr * activityFactor;
  const calories = Math.round(maintenance * (1 + (GOAL_ADJUSTMENT[fitnessGoal] ?? 0)));

  const proteinG = Math.round(weightKg * (fitnessGoal === 'muscle_gain' ? 2.0 : 1.8));
  const fatsG = Math.round((calories * 0.25) / 9);
  const carbsG = Math.max(0, Math.round((calories - proteinG * 4 - fatsG * 9) / 4));

  return { calories, proteinG, carbsG, fatsG };
}

/** Sums the saved meals — aiEstimatedTotals is app-computed, not AI-returned. */
export function sumMealTotals(meals = []) {
  return meals.reduce(
    (totals, meal) => {
      const estimate = meal.aiEstimate ?? {};
      return {
        calories: totals.calories + (estimate.calories ?? 0),
        proteinG: totals.proteinG + (estimate.proteinG ?? 0),
        carbsG: totals.carbsG + (estimate.carbsG ?? 0),
        fatsG: totals.fatsG + (estimate.fatsG ?? 0),
        fiberG: totals.fiberG + (estimate.fiberG ?? 0),
      };
    },
    { calories: 0, proteinG: 0, carbsG: 0, fatsG: 0, fiberG: 0 }
  );
}
