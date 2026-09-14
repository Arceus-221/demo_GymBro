import { Redirect } from 'expo-router';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Animated, Image, StyleSheet, Text, View } from 'react-native';
import { randomQuote } from '../constants/quotes';
import { spacing, typography } from '../constants/theme';
import { useAuthStore } from '../store/useAuthStore';
import { useUserProfileStore } from '../store/useUserProfileStore';
import { useThemedStyles } from '../components/shared/ThemeProvider';

/** Minimum time the brand screen stays up, even if auth resolves instantly. */
const MIN_SPLASH_MS = 2500;

/**
 * Entry route and the app's routing authority for a cold start.
 *
 * This is declarative on purpose: an imperative router.replace() fired from
 * the root layout's effect races the navigator's mount and gets dropped,
 * which parks the app on the splash screen. <Redirect> waits for the
 * navigator itself, so it can't lose that race.
 *
 * The splash holds for MIN_SPLASH_MS *in parallel with* the Firebase auth and
 * user-document reads rather than in series — the wait already existed, so the
 * brand screen fills it instead of adding to it. On a slow cold start the reads
 * are the long pole and the timer has already elapsed.
 */
export default function Index() {
  const isInitializing = useAuthStore((s) => s.isInitializing);
  const user = useAuthStore((s) => s.user);
  const userDoc = useUserProfileStore((s) => s.userDoc);
  const isProfileLoading = useUserProfileStore((s) => s.isLoading);

  const [minElapsed, setMinElapsed] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setMinElapsed(true), MIN_SPLASH_MS);
    return () => clearTimeout(timer);
  }, []);

  if (!minElapsed || isInitializing) return <Splash />;

  if (!user) return <Redirect href="/(auth)/sign-in" />;

  // Signed in, but the user document hasn't arrived yet — routing on a null
  // doc would bounce an onboarded user back through the wizard.
  if (isProfileLoading && !userDoc) return <Splash />;

  if (!userDoc?.onboardingComplete) return <Redirect href="/(onboarding)/goal" />;

  return <Redirect href="/(tabs)" />;
}

function Splash() {
  const { styles } = useThemedStyles(makeStyles);
  // One quote per launch: useMemo with no deps, so re-renders (auth state
  // landing, the timer firing) don't swap the text mid-read.
  const quote = useMemo(() => randomQuote(), []);
  const fade = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fade, {
      toValue: 1,
      duration: 600,
      useNativeDriver: true,
    }).start();
  }, [fade]);

  return (
    <View style={styles.wrap}>
      <Animated.View style={[styles.content, { opacity: fade }]}>
        <Image
          source={require('../assets/brand/GYMBROmainlogo.png')}
          style={styles.logo}
          resizeMode="contain"
          accessibilityRole="image"
          accessibilityLabel="GymBro"
        />
        <Text style={styles.quote}>{quote}</Text>
      </Animated.View>
    </View>
  );
}

const makeStyles = (colors) => StyleSheet.create({
  // Its own token, not surface.primary: the launch screen does not follow the
  // theme yet because the logo is black artwork (F19), and a bespoke design is
  // coming. Both live in colors.splash so this screen changes in one place.
  wrap: {
    flex: 1,
    backgroundColor: colors.splash.background,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xxl,
  },
  content: { alignItems: 'center', gap: spacing.xl },
  logo: { width: 220, height: 220 },
  quote: {
    ...typography.body,
    fontSize: 15,
    fontWeight: '600',
    color: colors.splash.text,
    textAlign: 'center',
    lineHeight: 22,
    maxWidth: 300,
  },
});
