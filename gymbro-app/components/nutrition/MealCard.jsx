import { StyleSheet, Text, View } from 'react-native';
import { colors, radius, spacing, typography } from '../../constants/theme';
import { Icon } from '../shared/Icon';

const MEAL_ICONS = {
  breakfast: 'breakfast',
  lunch: 'lunch',
  dinner: 'plate',
  snack: 'meals',
  pre_workout: 'bolt',
  post_workout: 'drink',
};

function MacroStat({ value, label }) {
  return (
    <View style={styles.macroStat}>
      <Text style={styles.macroValue}>{value}</Text>
      <Text style={styles.macroLabel}>{label}</Text>
    </View>
  );
}

/**
 * Renders a meal from either source: a generated plan meal (`description`) or a
 * user-logged meal (`userDescription` + `aiEstimate`). Note the backend returns
 * a single description string — there's no localName/englishGloss pair.
 */
export function MealCard({ meal, logged = false }) {
  const macros = logged ? meal.aiEstimate ?? {} : meal;
  const description = logged ? meal.userDescription : meal.description;

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <View style={styles.typeRow}>
          <Icon
            name={MEAL_ICONS[meal.mealType] ?? 'plate'}
            size={14}
            color={colors.text.muted}
          />
          <Text style={styles.type}>{labelize(meal.mealType)}</Text>
        </View>
        {logged ? <Text style={styles.badge}>LOGGED</Text> : null}
      </View>

      <Text style={styles.description}>{description}</Text>

      <View style={styles.macros}>
        <MacroStat value={Math.round(macros.calories ?? 0)} label="KCAL" />
        <MacroStat value={`${Math.round(macros.proteinG ?? 0)}g`} label="PRO" />
        <MacroStat value={`${Math.round(macros.carbsG ?? 0)}g`} label="CARB" />
        <MacroStat value={`${Math.round(macros.fatsG ?? 0)}g`} label="FAT" />
      </View>
    </View>
  );
}

function labelize(value) {
  if (!value) return 'Meal';
  const text = String(value).replace(/_/g, ' ');
  return text.charAt(0).toUpperCase() + text.slice(1);
}

const styles = StyleSheet.create({
  card: {
    padding: spacing.lg,
    borderRadius: radius.lg,
    borderWidth: 1.5,
    borderColor: colors.border.default,
    backgroundColor: colors.surface.light,
    gap: spacing.sm,
  },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  typeRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  type: { ...typography.eyebrow, fontSize: 9, color: colors.text.muted },
  badge: {
    ...typography.eyebrow,
    fontSize: 8,
    color: colors.brand.red,
  },
  description: { ...typography.body, fontWeight: '700', color: colors.text.primary, lineHeight: 20 },
  macros: { flexDirection: 'row', gap: spacing.sm, marginTop: 2 },
  macroStat: {
    flex: 1,
    paddingVertical: spacing.sm,
    borderRadius: radius.sm,
    backgroundColor: colors.surface.muted,
    alignItems: 'center',
    gap: 1,
  },
  macroValue: { ...typography.label, fontSize: 13, color: colors.text.primary },
  macroLabel: { ...typography.eyebrow, fontSize: 7, color: colors.text.muted },
});
