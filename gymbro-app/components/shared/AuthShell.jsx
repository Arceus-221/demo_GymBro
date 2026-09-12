import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, radius, spacing, typography } from '../../constants/theme';
import { Eyebrow, Heading } from './Typography';

/** Shared frame for sign-in / sign-up so the two screens can't drift apart. */
export function AuthShell({ eyebrow, title, subtitle, children }) {
  const insets = useSafeAreaInsets();

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        contentContainerStyle={[styles.content, { paddingTop: insets.top + 48 }]}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={styles.wordmark}>
          GYM<Text style={styles.red}>BRO</Text>
        </Text>
        <View style={styles.header}>
          <Eyebrow>{eyebrow}</Eyebrow>
          <Heading level={0} style={styles.title}>
            {title}
          </Heading>
          {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
        </View>
        {children}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

export function Field({ label, error, ...inputProps }) {
  return (
    <View style={styles.field}>
      <Eyebrow>{label}</Eyebrow>
      <TextInput
        placeholderTextColor={colors.text.faint}
        style={[styles.input, error && styles.inputError]}
        {...inputProps}
      />
      {error ? <Text style={styles.errorText}>{error}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.surface.light },
  content: { paddingHorizontal: spacing.xl, paddingBottom: spacing.xxl, gap: spacing.lg },
  wordmark: { ...typography.h1, fontSize: 26, color: colors.ink.black },
  red: { color: colors.brand.red },
  header: { gap: spacing.xs, marginTop: spacing.lg },
  title: { marginTop: spacing.xs },
  subtitle: { ...typography.body, color: colors.text.muted, marginTop: spacing.xs },
  field: { gap: spacing.xs },
  input: {
    borderWidth: 1.5,
    borderColor: colors.border.default,
    borderRadius: radius.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    fontSize: 16,
    fontWeight: '600',
    color: colors.text.primary,
    backgroundColor: colors.surface.muted,
  },
  inputError: { borderColor: colors.brand.red },
  errorText: { ...typography.small, color: colors.brand.red },
});
