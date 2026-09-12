import { useRouter } from 'expo-router';
import { where } from 'firebase/firestore';
import { useMemo, useState } from 'react';
import {
  Image,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { QuickActionTile } from '../../components/dashboard/QuickActionTile';
import { StatTile } from '../../components/dashboard/StatTile';
import { TodayWorkoutCard } from '../../components/dashboard/TodayWorkoutCard';
import { WeeklyGrid } from '../../components/dashboard/WeeklyGrid';
import { Button } from '../../components/shared/Button';
import { Card } from '../../components/shared/Card';
import { Icon } from '../../components/shared/Icon';
import { ProgressRing } from '../../components/shared/ProgressRing';
import { Eyebrow, Heading } from '../../components/shared/Typography';
import { colors, radius, spacing, typography } from '../../constants/theme';
import { useCallBackend } from '../../hooks/useCallBackend';
import { useFirestoreCollection } from '../../hooks/useFirestoreCollection';
import { useFirestoreDoc } from '../../hooks/useFirestoreDoc';
import { currentWeekDateIds, toDateId, todayLabel } from '../../hooks/useToday';
import { useAuthStore } from '../../store/useAuthStore';
import { useUserProfileStore } from '../../store/useUserProfileStore';

export default function Dashboard() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const user = useAuthStore((s) => s.user);
  const userDoc = useUserProfileStore((s) => s.userDoc);
  const { execute, isLoading: isGenerating } = useCallBackend();
  const [refreshing, setRefreshing] = useState(false);

  const today = toDateId();
  const weekDates = useMemo(() => currentWeekDateIds(), []);

  const { data: plan } = useFirestoreDoc(
    user && userDoc?.currentPlanId
      ? `users/${user.uid}/workoutPlans/${userDoc.currentPlanId}`
      : null
  );
  const { data: todayLog } = useFirestoreDoc(user ? `users/${user.uid}/dailyLogs/${today}` : null);

  // One subscription covers the whole week's completion marks.
  const { data: weekLogs } = useFirestoreCollection(
    user ? `users/${user.uid}/dailyLogs` : null,
    [where('date', '>=', weekDates[0]), where('date', '<=', weekDates[6])],
    `week:${weekDates[0]}`
  );

  const todaysPlanDay = useMemo(() => {
    if (!plan?.weeklySchedule) return null;
    const label = todayLabel();
    return plan.weeklySchedule.find((d) => d.dayLabel === label) ?? null;
  }, [plan]);

  const completedDays = useMemo(() => {
    const completedIds = new Set(
      weekLogs
        .filter((log) => log.workoutSession?.completionStatus === 'completed')
        .map((log) => log.date)
    );
    return weekDates.map((d) => completedIds.has(d));
  }, [weekLogs, weekDates]);

  const stats = userDoc?.stats ?? {};
  const targetDays = userDoc?.profile?.workoutDaysPerWeek ?? 7;
  const completedThisWeek = completedDays.filter(Boolean).length;

  // Percentage of the week's *scheduled* days done so far — a client-side
  // computation, not an AI call.
  const consistency = targetDays ? Math.round((completedThisWeek / targetDays) * 100) : 0;
  const caloriesToday = todayLog?.nutritionLog?.aiEstimatedTotals?.calories ?? 0;
  const workoutDoneToday = todayLog?.workoutSession?.completionStatus === 'completed';

  const firstName = (userDoc?.displayName || user?.displayName || 'there').split(' ')[0];

  const onRefresh = async () => {
    setRefreshing(true);
    // Subscriptions are already live; this is mostly a way to let the user
    // force a visual beat after a cold start recovers.
    setTimeout(() => setRefreshing(false), 600);
  };

  const handleGeneratePlan = () =>
    execute('/api/ai/generate-plan', { weekPreference: 4 }).catch(() => {});

  return (
    <View style={styles.flex}>
      <View style={[styles.statusStrip, { paddingTop: insets.top + 8 }]}>
        <Image
          source={require('../../assets/brand/GymBroLogoPlain.png')}
          style={styles.logo}
          resizeMode="contain"
          accessibilityRole="image"
          accessibilityLabel="GymBro"
        />
        <View style={styles.statusRight}>
          <View style={styles.streakBadge}>
            <Icon name="flame" size={15} color={colors.brand.red} />
            <Text style={styles.streakCount}>{stats.currentStreakDays ?? 0}</Text>
          </View>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Open your profile"
            onPress={() => router.push('/(profile)/profile')}
            hitSlop={8}
            style={styles.avatar}
          >
            <Text style={styles.avatarText}>{firstName.charAt(0).toUpperCase()}</Text>
          </Pressable>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={styles.body}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        <View>
          <Eyebrow>{formatToday()}</Eyebrow>
          <Heading level={1} style={styles.greeting}>
            {greeting()},
          </Heading>
          <Heading level={1} color={colors.brand.red}>
            {firstName.toUpperCase()}
          </Heading>
        </View>

        <View style={styles.statRow}>
          <StatTile value={`${stats.currentStreakDays ?? 0} days`} label="Streak" accent />
          <StatTile value={`${completedThisWeek} / ${targetDays}`} label="Workouts" />
          <StatTile value={caloriesToday ? caloriesToday.toLocaleString() : '—'} label="Calories" />
        </View>

        {todaysPlanDay ? (
          <TodayWorkoutCard
            day={todaysPlanDay}
            completed={workoutDoneToday}
            onStart={() => router.push('/(tabs)/workout')}
          />
        ) : (
          <Card style={styles.noPlan}>
            <Eyebrow>No active plan</Eyebrow>
            <Text style={styles.noPlanCopy}>
              {userDoc?.currentPlanId
                ? 'Your plan doesn’t have a session for today yet.'
                : 'Generate your first AI workout plan to get started.'}
            </Text>
            {!userDoc?.currentPlanId ? (
              <Button
                label="GENERATE MY PLAN"
                onPress={handleGeneratePlan}
                loading={isGenerating}
              />
            ) : null}
          </Card>
        )}

        <View style={styles.splitRow}>
          <View style={styles.ringTile}>
            <Text style={styles.ringEyebrow}>Consistency</Text>
            <ProgressRing
              percent={consistency}
              size={88}
              label={`${consistency}%`}
              sublabel="This week"
            />
          </View>
          <WeeklyGrid completedDays={completedDays} targetDays={targetDays} />
        </View>

        <View style={styles.section}>
          <Eyebrow>Quick Actions</Eyebrow>
          <View style={styles.quickRow}>
            <QuickActionTile
              icon="meals"
              label="Meal Plan"
              onPress={() => router.push('/(tabs)/nutrition')}
            />
            <QuickActionTile
              icon="chat"
              label="AI Coach"
              onPress={() => router.push('/(tabs)/coach')}
            />
            <QuickActionTile
              icon="chart"
              label="Progress"
              onPress={() => router.push('/(profile)/progress')}
            />
          </View>
        </View>
      </ScrollView>

      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Open AI Coach"
        onPress={() => router.push('/(tabs)/coach')}
        style={[styles.fab, { bottom: insets.bottom + 84 }]}
      >
        <Icon name="coachActive" size={26} color="#FFFFFF" />
      </Pressable>
    </View>
  );
}

