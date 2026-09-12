import { StyleSheet, TextInput, View } from 'react-native';
import { colors, radius, spacing } from '../../constants/theme';
import { Eyebrow } from '../shared/Typography';

export function NumberField({ label, value, onChange, placeholder, suffix }) {
  return (
    <View style={styles.field}>
      <Eyebrow>{suffix ? `${label} (${suffix})` : label}</Eyebrow>
      <TextInput
        value={value == null ? '' : String(value)}
        onChangeText={(text) => {
          const cleaned = text.replace(/[^0-9.]/g, '');
          onChange(cleaned === '' ? null : Number(cleaned));
        }}
        placeholder={placeholder}
        placeholderTextColor={colors.text.faint}
        keyboardType="decimal-pad"
        style={styles.input}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  field: { flex: 1, gap: spacing.xs },
  input: {
    borderWidth: 1.5,
    borderColor: colors.border.default,
    borderRadius: radius.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    fontSize: 16,
    fontWeight: '700',
    color: colors.text.primary,
    backgroundColor: colors.surface.muted,
  },
});
