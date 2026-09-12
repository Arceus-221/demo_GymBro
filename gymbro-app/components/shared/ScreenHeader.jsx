import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, spacing, typography } from '../../constants/theme';
import { Icon } from './Icon';

/**
 * Black bar with a back chevron and a centered title — the same treatment
 * Progress and Workout Mode use, extracted so the stacked (profile) screens
 * can't drift from it.
 *
 * @param {{icon: string, label: string, onPress: () => void}} [action] trailing button;
 *   `icon` is a name from components/shared/Icon.jsx
 */
export function ScreenHeader({ title, onBack, action = null }) {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
      {onBack ? (
        <Pressable
          onPress={onBack}
          hitSlop={10}
          accessibilityRole="button"
          accessibilityLabel="Go back"
        >
          <Icon name="back" size={22} color="#FFFFFF" />
        </Pressable>
      ) : (
        <View style={styles.spacer} />
      )}

      <Text style={styles.title} numberOfLines={1}>
        {title}
      </Text>

      {action ? (
        <Pressable
          onPress={action.onPress}
          hitSlop={10}
          accessibilityRole="button"
          accessibilityLabel={action.label}
        >
          <Icon name={action.icon} size={22} color="#FFFFFF" />
        </Pressable>
      ) : (
        <View style={styles.spacer} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
    backgroundColor: colors.ink.black,
  },
  title: { ...typography.label, fontSize: 13, color: '#FFFFFF' },
  spacer: { width: 22 },
});
