// routes/ai.js
const express = require('express');
const router = express.Router();

const verifyToken = require('../middleware/verifyToken');
const perUserThrottle = require('../middleware/perUserThrottle');
const validateBody = require('../middleware/validateBody');
const aiController = require('../controllers/aiController');

const {
  generatePlanRequestSchema,
  estimateNutritionRequestSchema,
  recoveryScoreRequestSchema,
  substituteExerciseRequestSchema,
  chatRequestSchema,
} = require('../schemas/aiSchemas');

// Middleware order: auth -> per-user throttle -> body validation -> controller.
// This ordering matters: never let an unauthenticated or spammy request reach
// Zod/Gemini (Phase 4 §5.5, Phase 5 §2.5).

router.post(
  '/generate-plan',
  verifyToken,
  perUserThrottle,
  validateBody(generatePlanRequestSchema),
  aiController.generateWorkoutPlan
);

router.post(
  '/chat',
  verifyToken,
  perUserThrottle,
  validateBody(chatRequestSchema),
  aiController.chat
);

router.post(
  '/estimate-nutrition',
  verifyToken,
  perUserThrottle,
  validateBody(estimateNutritionRequestSchema),
  aiController.estimateNutrition
);

router.post(
  '/recovery-score',
  verifyToken,
  perUserThrottle,
  validateBody(recoveryScoreRequestSchema),
  aiController.computeRecoveryScore
);

router.post(
  '/substitute-exercise',
  verifyToken,
  perUserThrottle,
  validateBody(substituteExerciseRequestSchema),
  aiController.substituteExercise
);

module.exports = router;
