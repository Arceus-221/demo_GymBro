import { Pressable, StyleSheet, Text } from 'react-native';
import { colors, radius, spacing, typography } from '../../constants/theme';
import { Icon } from '../shared/Icon';

export function QuickActionTile({ icon, label, onPress }) {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [styles.tile, pressed && styles.pressed]}
    >
      <Icon name={icon} size={22} color={colors.brand.red} />
      <Text style={styles.label}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  tile: {
    flex: 1,
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.lg,
    borderRadius: radius.lg,
    borderWidth: 1.5,
    borderColor: colors.border.default,
    backgroundColor: colors.surface.muted,
  },
  pressed: { opacity: 0.7 },
  label: { ...typography.eyebrow, fontSize: 9, color: colors.text.mid, textAlign: 'center' },
});
