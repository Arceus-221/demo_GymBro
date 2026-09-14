import { StyleSheet, Text, View } from 'react-native';
import { spacing, typography } from '../../constants/theme';
import { Button } from './Button';
import { useThemedStyles } from './ThemeProvider';

export function EmptyState({ title, message, actionLabel, onAction, style }) {
  const { styles } = useThemedStyles(makeStyles);
  return (
    <View style={[styles.wrap, style]}>
      <Text style={styles.title}>{title}</Text>
      {message ? <Text style={styles.message}>{message}</Text> : null}
      {actionLabel && onAction ? (
        <Button label={actionLabel} onPress={onAction} style={styles.action} />
      ) : null}
    </View>
  );
}

const makeStyles = (colors) => StyleSheet.create({
  wrap: { alignItems: 'center', padding: spacing.xl, gap: spacing.sm },
  title: { ...typography.h2, fontSize: 18, color: colors.text.primary, textAlign: 'center' },
  message: {
    ...typography.small,
    color: colors.text.muted,
    textAlign: 'center',
    lineHeight: 18,
  },
  action: { marginTop: spacing.md, alignSelf: 'stretch' },
});
