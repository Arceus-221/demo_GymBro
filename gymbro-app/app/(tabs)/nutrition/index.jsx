import { useRouter } from 'expo-router';
import { doc, serverTimestamp, setDoc } from 'firebase/firestore';
import { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AddMealSheet } from '../../../components/nutrition/AddMealSheet';
import { CalorieRingPanel } from '../../../components/nutrition/CalorieRingPanel';
import { MealCard } from '../../../components/nutrition/MealCard';
import { Card } from '../../../components/shared/Card';
import { EmptyState } from '../../../components/shared/EmptyState';
import { Icon } from '../../../components/shared/Icon';
import { Eyebrow } from '../../../components/shared/Typography';
import { radius, spacing, typography } from '../../../constants/theme';
import { useCallBackend } from '../../../hooks/useCallBackend';
import { useFirestoreDoc } from '../../../hooks/useFirestoreDoc';
import { toDateId, todayLabel } from '../../../hooks/useToday';
import { db } from '../../../services/firebase';
import { computeDailyTargets, sumMealTotals } from '../../../services/nutritionTargets';
import { useAuthStore } from '../../../store/useAuthStore';
import { useUIStore } from '../../../store/useUIStore';
import { useUserProfileStore } from '../../../store/useUserProfileStore';
import { useThemedStyles } from '../../../components/shared/ThemeProvider';

export default function Nutrition() {
  const { styles, colors } = useThemedStyles(makeStyles);
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const user = useAuthStore((s) => s.user);
  const userDoc = useUserProfileStore((s) => s.userDoc);
  const showToast = useUIStore((s) => s.showToast);
  const showError = useUIStore((s) => s.showError);
  const { execute, isLoading: isGenerating, loadingHint } = useCallBackend();
  const [addOpen, setAddOpen] = useState(false);

  const today = toDateId();
  const { data: todayLog } = useFirestoreDoc(user ? `users/${user.uid}/dailyLogs/${today}` : null);
  const { data: mealPlan } = useFirestoreDoc(
    user && userDoc?.currentMealPlanId
      ? `users/${user.uid}/mealPlans/${userDoc.currentMealPlanId}`
      : null
  );

  const loggedMeals = todayLog?.nutritionLog?.meals ?? [];
  const totals = todayLog?.nutritionLog?.aiEstimatedTotals ?? sumMealTotals(loggedMeals);
  const targets = useMemo(() => computeDailyTargets(userDoc?.profile), [userDoc?.profile]);

  const plannedMeals = useMemo(() => {
    if (!mealPlan?.weeklyMealSchedule) return [];
    const day = mealPlan.weeklyMealSchedule.find((d) => d.dayLabel === todayLabel());
    return day?.meals ?? [];
  }, [mealPlan]);

  const proteinGap = Math.max(0, targets.proteinG - Math.round(totals.proteinG ?? 0));

  const handleSaveMeal = async ({ mealType, userDescription, aiEstimate }) => {
    if (!user) return;
    const nextMeals = [
      ...loggedMeals,
      { mealType, userDescription, loggedAt: new Date(), aiEstimate },
    ];

    try {
      await setDoc(
        doc(db, 'users', user.uid, 'dailyLogs', today),
        {
          date: today,
          uid: user.uid,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
          nutritionLog: {
            ...(todayLog?.nutritionLog ?? {}),
            meals: nextMeals,
            // Recomputed app-side on every save (Phase 2 §2.5).
            aiEstimatedTotals: sumMealTotals(nextMeals),
          },
        },
        { merge: true }
      );
      showToast('Meal logged ✓', 'success');
    } catch {
      showError('Couldn’t save that meal — please retry.');
    }
  };

  const handleRegenerate = () =>
    execute('/api/ai/generate-meal-plan', { weekPreference: 1, mealsPerDay: 3 })
      .then(() => showToast('New meal plan ready', 'success'))
      .catch(() => {});

  return (
    <View style={styles.flex}>
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <Pressable onPress={() => router.back()} hitSlop={10} accessibilityLabel="Go back">
          <Icon name="back" size={22} color="#FFFFFF" />
        </Pressable>
        <View style={styles.headerCenter}>
          <Text style={styles.headerEyebrow}>NUTRITION</Text>
          <Text style={styles.headerTitle}>AI MEAL PLANNER</Text>
        </View>
        <Pressable
          onPress={handleRegenerate}
          hitSlop={10}
          disabled={isGenerating}
          accessibilityLabel="Regenerate meal plan"
          style={isGenerating && styles.refreshBusy}
        >
          <Icon name="refresh" size={20} color="#FFFFFF" />
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={styles.body}>
        <CalorieRingPanel totals={totals} targets={targets} />

        <View style={styles.pills}>
          <Pill icon="flame" label={`${Math.round(totals.calories ?? 0)} kcal`} />
          <Pill icon="bolt" label={`${Math.round(totals.proteinG ?? 0)}g protein`} />
          <Pill icon="plate" label={`${loggedMeals.length} logged`} />
        </View>

        <View style={styles.sectionHeader}>
          <View>
            <Eyebrow>Today’s Plan</Eyebrow>
            <Text style={styles.sectionSub}>AI generated meal plan</Text>
          </View>
          <Pressable onPress={() => setAddOpen(true)} style={styles.addButton}>
            <Text style={styles.addText}>+ ADD</Text>
          </Pressable>
        </View>

        {plannedMeals.length > 0 ? (
          plannedMeals.map((meal, i) => <MealCard key={`${meal.mealType}-${i}`} meal={meal} />)
        ) : (
          <EmptyState
            title="No meal plan yet"
            message={
              isGenerating
                ? loadingHint === 'waking'
                  ? 'Waking Coach up — this can take a moment on first use'
                  : 'Building your meal plan...'
                : 'Generate a 7-day plan tailored to your goal and dietary preference.'
            }
            actionLabel={isGenerating ? undefined : 'GENERATE MEAL PLAN'}
            onAction={isGenerating ? undefined : handleRegenerate}
          />
        )}

        {loggedMeals.length > 0 ? (
          <View style={styles.section}>
            <Eyebrow>Logged Today</Eyebrow>
            {loggedMeals.map((meal, i) => (
              <MealCard key={`logged-${i}`} meal={meal} logged />
            ))}
          </View>
        ) : null}

        {proteinGap > 0 && loggedMeals.length > 0 ? (
          <Card dark style={styles.tip}>
            <View style={styles.tipHeader}>
              <Icon name="coachActive" size={13} color={colors.brand.redText} />
              <Text style={styles.tipEyebrow}>AI COACH TIP</Text>
            </View>
            <Text style={styles.tipText}>
              {`You're ${proteinGap}g short on protein today. A shake or a serving of yogurt closes most of that.`}
            </Text>
            <Pressable onPress={() => router.push('/(tabs)/coach')} style={styles.tipCtaRow}>
              <Text style={styles.tipCta}>ADJUST PLAN</Text>
              <Icon name="forward" size={13} color={colors.brand.redText} />
            </Pressable>
          </Card>
        ) : null}
      </ScrollView>

      <AddMealSheet
        visible={addOpen}
        onClose={() => setAddOpen(false)}
        onSave={handleSaveMeal}
      />
    </View>
  );
}

