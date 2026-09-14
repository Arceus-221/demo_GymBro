import { StyleSheet, Text, View } from 'react-native';
import { radius, spacing, typography } from '../../constants/theme';
import { useThemedStyles } from '../shared/ThemeProvider';

export function StatTile({ value, label, accent = false }) {
  const { styles } = useThemedStyles(makeStyles);
  return (
    <View style={[styles.tile, accent && styles.accent]}>
      <Text style={[styles.value, accent && styles.valueAccent]} numberOfLines={1}>
        {value}
      </Text>
      <Text style={styles.label}>{label}</Text>
    </View>
  );
}

const makeStyles = (colors) => StyleSheet.create({
  tile: {
    flex: 1,
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.md,
    borderRadius: radius.lg,
    borderWidth: 1.5,
    borderColor: colors.border.default,
    backgroundColor: colors.surface.primary,
    gap: 2,
  },
  accent: { borderColor: colors.brand.red, backgroundColor: colors.brand.redTint },
  value: { ...typography.stat, fontSize: 20, color: colors.text.primary },
  valueAccent: { color: colors.brand.redText },
  label: { ...typography.eyebrow, fontSize: 9, color: colors.text.muted },
});
