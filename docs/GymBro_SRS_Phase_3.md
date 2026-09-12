# GymBro — Phase 3 SRS

## Frontend Architecture & Detailed UI/UX Specifications

> **Continuity Note:** This document extends `GymBro_SRS_Phase_1.md` (data flow, Firestore schema, backend) and `GymBro_SRS_Phase_2.md` (AI prompt specs). All screen specs below assume Path A (direct Firestore SDK) for CRUD and Path B (`callBackend()` from Phase 1 §3I) for every AI-touching action. Every Firestore field referenced here maps directly to the schema in Phase 1 §2.

---

## 1. Folder Structure & Modular Component Tree

GymBro uses **Expo Router** (file-based routing) rather than manually wired React Navigation stacks — this keeps deep-linking, auth-gating, and tab structure declarative and colocated with the screens themselves.

```
gymbro-app/
├── app/                                   ← Expo Router file-based routes
│   ├── _layout.jsx                        ← Root layout: theme provider, auth listener, offline banner
│   ├── index.jsx                          ← Splash/redirect: routes to (auth) or (tabs) based on auth state
│   │
│   ├── (auth)/                            ← Unauthenticated stack
│   │   ├── _layout.jsx
│   │   ├── sign-in.jsx
│   │   └── sign-up.jsx
│   │
│   ├── (onboarding)/                      ← Shown once, gated by users/{uid}.onboardingComplete
│   │   ├── _layout.jsx                    ← Step-count footer (dashes), back-swipe disabled
│   │   ├── goal.jsx                       ← Step 1 of 3 (§2.1)
│   │   ├── profile-details.jsx            ← Step 2 of 3: experience/body stats/equipment/diet
│   │   └── schedule-summary.jsx           ← Step 3 of 3: schedule + review → writes users/{uid}.profile
│   │
│   └── (tabs)/                            ← Main authenticated app, bottom tab navigator
│       ├── _layout.jsx                    ← Tab bar config — 4 tabs (HOME/TRAIN/MEALS/AI, §2.0),
│       │                                    dark theme, icon set; no Progress tab
│       ├── index.jsx                      ← Home Dashboard
│       ├── workout/
│       │   ├── index.jsx                  ← Workout Mode (single-exercise focus screen, §2.3)
│       │   └── [planId].jsx               ← View a specific historical/alternate plan
│       ├── coach/
│       │   ├── index.jsx                  ← Conversation list (if >1 active conversation)
│       │   └── [conversationId].jsx       ← AI Coach chat screen
│       └── nutrition/
│           └── index.jsx                  ← AI Meal Planner screen (merged daily plan + manual log, §2.5)
│
├── app/(profile)/                         ← Reached via Dashboard's "PROFILE" quick-action tile,
│   └── progress/                          │  not a bottom tab (§2.0); Progress screen (§2.7) lives
│       └── index.jsx                      │  here, pending its own Figma design
│
├── components/
│   ├── onboarding/
│   │   ├── OnboardingCard.jsx             ← Shared card shell (title, subtitle, footer nav)
│   │   ├── GoalSelector.jsx               ← Full-width vertical option rows, single-select (§2.1)
│   │   ├── EquipmentGrid.jsx              ← Multi-select chip grid
│   │   └── StepProgress.jsx               ← "STEP n OF 3" label + dash-segment bar (replaces ProgressDots)
│   │
│   ├── dashboard/
│   │   ├── TodayWorkoutCard.jsx           ← Red→black gradient card, muscle tags, inline start CTA
│   │   ├── ConsistencyRing.jsx            ← recharts RadialBarChart, % this week
│   │   ├── WeeklyGrid.jsx                 ← 7-day checkmark strip + progress bar
│   │   ├── StatTile.jsx                   ← STREAK / WORKOUTS / CALORIES 3-up row
│   │   ├── QuickActionTile.jsx            ← Meal Plan / AI Coach / Profile
│   │   └── AICoachFAB.jsx                 ← Floating circular button, global to Dashboard only
│   │
│   ├── workout/
│   │   ├── ExerciseSelectorStrip.jsx      ← Horizontal pill scroller, ✓ for completed, tap-to-jump
│   │   ├── SetStatTiles.jsx               ← Big SET/REPS/WEIGHT tiles for the focused exercise
│   │   ├── SetLogTable.jsx                ← set/reps/kg/status rows (formerly SetRow[])
│   │   ├── InlineRestTimerCard.jsx        ← In-flow rest timer (replaces RestTimerModal overlay)
│   │   └── WorkoutSummaryModal.jsx        ← Shown on "Finish Workout"
│   │   (SubstituteSheet.jsx / VoiceLogButton.jsx retained from Phase 2 spec but have no
│   │    placement in the current design — see §2.3 revision note)
│   │
│   ├── coach/
│   │   ├── ChatBubble.jsx                 ← role-aware styling (assistant=red/left, user=black/right)
│   │   ├── ChatInputBar.jsx               ← mic button + text input + send button
│   │   ├── StatusChipBar.jsx              ← Read-only chips: workout day, calories, streak (§2.4)
│   │   ├── QuickReplyRow.jsx              ← Canned-prompt chips, sends on tap
│   │   ├── HeaderQuickJump.jsx            ← Dumbbell → Workout, BarChart3 → Progress icon buttons
│   │   ├── TypingIndicator.jsx
│   │   └── ConversationListItem.jsx
│   │
│   ├── nutrition/                         ← Now backs the single merged AI Meal Planner screen (§2.5)
│   │   ├── CalorieRingPanel.jsx           ← Ring + per-macro progress bars, dark header panel
│   │   ├── QuickStatPills.jsx             ← kcal / water / protein pill row
│   │   ├── MealCard.jsx                  ← localName + englishGloss, macro mini-stats, tags, swap CTA
│   │   ├── AICoachTipCard.jsx             ← Macro-gap nudge + "ADJUST PLAN" deep-link
│   │   ├── RegeneratePlanButton.jsx
│   │   ├── MealInputBar.jsx               ← text input + voice trigger (the "+ ADD" manual flow)
│   │   ├── MacroEstimatePreviewCard.jsx   ← shown post-AI-call, pre-save
│   │   └── MealTypeSelector.jsx
│   │
│   ├── progress/                          ← Pending its own Figma design (§2.7); component shapes
│   │   ├── WeightProgressChart.jsx        │  below are provisional, not validated against §2.0
│   │   ├── PRTrackerTable.jsx
│   │   ├── VolumeBarChart.jsx             ← weekly sets-per-muscle-group
│   │   └── DateRangeToggle.jsx            ← 1M / 3M / 6M / All
│   │
│   └── shared/
│       ├── Eyebrow.jsx                    ← Letter-spaced uppercase micro-label (§2.0 typography)
│       ├── Heading.jsx                    ← Weight-900, tight-tracking poster headline (§2.0)
│       ├── Button.jsx
│       ├── Card.jsx
│       ├── LoadingSpinner.jsx
│       ├── OfflineBanner.jsx              ← global, driven by NetInfo + Firestore metadata.fromCache
│       ├── ErrorToast.jsx                 ← consumes standardized error contract (Phase 2 §7.6)
│       ├── EmptyState.jsx
│       └── BottomSheet.jsx
│
├── store/                                 ← Zustand stores (see §3)
│   ├── useAuthStore.js
│   ├── useUserProfileStore.js
│   ├── useActiveWorkoutStore.js           ← ephemeral, in-progress session state
│   ├── useUIStore.js                      ← modals, sheets, toasts, active tab
│   └── useConnectivityStore.js            ← online/offline + pending-write count
│
├── hooks/
│   ├── useFirestoreDoc.js                 ← reusable onSnapshot wrapper w/ Firestore converter
│   ├── useFirestoreCollection.js
│   ├── useCallBackend.js                  ← wraps Phase 1 §3I callBackend() with loading/error state
│   ├── useVoiceCapture.js                 ← Expo Speech / Whisper API abstraction
│   ├── useRestTimer.js
│   └── useOptimisticWrite.js              ← generic optimistic-update + rollback helper
│
├── services/
│   ├── firebase.js                        ← client SDK init + offline persistence config
│   ├── firestoreConverters.js             ← withConverter() for every collection (JSDoc-typed, not TS)
│   ├── apiClient.js                       ← from Phase 1 §3I
│   └── analytics.js
│
├── models/                                ← plain JS shape references + JSDoc typedefs (no TypeScript)
│   ├── user.js                            ← mirrors Phase 1 users/{uid} schema
│   ├── workoutPlan.js
│   ├── dailyLog.js
│   ├── aiConversation.js
│   └── api.js                             ← request/response shapes per Phase 2 endpoint
│
├── constants/
│   ├── theme.js                           ← brand color tokens, spacing scale, typography (§2.0)
│   └── equipment.js                       ← the 7 availableEquipment enum values, labeled
│
└── app.json / eas.json / package.json
```

