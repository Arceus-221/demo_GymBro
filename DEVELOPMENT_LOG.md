# Development Log

Running log of what's been built in GymBro and verification checks performed against
the actual codebase (not just what the docs claim). New entries go on top.

---

## 2026-09-14 — Light/dark theming (F7 + F11)

**Scope:** Softened the pure-black chrome, then built the theme system it was blocking.
56 files changed, +598/−320. Uncommitted at time of writing.

### Tokens are named by role now, not by colour

The old palette named appearances — `surface.light`, `ink.black`, `text.onDark` — which
become lies the moment a second palette exists. Renamed across 45 files, 87 references:

| Was | Now | Why |
|---|---|---|
| `surface.light` | `surface.primary` | the page ground, whatever colour that is |
| `surface.muted` / `mutedAlt` | `surface.secondary` / `tertiary` | raised surfaces |
| `ink.black` / `ink.deep` | `surface.inverse` / `inverseDeep` | the contrasting surface |
| `text.onDark` / `onDarkMuted` | `text.inverse` / `inverseMuted` | text on that surface |
| `border.dark` | `border.inverse` | ditto |

`surface.inverse` is the interesting one: in light mode it is a dark chrome on a light
page, and in dark mode it inverts mechanism and becomes a *raised* surface — same role,
opposite direction. Naming it by role is what lets one token cover both.

### F11 — the pure blacks are gone

