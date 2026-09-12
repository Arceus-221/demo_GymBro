import { useEffect } from 'react';
import { Pressable, StyleSheet, Text } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, radius, spacing, typography } from '../../constants/theme';
import { useUIStore } from '../../store/useUIStore';

const AUTO_DISMISS_MS = 4000;

/** Single global toast surface, consuming the Phase 2 §7.6 error contract. */
export function ErrorToast() {
  const toast = useUIStore((s) => s.toast);
  const clearToast = useUIStore((s) => s.clearToast);
  const insets = useSafeAreaInsets();

  useEffect(() => {
    if (!toast) return undefined;
    const timer = setTimeout(clearToast, AUTO_DISMISS_MS);
    return () => clearTimeout(timer);
  }, [toast, clearToast]);

  if (!toast) return null;

  return (
    <Pressable
      onPress={clearToast}
      style={[
        styles.toast,
        toast.tone === 'error' && styles.error,
        toast.tone === 'success' && styles.success,
        { bottom: insets.bottom + 90 },
      ]}
    >
      <Text style={styles.text}>{toast.message}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  toast: {
    position: 'absolute',
    left: spacing.lg,
    right: spacing.lg,
    backgroundColor: colors.ink.black,
    borderRadius: radius.md,
    padding: spacing.lg,
    zIndex: 999,
  },
  error: { backgroundColor: colors.brand.red },
  success: { backgroundColor: colors.success },
  text: { ...typography.body, color: '#FFFFFF', fontWeight: '600' },
});
