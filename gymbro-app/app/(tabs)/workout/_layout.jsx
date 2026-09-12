import { Stack } from 'expo-router';
import { colors } from '../../../constants/theme';

export default function WorkoutLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: colors.ink.deep },
      }}
    />
  );
}
