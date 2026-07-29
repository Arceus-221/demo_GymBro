// controllers/mealPlanController.js
// Implements POST /api/ai/generate-meal-plan — closes the gap flagged in
// Phase 3 SRS §2.6 (Meal Planner screen) and Phase 3's summary card
// ("Schema Gaps Flagged for Phase 4"). Mirrors generateWorkoutPlan's
// structure (Phase 4 §1) exactly: same validate -> Firestore fetch ->
// onboarding gate -> prompt -> resilient Gemini call -> batch write pattern.
//
// New Firestore sub-collection this controller writes to (not in Phase 1's
// original schema, added here per Phase 3 §2.6):
//
//   users/{uid}/mealPlans/{mealPlanId}
//     mealPlanId              string
//     createdAt               timestamp
//     generatedByModel        string
//     planName                string
//     isActive                boolean       // only one true at a time, same
//                                            // convention as workoutPlans
//     durationWeeks           number
//     weeklyMealSchedule      array<map>    // see mealPlanPrompts.js schema
//     aiGenerationContext     map
//       profileSnapshot       map
//       customInstructions    string|null
//
// Also adds `currentMealPlanId` to users/{uid} root doc, analogous to the
// existing `currentPlanId` field for workout plans (Phase 1 §2).
//
// Remember to add the matching Firestore Security Rules block for
// mealPlans (see firestore.rules) before deploying — Firestore denies by
// default, so a missing rules block means this endpoint's writes will
// succeed (Admin SDK bypasses rules) but the client's own reads of
// mealPlans will be denied until the rule exists.

const admin = require('../config/firebase');
const db = admin.firestore();
const { callGeminiResilient } = require('../services/aiResilienceWrapper');
const { TOKEN_LIMITS } = require('../services/geminiService');
const { MEAL_PLAN_SYSTEM_PROMPT, buildMealPlanUserPrompt } = require('../prompts/mealPlanPrompts');

const MEAL_TYPES = ['breakfast', 'lunch', 'dinner', 'snack', 'pre_workout', 'post_workout'];

const validateMealPlanShape = (data) =>
  Array.isArray(data.weeklyMealSchedule) &&
  data.weeklyMealSchedule.length === 7 &&
  data.weeklyMealSchedule.every(day =>
    typeof day.dayLabel === 'string' &&
    Array.isArray(day.meals) &&
    day.meals.length > 0 &&
    day.meals.every(meal =>
      MEAL_TYPES.includes(meal.mealType) &&
      typeof meal.description === 'string' &&
      typeof meal.calories === 'number' &&
      typeof meal.proteinG === 'number' &&
      typeof meal.carbsG === 'number' &&
      typeof meal.fatsG === 'number'
    )
  );

exports.generateMealPlan = async (req, res) => {
  const { weekPreference, mealsPerDay, customInstructions } = req.body;

  try {
    const userRef = db.collection('users').doc(req.user.uid);
    const userSnap = await userRef.get();

    if (!userSnap.exists) {
      return res.status(404).json({ success: false, error: 'USER_NOT_FOUND', message: 'User document does not exist.' });
    }

    const userData = userSnap.data();

    if (!userData.onboardingComplete) {
      return res.status(409).json({
        success: false,
        error: 'ONBOARDING_INCOMPLETE',
        message: 'Complete onboarding before generating a meal plan.',
      });
    }

    const profile = userData.profile;
    const resolvedMealsPerDay = mealsPerDay ?? 3;
    const userPrompt = buildMealPlanUserPrompt(profile, weekPreference, resolvedMealsPerDay, customInstructions);

    const result = await callGeminiResilient(
      MEAL_PLAN_SYSTEM_PROMPT,
      userPrompt,
      TOKEN_LIMITS.MEAL_PLANNER, // 4500 — largest payload in the app (Phase 1 §3E)
      validateMealPlanShape
    );

    // Business-rule check the generic validateShape closure can't see:
    // every day must have exactly resolvedMealsPerDay meals (same philosophy
    // as generateWorkoutPlan's post-callGeminiResilient workoutDaysPerWeek
    // check — Phase 4 §1.3).
    const mealCountMismatch = result.weeklyMealSchedule.some(
      day => day.meals.length !== resolvedMealsPerDay
    );
    if (mealCountMismatch) {
      return res.status(502).json({
        success: false,
        error: 'AI_MALFORMED_OUTPUT',
        message: 'AI returned an unexpected response format.',
      });
    }

    const batch = db.batch();
    const newMealPlanRef = userRef.collection('mealPlans').doc();

    const mealPlanDoc = {
      mealPlanId: newMealPlanRef.id,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      generatedByModel: 'gemini-2.5-flash-lite',
      planName: result.planName,
      isActive: true,
      durationWeeks: result.durationWeeks,
      weeklyMealSchedule: result.weeklyMealSchedule,
      aiGenerationContext: {
        profileSnapshot: profile,
        customInstructions: customInstructions ?? null,
      },
    };

    batch.set(newMealPlanRef, mealPlanDoc);

    if (userData.currentMealPlanId) {
      const oldMealPlanRef = userRef.collection('mealPlans').doc(userData.currentMealPlanId);
      batch.update(oldMealPlanRef, { isActive: false });
    }

    batch.update(userRef, {
      currentMealPlanId: newMealPlanRef.id,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    await batch.commit();

    return res.status(200).json({ success: true, data: { mealPlanId: newMealPlanRef.id, ...mealPlanDoc } });

  } catch (error) {
    return res.status(error.httpStatus || 500).json({
      success: false,
      error: error.code || 'AI_UNKNOWN_ERROR',
      message: error.message || 'Something went wrong generating the meal plan.',
    });
  }
};
