import { Image } from 'react-native';
import { useTheme } from './ThemeProvider';

// Both paths are static requires because React Native resolves them at bundle
// time — a computed path would not be bundled at all.
const LOGO_DARK_ON_LIGHT = require('../../assets/brand/GymBroLogoPlain.png');
const LOGO_LIGHT_ON_DARK = require('../../assets/brand/GymBroLogoPlain-white.png');

/**
 * The GYMBRO wordmark, in the variant the active theme can actually show.
 *
 * The original artwork is black-on-transparent and disappears on a dark ground
 * (F19); the -white asset is the light-on-dark counterpart. Both live here
 * rather than at each call site so the dashboard header and the auth screens
 * cannot drift apart — the point of F12 — and so the pairing is stated once.
 */
export function BrandWordmark({ width = 144, height = 36 }) {
  const { scheme } = useTheme();

  return (
    <Image
      source={scheme === 'dark' ? LOGO_LIGHT_ON_DARK : LOGO_DARK_ON_LIGHT}
      style={{ width, height }}
      resizeMode="contain"
      accessibilityRole="image"
      accessibilityLabel="GymBro"
    />
  );
}