**Component tree conventions:**

- Every screen component is a thin composition layer — data fetching lives in hooks, presentation lives in `components/`.
- No screen directly calls `firestore()` or `fetch()` — always through `hooks/useFirestoreDoc`, `useFirestoreCollection`, or `useCallBackend`, so retry/offline/error handling is centralized exactly once (mirrors the Phase 2 §7.2 backend philosophy, applied client-side).

---

## 2. Screen-by-Screen Technical Specifications

### 2.0 Visual Design System & Brand Identity (Figma Reference)

> This subsection is new in this revision, added to bring the spec in line with the high-fidelity UI prototype built in Figma (`/figma` project — `SplashScreen`, `GoalScreen`, `DashboardScreen`, `WorkoutScreen`, `MealPlanScreen`, `AICoachScreen`). Every layout diagram in §2.1–2.6 below has been redrawn to match that prototype pixel-for-pixel in structure. Where the prototype diverges from what earlier revisions of this document assumed, the divergence is called out explicitly rather than silently papered over.

**Brand identity:** "GYMBRO" — bold, high-contrast, gym-poster energy rather than a soft wellness-app look. Wordmark is always rendered as `GYM` in ink black immediately followed by `BRO` in brand red, heavy weight, tight negative letter-spacing.

**Color palette** (replaces the placeholder "dark palette, spacing scale, typography" note against `constants/theme.js` in §1):

|Token|Hex|Usage|
|---|---|---|
|`brand.red` (primary)|`#EF0000`|Primary actions, active states, streak/flame accents, chart fills|
|`ink.black`|`#111111`|Headers, dark surfaces, primary text on light backgrounds|
|`ink.deep`|`#0A0A0A`|Full-immersion surfaces (Workout Mode background, splash gradient)|
|`surface.light`|`#FFFFFF`|Default screen background (Onboarding, Dashboard, Meal Planner, Coach)|
|`surface.muted`|`#F8F8F8` / `#FAFAFA`|Card backgrounds, chat canvas|
|`border.default`|`#E0E0E0` / `#F0F0F0`|Card borders, dividers|
|`text.muted`|`#888888` / `#AAAAAA` / `#555555`|Secondary/tertiary text, letter-spaced eyebrow labels|
|`success`|`#22C55E`|Online/status dots only|

`constants/theme.js` should export these as the actual token values (not placeholders), plus the type scale below.

**Typography:** System font stack (`-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif`). Headings and stat numbers use weight **900** with tight/negative letter-spacing (`-0.5px` to `-1px`) for a "shouting" poster feel; small labels (eyebrows, tab captions, section headers) are weight 700, uppercase, letter-spaced `+1px` to `+3px`, and small (9–11px). Body copy is weight 500–600, muted gray, 12–14px. This convention (bold poster headline + letter-spaced uppercase micro-label) repeats on every screen and should be pulled into a shared `Heading`/`Eyebrow` pair of components in `components/shared/` rather than re-styled per screen.

**Navigation shape — supersedes the 5-tab assumption elsewhere in this document:** The prototype's bottom tab bar has **4 tabs**, not 5: `HOME`, `TRAIN`, `MEALS`, `AI`. There is no `PROGRESS` tab. Progress is reachable only via the `Profile` quick-action tile on the Dashboard (§2.2) — as of this prototype, Progress has no Figma screen of its own yet (flagged in §2.7). A floating circular "AI Coach" FAB (black circle, red ring, bot icon) additionally floats above the tab bar on the Dashboard for one-tap access to Coach from the home screen; this is in addition to, not a replacement for, the `AI` tab.

**Screen-background convention:** Most screens are light (`#FFFFFF`) with a near-black header bar (`#111111`) — the exception is the Workout Screen, which goes fully immersive dark (`#0A0A0A`) with a faint animated red-glow/grid background, signaling "focus mode" distinctly from the rest of the app.

---

### 2.1 Onboarding Flow Screen

**Route:** `app/(onboarding)/*.jsx` — **3-step wizard** (revised down from the 6-step wizard assumed in earlier revisions of this document), one screen per step, step-count pill + progress dashes in the footer (`STEP 1 OF 3`, three dash segments, not a 6-dot header indicator).

> **Revision note:** the Figma prototype's `GoalScreen` renders a footer reading `STEP 1 OF 3` with 3 progress dashes. The original 6-screen breakdown (`goals` / `experience` / `equipment` / `diet` / `schedule` / `summary`) is consolidated into 3 screens below so the implementation matches the designed step count. All the same `profile` fields are still collected — they're just grouped differently across fewer screens.

**Layout (per step, e.g. Step 1 — Goal):**

