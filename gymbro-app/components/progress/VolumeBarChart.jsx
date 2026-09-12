import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { colors, radius, spacing, typography } from '../../constants/theme';

/**
 * Sets per muscle group over the selected range. Plain views rather than a
 * charting dependency — these are rectangles.
 */
export function VolumeBarChart({ data }) {
  const entries = Object.entries(data);
  if (entries.length === 0) {
    return <Text style={styles.empty}>No training volume logged in this range yet.</Text>;
  }

  const max = Math.max(...entries.map(([, sets]) => sets));

  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false}>
      <View style={styles.chart}>
        {entries.map(([group, sets]) => (
          <View key={group} style={styles.column}>
            <Text style={styles.count}>{sets}</Text>
            <View style={styles.track}>
              <View style={[styles.bar, { height: `${(sets / max) * 100}%` }]} />
            </View>
            <Text style={styles.label} numberOfLines={1}>
              {group}
            </Text>
          </View>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  chart: { flexDirection: 'row', gap: spacing.md, alignItems: 'flex-end', height: 160 },
  column: { alignItems: 'center', gap: 4, width: 56 },
  track: { height: 110, width: 26, justifyContent: 'flex-end' },
  bar: { width: 26, backgroundColor: colors.brand.red, borderRadius: radius.sm, minHeight: 4 },
  count: { ...typography.eyebrow, fontSize: 9, color: colors.text.primary },
  label: { ...typography.eyebrow, fontSize: 8, color: colors.text.muted },
  empty: { ...typography.small, color: colors.text.muted },
});
