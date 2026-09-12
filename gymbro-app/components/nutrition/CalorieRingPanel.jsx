import { StyleSheet, Text, View } from 'react-native';
import { colors, radius, spacing, typography } from '../../constants/theme';
import { ProgressRing } from '../shared/ProgressRing';

function MacroBar({ label, value, target, color }) {
  const percent = target ? Math.min(100, (value / target) * 100) : 0;
  return (
    <View style={styles.macro}>
      <View style={styles.macroHeader}>
        <Text style={styles.macroLabel}>{label}</Text>
        <Text style={styles.macroValue}>{`${Math.round(value)}/${target}g`}</Text>
      </View>
      <View style={styles.track}>
        <View style={[styles.fill, { width: `${percent}%`, backgroundColor: color }]} />
      </View>
    </View>
  );
}

export function CalorieRingPanel({ totals, targets }) {
  const calories = Math.round(totals?.calories ?? 0);
  const percent = targets.calories ? Math.round((calories / targets.calories) * 100) : 0;

  return (
    <View style={styles.panel}>
      <View style={styles.ringSide}>
        <ProgressRing
          percent={percent}
          size={100}
          label={String(calories)}
          sublabel="kcal"
        />
      </View>

      <View style={styles.bars}>
        <Text style={styles.target}>
          {`Daily Target: ${targets.calories.toLocaleString()}  ·  ${percent}%`}
        </Text>
        <MacroBar label="Carbs" value={totals?.carbsG ?? 0} target={targets.carbsG} color="#F5A524" />
        <MacroBar label="Protein" value={totals?.proteinG ?? 0} target={targets.proteinG} color={colors.brand.red} />
        <MacroBar label="Fat" value={totals?.fatsG ?? 0} target={targets.fatsG} color="#3B82F6" />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  panel: {
    flexDirection: 'row',
    gap: spacing.lg,
    padding: spacing.lg,
    borderRadius: radius.lg,
    backgroundColor: colors.ink.black,
    alignItems: 'center',
  },
  ringSide: { alignItems: 'center' },
  bars: { flex: 1, gap: spacing.sm },
  target: { ...typography.eyebrow, fontSize: 9, color: 'rgba(255,255,255,0.7)' },
  macro: { gap: 3 },
  macroHeader: { flexDirection: 'row', justifyContent: 'space-between' },
  macroLabel: { ...typography.eyebrow, fontSize: 8, color: 'rgba(255,255,255,0.6)' },
  macroValue: { ...typography.eyebrow, fontSize: 8, color: '#FFFFFF' },
  track: {
    height: 5,
    borderRadius: radius.pill,
    backgroundColor: 'rgba(255,255,255,0.15)',
    overflow: 'hidden',
  },
  fill: { height: '100%', borderRadius: radius.pill },
});
