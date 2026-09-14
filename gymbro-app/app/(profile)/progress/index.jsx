import { useRouter } from 'expo-router';
import { collectionGroup, getDocs, orderBy, query, where } from 'firebase/firestore';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { PRTrackerTable } from '../../../components/progress/PRTrackerTable';
import { VolumeBarChart } from '../../../components/progress/VolumeBarChart';
import { Card } from '../../../components/shared/Card';
import { Icon } from '../../../components/shared/Icon';
import { LoadingSpinner } from '../../../components/shared/LoadingSpinner';
import { Eyebrow, Heading } from '../../../components/shared/Typography';
import { radius, spacing, typography } from '../../../constants/theme';
import { toDateId } from '../../../hooks/useToday';
import { db } from '../../../services/firebase';
import { useAuthStore } from '../../../store/useAuthStore';
import { useUserProfileStore } from '../../../store/useUserProfileStore';
import { useThemedStyles } from '../../../components/shared/ThemeProvider';

const RANGES = [
  { label: '1M', months: 1 },
  { label: '3M', months: 3 },
  { label: '6M', months: 6 },
  { label: 'All', months: 120 },
];

/**
 * The one screen that reads across many dailyLogs documents. Fetched once with
 * manual refresh rather than a live subscription — there are no writes here,
 * and a 6-month collection-group listener would be needlessly expensive.
 */
export default function Progress() {
  const { styles } = useThemedStyles(makeStyles);
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const user = useAuthStore((s) => s.user);
  const userDoc = useUserProfileStore((s) => s.userDoc);

  const [rangeIndex, setRangeIndex] = useState(1);
  const [logs, setLogs] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const rangeStart = useMemo(() => {
    const start = new Date();
    start.setMonth(start.getMonth() - RANGES[rangeIndex].months);
    return toDateId(start);
  }, [rangeIndex]);

  const fetchLogs = useCallback(async () => {
    if (!user) return;
    setIsLoading(true);
    setError(null);
    try {
      // The redundant `uid` field on every dailyLogs document exists precisely
      // to make this collection-group query possible (Phase 1 §2).
      const snapshot = await getDocs(
        query(
          collectionGroup(db, 'dailyLogs'),
          where('uid', '==', user.uid),
          where('date', '>=', rangeStart),
          orderBy('date', 'asc')
        )
      );
      setLogs(snapshot.docs.map((d) => d.data()));
    } catch (err) {
      // A missing composite index surfaces here as failed-precondition; the
      // console error carries a direct link to create it.
      setError(err?.message ?? 'Could not load progress data.');
    } finally {
      setIsLoading(false);
    }
  }, [user, rangeStart]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  const { personalRecords, volumeByMuscle, totalSessions } = useMemo(
    () => deriveStats(logs),
    [logs]
  );

  return (
    <View style={styles.flex}>
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <Pressable onPress={() => router.back()} hitSlop={10} accessibilityLabel="Go back">
          <Icon name="back" size={22} color="#FFFFFF" />
        </Pressable>
        <Text style={styles.headerTitle}>PROGRESS</Text>
        <Pressable onPress={fetchLogs} hitSlop={10} accessibilityLabel="Refresh">
          <Icon name="refresh" size={20} color="#FFFFFF" />
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={styles.body}>
        <View style={styles.rangeRow}>
          {RANGES.map((range, index) => (
            <Pressable
              key={range.label}
              onPress={() => setRangeIndex(index)}
              style={[styles.range, index === rangeIndex && styles.rangeActive]}
            >
              <Text style={[styles.rangeText, index === rangeIndex && styles.rangeTextActive]}>
                {range.label}
              </Text>
            </Pressable>
          ))}
        </View>

        {isLoading ? (
          <LoadingSpinner message="Crunching your history..." />
        ) : error ? (
          <Card style={styles.errorCard}>
            <Eyebrow>Couldn’t load progress</Eyebrow>
            <Text style={styles.errorText}>{error}</Text>
          </Card>
        ) : (
          <>
            <View style={styles.statRow}>
              <SummaryTile value={totalSessions} label="Sessions" />
              <SummaryTile value={userDoc?.stats?.longestStreakDays ?? 0} label="Best streak" />
              <SummaryTile value={personalRecords.length} label="Tracked lifts" />
            </View>

            <View style={styles.section}>
              <Heading level={2}>PERSONAL RECORDS</Heading>
              <PRTrackerTable records={personalRecords} />
            </View>

            <View style={styles.section}>
              <Heading level={2}>TRAINING VOLUME</Heading>
              <Eyebrow>Sets per muscle group</Eyebrow>
              <VolumeBarChart data={volumeByMuscle} />
            </View>
          </>
        )}
      </ScrollView>
    </View>
  );
}

function SummaryTile({ value, label }) {
  const { styles } = useThemedStyles(makeStyles);
  return (
    <View style={styles.tile}>
      <Text style={styles.tileValue}>{value}</Text>
      <Text style={styles.tileLabel}>{label}</Text>
    </View>
  );
}

/** PRs and volume are computed on-device — nothing is stored pre-aggregated. */
function deriveStats(logs) {
  const bestByExercise = new Map();
  const volumeByMuscle = {};
  let totalSessions = 0;

  logs.forEach((log) => {
    const session = log.workoutSession;
    if (!session?.exercises) return;
    totalSessions += 1;

    session.exercises.forEach((exercise) => {
      const muscle = exercise.primaryMuscleGroup || 'other';
      exercise.sets?.forEach((set) => {
        if (!set.completed) return;
        volumeByMuscle[muscle] = (volumeByMuscle[muscle] ?? 0) + 1;

        const existing = bestByExercise.get(exercise.name);
        if (!existing || set.weightKg > existing.weightKg) {
          bestByExercise.set(exercise.name, {
            name: exercise.name,
            weightKg: set.weightKg,
            date: log.date,
          });
        }
      });
    });
  });

  const personalRecords = [...bestByExercise.values()]
    .filter((record) => record.weightKg > 0)
    .sort((a, b) => b.weightKg - a.weightKg);

  return { personalRecords, volumeByMuscle, totalSessions };
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
  headerTitle: { ...typography.label, fontSize: 13, color: colors.text.inverse },
  body: { padding: spacing.lg, gap: spacing.xl, paddingBottom: spacing.xxl },
  rangeRow: { flexDirection: 'row', gap: spacing.sm },
  range: {
    flex: 1,
    paddingVertical: spacing.sm,
    borderRadius: radius.pill,
    borderWidth: 1.5,
    borderColor: colors.border.default,
    alignItems: 'center',
  },
  rangeActive: { backgroundColor: colors.brand.red, borderColor: colors.brand.red },
  rangeText: { ...typography.eyebrow, fontSize: 10, color: colors.text.mid },
  rangeTextActive: { color: colors.text.inverse },
  statRow: { flexDirection: 'row', gap: spacing.md },
  tile: {
    flex: 1,
    padding: spacing.lg,
    borderRadius: radius.lg,
    backgroundColor: colors.surface.secondary,
    gap: 2,
  },
  tileValue: { ...typography.stat, fontSize: 20, color: colors.text.primary },
  tileLabel: { ...typography.eyebrow, fontSize: 8, color: colors.text.muted },
  section: { gap: spacing.md },
  errorCard: { gap: spacing.sm },
  errorText: { ...typography.small, color: colors.text.muted, lineHeight: 18 },
});
