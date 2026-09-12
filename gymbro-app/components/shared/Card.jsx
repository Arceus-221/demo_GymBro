import { StyleSheet, View } from 'react-native';
import { colors, radius, spacing } from '../../constants/theme';

export function Card({ children, style, dark = false, accent = false }) {
  return (
    <View
      style={[
        styles.card,
        dark && styles.dark,
        accent && styles.accent,
        style,
      ]}
    >
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface.light,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border.default,
    padding: spacing.lg,
  },
  dark: {
    backgroundColor: colors.ink.black,
    borderColor: colors.border.dark,
  },
  accent: {
    borderColor: colors.brand.red,
    borderWidth: 2,
  },
});
