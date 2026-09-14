import { StyleSheet, Text } from 'react-native';
import { typography } from '../../constants/theme';
import { useTheme, useThemedStyles } from './ThemeProvider';

// A default parameter cannot read a hook, so these resolve their fallback
// colour inside the body instead of in the signature. `color` stays an
// override: pass one and it wins, omit it and the active palette decides.

/** Letter-spaced uppercase micro-label. Pairs with <Heading> on every screen. */
export function Eyebrow({ children, style, color }) {
  const { colors } = useTheme();
  return (
    <Text style={[typography.eyebrow, { color: color ?? colors.text.muted }, style]}>
      {children}
    </Text>
  );
}

/** Weight-900 poster headline with tight tracking. */
export function Heading({ children, level = 1, style, color }) {
  const { colors } = useTheme();
  const base = level === 0 ? typography.hero : level === 2 ? typography.h2 : typography.h1;
  return (
    <Text style={[base, { color: color ?? colors.text.primary }, style]}>{children}</Text>
  );
}

export function Body({ children, style, color }) {
  const { colors } = useTheme();
  return (
    <Text style={[typography.body, { color: color ?? colors.text.mid }, style]}>
      {children}
    </Text>
  );
}

export function Muted({ children, style }) {
  const { colors } = useTheme();
  return (
    <Text style={[typography.small, { color: colors.text.muted }, style]}>{children}</Text>
  );
}

/** Red left-edge tab + eyebrow, the recurring section header treatment. */
export function TabbedEyebrow({ children, style }) {
  const { styles } = useThemedStyles(makeStyles);
  return <Text style={[typography.eyebrow, styles.tabbed, style]}>{children}</Text>;
}

const makeStyles = (colors) => StyleSheet.create({
  tabbed: {
    color: colors.text.muted,
    borderLeftWidth: 3,
    borderLeftColor: colors.brand.red,
    paddingLeft: 8,
  },
});
