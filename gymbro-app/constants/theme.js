// constants/theme.js — brand tokens from Phase 3 §2.0.
// "Gym poster" energy: heavy weights, tight tracking, letter-spaced micro-labels.

export const colors = {
  brand: { red: '#EF0000', redDim: '#C50000', redTint: '#FFF5F5' },
  ink: { black: '#111111', deep: '#0A0A0A' },
  surface: { light: '#FFFFFF', muted: '#F8F8F8', mutedAlt: '#FAFAFA' },
  border: { default: '#E0E0E0', soft: '#F0F0F0', dark: '#262626' },
  text: {
    primary: '#111111',
    muted: '#888888',
    faint: '#AAAAAA',
    mid: '#555555',
    onDark: '#FFFFFF',
    onDarkMuted: '#9A9A9A',
  },
  success: '#22C55E',
};

export const spacing = { xs: 4, sm: 8, md: 12, lg: 16, xl: 24, xxl: 32 };

export const radius = { sm: 8, md: 12, lg: 16, xl: 22, pill: 999 };

// Headings shout (900 + negative tracking); eyebrows whisper (700, uppercase,
// wide tracking, small). This pairing repeats on every screen.
export const typography = {
  hero: { fontSize: 34, fontWeight: '900', letterSpacing: -1 },
  h1: { fontSize: 28, fontWeight: '900', letterSpacing: -0.8 },
  h2: { fontSize: 22, fontWeight: '900', letterSpacing: -0.5 },
  stat: { fontSize: 24, fontWeight: '900', letterSpacing: -0.5 },
  eyebrow: { fontSize: 10, fontWeight: '700', letterSpacing: 2, textTransform: 'uppercase' },
  label: { fontSize: 12, fontWeight: '700', letterSpacing: 1 },
  body: { fontSize: 14, fontWeight: '500' },
  small: { fontSize: 12, fontWeight: '500' },
};

export default { colors, spacing, radius, typography };
