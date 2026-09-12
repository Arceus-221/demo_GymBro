# Development Log

Running log of what's been built in GymBro and verification checks performed against
the actual codebase (not just what the docs claim). New entries go on top.

---

## 2026-09-10 — AI + Firebase live connectivity check (follow-up)

The 2026-09-10 audit below flagged Gemini calls and Firestore reads as "not exercised" —
that meant *untested*, not *broken*, but it read as a red flag. Tested both directly
against the real credentials already in `.env`:

- `services/aiProviders/geminiAdapter.js` `call()` invoked directly with a trivial
  prompt → **succeeded**, returned valid parsed JSON from `gemini-3.5-flash-lite`.
- `config/firebase.js` Admin SDK → `admin.firestore().collection('_healthcheck').get()`
  → **succeeded**, connected and read (empty collection, as expected).
- Compared `FIREBASE_PROJECT_ID` (backend `.env`) against
  `EXPO_PUBLIC_FIREBASE_PROJECT_ID` (frontend `.env.local`) → **match**, both point at the
  same Firebase project.

**Conclusion: no AI or Firebase issue exists.** Both integrations work end-to-end from
the backend as configured. Nothing to fix here.

---

## 2026-09-10 — Build & runtime audit

**Scope:** Full inventory of `gymbro-app/` (Expo/React Native) and `gymbro-backend/`
(Node/Express), plus hands-on verification of whether each side actually runs.

### What exists

**Backend (`gymbro-backend/`) — 1,644 LOC across ~25 files**

- Express app (`index.js`) with `/health` and two route groups: `/api/ai/*`, `/api/audio/*`.
- Middleware: `verifyToken` (Firebase ID token auth), `perUserThrottle` (soft per-user rate
  limit), `validateBody` (Zod schema validation).
- Controllers, all present and wired to routes:
  - `aiController.js` — `generateWorkoutPlan`, `estimateNutrition`, `computeRecoveryScore`,
    `substituteExercise`, `chat`
  - `mealPlanController.js` — `generateMealPlan`
  - `audioController.js` — `transcribe` (Groq-hosted Whisper proxy)
- `services/geminiService.js` + `aiResilienceWrapper.js` + `geminiRateLimiter.js` — provider
  facade, retry/timeout wrapper, and a `bottleneck`-based queue in front of Gemini.
- `services/aiProviders/geminiAdapter.js` + `openRouterAdapter.js` — swappable provider
  adapters selected by `AI_PROVIDER` env var.
- `prompts/` — one file per AI feature (chat, meal plan, nutrition, plan, recovery,
  substitute), each with the `<<<USER_INPUT>>>` delimiter pattern for prompt-injection
  defense.
- `schemas/aiSchemas.js` — Zod request schemas for every `/api/ai/*` route.
- `firestore.rules` + `firebase.json` — per-user Firestore security rules, not yet
  confirmed deployed to a live project (deploy requires `firebase login` + a real project,
  not attempted in this session).
- Real credentials present in `gymbro-backend/.env` (Firebase service account + Gemini API
  key all filled in, not placeholders).

**Frontend (`gymbro-app/`) — 4,998 LOC across ~50 files**

- Expo Router file-based routes, all present:
  - `(auth)`: sign-in, sign-up
  - `(onboarding)`: goal → profile-details → schedule-summary (3-step wizard)
  - `(tabs)`: dashboard (`index`), `workout`, `nutrition`, `coach` (list + `[conversationId]`
    detail)
  - `(profile)/progress`
  - Root `_layout.jsx` — auth-state listener, one shared `users/{uid}` Firestore
    subscription, backend wake-ping on launch/foreground, and a single
    `useProtectedRoute()` guard that redirects between the three route groups based on
    auth + onboarding state.
- Components grouped by screen area: `coach/`, `dashboard/`, `nutrition/`, `onboarding/`,
  `progress/`, `shared/`, `workout/` — 29 component files total, all implemented (no
  stub/placeholder components found; grepped for TODO/FIXME/"not implemented" across all
  app + backend source, zero hits).
- State: 6 Zustand stores — auth, user profile, active workout, onboarding draft,
  connectivity, UI (toasts/loading).
