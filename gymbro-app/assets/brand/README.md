# Brand assets

## What to export (PNG)

| File | Size | Ratio | Used by |
|---|---|---|---|
| `GymBroLogoPlain.png` | 1200 × 300 | 4:1 landscape | App header (left), auth screens — light mode |
| `GymBroLogoPlain-white.png` | 2048 × 512 | 4:1 landscape | Same two surfaces — dark mode |
| `GYMBROmainlogo.png` | 1024 × 1024 | 1:1 square | Loading screen (both themes) |

The two plain variants are paired in `components/shared/BrandWordmark.jsx`, which picks
one by the active theme. Nothing else should `require()` them directly, or the pair will
drift.

Those dimensions are ~3-4× the largest on-screen size, so they stay sharp on a 3x phone
display. One high-resolution file per logo is enough — React Native downsamples cleanly,
and no `@2x`/`@3x` variants are needed at these sizes.

**Export with a transparent background, not a white one.** A baked-in white background
looks correct today and turns into a visible white rectangle the moment dark mode lands
(F7 in `FRONTEND_FIX_LOG.md`).

### Light variants — resolved 2026-09-14

`GymBroLogoPlain-white.png` was added when dark mode landed, and closes F19 for the two
surfaces that needed it.

**The loading screen needs no light variant.** It carries its own background in both
themes by design rather than following the palette, so `GYMBROmainlogo.png` works
unchanged. Those two values live in `colors.splash` (`constants/theme.js`).

Note the white variant is 2048 × 512 rather than matching the 1200 × 300 original. Both
are 4:1 so they are interchangeable at any rendered size; the larger export is simply more
headroom than needed at a 144pt render.

## Why PNG and not SVG here

The original `.svg` files in this folder were **auto-traced from raster artwork**, not
authored as vectors:

| | `GYMBROmainlogo.svg` | `GymBroLogoPlain.svg` |
|---|---|---|
| Paths | 2,250 | 293 |
| Distinct fills | 2,063 | 281 |
| `viewBox` | none | none |

Those fill counts are anti-aliased edge pixels from the source image, each converted into
its own polygon — dozens of near-identical reds (`#E8302D`, `#E21D1D`, `#E22F2D`, …) where
a hand-authored logo would have exactly one.

That makes SVG the wrong format for these specific files:

- react-native-svg renders **every path as a native shape**. 2,250 of them on the loading
  screen — the one screen whose entire job is to appear instantly — is the worst place to
  pay that cost.
- With no `viewBox`, scaling in react-native-svg is unreliable.
- Hundreds of hardcoded fills can't be tinted, so SVG's main advantage for dark mode
  doesn't apply anyway.
- Since the artwork is raster underneath, a PNG is visually identical, smaller, and
  rendered by the native image pipeline.

The SVG pipeline itself stays wired up (`metro.config.js` + `react-native-svg-transformer`)
— it's there for any genuine vector asset added later.

**Once the PNGs land, the traced `.svg` files should be deleted** so there's no ambiguity
about which file is canonical.

## Brand red

The traced logos sample around `#E01A1B`–`#E51514`. The app's theme red stays **`#EF0000`**
(`constants/theme.js`) — decided 2026-09-12, logo and UI red are allowed to differ slightly.

## App launcher / splash icons are separate

These live at the root of `assets/` because `app.json` hardcodes those paths:

- `icon.png` — app launcher icon (1024×1024) — `GYMBROmainlogo.png` can be reused here
- `splash-icon.png` — native splash, shown before the JS bundle loads
- `android-icon-foreground.png` / `-background.png` / `-monochrome.png` — Android adaptive
- `favicon.png` — web

Replace in place and keep the filenames. Note the native splash is a different thing from
the in-app loading screen (F13): the native one appears first, while JS loads, and cannot
show rotating quotes. Using the same logo in both keeps the handoff from looking like two
different screens.
