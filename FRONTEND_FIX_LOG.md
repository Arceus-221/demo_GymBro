# Frontend Fix Log

Known frontend defects found by inspection, deferred for a later fix pass. Each entry
records the symptom, the confirmed root cause, and the file to change. Confirmed items
were traced to source; open items still need a check on a physical device.

---

# Reported 2026-09-10

From iOS (Expo Go) device screenshots.

## Confirmed — root cause traced to source

### F1. Streak reads "1 days" instead of "1 day"
- **Where:** `gymbro-app/app/(tabs)/index.jsx:108`
- **Symptom:** Dashboard streak stat tile reads "1 days".
- **Cause:** `` `${stats.currentStreakDays ?? 0} days` `` hardcodes the plural — no
  singular case.
- **Fix:** Pluralize on the count (`1 day` / `n days`). Check the same pattern in
  `components/coach/ChatScreen.jsx:81`, which builds a `${n} day streak` chip label the
  same way.

### F2. Keyboard covers the input in the "Log a Meal" sheet
- **Where:** `gymbro-app/components/nutrition/AddMealSheet.jsx`
- **Symptom:** Opening "+ ADD" on the Nutrition screen and tapping the description field
  puts the iOS keyboard directly over the field being typed into — the user can't see
  what they're writing.
- **Cause:** The `Modal` → `backdrop` → `sheet` tree has no `KeyboardAvoidingView` and no
  keyboard offset handling anywhere in the file. The sheet is pinned to the bottom
  (`justifyContent: 'flex-end'`) and never moves when the keyboard appears.
- **Fix:** Wrap the sheet in `KeyboardAvoidingView` with `behavior="padding"` on iOS
  (matching what `components/coach/ChatScreen.jsx:128-132` already does correctly), or
  make the sheet content scrollable.

### F3. Active exercise pill is unreadable in Workout Mode
- **Where:** `gymbro-app/components/workout/ExerciseSelectorStrip.jsx:44-45`
- **Symptom:** The currently-selected exercise pill's text washes out against the red
  glow behind it.
- **Cause:** `pillDone` sets a solid red `backgroundColor`, but `pillActive` only sets
  `borderColor: '#FFFFFF'` / `borderWidth: 2` — the base `pill` style defines **no
  `backgroundColor` at all**, so an active-but-not-done pill is fully transparent. Its
  white text (`textOn`) then sits directly over the absolutely-positioned red `glow`
  circle from `app/(tabs)/workout/index.jsx:309-318`, which bleeds through.
- **Fix:** Give `pill` (or `pillActive`) an opaque background so pill text always has a
  solid surface behind it.

---

## Open — needs confirmation on a physical device

### F4. Oversized blank pills on the AI Coach screen
- **Where:** `gymbro-app/components/coach/StatusChipBar.jsx`,
  `gymbro-app/components/coach/QuickReplyRow.jsx`
- **Symptom (from screenshot):** The top status strip and the quick-reply suggestions
  render as large blank rounded boxes, with their label text sitting outside the box
  rather than centered inside it.
- **Status:** **Unconfirmed.** Both components' styles were read closely and look
  correct — simple padding-sized pills, no explicit height, text nested inside the
  pressable. Nothing in the source explains the screenshot. Two candidate explanations:
  1. A real RN layout bug — this project runs React Native 0.86 with
     `newArchEnabled: true` (Fabric), where horizontal `ScrollView` child measurement can
     misbehave.
  2. A capture artifact from the screen-mirroring tool used to take the screenshots.
- **Next step:** Look at the AI Coach screen directly on the device. If it reproduces,
  compare against Android (it reportedly rendered fine there before), which would isolate
  it to iOS/Fabric rather than to the styles.
- **2026-09-12:** Re-reported as "the blocks before the chat box are inconsistent", so
  this is being treated as a real defect rather than a capture artifact. See F10 — the
  same "text escapes its container" signature now appears in a second component, which
  makes a shared root cause more likely than two unrelated style bugs.

### F5. Second exercise pill clipped at the screen edge
- **Where:** `gymbro-app/components/workout/ExerciseSelectorStrip.jsx`
- **Symptom (from screenshot):** The second pill reads "2. DOORWAY REVER" and is cut off
  at the right edge.
