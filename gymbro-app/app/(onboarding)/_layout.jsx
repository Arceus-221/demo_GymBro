import { Stack } from 'expo-router';
import { useTheme } from '../../components/shared/ThemeProvider';

export default function OnboardingLayout() {
  // Stack contentStyle is not a StyleSheet, so it has to read the live
  // palette here or the screen background never follows the theme.
  const { colors } = useTheme();
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        // Back is driven by the footer's explicit Back button, not a swipe —
        // an accidental swipe mid-wizard is easy to do and confusing.
        gestureEnabled: false,
        contentStyle: { backgroundColor: colors.surface.primary },
      }}
    />
  );
}
