import { StyleSheet, Text, View } from 'react-native';
import { spacing, typography } from '../../constants/theme';
import { formatWeight } from '../../constants/units';
import { useSettingsStore } from '../../store/useSettingsStore';
import { useThemedStyles } from '../shared/ThemeProvider';

export function PRTrackerTable({ records }) {
  const { styles } = useThemedStyles(makeStyles);
  const weightUnit = useSettingsStore((s) => s.weightUnit);

  if (records.length === 0) {
    return <Text style={styles.empty}>No personal records yet — log a few sessions.</Text>;
  }

  return (
    <View style={styles.table}>
      <View style={styles.headerRow}>
        <Text style={[styles.header, styles.colName]}>EXERCISE</Text>
        <Text style={[styles.header, styles.colBest]}>BEST</Text>
        <Text style={[styles.header, styles.colDate]}>DATE</Text>
      </View>
      {records.map((record) => (
        <View key={record.name} style={styles.row}>
          <Text style={[styles.cell, styles.colName]} numberOfLines={1}>
            {record.name}
          </Text>
          <Text style={[styles.cell, styles.colBest, styles.best]}>
            {formatWeight(record.weightKg, weightUnit)}
          </Text>
          <Text style={[styles.cell, styles.colDate]}>{record.date.slice(5)}</Text>
        </View>
      ))}
    </View>
  );
}

const makeStyles = (colors) => StyleSheet.create({
  table: { borderRadius: 12, borderWidth: 1, borderColor: colors.border.default, overflow: 'hidden' },
  headerRow: {
    flexDirection: 'row',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: colors.surface.secondary,
  },
  header: { ...typography.eyebrow, fontSize: 8, color: colors.text.muted },
  row: {
    flexDirection: 'row',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border.soft,
  },
  cell: { ...typography.small, color: colors.text.primary },
  best: { fontWeight: '800', color: colors.brand.redText },
  colName: { flex: 1 },
  colBest: { width: 70 },
  colDate: { width: 50, textAlign: 'right' },
  empty: { ...typography.small, color: colors.text.muted },
});