- **Status:** **Possibly not a bug.** That row is a horizontal `ScrollView`, so a
  partially-visible next pill is the normal resting appearance of a scrollable list.
- **Next step:** Confirm the row scrolls to reveal the full pill. If it doesn't scroll,
  investigate the parent's width constraints in `app/(tabs)/workout/index.jsx:177-184`.

---

## Deferred work (known incomplete, decided deliberately)

### F7. Dark mode needs a theme refactor before it can ship
- **Scope:** 47 files import `constants/theme.js`; 42 of them call `StyleSheet.create`
  at module scope with 233 `colors.*` references baked in. `StyleSheet.create` evaluates
  once at import, so mutating the exported `colors` object at runtime re-renders nothing.
- **What's needed:** turn the palette into light/dark token sets behind a provider +
  `useTheme()` hook, then convert each `StyleSheet.create({...})` into a factory the
  component calls with the active palette.
- **Status:** Settings ships a Dark mode row that is visibly **disabled** with a
  "not available yet" sub-label, so the intent is represented without a dead control.
  Flip it live as the final step of the refactor.

### F8. Weight-unit preference is not applied outside the profile screens
- **Where applied today:** `app/(profile)/profile.jsx`, `app/(profile)/edit.jsx`.
- **Still hardcoded to kg:** Workout Mode's WEIGHT tile and set table
  (`app/(tabs)/workout/index.jsx`, `components/workout/SetLogTable.jsx`), the workout
  summary modal's volume figure, and the Progress screen's PR table.
- **Fix:** read `useSettingsStore().weightUnit` at those display sites and run values
  through `formatWeight()` from `constants/units.js`. Storage stays kg — never convert
  before a Firestore or backend write.

### F9. Deleting an account orphans chat messages
- **Where:** `services/accountActions.js` (`deleteAccount`).
- **Cause:** `firestore.rules` denies client deletes on
  `aiConversations/{id}/messages` (`allow update, delete: if false`), and Firestore does
  not cascade. Parent conversation docs are deleted; their message subcollections survive.
- **Impact:** the orphans are unreachable — every rule on that path requires
  `request.auth.uid == uid`, and that uid can never sign in again — but the data is not
  erased.
- **Fix:** purge with the Admin SDK from a backend endpoint or a scheduled job.

---

## Not a bug

### F6. Blue gear icon in the top-right of every screen
Not part of this app. There is no gear/settings icon anywhere in the frontend source
(`⚙`, `gear`, `settings`, and `Ionicons` all return zero matches across `app/` and
`components/`). The dashboard header renders only the "GYMBRO" wordmark and a `🔥` streak
badge (`app/(tabs)/index.jsx:86-91`). The icon is an overlay from the screen
mirroring/capture tooling used to take the screenshots.

> Note: a real Settings entry point shipped separately on 2026-09-10 (Profile → gear →
> `/(profile)/settings`) — that's new work, not this artifact.

---

# Reported 2026-09-12

## Defects

### F10. Ring labels render outside their black container (Home + Meals)
- **Where:** `gymbro-app/components/shared/ProgressRing.jsx:26-56`
- **Symptom, two call sites, one component:**
  - **Home** — the consistency "25%" sits below the ring and is clipped by the bottom
    edge of the black tile (`app/(tabs)/index.jsx:137-148`).
  - **Meals** — the calorie "0" sits below the ring, clipped by the black daily-target
    panel and running off-screen (`components/nutrition/CalorieRingPanel.jsx:26-33`).
- **Cause (traced, mechanism unconfirmed):** the ring is a fixed
  `<View style={{ width: size, height: size }}>` holding an `<Svg>` plus a label overlay
  styled `...StyleSheet.absoluteFillObject` + centered. If that overlay lays out in normal
  flow instead of absolutely, the label lands *after* the SVG, overflows the hard-capped
  `height: size` box, and gets clipped by whichever black container it sits in — which is
  exactly the reported symptom in both places. The style code itself reads correctly, so
  this is unlikely to be a one-line tweak.
