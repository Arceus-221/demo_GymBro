import { Children, cloneElement, isValidElement } from 'react';
import { Pressable, StyleSheet, Switch, Text, View } from 'react-native';
import { colors, radius, spacing, typography } from '../../constants/theme';
import { Icon } from '../shared/Icon';
import { Eyebrow } from '../shared/Typography';

/**
 * Titled block of rows sharing one rounded container. The separator lives on
 * each row, so the group strips it from the last one — otherwise it would draw
 * a second hairline directly against the card's own bottom border.
 */
export function SettingsGroup({ label, children }) {
  const rows = Children.toArray(children).filter(Boolean);

  return (
    <View style={styles.group}>
      {label ? <Eyebrow>{label}</Eyebrow> : null}
      <View style={styles.card}>
        {rows.map((row, index) =>
          isValidElement(row) && index === rows.length - 1
            ? cloneElement(row, { isLast: true })
            : row
        )}
      </View>
    </View>
  );
}

/**
 * Tappable row: icon, label (+ optional sub-label), trailing value and chevron.
 * Without `onPress` it renders as a static read-only row.
 */
export function SettingsRow({
  label,
  sub,
  icon,
  value,
  onPress,
  destructive = false,
  disabled = false,
  isLast = false,
}) {
  const tint = destructive ? colors.brand.red : colors.text.mid;

  const body = (
    <>
      {icon ? <Icon name={icon} size={19} color={tint} style={styles.icon} /> : null}
      <View style={styles.text}>
        <Text style={[styles.label, destructive && styles.destructive]}>{label}</Text>
        {sub ? <Text style={styles.sub}>{sub}</Text> : null}
      </View>
      {value ? (
        <Text style={styles.value} numberOfLines={1}>
          {value}
        </Text>
      ) : null}
      {onPress && !disabled ? (
        <Icon name="chevron" size={18} color={colors.text.faint} />
      ) : null}
    </>
  );

  if (!onPress) {
    return (
      <View style={[styles.row, isLast && styles.rowLast, disabled && styles.rowDisabled]}>
        {body}
      </View>
    );
  }

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled }}
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [
        styles.row,
        isLast && styles.rowLast,
        pressed && styles.rowPressed,
        disabled && styles.rowDisabled,
      ]}
    >
      {body}
    </Pressable>
  );
}

/** Row with a trailing Switch. The row body itself is not pressable. */
export function SettingsSwitchRow({
  label,
  sub,
  icon,
  value,
  onValueChange,
  disabled = false,
  isLast = false,
}) {
  return (
    <View style={[styles.row, isLast && styles.rowLast, disabled && styles.rowDisabled]}>
      {icon ? (
        <Icon name={icon} size={19} color={colors.text.mid} style={styles.icon} />
      ) : null}
      <View style={styles.text}>
        <Text style={styles.label}>{label}</Text>
        {sub ? <Text style={styles.sub}>{sub}</Text> : null}
      </View>
      <Switch
        value={value}
        onValueChange={onValueChange}
        disabled={disabled}
        trackColor={{ true: colors.brand.red, false: colors.border.default }}
        thumbColor="#FFFFFF"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  group: { gap: spacing.sm },
  card: {
    borderWidth: 1,
    borderColor: colors.border.default,
    borderRadius: radius.lg,
    backgroundColor: colors.surface.light,
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.lg,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border.default,
    minHeight: 58,
  },
  rowLast: { borderBottomWidth: 0 },
  rowPressed: { backgroundColor: colors.surface.muted },
  rowDisabled: { opacity: 0.45 },
  icon: { width: 24, textAlign: 'center' },
  text: { flex: 1, gap: 2 },
  label: { ...typography.body, fontWeight: '700', color: colors.text.primary },
  destructive: { color: colors.brand.red },
  sub: { ...typography.small, fontSize: 11, color: colors.text.muted },
  value: { ...typography.small, fontWeight: '700', color: colors.text.muted, maxWidth: 150 },
});
