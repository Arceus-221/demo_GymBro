import { ActivityIndicator, Pressable, StyleSheet, Text } from 'react-native';
import { radius, typography } from '../../constants/theme';
import { useThemedStyles } from './ThemeProvider';

/**
 * @param {'primary'|'secondary'|'ghost'|'dark'} variant
 */
export function Button({
  label,
  onPress,
  variant = 'primary',
  disabled = false,
  loading = false,
  style,
  textStyle,
}) {
  const { styles, colors } = useThemedStyles(makeStyles);
  const isDisabled = disabled || loading;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: isDisabled, busy: loading }}
      onPress={onPress}
      disabled={isDisabled}
      style={({ pressed }) => [
        styles.base,
        styles[variant],
        pressed && !isDisabled && styles.pressed,
        isDisabled && styles.disabled,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator
          color={variant === 'secondary' || variant === 'ghost' ? colors.brand.redText : colors.text.inverse}
        />
      ) : (
        <Text style={[styles.text, styles[`${variant}Text`], textStyle]}>{label}</Text>
      )}
    </Pressable>
  );
}

const makeStyles = (colors) => StyleSheet.create({
  base: {
    minHeight: 52,
    paddingHorizontal: 24,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  primary: { backgroundColor: colors.brand.red },
  dark: { backgroundColor: colors.surface.inverse },
  secondary: {
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: colors.brand.red,
  },
  ghost: { backgroundColor: 'transparent' },
  pressed: { opacity: 0.85, transform: [{ scale: 0.99 }] },
  disabled: { opacity: 0.45 },
  text: { ...typography.label, fontSize: 13, letterSpacing: 1.5 },
  primaryText: { color: colors.text.inverse },
  darkText: { color: colors.text.inverse },
  secondaryText: { color: colors.brand.redText },
  ghostText: { color: colors.text.muted },
});
