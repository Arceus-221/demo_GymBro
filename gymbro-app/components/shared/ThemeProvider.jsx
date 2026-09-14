import { createContext, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { Animated, StyleSheet, useColorScheme, View } from 'react-native';
import { palettes } from '../../constants/theme';
import { useSettingsStore } from '../../store/useSettingsStore';

const ThemeContext = createContext({ colors: palettes.light, scheme: 'light' });

// Long enough to read as a deliberate wash rather than a flicker, short enough
// that it never feels like waiting. Out is slower than in so the new theme
// arrives gently instead of snapping.
const FADE_IN_MS = 140;
const FADE_OUT_MS = 240;

/**
 * Supplies the active colour palette and cross-fades between palettes.
 *
 * A theme change is otherwise a hard cut: every surface in the tree re-renders
 * on the same frame and the whole screen inverts at once, which reads as a
 * glitch. Instead a cover in the *incoming* background colour fades in, the
 * palette swaps underneath while it is opaque, and the cover fades out to
 * reveal the new theme.
 *
 * This component is deliberately NOT themed itself — it is the thing that
 * supplies the theme, so it cannot consume one.
 */
export function ThemeProvider({ children }) {
  const themeMode = useSettingsStore((s) => s.themeMode);
  const systemScheme = useColorScheme();

  // 'system' resolves through the OS. useColorScheme can return null before the
  // native module answers, so light is the fallback.
  const target = themeMode === 'system' ? systemScheme ?? 'light' : themeMode;

  const [active, setActive] = useState(target);
  const cover = useRef(new Animated.Value(0)).current;

  // Zustand rehydrates the persisted theme from AsyncStorage asynchronously, so
  // a dark-mode user's first paint is light and then flips. That flip is not a
  // theme change the user made and must not animate, or every cold start opens
  // with a wash.
  const hydrated = useRef(useSettingsStore.persist.hasHydrated());
  useEffect(
    () =>
      useSettingsStore.persist.onFinishHydration(() => {
        hydrated.current = true;
      }),
    []
  );

  useEffect(() => {
    if (active === target) return undefined;

    if (!hydrated.current) {
      setActive(target);
      return undefined;
    }

    let cancelled = false;
    Animated.timing(cover, {
      toValue: 1,
      duration: FADE_IN_MS,
      useNativeDriver: true,
    }).start(({ finished }) => {
      if (cancelled || !finished) return;
      setActive(target);
      Animated.timing(cover, {
        toValue: 0,
        duration: FADE_OUT_MS,
        useNativeDriver: true,
      }).start();
    });

    return () => {
      cancelled = true;
    };
  }, [target, active, cover]);

  const value = useMemo(
    () => ({ colors: palettes[active] ?? palettes.light, scheme: active }),
    [active]
  );

  const incoming = palettes[target] ?? palettes.light;

  return (
    <ThemeContext.Provider value={value}>
      <View style={staticStyles.root}>
        {children}
        <Animated.View
          // pointerEvents none: the wash is decorative and must never swallow a
          // tap, even mid-transition.
          pointerEvents="none"
          style={[
            StyleSheet.absoluteFill,
            { backgroundColor: incoming.surface.primary, opacity: cover },
          ]}
        />
      </View>
    </ThemeContext.Provider>
  );
}

/** The active palette plus the resolved scheme name ('light' | 'dark'). */
export function useTheme() {
  return useContext(ThemeContext);
}

/**
 * Builds a component's styles from the active palette.
 *
 * `StyleSheet.create` at module scope captures colours once at import, so a
 * themed component declares a `makeStyles(colors)` factory instead and calls
 * this. Pass a factory defined at module scope — a new function each render
 * would rebuild the stylesheet every time.
 *
 *   const { styles, colors } = useThemedStyles(makeStyles);
 */
export function useThemedStyles(factory) {
  const { colors, scheme } = useTheme();
  const styles = useMemo(() => factory(colors), [factory, colors]);
  return useMemo(() => ({ styles, colors, scheme }), [styles, colors, scheme]);
}

// Not themed: a bare flex container that only exists to host the wash overlay.
const staticStyles = StyleSheet.create({
  root: { flex: 1 },
});