function Pill({ icon, label }) {
  const { styles, colors } = useThemedStyles(makeStyles);
  return (
    <View style={styles.pill}>
      <Icon name={icon} size={12} color={colors.text.mid} />
      <Text style={styles.pillText}>{label}</Text>
    </View>
  );
}

const makeStyles = (colors) => StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.surface.primary },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
    backgroundColor: colors.surface.inverse,
  },
  headerCenter: { alignItems: 'center' },
  headerEyebrow: { ...typography.eyebrow, fontSize: 8, color: colors.onInverse.subtle },
  headerTitle: { ...typography.label, fontSize: 13, color: colors.text.inverse },
  refreshBusy: { opacity: 0.4 },
  body: { padding: spacing.lg, gap: spacing.lg, paddingBottom: spacing.xxl * 2 },
  pills: { flexDirection: 'row', gap: spacing.sm, flexWrap: 'wrap' },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: spacing.md,
    paddingVertical: 7,
    borderRadius: radius.pill,
    backgroundColor: colors.surface.secondary,
    borderWidth: 1,
    borderColor: colors.border.soft,
  },
  pillText: { ...typography.eyebrow, fontSize: 9, color: colors.text.mid, letterSpacing: 0.5 },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sectionSub: { ...typography.eyebrow, fontSize: 8, color: colors.text.faint, marginTop: 2 },
  addButton: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: radius.pill,
    backgroundColor: colors.brand.red,
  },
  addText: { ...typography.eyebrow, fontSize: 10, color: colors.text.inverse },
  section: { gap: spacing.md },
  tip: { gap: spacing.sm },
  tipHeader: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  tipEyebrow: { ...typography.eyebrow, fontSize: 9, color: colors.brand.redText },
  tipText: { ...typography.body, color: colors.text.inverse, lineHeight: 20 },
  tipCtaRow: { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 4 },
  tipCta: { ...typography.eyebrow, fontSize: 10, color: colors.brand.redText },
});
