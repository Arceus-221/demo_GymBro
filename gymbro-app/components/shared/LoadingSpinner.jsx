import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { spacing, typography } from '../../constants/theme';
import { useThemedStyles } from './ThemeProvider';

export function LoadingSpinner({ message, dark = false, style }) {
  const { styles, colors } = useThemedStyles(makeStyles);
  return (
    <View style={[styles.wrap, style]}>
      <ActivityIndicator color={dark ? colors.text.inverse : colors.brand.redText} size="large" />
      {message ? (
        <Text style={[styles.message, dark && styles.messageDark]}>{message}</Text>
      ) : null}
    </View>
  );
}

/**
 * Standard loading copy for Path B calls — swaps to the cold-start message
 * once useCallBackend reports we're probably waiting on Render (Phase 5 §1.2).
 */
export function backendLoadingMessage(loadingHint, normalMessage = 'Thinking...') {
  return loadingHint === 'waking'
    ? 'Waking Coach up — this can take a moment on first use'
    : normalMessage;
}

const makeStyles = (colors) => StyleSheet.create({
  wrap: { alignItems: 'center', justifyContent: 'center', padding: spacing.xl, gap: spacing.md },
  message: { ...typography.small, color: colors.text.muted, textAlign: 'center' },
  messageDark: { color: colors.text.inverseMuted },
});
