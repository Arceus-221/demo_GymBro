import { Stack } from 'expo-router';
import { useTheme } from '../../../components/shared/ThemeProvider';

export default function CoachLayout() {
  // Stack contentStyle is not a StyleSheet, so it has to read the live
  // palette here or the screen background never follows the theme.
  const { colors } = useTheme();
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: colors.surface.tertiary },
      }}
    />
  );
}
