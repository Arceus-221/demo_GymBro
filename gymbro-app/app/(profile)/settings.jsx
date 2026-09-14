import Constants from 'expo-constants';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { ChipGroup } from '../../components/onboarding/ChipGroup';
import { SettingsGroup, SettingsRow } from '../../components/profile/SettingsRow';
import { Field } from '../../components/shared/AuthShell';
import { Button } from '../../components/shared/Button';
import { ScreenHeader } from '../../components/shared/ScreenHeader';
import { Eyebrow, Heading } from '../../components/shared/Typography';
import { radius, spacing, THEME_MODES, typography } from '../../constants/theme';
import { WEIGHT_UNITS } from '../../constants/units';
import { deleteAccount, signOutUser } from '../../services/accountActions';
import { authErrorMessage } from '../../services/authErrors';
import { useAuthStore } from '../../store/useAuthStore';
import { useSettingsStore } from '../../store/useSettingsStore';
import { useUIStore } from '../../store/useUIStore';
import { useUserProfileStore } from '../../store/useUserProfileStore';
import { useThemedStyles } from '../../components/shared/ThemeProvider';

export default function Settings() {
  const { styles } = useThemedStyles(makeStyles);
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const userDoc = useUserProfileStore((s) => s.userDoc);
  const weightUnit = useSettingsStore((s) => s.weightUnit);
  const setWeightUnit = useSettingsStore((s) => s.setWeightUnit);
  const themeMode = useSettingsStore((s) => s.themeMode);
  const setThemeMode = useSettingsStore((s) => s.setThemeMode);
  const showError = useUIStore((s) => s.showError);

  const [deleteOpen, setDeleteOpen] = useState(false);

  const email = userDoc?.email || user?.email || '—';
  const version = Constants.expoConfig?.version ?? '—';

  const handleSignOut = () => {
    Alert.alert('Sign out', 'You’ll need your email and password to sign back in.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign out',
        style: 'destructive',
        onPress: async () => {
          try {
            // The auth listener in app/_layout.jsx handles the redirect.
            await signOutUser();
          } catch {
            showError('Couldn’t sign out — please try again.');
          }
        },
      },
    ]);
  };

  return (
    <View style={styles.flex}>
      <ScreenHeader title="SETTINGS" onBack={() => router.back()} />

      <ScrollView contentContainerStyle={styles.body}>
        <SettingsGroup label="Account">
          <SettingsRow icon="mail" label="Email" value={email} />
          <SettingsRow
            icon="lock"
            label="Change password"
            onPress={() => router.push('/(profile)/change-password')}
          />
          <SettingsRow
            icon="person"
            label="Edit profile"
            onPress={() => router.push('/(profile)/edit')}
          />
        </SettingsGroup>

        <View style={styles.unitBlock}>
          <Eyebrow>Weight units</Eyebrow>
          <ChipGroup options={WEIGHT_UNITS} value={weightUnit} onChange={setWeightUnit} />
          <Text style={styles.hint}>
            Display only — weights are always stored in kilograms, so switching this never
            changes your logged data.
          </Text>
        </View>

        <View style={styles.unitBlock}>
          <Eyebrow>Appearance</Eyebrow>
          <ChipGroup options={THEME_MODES} value={themeMode} onChange={setThemeMode} />
          <Text style={styles.hint}>
            System follows your device setting. The choice is saved on this device, so the
            same account can be light on one phone and dark on another.
          </Text>
        </View>

        <SettingsGroup label="About">
          <SettingsRow icon="package" label="Version" value={version} />
        </SettingsGroup>

        <SettingsGroup label="Danger zone">
          <SettingsRow icon="signOut" label="Sign out" onPress={handleSignOut} />
          <SettingsRow
            icon="warning"
            label="Delete account"
            sub="Permanently erases your plans, logs and chats"
            destructive
            onPress={() => setDeleteOpen(true)}
          />
        </SettingsGroup>
      </ScrollView>

      <DeleteAccountModal visible={deleteOpen} onClose={() => setDeleteOpen(false)} />
    </View>
  );
}

/**
 * Deleting requires the current password because Firebase rejects the operation
 * on a stale session — asking for it here means the failure lands on this form
 * rather than half-way through the data wipe.
 */
function DeleteAccountModal({ visible, onClose }) {
  const { styles } = useThemedStyles(makeStyles);
  const showToast = useUIStore((s) => s.showToast);
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const close = () => {
    setPassword('');
    setError(null);
    onClose();
  };

  const handleDelete = async () => {
    if (!password) {
      setError('Enter your password to confirm.');
      return;
    }
    setIsDeleting(true);
    setError(null);
    try {
      await deleteAccount({ currentPassword: password });
      // No navigation needed — the auth listener sends us to (auth) as soon as
      // the account is gone.
      showToast('Account deleted', 'info');
    } catch (err) {
      setError(authErrorMessage(err));
      setIsDeleting(false);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={close}>
      <KeyboardAvoidingView
        style={styles.backdrop}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={styles.sheet}>
          <Eyebrow>This cannot be undone</Eyebrow>
          <Heading level={2}>DELETE ACCOUNT?</Heading>
          <Text style={styles.warning}>
            Your profile, workout plans, meal plans and training history will be deleted, and
            you’ll be signed out immediately.
          </Text>

          <Field
            label="Confirm your password"
            value={password}
            onChangeText={setPassword}
            placeholder="••••••••"
            secureTextEntry
            error={error}
          />

          <Button
            label="DELETE MY ACCOUNT"
            onPress={handleDelete}
            loading={isDeleting}
            disabled={!password}
          />
          <Button label="CANCEL" variant="ghost" onPress={close} disabled={isDeleting} />
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const makeStyles = (colors) => StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.surface.primary },
  body: { padding: spacing.lg, gap: spacing.xl, paddingBottom: spacing.xxl },
  unitBlock: { gap: spacing.sm },
  hint: { ...typography.small, color: colors.text.muted, lineHeight: 18 },
  backdrop: { flex: 1, backgroundColor: colors.backdrop, justifyContent: 'flex-end' },
  sheet: {
    backgroundColor: colors.surface.primary,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    padding: spacing.xl,
    gap: spacing.lg,
  },
  warning: { ...typography.body, color: colors.text.mid, lineHeight: 20 },
});