```
┌─────────────────────────────────┐
│  ▍ONBOARDING                    │  ← red tab + eyebrow label, pt-14 top pad
│  WHAT'S YOUR                    │  ← H1, 34px/900, two lines, tight tracking
│  MAIN GOAL?                     │
│  Select one to personalize...   │  ← muted subtitle
├─────────────────────────────────┤
│ ┌─────────────────────────────┐ │
│ │ [icon] Fat Loss          ⚪ │ │  ← full-width option row (not a 2x2 grid):
│ │        Burn calories & lean │ │     64x64 icon tile, label, sub-label,
│ └─────────────────────────────┘ │     circular check-mark on the right
│ ┌─────────────────────────────┐ │
│ │ [icon] Muscle Gain       ⚫ │ │  ← selected state: red 2.5px border,
│ │        Build strength & size│ │     tinted #FFF5F5 fill, red left-edge
│ └─────────────────────────────┘ │     stripe, filled red check-circle
│ ┌─────────────────────────────┐ │
│ │ [icon] Endurance         ⚪ │ │
│ │        Boost stamina & cardio│ │
│ └─────────────────────────────┘ │
├─────────────────────────────────┤
│ STEP 1 OF 3        [ NEXT → ]   │  ← footer: step label + 3-dash progress
│ ▬▬▬ ▬ ▬                          │     (left) vs. red pill CTA (right)
└─────────────────────────────────┘
```

**Step mapping to `profile` fields:**

|Step|Screen|Fields Collected|Component|
|---|---|---|---|
|1|`goal.jsx`|`fitnessGoal` (Fat Loss / Muscle Gain / Endurance — single-select vertical list, not a 2×2 grid)|`GoalSelector` (full-width option rows, icon tile + label + sub-label + trailing check-circle)|
|2|`profile-details.jsx`|`experienceLevel`, `age`, `gender`, `heightCm`, `weightKg`, `availableEquipment`, `dietaryPreference`, `targetWeightKg` (optional)|Segmented controls + numeric inputs + `EquipmentGrid` multi-select chips + radio list, grouped on one scrollable step|
|3|`schedule-summary.jsx`|`workoutDaysPerWeek`, `preferredDurationMinutes`, `medicalNotes` (optional free text), plus a review/edit summary of steps 1–2|Stepper (2–6) + segmented duration (30/45/60/90) + `TextInput` + read-only recap list, editable via tap-to-jump-back|

**State requirements:**

- A single `useOnboardingDraftStore` (Zustand, not persisted to Firestore until final submit) holds the in-progress `profile` object across all 3 steps — avoids partial writes to Firestore mid-flow.
- Each step screen reads/writes only its own slice of the draft via selector hooks (`useOnboardingDraftStore(s => s.fitnessGoal)`), preventing unnecessary re-renders of unrelated fields.
- `schedule-summary.jsx` is the **only** screen that performs the Firestore write: a single `users/{uid}.set({ profile: draft, onboardingComplete: true, updatedAt: serverTimestamp() }, { merge: true })` (Path A). On success, root layout's auth listener re-evaluates and routes to `(tabs)`.

**User actions:**

- Tap an option row → updates draft store, no network call; selected row gets the red border/tint/left-stripe/filled-checkmark treatment shown above.
- "NEXT →" (red pill, bottom-right) → validates required field(s) for that step present, pushes next route.
- "← Back" → `router.back()`, draft store retains prior values (no reset).
- Final "Finish Setup" (on `schedule-summary.jsx`) → shows `LoadingSpinner` over button during the Firestore write, then triggers **Path B** call to `/api/ai/generate-plan` automatically (first plan generation is part of onboarding completion, not a separate user action) before navigating to Home Dashboard, so the user's first-ever screen already has a plan waiting.

---

### 2.2 Home Dashboard Screen

**Route:** `app/(tabs)/index.jsx`

**Layout (revised to match `DashboardScreen` prototype):**

```
┌─────────────────────────────────┐
│ ● GYMBRO              🔥7  ⚡   │  ← black status strip: brand dot + wordmark
├─────────────────────────────────┤    (left), streak flame + zap icon (right)
│  MONDAY, MAY 25                 │  ← eyebrow date label
│  GOOD MORNING,                  │  ← H1 900/28px, second line in brand red
│  SAAD                           │
│                                  │
│ ┌────────┐┌────────┐┌─────────┐│  ← 3-up stat row: STREAK / WORKOUTS /
│ │7 days  ││ 3 / 5  ││  2,450  ││     CALORIES — streak tile gets a red
│ │STREAK  ││WORKOUTS││CALORIES ││     accent border, others neutral
│ └────────┘└────────┘└─────────┘│
│                                  │
│ ┌───────────────────────────┐   │
│ │ TODAY'S WORKOUT             │  │  ← TodayWorkoutCard: full-bleed red→black
│ │ DAY 1: FULL BODY PUSH       │  │     gradient card with concentric-circle
│ │ [Chest][Shoulders][Triceps] │  │     bg pattern, muscle-group pill tags,
│ │                DURATION 55m │  │     duration + exercise count top-right
│ │                6 exercises  │  │
│ │   ▶ START WORKOUT           │  │  ← full-width CTA strip inside the card
│ └───────────────────────────┘   │
│                                  │
│ ┌──────────┐┌──────────────┐   │
│ │CONSISTENCY││  THIS WEEK    │  │  ← radial ring (dark tile, left) +
│ │  ⭕ 60%   ││ M T W T F S S │  │     weekly checkmark grid (light tile,
│ │This week  ││ ✓ ✓ ✓ · · · · │  │     right) with a 3/7 progress bar
│ └──────────┘│  ▓▓▓░░░░ 3/7  │   │
│              └──────────────┘   │
│                                  │
│  QUICK ACTIONS                  │
│ [🍎 MEAL PLAN][💬 AI COACH][👤 PROFILE] │  ← 3-up quick-action tiles
│                                  │
│                        ⬤ (FAB)  │  ← floating black/red AI Coach FAB,
│ [HOME][TRAIN][MEALS][AI]        │     sits above the 4-tab bottom nav
└─────────────────────────────────┘
```

> **Revision note:** the prototype has no `AIMotivationBanner`, `RecoveryScoreRing`, or `CalorieSnapshotCard` on the Dashboard — those Phase-1/2-era concepts are superseded by the layout above. Recovery check-in and a running calorie snapshot are not surfaced on this screen in the current design; if they're still wanted, they'd need a new Figma pass rather than being assumed present. The 5-tab/`Progress`-tab assumption is also gone — see §2.0.

**State requirements:**

