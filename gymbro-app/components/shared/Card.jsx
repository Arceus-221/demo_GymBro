import { StyleSheet, View } from 'react-native';
import { radius, spacing } from '../../constants/theme';
import { useThemedStyles } from './ThemeProvider';

export function Card({ children, style, dark = false, accent = false }) {
  const { styles } = useThemedStyles(makeStyles);
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

const makeStyles = (colors) => StyleSheet.create({
  card: {
    backgroundColor: colors.surface.primary,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border.default,
    padding: spacing.lg,
  },
  dark: {
    backgroundColor: colors.surface.inverse,
    borderColor: colors.border.inverse,
  },
  accent: {
    borderColor: colors.brand.red,
    borderWidth: 2,
  },
});