function greeting() {
  const hour = new Date().getHours();
  if (hour < 12) return 'GOOD MORNING';
  if (hour < 18) return 'GOOD AFTERNOON';
  return 'GOOD EVENING';
}

function formatToday() {
  return new Date()
    .toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })
    .toUpperCase();
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.surface.light },
  // No black bar: the header sits on the page ground so it reads as one
  // surface, and so the logo's black wordmark stays legible (F12).
  statusStrip: {
    backgroundColor: colors.surface.light,
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  // 4:1 asset, and its artwork occupies ~56% of the canvas height — hence the
  // generous box for a ~20pt visual logo.
  logo: { width: 144, height: 36 },
  statusRight: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: radius.pill,
    backgroundColor: colors.brand.red,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { ...typography.label, fontSize: 13, color: '#FFFFFF' },
  streakBadge: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  streakCount: { ...typography.label, fontSize: 13, color: colors.text.primary },
  body: { padding: spacing.xl, gap: spacing.xl, paddingBottom: spacing.xxl * 2 },
  greeting: { marginTop: spacing.xs },
  statRow: { flexDirection: 'row', gap: spacing.md },
  noPlan: { gap: spacing.md },
  noPlanCopy: { ...typography.body, color: colors.text.muted, lineHeight: 20 },
  splitRow: { flexDirection: 'row', gap: spacing.md },
  ringTile: {
    backgroundColor: colors.ink.black,
    borderRadius: radius.lg,
    padding: spacing.lg,
    alignItems: 'center',
    gap: spacing.sm,
  },
  ringEyebrow: { ...typography.eyebrow, fontSize: 9, color: 'rgba(255,255,255,0.6)' },
  section: { gap: spacing.md },
  quickRow: { flexDirection: 'row', gap: spacing.md },
  fab: {
    position: 'absolute',
    right: spacing.xl,
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: colors.ink.black,
    borderWidth: 3,
    borderColor: colors.brand.red,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
