import { StyleSheet, Text, View } from 'react-native';
import { colors, radius, spacing, typography } from '../../constants/theme';
import { Icon } from '../shared/Icon';

const DAY_INITIALS = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

/**
 * 7-day checkmark strip + progress bar.
 * @param {boolean[]} completedDays - Monday-first, length 7
 */
export function WeeklyGrid({ completedDays = [], targetDays }) {
  const completedCount = completedDays.filter(Boolean).length;
  const denominator = targetDays || 7;
  const percent = Math.min(100, (completedCount / denominator) * 100);

  return (
    <View style={styles.tile}>
      <Text style={styles.eyebrow}>This Week</Text>

      <View style={styles.days}>
        {DAY_INITIALS.map((initial, i) => (
          <View key={i} style={styles.day}>
            <Text style={styles.dayInitial}>{initial}</Text>
            <Icon
              name={completedDays[i] ? 'check' : 'dot'}
              size={completedDays[i] ? 14 : 6}
              color={completedDays[i] ? colors.brand.red : colors.border.default}
            />
          </View>
        ))}
      </View>

      <View style={styles.barTrack}>
        <View style={[styles.barFill, { width: `${percent}%` }]} />
      </View>
      <Text style={styles.count}>{`${completedCount}/${denominator}`}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  tile: {
    flex: 1,
    padding: spacing.lg,
    borderRadius: radius.lg,
    borderWidth: 1.5,
    borderColor: colors.border.default,
    backgroundColor: colors.surface.light,
    gap: spacing.sm,
  },
  eyebrow: { ...typography.eyebrow, fontSize: 9, color: colors.text.muted },
  days: { flexDirection: 'row', justifyContent: 'space-between' },
  day: { alignItems: 'center', gap: 4, minHeight: 30, justifyContent: 'center' },
  dayInitial: { ...typography.eyebrow, fontSize: 9, color: colors.text.faint },
  barTrack: {
    height: 6,
    borderRadius: radius.pill,
    backgroundColor: colors.border.soft,
    overflow: 'hidden',
  },
  barFill: { height: '100%', backgroundColor: colors.brand.red, borderRadius: radius.pill },
  count: { ...typography.eyebrow, fontSize: 9, color: colors.text.muted, alignSelf: 'flex-end' },
});
