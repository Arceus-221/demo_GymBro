// models/index.js — JSDoc typedefs mirroring the Firestore schema (Phase 1 §2).
// Reference only: this project is plain JS, and `tsc --checkJs` in CI is what
// catches drift between these shapes and actual usage.

/**
 * @typedef {Object} UserProfile
 * @property {number} age
 * @property {'male'|'female'|'other'|'prefer_not_to_say'} gender
 * @property {number} heightCm
 * @property {number} weightKg
 * @property {number|null} targetWeightKg
 * @property {'fat_loss'|'muscle_gain'|'maintenance'|'endurance'} fitnessGoal
 * @property {'beginner'|'intermediate'|'advanced'} experienceLevel
 * @property {string[]} availableEquipment
 * @property {'none'|'vegetarian'|'vegan'|'halal'|'keto'} dietaryPreference
 * @property {number} workoutDaysPerWeek
 * @property {number} preferredDurationMinutes
 * @property {string|null} medicalNotes
 */

/**
 * @typedef {Object} UserStats
 * @property {number} totalWorkoutsCompleted
 * @property {number} currentStreakDays
 * @property {number} longestStreakDays
 * @property {string|null} lastWorkoutDate
 */

/**
 * @typedef {Object} UserDoc
 * @property {string} uid
 * @property {string} displayName
 * @property {string} email
 * @property {string|null} photoURL
 * @property {boolean} onboardingComplete
 * @property {string|null} currentPlanId
 * @property {string|null} [currentMealPlanId]
 * @property {UserProfile} profile
 * @property {UserStats} stats
 */

/**
 * @typedef {Object} PlanExercise
 * @property {string} exerciseId
 * @property {string} name
 * @property {'compound'|'isolation'|'cardio'|'mobility'} category
 * @property {string} primaryMuscleGroup
 * @property {number} sets
 * @property {string} repsRange
 * @property {number} restSeconds
 * @property {string} formCue
 * @property {string[]} substituteExercises
 */

/**
 * @typedef {Object} PlanDay
 * @property {string} dayLabel
 * @property {boolean} isRestDay
 * @property {string} sessionName
 * @property {string[]} targetMuscleGroups
 * @property {number} estimatedDurationMinutes
 * @property {PlanExercise[]} exercises
 */

/**
 * @typedef {Object} WorkoutPlan
 * @property {string} planId
 * @property {string} planName
 * @property {boolean} isActive
 * @property {number} durationWeeks
 * @property {PlanDay[]} weeklySchedule
 */

/**
 * Returned by POST /api/ai/generate-meal-plan. Note this is a single
 * `description` string per meal — there is no localName/englishGloss split.
 * @typedef {Object} PlannedMeal
 * @property {'breakfast'|'lunch'|'dinner'|'snack'|'pre_workout'|'post_workout'} mealType
 * @property {string} description
 * @property {number} calories
 * @property {number} proteinG
 * @property {number} carbsG
 * @property {number} fatsG
 */

/**
 * @typedef {Object} MealPlan
 * @property {string} mealPlanId
 * @property {string} planName
 * @property {boolean} isActive
 * @property {number} durationWeeks
 * @property {{dayLabel: string, meals: PlannedMeal[]}[]} weeklyMealSchedule
 */

/**
 * @typedef {Object} LoggedSet
 * @property {number} setNumber
 * @property {number} repsCompleted
 * @property {number} weightKg
 * @property {boolean} isWarmupSet
 * @property {boolean} completed
 */

/**
 * @typedef {Object} DailyLog
 * @property {string} date
 * @property {string} uid
 * @property {Object|null} workoutSession
 * @property {Object|null} nutritionLog
 * @property {Object|null} recoveryLog
 */

/**
 * @typedef {Object} ChatMessage
 * @property {string} messageId
 * @property {'user'|'assistant'} role
 * @property {string} content
 * @property {any} timestamp
 */

export {};