- `useFirestoreDoc('users/{uid}')` — live subscription (Path A, `onSnapshot`) for `profile`, `stats` (`currentStreakDays`, `totalWorkoutsCompleted` this week, streak-week completion flags), `currentPlanId`.
- `useFirestoreDoc('users/{uid}/workoutPlans/{currentPlanId}')` — active plan, derives today's `dayLabel` entry (name, muscle groups, duration, exercise count) client-side by matching current weekday against `weeklySchedule`; drives the `TodayWorkoutCard` gradient card's copy. All hooks in `hooks/` are plain JavaScript — no generics, no interfaces; shape expectations for each collection are documented via JSDoc `@typedef` comments in `models/` purely as developer reference, not enforced at compile time.
- `useFirestoreDoc('users/{uid}/dailyLogs/{today}')` — today's log document; `workoutSession.completionStatus` and the day-of-week completion flags backing the weekly checkmark grid are read from this subscription (and, for the rest of the week, from the equivalent documents fetched for the current ISO week).
- The `CONSISTENCY` radial ring is a simple client-computed percentage (days completed ÷ days elapsed so far this week), rendered with `recharts`' `RadialBarChart` — no separate AI call backs it.
- Calorie total shown in the stat row is `dailyLogs/{today}.nutritionLog.aiEstimatedTotals.calories`; no macro breakdown is shown inline on this screen (macro detail now lives on the merged Meal Planner screen, §2.5).

**User actions:**

- Tap `TodayWorkoutCard` / its "▶ START WORKOUT" strip → navigate to `workout/index.jsx`.
- Tap the "MEAL PLAN" quick-action tile (or the `MEALS` tab) → navigate to `nutrition/index.jsx` (§2.5).
- Tap the "AI COACH" quick-action tile, the `AI` tab, **or** the floating Coach FAB → navigate to `coach/[conversationId].jsx`.
- Tap the "PROFILE" quick-action tile → navigate to a Profile screen (out of scope for this spec; this is also the only current entry point toward Progress, §2.7, until that screen is designed).
- Pull-to-refresh → forces `getDocFromServer()` on the subscriptions above to bypass cache (useful right after a Render cold-start recovers).

---

### 2.3 Workout Screen

**Route:** `app/(tabs)/workout/index.jsx`

