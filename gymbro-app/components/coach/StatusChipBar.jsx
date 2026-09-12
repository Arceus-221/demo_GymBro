import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { colors, radius, spacing, typography } from '../../constants/theme';
import { Icon } from '../shared/Icon';

/**
 * Read-only state chips — not a filter control (Phase 3 §2.4 revision note).
 * Each chip is `{ icon, label }`, where `icon` is a name from Icon.jsx.
 */
export function StatusChipBar({ chips }) {
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.row}>
      {chips.map((chip) => (
        <View key={chip.label} style={styles.chip}>
          <Icon name={chip.icon} size={12} color={colors.text.mid} />
          <Text style={styles.text}>{chip.label}</Text>
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  row: { gap: spacing.sm, paddingHorizontal: spacing.lg, paddingVertical: spacing.md },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
    borderRadius: radius.pill,
    backgroundColor: colors.surface.muted,
    borderWidth: 1,
    borderColor: colors.border.soft,
  },
  text: { ...typography.eyebrow, fontSize: 9, color: colors.text.mid, letterSpacing: 1 },
});
