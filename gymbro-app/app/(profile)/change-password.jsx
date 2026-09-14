import { useRouter } from 'expo-router';
import { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
} from 'react-native';
import { Field } from '../../components/shared/AuthShell';
import { Button } from '../../components/shared/Button';
import { ScreenHeader } from '../../components/shared/ScreenHeader';
import { colors, spacing, typography } from '../../constants/theme';
import { changePassword } from '../../services/accountActions';
import { authErrorMessage } from '../../services/authErrors';
import { useUIStore } from '../../store/useUIStore';

const MIN_LENGTH = 6;

export default function ChangePassword() {
  const router = useRouter();
  const showToast = useUIStore((s) => s.showToast);

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      setError('Fill in every field to continue.');
      return;
    }
    if (newPassword.length < MIN_LENGTH) {
      setError(`New password needs to be at least ${MIN_LENGTH} characters.`);
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('The two new passwords don’t match.');
      return;
    }
    if (newPassword === currentPassword) {
      setError('That’s already your current password.');
      return;
    }

    setIsSubmitting(true);
    setError(null);
    try {
      await changePassword({ currentPassword, newPassword });
      showToast('Password changed ✓', 'success');
      router.back();
    } catch (err) {
      setError(authErrorMessage(err));
      setIsSubmitting(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScreenHeader title="CHANGE PASSWORD" onBack={() => router.back()} />

      <ScrollView contentContainerStyle={styles.body} keyboardShouldPersistTaps="handled">
        <Text style={styles.intro}>
          Enter your current password, then choose a new one. You’ll stay signed in on this
          device.
        </Text>

        <Field
          label="Current password"
          value={currentPassword}
          onChangeText={setCurrentPassword}
          placeholder="••••••••"
          secureTextEntry
          autoComplete="current-password"
        />
        <Field
          label="New password"
          value={newPassword}
          onChangeText={setNewPassword}
          placeholder={`At least ${MIN_LENGTH} characters`}
          secureTextEntry
          autoComplete="new-password"
        />
        <Field
          label="Confirm new password"
          value={confirmPassword}
          onChangeText={setConfirmPassword}
          placeholder="••••••••"
          secureTextEntry
          autoComplete="new-password"
        />

        {error ? <Text style={styles.error}>{error}</Text> : null}

        <Button label="UPDATE PASSWORD" onPress={handleSubmit} loading={isSubmitting} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.surface.light },
  body: { padding: spacing.lg, gap: spacing.lg, paddingBottom: spacing.xxl },
  intro: { ...typography.body, color: colors.text.muted, lineHeight: 20 },
  error: { ...typography.small, color: colors.brand.red, fontWeight: '600' },
});