**Layout (revised — replaces the collapsible-list design with the prototype's immersive, single-exercise "Workout Mode"):**

```
┌─────────────────────────────────┐  ← full-bleed #0A0A0A background,
│ ← Back  WORKOUT MODE      🔥247 │     faint red-glow blur + 6.25%-opacity
│         DAY 1: FULL BODY PUSH   │     grid lines behind everything
├─────────────────────────────────┤
│ [1.BENCH✓][2.SHOULDER][3.PUSH-UP][4.DIPS] │ ← horizontal exercise selector
│                                  │    strip; done=red pill w/ ✓, upcoming=
│                                  │    dark outline pill, tap jumps directly
│  CHEST / TRICEPS                │  ← muted eyebrow: current exercise's
│  BENCH PRESS                    │     muscle group, then huge red H1 name
│                                  │     (38px/900) — one exercise at a time,
│ ┌──────┐┌──────┐┌──────────┐   │     not a scrollable card list
│ │ SET  ││ REPS ││  WEIGHT   │   │  ← 3 big stat tiles: current set/4,
│ │2 of 4││  8   ││  60 kg    │   │     target reps, target weight
│ └──────┘└──────┘└──────────┘   │
│ ┌─────────────────────────────┐ │
│ │SET│REPS│KG│STATUS            │ │  ← per-set log table, 4 rows, current
│ │ 1 │ 8  │60│ ✓ (red, done)    │ │     row highlighted, ✓/pulsing-dot/
│ │ 2 │ 8  │60│ ● (pulsing)      │ │     idle-dot per row
│ │ 3 │ 6  │65│ ○                │ │
│ │ 4 │ 6  │65│ ○                │ │
│ └─────────────────────────────┘ │
│ ┌─────────────────────────────┐ │
│ │ ⏱ REST TIMER      1:30  SKIP│ │  ← inline rest-timer card (not a modal),
│ └─────────────────────────────┘ │     appears after logging a set
│ [   ✓ LOG SET   ] [⏱ REST]      │  ← primary CTA (2:1 width) + manual
│ NEXT: SHOULDER PRESS →          │     rest trigger; footer link advances
└─────────────────────────────────┘     to the next exercise in the strip
```

> **Revision note:** the prototype presents the workout as one focused exercise at a time (selector strip + big stat tiles + per-set log table), not a scrollable list of collapsible `ExerciseCard`s with inline `SetRow`s. The rest timer is an **inline card in the flow**, not a separate `RestTimerModal` overlay. There is no visible "Substitute" or "Voice Log" affordance in this screen's current design — those Phase-1/2 interactions (`SubstituteSheet`, `VoiceLogButton`) are **not dropped from the product**, but they have no home in this mock yet; recommend either a future icon-button row under the set table, or folding "substitute this exercise" into the AI Coach chat (§2.4) via its `Dumbbell` quick-jump button, which already deep-links Coach → Workout context.

**Component hierarchy (revised):**

```
WorkoutScreen
 └─ SessionHeader (back, "WORKOUT MODE" eyebrow + day label, live calorie counter)
 └─ ExerciseSelectorStrip (horizontal scroll, one pill per exercise, ✓ for completed, tap-to-jump)
 └─ ExerciseFocusPanel (for the current exercise only)
     ├─ ExerciseTitle (muscle group eyebrow + huge exercise name)
     ├─ SetStatTiles (SET n/total, REPS target, WEIGHT target)
     ├─ SetLogTable (SetRow[] — set/reps/kg/status, current row highlighted)
     ├─ InlineRestTimerCard (shown conditionally, not a modal; SKIP button)
     └─ ActionRow ("LOG SET" primary CTA, "REST" secondary trigger)
 └─ NextExerciseLink (footer, advances ExerciseSelectorStrip's active index)
 └─ WorkoutSummaryModal (shown after the last exercise's "Finish Workout")
```

**State requirements:**

- `useActiveWorkoutStore` (Zustand, in-memory only, not Firestore-backed until finish) holds the entire in-progress `workoutSession` object: per-exercise, per-set `repsCompleted`, `weightKg`, `completed`, `isWarmupSet`, plus the currently-focused `exerciseIndex` and `currentSet` pointers that drive the selector strip and stat tiles. This is the **single source of truth** during the session — Firestore is not touched per-set to avoid write-quota churn and to keep set-logging instant even with poor gym Wi-Fi.
- `startTime` is captured client-side (`Date.now()`) the moment the screen mounts and the user has not yet finished; not written to Firestore until "Finish Workout". The live calorie counter in the header is a client-side estimate derived from elapsed time × plan intensity, not an AI call.
- The inline rest-timer card reads `restSeconds` from the just-completed exercise's plan data and starts a countdown; runs via `useRestTimer` hook using `Date.now()` deltas (not `setInterval` alone) so backgrounding the app doesn't desync the timer. "SKIP" dismisses it immediately.
- Tapping a pill in `ExerciseSelectorStrip` or "LOG SET" is instant local state — no loading spinner, no network call.

**User actions & optimistic flow:**

1. User taps "✓ LOG SET" for the current set → `useActiveWorkoutStore` advances `currentSet`, marks the row `done`, and the inline rest-timer card appears automatically (dismissible via "SKIP").
2. Tapping a pill in the exercise selector strip jumps `exerciseIndex` directly to that exercise (all local state — no confirmation needed, since nothing has been lost).
3. "NEXT: <exercise name> →" footer link advances to the next exercise once all sets for the current one are logged.
4. On the final exercise, "Finish Workout" opens `WorkoutSummaryModal` (perceivedExertion slider, notes field) → on confirm, performs **one single Firestore write** (Path A): `users/{uid}/dailyLogs/{today}.set({ workoutSession: {...fullSessionFromStore} }, { merge: true })`, plus a batched increment of `stats.totalWorkoutsCompleted` and streak fields. This is the **optimistic UI update** described in §3.2 — the modal closes and the app navigates back to Home Dashboard immediately, before Firestore's write acknowledgment returns, using Firestore's built-in local-write optimism (see §3.3).

---

### 2.4 AI Coach Screen

**Route:** `app/(tabs)/coach/[conversationId].jsx`

**Layout (revised to match `AICoachScreen` prototype):**

```
┌─────────────────────────────────┐
│ ← [🤖]  GYMBRO AI COACH   [🏋][📊]│ ← black header: back, animated robot-
│    ● Online · Always here      │    face avatar (red tile, online dot),
├─────────────────────────────────┤    name + status, and 2 quick-jump icon
│[🏋 Day1 Push][🍎 1890kcal][⚡7day]│    buttons (→ Workout, → Progress)
│                                  │  ← ContextChipSelector, now read-only
│ [🤖] ┌──────────────────────┐   │    "state chips" (current workout day,
│      │ Hey Saad! I've analyzed│  │    today's calories, streak) rather
│      │ your progress this week│ │    than a tappable filter — see note
│      └──────────────────────┘   │    below
│         ┌──────────────┐  [S]  │
│         │ my shoulder   │       │  ← ChatBubble (user, right-aligned,
│         │ feels off     │       │     black bubble, initial-avatar tile)
│         └──────────────┘        │
│ [🤖] ┌──────────────────────┐   │  ← ChatBubble (assistant, left-aligned,
│      │ Got it — let's ease up│  │     brand-red bubble, robot avatar tile)
│      │ on overhead pressing  │  │
│      └──────────────────────┘   │
│ [🤖] ● ● ●  (typing indicator)  │
├─────────────────────────────────┤
│[Log workout][Update meal plan]  │ ← quick-reply chip row (tappable
│[Check progress][Rest day advice]│    canned prompts, sends on tap)
├─────────────────────────────────┤
│ [🎙]  Ask your AI coach...  [➤]│ ← mic button (voice capture) + text
└─────────────────────────────────┘    input + send button
```

> **Revision note:** the chat bubble color convention is **reversed** from a typical messaging UI — the assistant's bubble is brand red, the user's is black — and the header now carries two quick-jump icon buttons (`Dumbbell` → Workout Screen, `BarChart3` → Progress) plus a bar of **read-only status chips** (current workout day, today's logged calories, streak count) rather than the originally-specified tappable `ContextChipSelector` filter row. Functionally, `contextType` (Phase 2 §5.4) should still be inferred and sent with each request — the chips just no longer double as the input mechanism for it; instead, infer it from which quick-reply/quick-jump the user used, or default to `undefined` for freeform typed messages. A quick-reply chip row (`Log today's workout`, `Update meal plan`, `Check my progress`, `Rest day advice`) is a new addition that sends a canned prompt on tap, going through the exact same optimistic send flow as typed input.

**State requirements:**

- `useFirestoreCollection('users/{uid}/aiConversations/{conversationId}/messages', orderBy('timestamp', 'asc'), limitToLast(30))` — live subscription; only the last 30 messages are subscribed client-side for render performance, independent of the backend's separate "last 10 for Gemini context" window (Phase 2 §5.2) — these are two different windows for two different purposes and must not be conflated.
- Local `draftMessage` state for the input bar (not global — resets per screen mount).
- `isSending` boolean local state drives the `TypingIndicator` and disables the send button during the Path B round trip.
- The status-chip bar reads directly from already-subscribed data (`currentPlanId`'s today entry, `dailyLogs/{today}.nutritionLog.aiEstimatedTotals`, `stats.currentStreakDays`) — no separate fetch of its own.
- `selectedContextType` local state, defaults to `undefined` → sent as `contextType` in the request body (Phase 2 §5.4); set implicitly when a quick-reply chip is tapped (e.g. `"Log today's workout"` → `'workout_advice'`).

**User actions:**

1. Type message or tap a quick-reply chip, then send → `ChatInputBar` clears instantly, an **optimistic** `ChatBubble` for the user's message renders immediately in local state (not yet in Firestore) while `useCallBackend('/api/ai/chat', {...})` is in flight.
2. Tap the mic icon → `useVoiceCapture` transcribes speech into the input field (same client-side transcription pattern as Nutrition's voice input, §2.5); does not auto-send.
3. On success: backend has already written both the user message and assistant reply to Firestore (Phase 2 §5.5) — the `onSnapshot` listener receives both real documents; the optimistic local bubble is reconciled/removed once the real user-message document with a matching approximate timestamp arrives, and the assistant's `ChatBubble` renders from the live subscription with a brief fade-in.
4. On failure (any Phase 2 §7.6 error code): optimistic user bubble gets a small "⚠ failed to send — tap to retry" affordance instead of being removed; tapping it re-fires the same request body.
5. Tap the header's `Dumbbell` icon → navigate to `workout/index.jsx`; tap the `BarChart3` icon → navigate toward Progress (§2.7, pending design).

---

### 2.5 Nutrition Screen — "AI Meal Planner" (merges the former separate Nutrition + Meal Planner screens)

**Route:** `app/(tabs)/nutrition/index.jsx` (`planner.jsx` as a distinct route is **retired** — see revision note)

> **Revision note:** the prototype's `MealPlanScreen` collapses what earlier revisions of this document specified as two screens (a manual "log a meal" Nutrition screen and a separate weekly "Meal Planner" screen) into **one** daily-focused screen: an AI-generated plan for *today* with per-meal "SWAP WITH AI" actions, rather than a freeform log-anything-you-ate flow as the primary interaction. Manual logging (the old `MealInputBar` estimate-and-save flow) still has a place — it's the "+ ADD" button in the section header below — but it is now secondary to the AI-generated plan, not the screen's main purpose. Nothing here removes the ability to log an arbitrary meal by text/voice; it just moves that entry point behind "+ ADD" instead of it being the whole screen. The weekly, 7-day, "Monday…Sunday" scrollable planner view from the original Meal Planner screen has **no equivalent in the current Figma prototype** — the design only shows a single day at a time. If a weekly view is still wanted, it needs its own design pass; don't build it from the old ASCII mock below, which no longer reflects the product direction.

**Layout (revised to match `MealPlanScreen` prototype):**

```
┌─────────────────────────────────┐
│ ←     NUTRITION            ↻    │  ← black header: back, eyebrow label,
│    AI MEAL PLANNER               │    "AI MEAL PLANNER" title, regenerate
├─────────────────────────────────┤    icon (RegeneratePlanButton)
│ ⭕1890   Daily Target: 2,450 77%│  ← dark panel: calorie progress ring +
│  kcal   Carbs ▓▓▓▓▓▓▓▓░░ 224/280g│    per-macro thin progress bars
│         Protein▓▓▓▓▓▓▓▓░░123/150g│
│         Fat    ▓▓▓▓▓▓▓░░░ 43/60g │
├─────────────────────────────────┤
│ [🔥1890 kcal][💧2.8L water][⚡123g protein]│ ← 3 quick-stat pills
├─────────────────────────────────┤
│ TODAY'S PLAN          [+ ADD]   │  ← section header; "+ ADD" opens the
│ AI GENERATED LOCAL MEAL PLAN     │    manual log flow (text/voice/estimate)
│ ┌───────────────────────────┐   │
│ │🍳 7:30 AM · Breakfast   [🍳]│  │  ← meal card: localized name (e.g.
│ │Ruti, Dimer Bhuna & Dal      │  │    Bengali) + italic English gloss,
│ │Chapati, Spiced Egg Curry... │  │    4-up KCAL/PRO/CARB/FAT mini-stats,
│ │[480][28g][55g][12g]         │  │    tag pills, "SWAP WITH AI" per card
│ │[High Protein][Local] ↻SWAP  │  │
│ └───────────────────────────┘   │
│  ... Lunch, Pre-Workout Snack,   │
│      Dinner (same card shape)    │
│ ┌───────────────────────────┐   │
│ │🤖 AI COACH TIP               │  │  ← dark AI-tip card: proactive
│ │"You're 27g short on protein  │  │    macro-gap nudge + "ADJUST PLAN"
│ │ today. Add a glass of milk." │  │    CTA
│ │        [ADJUST PLAN →]       │  │
│ └───────────────────────────┘   │
└─────────────────────────────────┘
```

**Notable product details introduced by this design, not previously in this spec:**

- **Localization of meal content:** each generated meal shows a local-language name (the prototype uses Bengali, e.g. "Ruti, Dimer Bhuna & Dal") as the primary label with an italic English gloss underneath ("Chapati, Spiced Egg Curry & Lentil Soup"). This means the meal-generation prompt (Phase 2) and the `mealPlans`/`dailyLogs` schema (Phase 1) need a `localName` + `englishGloss` pair per meal, not a single name string, if this is to be implemented as designed — flagged here as a schema/prompt implication for Phase 1/2, not something this document can silently assume already exists.
- **Per-meal "SWAP WITH AI"** is a first-class action on every meal card (distinct from "+ ADD" and from "↻ Regenerate"): it re-generates just that one meal via Path B, not the whole day's plan.
- **Proactive AI Coach Tip card** at the bottom of the day's plan — a macro-gap-aware nudge ("You're 27g short on protein today...") with an "ADJUST PLAN" CTA. This reads as a lightweight, screen-embedded echo of the AI Coach (§2.4) rather than a full chat — recommend it call the same `/api/ai/chat` (contextType: `'nutrition'`) endpoint used by Coach, surfacing only the first response inline, with "ADJUST PLAN" deep-linking into a full Coach conversation for follow-up.

**State requirements:**

- `useFirestoreDoc('users/{uid}/dailyLogs/{today}')` — `nutritionLog.meals` array drives the meal cards, `aiEstimatedTotals` drives the calorie ring + macro bars + quick-stat pills.
- This screen's *generated plan* data source still needs the Phase 4 backend addition flagged below (a `mealPlans` sub-collection + generation endpoint) for the "TODAY'S PLAN" section and "↻ Regenerate"/"SWAP WITH AI" to be real; until then, this section should render from a static/mocked plan behind a feature flag in `useUIStore`, exactly as the original spec suggested for the weekly planner.
- Local `draftMealDescription`, `selectedMealType` for the "+ ADD" manual flow — reset after each save.
- Local `estimatePreview` state machine for "+ ADD": `idle → loading → result → (saved | discarded)`. The AI estimate is **never** written to Firestore automatically — it's a preview the user must explicitly confirm, per the Phase 2 §2.5 note that `aiEstimatedTotals` is app-computed and meal-level `aiEstimate` only persists on user save.

**User actions:**

1. Tap "+ ADD" → opens the manual log flow (text or voice description → "Estimate" → **Path B** call to `/api/ai/estimate-nutrition` with `mealDescription`, `mealType` → preview card → "Save ✓" appends to `meals` array (Path A, `arrayUnion`-style merge) and recomputes `aiEstimatedTotals`, or "Discard" with no write). Voice input inside this flow uses `useVoiceCapture` to transcribe speech-to-text into the description field (client-side transcription only; it does not skip straight to an AI nutrition call from audio).
2. Tap "↻ SWAP WITH AI" on a meal card → **Path B** call regenerating just that meal (`exerciseName`-equivalent: `mealSlot`, `mealType`, `dietaryPreference`, `reason` if any) → replaces that card's contents on success.
3. Tap the header "↻" (`RegeneratePlanButton`) → Path B call → overwrite flow identical in spirit to workout plan regeneration (Phase 2 §1.5: old plan `isActive: false`, new plan written, `currentMealPlanId` updated).
4. Tap "ADJUST PLAN →" on the AI Coach Tip card → deep-links into `coach/[conversationId].jsx` (§2.4) with the tip's context pre-loaded.

**Phase 4 backend addition still required (carried forward from the original Meal Planner spec):** a new sub-collection `users/{uid}/mealPlans/{planId}` (analogous structure to `workoutPlans`) and a corresponding Path B endpoint (e.g. `POST /api/ai/generate-meal-plan` using the already-reserved `TOKEN_LIMITS.MEAL_PLANNER` budget from Phase 1 §3E, which exists in the token table but has no endpoint yet — this screen is that endpoint's first consumer), plus a lighter-weight single-meal regeneration endpoint or parameter to back "SWAP WITH AI".

---

### 2.7 Progress Screen

**Route:** `app/(profile)/progress/index.jsx` (moved out of `(tabs)` — see revision note)

> **Revision note:** this screen has **no corresponding design in the current Figma prototype** (only Splash, Goal, Dashboard, Workout, Meal Planner, and AI Coach were built). It is also no longer reachable from the bottom tab bar, since that bar now has only 4 tabs (`HOME`/`TRAIN`/`MEALS`/`AI`, §2.0) with no `PROGRESS` slot — the only current entry point is the Dashboard's "PROFILE" quick-action tile (§2.2). The spec below is therefore carried forward **unchanged from the prior revision as a placeholder** — treat it as a proposal awaiting its own Figma pass, not as something already validated against the visual design system in §2.0. Before implementing, this screen should be redesigned to match the brand identity (red/black, weight-900 headings, letter-spaced eyebrows) established by the other five screens.

**Layout (placeholder, pending design):**

```
┌─────────────────────────────────┐
│  Progress      [1M][3M][6M][All]│  ← DateRangeToggle
├─────────────────────────────────┤
│  Body Weight                     │
│ ┌───────────────────────────┐   │
│ │      ╭─╮                   │   │  ← WeightProgressChart
│ │   ╭──╯  ╰──╮   ╭──╮        │   │     (line chart, tappable points
│ │ ──╯        ╰───╯  ╰──      │   │      show weightKg + date tooltip)
│ └───────────────────────────┘   │
│                                  │
│  Personal Records                │
│ ┌────────────┬────────┬───────┐ │
│ │ Exercise    │ Best   │ Date  │ │  ← PRTrackerTable
│ ├────────────┼────────┼───────┤ │
│ │ Bench Press │ 85 kg  │ 7/12  │ │
│ │ Squat       │ 110kg  │ 7/18  │ │
│ └────────────┴────────┴───────┘ │
│                                  │
│  Weekly Training Volume          │
│ ┌───────────────────────────┐   │
│ │ ▇▇  ▇▇▇  ▇  ▇▇▇▇  ▇▇  ▇  ▇  │  ← VolumeBarChart (sets/muscle group/week)
│ │ Chest Back Legs Shldr Arms │  │
│ └───────────────────────────┘   │
└─────────────────────────────────┘
```

**State requirements:**

- No single Firestore document holds this data pre-aggregated — this screen is the one place in the app that requires a **collection group query** across `dailyLogs`: `firestore().collectionGroup('dailyLogs').where('uid', '==', uid).where('date', '>=', rangeStart).orderBy('date')`. This is exactly why Phase 1's `dailyLogs` schema includes the redundant `uid` field on every document — it exists specifically to make this query possible without a composite `users/{uid}/dailyLogs` collection-group ambiguity.
- Client-side derivation from the fetched range of `dailyLogs` documents (not stored, computed on-device):
    - **Weight series** → `profile.weightKg` is a point-in-time field on the root user doc, not historical; so weight history instead requires a lightweight `weightKg` snapshot to be added into each day's `dailyLogs/{date}` document at recovery-check-in or workout-log time (a minor schema extension flagged here — currently Phase 1 has no daily weight field; recommend adding an optional `bodyWeightKg: number|null` field at the `dailyLogs/{date}` root level to support this chart without redesigning the schema).
    - **PR Tracker** → derived by scanning `workoutSession.exercises[].sets[]` across the fetched range, grouping by `exerciseId`/`name`, taking `max(weightKg where completed === true)`.
    - **Volume chart** → derived by summing `sets.length` per `primaryMuscleGroup` per ISO week (muscle group requires a join against the exercise's plan-time `primaryMuscleGroup`, denormalized onto the log entry at logging time — already covered since `workoutSession.exercises[].name` is denormalized per Phase 1; recommend also denormalizing `primaryMuscleGroup` onto the logged exercise object at save time in the Workout Screen's "Finish Workout" write, for exactly this reason).
- Given collection-group queries over 6 months of daily documents can be non-trivial in size, this screen fetches **once** (not a live `onSnapshot`) with a manual pull-to-refresh, and shows a `LoadingSpinner` covering all three charts during that fetch — not a per-chart optimistic pattern like other screens, since there is no "write" here at all, only a read-and-compute.

**User actions:**

- Toggle date range → re-fires the collection-group query with a new `rangeStart`, all three visualizations recompute from the new dataset.
- Tap a point on `WeightProgressChart` → tooltip showing exact `bodyWeightKg` and date.
- Tap a `PRTrackerTable` row → optional deep-link to that day's `dailyLogs/{date}` detail (out of scope for this spec, flagged as a nice-to-have).

---

## 3. State Management & Offline Strategy

### 3.1 Global UI State vs. Local Component State

GymBro uses **Zustand** for global state (lightweight, no boilerplate, works well with React Native) and reserves it strictly for state that must survive navigation or be shared across unrelated component trees. Everything else stays local (`useState`/`useReducer`).

|State|Scope|Why|
|---|---|---|
|Auth user (`uid`, `email`)|`useAuthStore` (global)|Needed by nearly every Firestore query and API call app-wide|
|Cached `profile` / `stats`|`useUserProfileStore` (global)|Read by Dashboard, Workout, Nutrition, Coach, Onboarding-summary — re-fetching per screen would be wasteful and would desync during a live session|
|In-progress workout session|`useActiveWorkoutStore` (global, session-scoped)|Must survive the user backgrounding the app mid-set or navigating to `SubstituteSheet` and back; cleared on "Finish Workout" or explicit exit|
|Onboarding draft profile|`useOnboardingDraftStore` (global, but reset after submit)|Spans 6 separate route screens; local state would be lost on each route push|
|Active modal/sheet/toast|`useUIStore` (global)|Any screen can trigger a global toast (e.g. an AI error from Phase 2 §7.6); centralizing avoids prop-drilling a toast dispatcher|
|Connectivity + pending-write count|`useConnectivityStore` (global)|Drives the app-wide `OfflineBanner` in the root layout, independent of any single screen|
|Chat draft message, meal draft description, form inputs, chart date-range toggle|Local `useState` per screen|Ephemeral, single-screen concerns; global state here would only add unnecessary re-render surface|

**Rule of thumb applied throughout:** if losing the state on unmount would break the user's task, it's global; if losing it on unmount is exactly what should happen (e.g. clearing a chat draft after navigating away), it's local.

### 3.2 Optimistic UI Updates for Instant Workout Logging

The Workout Screen (§2.3) is the single highest-frequency write surface in the app and the one most likely to be used on unreliable gym Wi-Fi, so it gets the most aggressive optimistic treatment:

1. **Per-set interactions never touch the network.** Every checkbox tick, rep count, and weight entry during a session updates only `useActiveWorkoutStore` (in-memory). This is not "optimistic" in the retry-and-reconcile sense — it's simply local-first by design, since there is no reason a mid-set checkbox tap should ever wait on a round trip.
2. **The single Firestore write happens once, at "Finish Workout".** This is where true optimistic-UI applies: the app navigates away and shows the workout as saved (`stats.totalWorkoutsCompleted` incremented, streak updated in the locally-cached `useUserProfileStore`) **before** Firestore's server acknowledgment returns, relying on the Firestore SDK's own local-cache-first write behavior (§3.3) rather than hand-rolled optimism.
3. **Rollback path:** if the write ultimately fails after exhausting Firestore's internal retry (e.g. the device goes fully offline for an extended period and the app is later force-quit before reconnecting), the write remains queued in Firestore's persistent local cache and flushes automatically on the next app launch with connectivity — GymBro does not need custom rollback logic here because Firestore's offline queue already guarantees eventual delivery; the only custom logic needed is the `useConnectivityStore` pending-write counter (§3.4) so the user can see "1 workout syncing" rather than assuming data loss.
4. **AI-touched writes (Path B) are the exception to optimism.** Substitute-exercise suggestions and any Coach reply genuinely require a server round trip before anything can render (there is no valid client-side guess for what Gemini will return), so these use the standard `loading → result | error` pattern (§2.4, §2.5) rather than optimistic rendering — the only thing that's optimistic there is the user's own outgoing chat bubble (§2.4, point 1), never the AI's response.

### 3.3 Firestore Offline Persistence Configuration

```javascript
// services/firebase.js
import { initializeApp } from 'firebase/app';
import {
  initializeFirestore,
  persistentLocalCache,
  persistentMultipleTabManager,
} from 'firebase/firestore';

const app = initializeApp(firebaseConfig);

// React Native has no multi-tab concept, but persistentMultipleTabManager
// is still the correct manager here — it's what enables the unlimited
// local cache size and long-term offline queueing; single-tab manager
// is a web-only optimization irrelevant on-device.
export const db = initializeFirestore(app, {
  localCache: persistentLocalCache({
    tabManager: persistentMultipleTabManager(),
  }),
});
```

**Configuration rationale, specific to GymBro's gym-network use case:**

- **Unlimited cache size** (default with `persistentLocalCache`, no `cacheSizeBytes` cap set) — a full year of `dailyLogs` documents is small relative to typical device storage, and capping it risks evicting exactly the recent workout history the Progress Screen (§2.7) needs most.
- **Every screen's primary read is a live `onSnapshot` subscription, not a one-off `getDoc`** (Dashboard, Workout's plan lookup, Coach's messages, Nutrition's daily log) — this is what makes offline persistence actually useful: `onSnapshot` serves the last-cached snapshot instantly when offline, then transparently re-syncs when connectivity returns, with no code change needed in the listening component.
- **`metadata.fromCache` is surfaced, not hidden.** Every `useFirestoreDoc`/`useFirestoreCollection` hook exposes an `isFromCache` boolean alongside the data, which `OfflineBanner` (root layout, global) uses to show a persistent but unobtrusive "Offline — changes will sync when reconnected" strip, rather than letting the user believe stale data is live.
- **Writes made while offline queue automatically** (Firestore SDK default behavior with persistence enabled) — this is why the Workout Screen's "Finish Workout" write (§3.2) requires no custom offline queue of its own; the same guarantee extends to Nutrition's meal-save and Onboarding's final profile write, meaning **all Path A writes in the app are gym-network-safe by construction**.
- **Path B (AI/backend) calls are explicitly NOT covered by Firestore's offline queue** — `useCallBackend` must check `useConnectivityStore`'s online flag before attempting any Path B call, and short-circuit immediately to a clear "You're offline — AI features need a connection" state (distinct from the Phase 2 §7.6 error contract, since this is a client-detected pre-condition, not a backend error response) rather than letting `fetch()` hang and eventually time out.

### 3.4 Connectivity Store

```javascript
// store/useConnectivityStore.js (shape reference, not full implementation)
// Plain JS Zustand store — the object below just documents what state it holds:
{
  isOnline: true,          // boolean, from @react-native-community/netinfo
  pendingWriteCount: 0,    // number, derived from Firestore's waitForPendingWrites()
                           // status, polled/observed to drive "N syncing" UI
}
```

This store backs the single global `OfflineBanner` in `app/_layout.jsx`, so no individual screen needs its own offline-handling logic beyond checking `isOnline` before initiating a Path B call — Path A reads/writes remain fully functional offline by Firestore's own design (§3.3) and need no gating at all.

---

## Summary Reference Card — Phase 3 Additions

> Revised to match the Figma prototype (§2.0): Onboarding is now 3 steps (not 6), Nutrition and Meal Planner are one merged screen, Progress has moved out of the tab bar pending its own design, and the bottom nav is 4 tabs, not 5.

|Screen|Route|Primary Data Path|Live Subscription?|
|---|---|---|---|
|Onboarding (3 steps)|`(onboarding)/*`|Path A (single write on submit) + Path B (auto plan-gen)|No|
|Home Dashboard|`(tabs)/index`|Path A (`onSnapshot` ×3)|Yes|
|Workout (Workout Mode)|`(tabs)/workout/index`|Local state → Path A (1x write on finish); Path B for substitutes (no UI placement yet, §2.3)|Yes (plan only)|
|AI Coach|`(tabs)/coach/[id]`|Path B (chat) + Path A (message subscription)|Yes|
|Nutrition — AI Meal Planner (merged)|`(tabs)/nutrition/index`|Path B (plan-gen, swap, estimate) + Path A (save/subscription) — **plan-gen and swap require a new Phase 4 endpoint**|Yes (once built)|
|Progress *(no Figma design yet)*|`(profile)/progress/index`|Path A (one-shot collection-group query)|No (manual refresh)|

|Global Store|Persists Across Nav?|Backed By|
|---|---|---|
|`useAuthStore`|Yes|Firebase Auth listener|
|`useUserProfileStore`|Yes|`onSnapshot('users/{uid}')`|
|`useActiveWorkoutStore`|Session only|In-memory, cleared on finish/exit; now also tracks focused `exerciseIndex`/`currentSet` for Workout Mode (§2.3)|
|`useOnboardingDraftStore`|Onboarding only|In-memory, cleared on submit; spans 3 steps, not 6|
|`useUIStore`|Yes|In-memory|
|`useConnectivityStore`|Yes|NetInfo + Firestore pending-write state|

| Schema Gaps Flagged for Phase 4                              | Reason                                                                           |
| ------------------------------------------------------------ | -------------------------------------------------------------------------------- |
| `users/{uid}/mealPlans/{planId}` collection                  | Needed by the AI Meal Planner screen (§2.5); mirrors `workoutPlans` structure    |
| `POST /api/ai/generate-meal-plan` endpoint (+ single-meal regenerate) | `TOKEN_LIMITS.MEAL_PLANNER` already reserved in Phase 1 §3E but unused until now; single-meal regenerate backs "SWAP WITH AI" (§2.5) |
| `localName` / `englishGloss` fields on generated meals        | Needed for the localized (e.g. Bengali) meal names shown in the Meal Planner design (§2.5) — not in current Phase 1/2 meal shape |
| `dailyLogs/{date}.bodyWeightKg` (optional field)             | Needed for Progress Screen's weight chart; not in current Phase 1 schema         |
| Denormalized `primaryMuscleGroup` on logged exercise objects | Needed for Progress Screen's volume chart without a plan-document join           |
| Progress Screen visual design                                 | No Figma mock exists yet; §2.7's layout is a carried-forward placeholder awaiting a design pass in the app's brand identity (§2.0) |