- **Shared signature with F4:** both are "text renders outside the box that should contain
  it", on iOS/Expo Go, on RN 0.86 + `newArchEnabled: true`. Worth investigating as one
  root cause (Fabric layout or font metrics) before patching three components separately.
- **Fix direction:** stop relying on absolute-fill centering for the label — lay the ring
  and its label out explicitly — and confirm on Android to isolate platform vs. styles.
- **Note:** fixing `ProgressRing` fixes both screens at once.

### F11. Pure black chrome will fight dark mode
- **Where:** `constants/theme.js` (`ink.black: '#111111'`, `ink.deep: '#0A0A0A'`), applied
  as screen chrome in `app/(tabs)/_layout.jsx:47` (tab bar), `app/(tabs)/index.jsx:199-206`
  (status strip), `components/shared/ScreenHeader.jsx`, and every dark card/panel.
- **Symptom:** the top bar and bottom navigation bar read as hard black borders against the
  light content, and that treatment has nowhere to go once the app has a dark theme — black
  chrome on a black background loses all separation.
- **Ask:** soften the blacks used in light mode so the same surfaces still read correctly
  after the dark palette lands.
- **Depends on:** F7 — this is a palette decision and should be made as part of the theme
  token work, not patched per screen beforehand.

## Design changes

### F12. Home header redesign
- **Where:** `app/(tabs)/index.jsx:86-91` (`statusStrip`).
- **Ask:** drop the black bar entirely. Replace with the GymBro logo on the left, and the
  streak counter plus profile icon on the right.
- **Note:** the streak badge and profile avatar already live in that strip as of
  2026-09-10; this change is about removing the black bar treatment around them.
- **Depends on:** F11 — same surface, so do both in one pass.
- **Asset:** `assets/brand/GymBroLogoPlain.png`, 1200×300 landscape (2026-09-12).
- **DONE 2026-09-12.** Black bar removed — `statusStrip` now sits on `surface.light` so
  the header reads as one surface with the page, the logo replaces the styled-text
  wordmark, and the streak count flipped to `text.primary`. The removal was required, not
  just cosmetic: the logo's "BRO" is black artwork and was invisible on the black bar.
- **Still open:** `components/shared/AuthShell.jsx:27-29` renders the same wordmark as
  styled text on sign-in/sign-up. Swap it to the logo so the two can't drift.

### F13. Loading screen
- **Ask:** a launch screen showing the GymBro logo for 2-3 seconds, with a randomly
  selected workout motivational quote.
- **Where it would go:** `app/index.jsx` already exists as the pre-route redirect and is
  the natural host; `app.json` also has a `splash` block configured.
- **Note:** the app currently gates first paint on the Firebase auth listener and the
  `users/{uid}` snapshot, so some of this delay already exists — the screen should cover
  that wait rather than adding 2-3s on top of it.
- **Asset:** `assets/brand/GYMBROmainlogo.png`, 1024×1024 (2026-09-12).
- **DONE 2026-09-12.** `app/index.jsx` now shows the logo plus one randomly chosen line
  from `constants/quotes.js` (12 unattributed gym aphorisms — attributed fitness quotes
  are misattributed more often than not), fading in over 600ms.
- **Timing:** the 2.5s minimum runs *in parallel with* the Firebase auth and user-document
  reads, not in series — that wait already existed, so the brand screen fills it rather
  than adding to it. On a slow cold start the reads are the long pole and the timer has
  already elapsed.
- **Background is light**, not the previous `ink.deep`: the logo's wordmark and tagline
  are black artwork and disappear on a dark ground. Revisit when a light-variant asset
  exists (F19).

### F18. Emoji are used as UI icons throughout
- **Scope:** 33 distinct glyphs, 76 uses, across 24 files. Every icon in the app is a
  unicode/emoji character inside a `<Text>`: tab bar (`⌂ 🏋 🍎 🤖`), settings rows
  (`✉ 🔒 👤 🌙 📦 ↩ ⚠`), chat (`🎙 ➤ ● 🤖`), workout (`⏱ ✓ ○ ▶`), nutrition
  (`🍳 🍛 🥤 🍽 ⚡`), onboarding (`💪 🏃 ⚖ 🔥`), navigation (`← → ↻ ⚙`).
