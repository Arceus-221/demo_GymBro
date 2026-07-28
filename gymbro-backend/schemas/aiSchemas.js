// schemas/aiSchemas.js
const { z } = require('zod');

const nonEmptyTrimmedString = (maxLen, fieldName) =>
  z.string()
    .trim()
    .min(1, { message: `${fieldName} must not be empty.` })
    .max(maxLen, { message: `${fieldName} must be ${maxLen} characters or fewer.` });

const generatePlanRequestSchema = z.object({
  weekPreference: z.number().int().min(1).max(12).optional(),
  customInstructions: nonEmptyTrimmedString(500, 'customInstructions').nullable().optional(),
});

const MEAL_TYPES = ['breakfast', 'lunch', 'dinner', 'snack', 'pre_workout', 'post_workout'];

const estimateNutritionRequestSchema = z.object({
  mealDescription: nonEmptyTrimmedString(300, 'mealDescription'),
  mealType: z.enum(MEAL_TYPES, {
    errorMap: () => ({ message: `mealType must be one of: ${MEAL_TYPES.join(', ')}` }),
  }),
});

const recoveryScoreRequestSchema = z.object({
  sleepHours: z.number().min(0).max(12),
  sleepQuality: z.number().int().min(1).max(5),
  muscleSoreness: z.number().int().min(1).max(5),
  energyLevel: z.number().int().min(1).max(5),
  stressLevel: z.number().int().min(1).max(5),
  moodRating: z.number().int().min(1).max(5),
});

const substituteExerciseRequestSchema = z.object({
  exerciseName: nonEmptyTrimmedString(100, 'exerciseName'),
  reason: nonEmptyTrimmedString(300, 'reason'),
  availableEquipment: z.array(z.string()).max(10).optional().default([]),
});

const CONTEXT_TYPES = ['general', 'workout_advice', 'nutrition', 'recovery', 'motivation'];

const chatRequestSchema = z.object({
  message: nonEmptyTrimmedString(2000, 'message'),
  contextType: z.enum(CONTEXT_TYPES).optional(),
  conversationId: z.string().min(1).max(128).optional(),
});

module.exports = {
  generatePlanRequestSchema,
  estimateNutritionRequestSchema,
  recoveryScoreRequestSchema,
  substituteExerciseRequestSchema,
  chatRequestSchema,
};
