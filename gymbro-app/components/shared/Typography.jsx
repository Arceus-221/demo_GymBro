import { StyleSheet, Text } from 'react-native';
import { colors, typography } from '../../constants/theme';

/** Letter-spaced uppercase micro-label. Pairs with <Heading> on every screen. */
export function Eyebrow({ children, style, color = colors.text.muted }) {
  return <Text style={[typography.eyebrow, { color }, style]}>{children}</Text>;
}

/** Weight-900 poster headline with tight tracking. */
export function Heading({ children, level = 1, style, color = colors.text.primary }) {
  const base =
    level === 0 ? typography.hero : level === 2 ? typography.h2 : typography.h1;
  return <Text style={[base, { color }, style]}>{children}</Text>;
}

export function Body({ children, style, color = colors.text.mid }) {
  return <Text style={[typography.body, { color }, style]}>{children}</Text>;
}

export function Muted({ children, style }) {
  return (
    <Text style={[typography.small, { color: colors.text.muted }, style]}>{children}</Text>
  );
}

/** Red left-edge tab + eyebrow, the recurring section header treatment. */
export function TabbedEyebrow({ children, style }) {
  return (
    <Text style={[typography.eyebrow, styles.tabbed, style]}>{children}</Text>
  );
}

const styles = StyleSheet.create({
  tabbed: {
    color: colors.text.muted,
    borderLeftWidth: 3,
    borderLeftColor: colors.brand.red,
    paddingLeft: 8,
  },
});