- **Why it reads as cheap:** emoji render differently on every OS and font version, are
  full-colour so they can't be tinted to match brand or state, don't align to a consistent
  optical grid, and several (`🏋 🎙 ⏱ ⚠ ⚖`) are text-presentation glyphs that fall back
  inconsistently.
- **Blocks dark mode (F7):** an emoji can't be recoloured, so tab-bar active/inactive
  states and every dark-surface icon have no way to respond to a theme change. This should
  be resolved *before or with* the theme refactor, not after.
- **Direction:** replace with a vector icon set — tintable via a `color` prop, crisp at any
  density, one dependency instead of dozens of raster assets. Brand logo is a separate,
  genuinely file-based asset.
- **RESOLVED 2026-09-12.** Added `@expo/vector-icons` and a single map in
  `components/shared/Icon.jsx` (38 semantic names → Ionicons / MaterialCommunityIcons).
  All 24 files migrated; screens now name icons semantically (`<Icon name="train" />`)
  rather than by vendor glyph, so a future family swap is a one-file change. Every icon
  takes `color`, which unblocks the F7 theme work. Bundle grew 4.4→4.8MB (the two icon
  fonts). Remaining unicode in the codebase is prose inside toast strings and comments,
  not icon slots.

### F19. Logo needs a light variant before dark mode
- **Where:** `assets/brand/GYMBROmainlogo.png`, `assets/brand/GymBroLogoPlain.png`
- **Symptom:** both logos are dark-on-transparent — "BRO" is black, and the main logo's
  "YOUR SMART FITNESS ASSISTANT" tagline is black. Composited against `ink.black` they
  are effectively invisible; the wordmark survives only via its thin white outline.
- **Consequence:** the two surfaces that host a logo (dashboard header F12, loading screen
  F13) are both pinned to a light background *because of the artwork*, not by design. Dark
  mode (F7) can't flip them until a light variant exists.
- **Needed:** `GymBroLogoPlain-light.png` and `GYMBROmainlogo-light.png` (white/light
  wordmark + tagline, same dimensions), then select by active theme.
- **Asset note:** the delivered PNGs were flattened on white with no alpha. Backgrounds
  were removed here via edge-connected flood fill — a global white-key would have punched
  out the interior whites (letter counters, gear detail), which are 2.4% / 1.4% of the
  pixels. Resized to spec and alpha-premultiplied before downscaling to avoid edge halos.
  Main logo went 3.5MB → 531KB. A native transparent export from the design source would
  still be marginally cleaner than a background removal.

## Feature requests (new capability, not defects)

> These are not bugs — they are functionality that was never built. Kept in this log for
> one place to look, but they are product work and need their own scoping.

### F14. Users cannot edit their routine or add their own exercises
- **Where:** `app/(tabs)/workout/index.jsx` seeds an in-memory session straight from the
  AI plan's `weeklySchedule` and offers no add/remove/reorder. `useActiveWorkoutStore`
  exposes `logCurrentSet` / `updateSet` / `setExerciseIndex` only.
- **Ask:** let users modify the routine and insert their own exercises.

### F15. Exercise library + AI re-adjustment
- **Ask:** ship a browsable catalogue of available exercises for users to pick from, then
  have the AI read those selections and adjust the routine around them.
- **Backend note:** `/api/ai/generate-plan` and `/api/ai/substitute-exercise` already
  exist; this likely needs a new prompt/route that accepts user-chosen exercises as input
  rather than reusing plan generation wholesale. No exercise catalogue exists anywhere in
  the repo today — `constants/equipment.js` holds equipment enums, not exercises.

### F16. No way to mark an AI-recommended meal as complete
- **Where:** `app/(tabs)/nutrition/index.jsx` renders the plan's meals as read-only cards;
  logging goes through `AddMealSheet` as free-text + AI estimate.
- **Ask:** let a planned meal be ticked off, presumably writing its known macros into the
  day's totals without re-estimating them.

### F17. The AI meal plan itself cannot be edited
- **Symptom:** users can add their own intake, but the recommended plan is immutable.
- **Ask:** allow editing/replacing meals within the generated plan.
- **Related:** F16 — both concern the same read-only `mealPlans` document.
