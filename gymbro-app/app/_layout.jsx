import NetInfo from '@react-native-community/netinfo';
import { Slot, useRootNavigationState, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, onSnapshot } from 'firebase/firestore';
import { useEffect, useRef } from 'react';
import { AppState, StyleSheet, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { ErrorToast } from '../components/shared/ErrorToast';
import { OfflineBanner } from '../components/shared/OfflineBanner';
import { colors } from '../constants/theme';
import { wakeBackend } from '../services/apiClient';
import { auth, db } from '../services/firebase';
import { useAuthStore } from '../store/useAuthStore';
import { useConnectivityStore } from '../store/useConnectivityStore';
import { useUserProfileStore } from '../store/useUserProfileStore';

const WAKE_THROTTLE_MS = 60_000;

export default function RootLayout() {
  const setUser = useAuthStore((s) => s.setUser);
  const setUserDoc = useUserProfileStore((s) => s.setUserDoc);
  const clearProfile = useUserProfileStore((s) => s.clear);
  const setOnline = useConnectivityStore((s) => s.setOnline);
  const lastWakeRef = useRef(0);

  // Layer 1 of cold-start handling: start Render's container booting during
  // splash/auth time rather than at the user's first real AI request.
  useEffect(() => {
    wakeBackend();
    lastWakeRef.current = Date.now();

    const sub = AppState.addEventListener('change', (state) => {
      const now = Date.now();
      if (state === 'active' && now - lastWakeRef.current > WAKE_THROTTLE_MS) {
        lastWakeRef.current = now;
        wakeBackend();
      }
    });
    return () => sub.remove();
  }, []);

  useEffect(() => {
    const unsub = NetInfo.addEventListener((state) => {
      setOnline(Boolean(state.isConnected && state.isInternetReachable !== false));
    });
    return unsub;
  }, [setOnline]);

  useEffect(() => onAuthStateChanged(auth, setUser), [setUser]);

  // One shared subscription to users/{uid} for the whole app — screens read it
  // from the store instead of each opening their own listener.
  const user = useAuthStore((s) => s.user);
  useEffect(() => {
    if (!user) {
      clearProfile();
      return undefined;
    }
    return onSnapshot(
      doc(db, 'users', user.uid),
      (snap) => setUserDoc(snap.exists() ? { id: snap.id, ...snap.data() } : null),
      () => setUserDoc(null)
    );
  }, [user, setUserDoc, clearProfile]);

  useProtectedRoute();

  return (
    <SafeAreaProvider>
      <StatusBar style="auto" />
      <View style={styles.root}>
        <OfflineBanner />
        <Slot />
        <ErrorToast />
      </View>
    </SafeAreaProvider>
  );
}

/**
 * Single routing authority: signed out -> (auth), signed in but not onboarded
 * -> (onboarding), otherwise -> (tabs). Runs on every segment change so a
 * user can't land somewhere their auth state doesn't allow.
 */
function useProtectedRoute() {
  const router = useRouter();
  const segments = useSegments();
  const navigationState = useRootNavigationState();
  const user = useAuthStore((s) => s.user);
  const isInitializing = useAuthStore((s) => s.isInitializing);
  const userDoc = useUserProfileStore((s) => s.userDoc);

  useEffect(() => {
    // The navigator must be mounted before router.replace() does anything.
    if (!navigationState?.key) return;
    if (isInitializing) return;

    const group = segments[0];

    // On the index route, app/index.jsx owns routing declaratively via
    // <Redirect>. Racing it from here is what stranded the app on the splash
    // screen, so this guard only handles transitions *after* the first route
    // is established (signing out, finishing onboarding).
    if (!group) return;

    const inAuth = group === '(auth)';
    const inOnboarding = group === '(onboarding)';

    if (!user) {
      if (!inAuth) router.replace('/(auth)/sign-in');
      return;
    }

    // Wait for the user document before deciding onboarding state — routing on
    // a null doc would bounce a fully-onboarded user back through the wizard.
    if (userDoc === null) return;

    if (!userDoc.onboardingComplete) {
      if (!inOnboarding) router.replace('/(onboarding)/goal');
      return;
    }

    if (inAuth || inOnboarding) router.replace('/(tabs)');
  }, [navigationState?.key, user, userDoc, isInitializing, segments, router]);
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.surface.light },
});
