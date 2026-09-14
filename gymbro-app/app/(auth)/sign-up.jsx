import { Link } from 'expo-router';
import { createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { doc, serverTimestamp, setDoc } from 'firebase/firestore';
import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { AuthShell, Field } from '../../components/shared/AuthShell';
import { Button } from '../../components/shared/Button';
import { spacing, typography } from '../../constants/theme';
import { authErrorMessage } from '../../services/authErrors';
import { auth, db } from '../../services/firebase';
import { useThemedStyles } from '../../components/shared/ThemeProvider';

export default function SignUp() {
  const { styles } = useThemedStyles(makeStyles);
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSignUp = async () => {
    if (!displayName.trim() || !email.trim() || !password) {
      setError('Fill in every field to continue.');
      return;
    }
    if (password.length < 6) {
      setError('Password needs to be at least 6 characters.');
      return;
    }

    setIsSubmitting(true);
    setError(null);
    try {
      const credential = await createUserWithEmailAndPassword(auth, email.trim(), password);
      const { uid } = credential.user;
      await updateProfile(credential.user, { displayName: displayName.trim() });

      // The root user document. `uid` must be present for the security rules'
      // create condition to pass (Phase 1 §3H).
      await setDoc(doc(db, 'users', uid), {
        uid,
        displayName: displayName.trim(),
        email: email.trim(),
        photoURL: null,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        onboardingComplete: false,
        currentPlanId: null,
        currentMealPlanId: null,
        stats: {
          totalWorkoutsCompleted: 0,
          currentStreakDays: 0,
          longestStreakDays: 0,
          lastWorkoutDate: null,
        },
      });
      // Root layout routes to onboarding once the doc lands.
    } catch (err) {
      setError(authErrorMessage(err));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AuthShell
      eyebrow="Get started"
      title={'BUILD YOUR\nBEST SELF'}
      subtitle="Create an account and we’ll write your first plan."
    >
      <Field
        label="Name"
        value={displayName}
        onChangeText={setDisplayName}
        placeholder="Your name"
        autoCapitalize="words"
      />
      <Field
        label="Email"
        value={email}
        onChangeText={setEmail}
        placeholder="you@example.com"
        autoCapitalize="none"
        autoComplete="email"
        keyboardType="email-address"
      />
      <Field
        label="Password"
        value={password}
        onChangeText={setPassword}
        placeholder="At least 6 characters"
        secureTextEntry
      />

      {error ? <Text style={styles.error}>{error}</Text> : null}

      <Button label="CREATE ACCOUNT" onPress={handleSignUp} loading={isSubmitting} />

      <View style={styles.footer}>
        <Text style={styles.footerText}>Already have an account?</Text>
        <Link href="/(auth)/sign-in" style={styles.link}>
          SIGN IN
        </Link>
      </View>
    </AuthShell>
  );
}

const makeStyles = (colors) => StyleSheet.create({
  error: { ...typography.small, color: colors.brand.redText, fontWeight: '600' },
  footer: { flexDirection: 'row', gap: spacing.sm, alignItems: 'center', justifyContent: 'center' },
  footerText: { ...typography.small, color: colors.text.muted },
  link: { ...typography.label, fontSize: 12, color: colors.brand.redText },
});
