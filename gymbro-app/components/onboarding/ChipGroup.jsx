import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, radius, spacing, typography } from '../../constants/theme';
import { Eyebrow } from '../shared/Typography';

/** Segmented / multi-select chip grid used across onboarding step 2 and 3. */
export function ChipGroup({ label, options, value, onChange, multi = false }) {
  const isSelected = (optionValue) =>
    multi ? (value || []).includes(optionValue) : value === optionValue;

  return (
    <View style={styles.group}>
      {label ? <Eyebrow>{label}</Eyebrow> : null}
      <View style={styles.chips}>
        {options.map((option) => {
          const selected = isSelected(option.value);
          return (
            <Pressable
              key={String(option.value)}
              accessibilityRole={multi ? 'checkbox' : 'radio'}
              accessibilityState={{ selected }}
              onPress={() => onChange(option.value)}
              style={[styles.chip, selected && styles.chipSelected]}
            >
              <Text style={[styles.chipText, selected && styles.chipTextSelected]}>
                {option.label}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  group: { gap: spacing.sm },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  chip: {
    paddingHorizontal: spacing.lg,
    paddingVertical: 10,
    borderRadius: radius.pill,
    borderWidth: 1.5,
    borderColor: colors.border.default,
    backgroundColor: colors.surface.light,
  },
  chipSelected: { backgroundColor: colors.brand.red, borderColor: colors.brand.red },
  chipText: { ...typography.small, fontWeight: '700', color: colors.text.mid },
  chipTextSelected: { color: '#FFFFFF' },
});