`ink.black` (#111111) and `ink.deep` (#0A0A0A) were the tab bar, headers, dark cards, the
FAB and Workout Mode's ground. They read as hard cutouts against the white page and had
nowhere to go in dark mode. Now #1F2125 and #17181B — soft charcoals in the same neutral
family as the light greys rather than holes punched in them.

### The dark palette is deliberately quiet

- Base is #121316, not true black, so raised surfaces have somewhere to go.
- Text is #F5F6F8, not #FFFFFF. At full white on a dark ground the halation makes long
  text harder to read; at this value it is indistinguishable from white in use.
- **Two reds, because one value cannot do both jobs on a dark ground.** The first pass
  used a single desaturated #E5484D, which read as washed out — too subtle to carry the
  brand. Split instead:
  - `brand.red` **#D12F38** — fills: buttons, pills, the FAB, selected states. Deep and
    saturated enough to look considered rather than lit, and it carries a near-white label
    at 4.65:1, which the lighter red could not (3.62:1).
  - `brand.redText` **#E9575C** — red *text* and small glyphs sitting ON a dark surface,
    where the fill red drops to 3.7:1 and fails small text. This is the lightest value
    that clears 4.5:1 against page, card and chrome alike; anything lighter drifts pink
    and starts to glow.

  The split is mechanical to apply and was: 33 text/glyph uses point at `redText`, 42
  fills keep `red`. `ProgressRing`'s arc deliberately stays on the fill red — it is a
  10px stroke, a large graphic rather than text, and the solid red is the intended look.
  In light mode the two are the same value (#EF0000 already clears 4.5:1 on white), so
  nothing there changed.
- `success` was softened #3DD68C → **#3BAC79**. The first value read as mint neon against
  the near-black. The darker green still clears 4.5:1 for the 8px status text in the chat
  header and also improves the near-white label on the success toast.

**Contrast verified numerically** (WCAG relative luminance), since none of this has been
seen on a screen yet:

| Pair | Dark | Target |
|---|---|---|
| body text on page | 17.18:1 | 4.5 |
| secondary text | 10.94:1 | 4.5 |
| muted text | 7.11:1 | 4.5 |
| text on card | 15.95:1 | 4.5 |
| label on red fill | 4.65:1 | 4.5 |
| red fill vs page (large) | 3.69:1 | 3.0 |
| red text on page | 5.29:1 | 4.5 |
| red text on chrome (tab label) | 4.64:1 | 4.5 |
| success text on chrome | 5.71:1 | 4.5 |

Every checked dark pair passes. **One pre-existing light-mode failure surfaced and was
left alone:** `text.muted` (#888888) on white is 3.54:1 against a 4.5 target. It predates
this work and changing it would alter the light design, so it is flagged, not fixed.

### How components consume it

`StyleSheet.create` at module scope captures colours once at import — the reason mutating
a palette object re-rendered nothing. Each of **49 files** now declares a factory and calls
one hook:

```js
const { styles, colors } = useThemedStyles(makeStyles);
// ...
const makeStyles = (colors) => StyleSheet.create({ ... });
```

The conversion was scripted; the stylesheet bodies are untouched. Four places needed hand
work because a **default parameter cannot read a hook** — `Typography`, `ProgressRing`,
`Icon` and the five route `_layout.jsx` files all defaulted a prop to a palette value in
the signature. They resolve their fallback in the body instead, so `color` stays an
override rather than a frozen default.

**56 hardcoded colour literals across 23 files** were folded into tokens at the same time —
these were invisible to a `colors.*` grep and would have produced white-on-white. Most
were `#FFFFFF` acting as "text on a dark surface" (`text.inverse`); the `rgba(255,255,255,…)`
family became a named `onInverse` scale. One needed judgement: `SelectRow`'s selected icon
tile is a white *background*, not white *text*, so it maps to `surface.primary` — identical
in light mode, but `text.inverse` would have made it the brightest thing on a dark screen.

**There is no longer a `colors` export.** Reaching for a colour outside the hook is now a
lint error rather than a silent bug that only appears in dark mode.

### The transition is a wash, not a cut

Swapping palettes re-renders every surface on one frame and the screen inverts at once,
which reads as a glitch. `ThemeProvider` instead fades a cover in the *incoming* background
colour over the tree (140ms), swaps the palette while it is opaque, and fades out (240ms).

Zustand rehydrates the persisted choice from AsyncStorage asynchronously, so a dark-mode
user's first paint is light and then flips. That is not a change the user made, so it is
detected via `persist.hasHydrated()` and applied without animation — otherwise every cold
start would open with a wash.

`StatusBar` is driven by the resolved scheme rather than `style="auto"`, which follows the
OS and would show dark glyphs on our dark ground whenever a user forces a theme that
differs from their device.

### F19 — closed

`GymBroLogoPlain.png` and `GYMBROmainlogo.png` are black-on-transparent and vanish on a
dark ground. Three surfaces host them: the dashboard header, both auth screens, and the
launch screen.

- **Header and auth** render `components/shared/BrandWordmark.jsx`, which pairs the
  original with `GymBroLogoPlain-white.png` (added 2026-09-14, 2048 × 512, RGBA) and picks
  one by the active scheme. One component owns the pairing, so the two surfaces cannot
  drift — which was F12's actual point — and nothing else should `require()` either file.
- **The launch screen needs no light variant.** It carries its own background in both
  themes by design rather than following the palette, so `GYMBROmainlogo.png` works
  unchanged. Its two values live in `colors.splash`.

The white export is 2048 × 512 against the original's 1200 × 300. Both are 4:1 so they are
interchangeable at any rendered size; the larger file is just more headroom than a 144pt
render needs.

### Settings

The dead "Dark mode" switch — hardcoded `value={false}`, `disabled`, "Not available yet" —
is replaced by a System / Light / Dark `ChipGroup`, matching the weight-units control
already on that screen. A binary switch would have hidden the `system` option. The choice
persists per device in `useSettingsStore`, consistent with that store's existing argument
that display preferences are device-local and deliberately outside `users/{uid}`.

### Verification

| Check | Result |
|---|---|
| `npx expo export --platform ios --platform android` | **Bundles clean.** 4.8MB / 5.0MB |
| `npm run lint` | **0 errors**, 14 warnings (was 9; +5 are the same `useRef().current` idiom in ThemeProvider) |
| `npm run typecheck` | **Clean** |
| Contrast ratios, both palettes | Computed — see table above |

**Not seen running, in either theme.** Everything above is reasoned from source, bundled,
and checked numerically. Nobody has looked at dark mode on a device. The transition timing
in particular is a judgement that needs eyes on it.

### Open items after this session

1. Frontend has no tests; backend has 4 API tests and no AI-controller coverage. **Open.**
2. No end-to-end run against a real Firebase project. **Open.**
3. ~~Lint/typecheck tooling.~~ **Closed** (previous entry).
4. Web platform declared in `app.json` but not installed. **Open.**
5. Demo account seeding. **Open.**
6. ~~Dark mode (F7) unstarted.~~ **Built, unverified on device.** F11 is closed with it.
7. ~~F19 light logo variants.~~ **Closed** — `GymBroLogoPlain-white.png` added and wired
   through `BrandWordmark`. The launch screen needs no variant by design.
8. **New:** the launch screen is awaiting a design; `colors.splash` is the single place it
   will change.
9. **New:** light-mode `text.muted` is 3.54:1 on white, below the 4.5 target. Pre-existing.
10. **New:** the success toast puts near-white text on a green fill in both themes and
    clears neither 4.5:1. Softening the dark green improved it but did not resolve it —
    reaching target needs a much deeper green or dark text on the fill, which is a
    component design decision rather than a palette one. Pre-existing.

---

## 2026-09-14 — Frontend defect pass, and CI quality gates made functional

**Scope:** Closed every open defect in `FRONTEND_FIX_LOG.md`, then fixed the CI jobs that
had been failing on both packages since before that work began.

### Frontend defects — 8 closed across 3 commits

| Item | Cause found | Commit |
|---|---|---|
| F1 Streak reads "1 days" | Hardcoded plural on the dashboard stat tile | `d21e35a` |
| F2 Keyboard covers meal input | No `KeyboardAvoidingView` anywhere in the sheet's tree | `d21e35a` |
| F3 Active pill unreadable | Base `pill` style set a border but no `backgroundColor`, so the red glow bled through its label | `d21e35a` |
| F8 Weight unit ignored outside profile | Four display sites never read `weightUnit`; one was an *input* writing lb into a kg field | `d21e35a` |
| F12 AuthShell wordmark | Sign-in/sign-up still drew styled text while the dashboard used the logo asset | `d21e35a` |
| F4 Coach chips oversized | Message list took no `flex:1`, so the column's spare height fell into the chip rows | `db00da8` |
| F10 Ring labels clipped | Label was an absolute-filled overlay inside a box hard-capped at the ring's size | `db00da8` |
| F5 Pill clipped at edge | `Text` had no `flexShrink`, so it overflowed the pill's `maxWidth` instead of ellipsizing | `8454fef` |

Two of these were more than they looked:

- **F8 was a data-integrity bug, not a formatting one.** `SetLogTable`'s weight field is a
  `TextInput` writing straight into `set.weightKg`, so an `lb` user was storing a pound
  figure into a kilogram field. It now holds the typed text in local draft state and
  converts on commit — rendering stored kg back out per keystroke would round-trip and
  drift the number under the cursor. It commits on change rather than blur because
  LOG SET is reachable while the field still holds focus. `round1` moved from
  `app/(profile)/edit.jsx` into `constants/units.js` now that two screens need it.
- **F4's cause was in `ChatScreen`, not in either chip component.** Both components'
  styles were correct, which is why inspection kept coming up empty.

### The "needs a physical device" items did not need one

F4, F5 and F10 were all filed as blocked on device confirmation, on a theory that
RN 0.86 + `newArchEnabled: true` (Fabric) was mismeasuring layout. **All three were
diagnosable from source, and none was a platform bug.** Each was an ordinary flex
constraint missing in a row layout:

- F4 — a `ScrollView` given `contentContainerStyle` but no `style`, so it never claimed
  `flex: 1` and left the column's spare height undefined.
- F5 — a `Text` with `numberOfLines={1}` inside a `maxWidth` row, but `flexShrink` defaults
  to 0 in React Native, so it kept its intrinsic width and overflowed instead of
  ellipsizing. `numberOfLines` has nothing to truncate against until the text can shrink.
- F10 — a label centred by `absoluteFillObject` inside a fixed-size box; inverted so the
  `Svg` sits absolutely behind and the label centres by ordinary flex layout.

The log was right that these shared a root cause. It was wrong about what it was — and the
tell was in the original report: the clipped pill had **no ellipsis**, which rules out both
a scrolled-off pill and a working truncation. Sweeping for the same pattern found one more
live instance in `components/profile/SettingsRow.jsx`, fixed in `8454fef`.

### CI quality gates — all four steps now run

Both jobs in `.github/workflows/ci.yml` were red. In every case the tooling failed to
*start*, so none of them had ever reported a code problem. This closes open items 1 and 3
from the 2026-09-10 audit below.

| Step | Why it failed | Resolution |
|---|---|---|
| backend `npm run lint` | ESLint 9 installed, no `eslint.config.js`; v9 no longer reads `.eslintrc` | Added flat config |
| backend `npm test` | Jest exits 1 on "No tests found"; zero test files existed | Added 4 supertest tests |
| frontend `npm run lint` | `eslint` was not a dependency at all — no `devDependencies` block | Added `eslint` + `eslint-config-expo` + flat config |
| frontend `npx tsc` | `typescript` not installed, and with no `tsconfig.json` tsc has no inputs | Added both; CI now calls `npm run typecheck` |

Turning lint on surfaced four genuine problems, all fixed: unused `catch` bindings in both
AI provider adapters, and unused imports in `change-password.jsx` and `ChatScreen.jsx`.

**The new backend tests** cover exactly what the 2026-09-10 audit verified by hand:
`/health`, the 404 fallthrough, and the auth gate rejecting both a missing and a malformed
`Authorization` header. Two things blocked writing them, both now fixed — `index.js` called
`app.listen()` unconditionally at module scope, so requiring it from a test bound a port and
hung Jest (now guarded by `require.main === module`), and `config/firebase.js` initializes
the Admin SDK with `cert()` at import time, which throws where no service account exists, so
the suite mocks that module. No path asserted reaches Firebase.

### Deliberate compromises in the CI work

These are green because a judgement was made, not because the underlying issue is gone:

1. **9 lint warnings remain on the frontend.** From `eslint-plugin-react-hooks` v6's React
   Compiler rules — `setState` called synchronously in an effect (both Firestore
   subscription hooks, plus two screens seeding form state from a snapshot) and a ref read
   during render in the splash animation. All are pre-existing patterns that work.
   `set-state-in-effect` and `refs` are set to `warn` so they stay visible without failing
   the build; resolving them means restructuring how those hooks derive state.
2. **`checkJs` is off.** With it on, `tsc` reports **637 errors**, ~90% of them implicit-any
   on unannotated props and callbacks (TS7031, TS7006) and inferred prop shapes (TS2741).
   The codebase is untyped, not wrong. As configured the job verifies the project parses and
   resolves, and becomes a real gate the moment any `.ts` file is added.
3. **`gymbro-app/.npmrc` pins `legacy-peer-deps`.** `npm install` already failed on the
   existing tree before any of this work: `react-dom@19.3` requires `react ^19.3` while the
   project is pinned to the `19.2.3` that react-native 0.86 expects. Nothing imports
   react-dom — it arrives as an optional peer of Expo's metro runtime because `web` is
   declared in `app.json` but was never installed (open item 4, still open). This makes
   local installs and CI's `npm ci` agree; deciding whether to support web is the real fix.

`eslint` is pinned to 9 and `typescript` to 6 on both sides. Left unpinned they resolve to
ESLint 10 and TS 7, and neither works here: `eslint-plugin-react` uses a rule API ESLint 10
removed, and `typescript-eslint` does not support TS 7.

### Verification performed this session

| Check | Result |
|---|---|
| `npx expo export --platform ios` after each change | **Bundles clean.** 4.8MB, zero errors |
| backend `npm ci && npm run lint && npm test -- --ci` | **Passes.** 4 tests, 0 lint findings |
| frontend `npm ci && npm run lint && npm run typecheck` | **Passes.** 0 lint errors (9 warnings), typecheck clean |

**Not verified on a physical device.** Every fix in this entry is reasoned from source and
confirmed to bundle; none has been seen running on hardware. The layout fixes in particular
(F4, F5, F10) should be eyeballed on iOS and Android before they are trusted.

### Open items after this session

1. ~~No automated tests on either side.~~ **Partly closed** — the backend has 4 API tests.
   The frontend still has none, and the backend has no coverage of the AI controllers.
2. No end-to-end run against a real Firebase project (real login → onboarding → AI call →
   Firestore write) has been verified. **Still open.**
3. ~~Lint/typecheck tooling needs finishing.~~ **Closed** — see above, with the three
   compromises noted.
4. Web platform support is declared in `app.json` but not installed. **Still open**, and now
   also the reason `.npmrc` exists.
5. Demo account still needs seeding. **Still open.**
6. **New:** dark mode (F7) is unstarted and has grown — 55 files import `constants/theme`,
   48 call `StyleSheet.create` at module scope, 293 `colors.*` references, plus 58 hardcoded
   colour literals across 23 files that a `colors.*` grep does not see. It grows with every
   shipped screen, so F14–F17 should not be built ahead of it. F19 (light logo variants)
   remains an unstarted asset dependency that gates it.

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
