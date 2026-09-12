import { Link } from 'expo-router';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { AuthShell, Field } from '../../components/shared/AuthShell';
import { Button } from '../../components/shared/Button';
import { colors, spacing, typography } from '../../constants/theme';
import { authErrorMessage } from '../../services/authErrors';
import { auth } from '../../services/firebase';

export default function SignIn() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSignIn = async () => {
    if (!email.trim() || !password) {
      setError('Enter your email and password.');
      return;
    }
    setIsSubmitting(true);
    setError(null);
    try {
      await signInWithEmailAndPassword(auth, email.trim(), password);
      // Routing is handled by the root layout's auth listener.
    } catch (err) {
      setError(authErrorMessage(err));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AuthShell eyebrow="Welcome back" title={'READY TO\nTRAIN?'} subtitle="Sign in to pick up where you left off.">
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
        placeholder="••••••••"
        secureTextEntry
        autoComplete="password"
      />

      {error ? <Text style={styles.error}>{error}</Text> : null}

      <Button label="SIGN IN" onPress={handleSignIn} loading={isSubmitting} />

      <View style={styles.footer}>
        <Text style={styles.footerText}>New here?</Text>
        <Link href="/(auth)/sign-up" style={styles.link}>
          CREATE AN ACCOUNT
        </Link>
      </View>
    </AuthShell>
  );
}

const styles = StyleSheet.create({
  error: { ...typography.small, color: colors.brand.red, fontWeight: '600' },
  footer: { flexDirection: 'row', gap: spacing.sm, alignItems: 'center', justifyContent: 'center' },
  footerText: { ...typography.small, color: colors.text.muted },
  link: { ...typography.label, fontSize: 12, color: colors.brand.red },
});
