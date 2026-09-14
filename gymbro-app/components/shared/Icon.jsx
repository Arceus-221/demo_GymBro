import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from './ThemeProvider';

/**
 * Every icon in the app resolves through this one map.
 *
 * Screens name icons semantically (`<Icon name="train" />`), never by vendor
 * glyph, so swapping icon families later is a change to this file rather than a
 * sweep through 24 screens — the same reasoning that keeps MODEL_ID in one
 * place on the backend.
 *
 * These replaced emoji characters, which render differently per OS, can't be
 * tinted, and therefore couldn't respond to the coming dark theme (see F18 in
 * FRONTEND_FIX_LOG.md). Everything here takes a `color` prop instead.
 */
const ICONS = {
  // Tabs — outline for the resting state, solid for the focused one.
  home: [Ionicons, 'home-outline'],
  homeActive: [Ionicons, 'home'],
  train: [MaterialCommunityIcons, 'dumbbell'],
  trainActive: [MaterialCommunityIcons, 'dumbbell'],
  meals: [Ionicons, 'nutrition-outline'],
  mealsActive: [Ionicons, 'nutrition'],
  coach: [MaterialCommunityIcons, 'robot-outline'],
  coachActive: [MaterialCommunityIcons, 'robot'],

  // Navigation / chrome
  back: [Ionicons, 'arrow-back'],
  forward: [Ionicons, 'arrow-forward'],
  chevron: [Ionicons, 'chevron-forward'],
  refresh: [Ionicons, 'refresh'],
  settings: [Ionicons, 'settings-outline'],

  // Account & settings rows
  mail: [Ionicons, 'mail-outline'],
  lock: [Ionicons, 'lock-closed-outline'],
  person: [Ionicons, 'person-outline'],
  moon: [Ionicons, 'moon-outline'],
  package: [Ionicons, 'cube-outline'],
  signOut: [Ionicons, 'log-out-outline'],
  warning: [Ionicons, 'warning-outline'],

  // Dashboard & progress
  flame: [Ionicons, 'flame'],
  chart: [Ionicons, 'bar-chart'],
  chat: [Ionicons, 'chatbubble-ellipses'],

  // Workout
  timer: [Ionicons, 'timer-outline'],
  play: [Ionicons, 'play'],
  check: [Ionicons, 'checkmark'],
  circle: [Ionicons, 'ellipse-outline'],
  dot: [Ionicons, 'ellipse'],

  // Chat input
  mic: [Ionicons, 'mic'],
  send: [Ionicons, 'send'],

  // Nutrition
  bolt: [Ionicons, 'flash'],
  plate: [Ionicons, 'restaurant-outline'],
  breakfast: [MaterialCommunityIcons, 'egg-fried'],
  lunch: [MaterialCommunityIcons, 'bowl-mix'],
  drink: [MaterialCommunityIcons, 'cup'],

  // Onboarding goals
  muscle: [MaterialCommunityIcons, 'arm-flex'],
  run: [MaterialCommunityIcons, 'run'],
  scale: [MaterialCommunityIcons, 'scale-balance'],
};

export function Icon({ name, size = 20, color, style }) {
  const { colors } = useTheme();
  const entry = ICONS[name];

  if (!entry) {
    // Loud in development, silent in production — a missing icon should never
    // be a blank square nobody notices, nor a crash in a user's hands.
    if (__DEV__) console.warn(`<Icon name="${name}" /> is not in the icon map.`);
    return null;
  }

  const [Family, glyph] = entry;
  // Resolved here, not in the signature: a default parameter cannot read
  // a hook, and an unthemed default would stay black in dark mode.
  return (
    <Family name={glyph} size={size} color={color ?? colors.text.primary} style={style} />
  );
}

/** Names are exported so callers can be checked against the map in tests. */
export const ICON_NAMES = Object.keys(ICONS);
