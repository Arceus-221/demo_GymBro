import { StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, typography } from '../../constants/theme';
import { useConnectivityStore } from '../../store/useConnectivityStore';

/**
 * Global strip in the root layout. Path A keeps working offline, so this is
 * informational rather than blocking — it exists so stale cached data never
 * silently reads as live (Phase 3 §3.3).
 */
export function OfflineBanner() {
  const isOnline = useConnectivityStore((s) => s.isOnline);
  const insets = useSafeAreaInsets();

  if (isOnline) return null;

  return (
    <View style={[styles.banner, { paddingTop: insets.top + 6 }]}>
      <Text style={styles.text}>Offline — changes will sync when reconnected</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    backgroundColor: colors.ink.black,
    paddingBottom: 6,
    paddingHorizontal: 16,
  },
  text: {
    ...typography.eyebrow,
    color: '#FFFFFF',
    textAlign: 'center',
    letterSpacing: 1,
  },
});