- Hooks: `useFirestoreDoc`, `useFirestoreCollection`, `useCallBackend`, `useRestTimer`,
  `useToday`, `useVoiceCapture`.
- `services/firebase.js` — Firebase JS SDK (not `@react-native-firebase`) for both Auth and
  Firestore; deliberate deviation from the SRS, documented in README §3.2 (avoids native
  dev-build requirement, trades away persistent offline cache on native — falls back to
  `memoryLocalCache()`).
- Real Firebase web config present in `gymbro-app/.env.local` (all 6 Firebase keys + API
  base URL filled in).
- All the `.gitkeep` placeholder files from the initial scaffold have been deleted and
  replaced with real implementations — this is the biggest structural signal that Phase 3
  (frontend) went from scaffold to actually-built since the last commit.

### Verification performed this session

| Check | Result |
|---|---|
| `cd gymbro-backend && node index.js` | **Boots clean.** Logs `GymBro API running on port 3001` (`.env` sets `PORT=3001`) |
| `curl /health` | `{"status":"ok"}` — 200 |
| `curl /api/ai/nonexistent` | `{"success":false,"error":"Route not found"}` — 404, correct fallthrough |
| `curl -X POST /api/ai/chat` with no auth header | `{"success":false,"error":"MISSING_TOKEN",...}` — 401, `verifyToken` middleware confirmed working |
| `npm test` (backend) | **No tests exist.** Jest reports `0 matches` — `test`/`supertest` are installed as devDeps but no `__tests__` or `*.test.js` files have been written yet |
| `npm run lint` (backend) | **Broken.** ESLint 9 installed but no `eslint.config.js` — the flat-config migration was never done, so `npm run lint` errors out immediately |
| `npx expo export --platform ios --platform android` (frontend) | **Bundles clean.** Metro bundled 1,324 modules (iOS) / 1,411 modules (Android) with zero errors; confirms every import in the 50-file app tree resolves and the JS bundle is buildable |
| `npx expo export --platform web` | **Fails.** Missing `react-dom` / `react-native-web` — web is listed as a target platform in `app.json` but its deps were never installed. Not a blocker for the mobile app; only matters if web support is wanted |
| `npm run typecheck` (frontend) | **Broken.** Script calls `tsc`, but `typescript` is not in `package.json` at all (no devDependencies block) — command fails with "not recognized" |
| `npm run lint` (frontend) | **Broken.** Same issue — `eslint` isn't installed locally and there's no devDependencies block, so the script has nothing to run |

### Bottom line

- **Backend runs and behaves correctly** for the one thing tested end-to-end without live
  Firebase/Gemini calls (routing, 404 handling, auth gate). Actual AI calls (Gemini) and
  Firestore reads were not exercised — that needs a live round trip with a real ID token,
  which wasn't attempted this session.
- **Frontend compiles/bundles correctly** for iOS and Android. Not run in a simulator or
  Expo Go this session — bundling success is necessary but not sufficient proof the UI
  renders/behaves correctly on device.
- **Quality gates (lint, typecheck, tests) are all non-functional right now** — not because
  the code is untested by hand, but because the tooling itself was never finished:
  no `eslint.config.js` on either package, no `typescript` devDependency on the frontend,
  and zero test files on the backend despite Jest/Supertest being installed.
- **No seeded demo account** — `DEMO_CREDENTIALS.md` is still a template ("Password: (set
  after seeding)"), so there's no way yet for someone else to open the app and see
  pre-populated data without creating their own Firebase project and going through
  onboarding manually.
- **Firestore rules deploy status unconfirmed** — `firestore.rules` exists in the repo but
  whether it's actually been pushed to the live Firebase project (`npm run predeploy`) was
  not checked.

### Open items (from README's own "current state" note, cross-checked and still accurate)

1. No automated tests on either side.
2. No end-to-end run against a real Firebase project (real login → onboarding → AI call →
   Firestore write) has been verified.
3. Lint/typecheck tooling needs finishing (flat ESLint config + `typescript` devDependency).
4. Web platform support is declared in `app.json` but not installed — either install
   `react-dom`/`react-native-web` or drop `"web"` from the platforms list.
5. Demo account still needs seeding.
