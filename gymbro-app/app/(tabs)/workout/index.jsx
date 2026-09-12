import { useRouter } from 'expo-router';
import { doc, serverTimestamp, writeBatch } from 'firebase/firestore';
import { useEffect, useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { EmptyState } from '../../../components/shared/EmptyState';
import { Icon } from '../../../components/shared/Icon';
import { Eyebrow } from '../../../components/shared/Typography';
import { ExerciseSelectorStrip } from '../../../components/workout/ExerciseSelectorStrip';
import { InlineRestTimerCard } from '../../../components/workout/InlineRestTimerCard';
import { SetLogTable } from '../../../components/workout/SetLogTable';
import { WorkoutSummaryModal } from '../../../components/workout/WorkoutSummaryModal';
import { colors, radius, spacing, typography } from '../../../constants/theme';
import { useFirestoreDoc } from '../../../hooks/useFirestoreDoc';
import { useRestTimer } from '../../../hooks/useRestTimer';
import { toDateId, todayLabel } from '../../../hooks/useToday';
import { db } from '../../../services/firebase';
import { useActiveWorkoutStore } from '../../../store/useActiveWorkoutStore';
import { useAuthStore } from '../../../store/useAuthStore';
import { useUIStore } from '../../../store/useUIStore';
import { useUserProfileStore } from '../../../store/useUserProfileStore';

export default function WorkoutMode() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const user = useAuthStore((s) => s.user);
  const userDoc = useUserProfileStore((s) => s.userDoc);
  const showToast = useUIStore((s) => s.showToast);
  const showError = useUIStore((s) => s.showError);

  const session = useActiveWorkoutStore();
  const restTimer = useRestTimer();
  const [summaryOpen, setSummaryOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  const { data: plan, isLoading } = useFirestoreDoc(
    user && userDoc?.currentPlanId
      ? `users/${user.uid}/workoutPlans/${userDoc.currentPlanId}`
      : null
  );

  const todaysPlanDay = useMemo(() => {
    if (!plan?.weeklySchedule) return null;
    return plan.weeklySchedule.find((d) => d.dayLabel === todayLabel()) ?? null;
  }, [plan]);

  // Seed the in-memory session once today's plan day is known. Everything from
  // here is local state until "Finish Workout" (Phase 3 §3.2).
  useEffect(() => {
    if (!todaysPlanDay || todaysPlanDay.isRestDay) return;
    if (session.isActive && session.planId === plan?.planId) return;
    session.startSession({
      planId: plan?.planId ?? null,
      sessionName: todaysPlanDay.sessionName,
      exercises: todaysPlanDay.exercises ?? [],
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [todaysPlanDay, plan?.planId]);

  const exercise = session.exercises[session.exerciseIndex];
  const currentSetIndex = exercise ? exercise.sets.findIndex((s) => !s.completed) : -1;
  const allSetsDone = exercise && currentSetIndex === -1;
  const isLastExercise = session.exerciseIndex === session.exercises.length - 1;

  const handleLogSet = () => {
    if (!exercise || currentSetIndex === -1) return;
    session.logCurrentSet(session.exerciseIndex, currentSetIndex);
    restTimer.start(exercise.restSeconds ?? 90);
  };

  const handleFinish = async ({ perceivedExertion, notes }) => {
    if (!user) return;
    setSaving(true);
    const today = toDateId();

    try {
      const payload = session.buildSessionPayload({ perceivedExertion, notes });
      const batch = writeBatch(db);

      batch.set(
        doc(db, 'users', user.uid, 'dailyLogs', today),
        {
          date: today,
          // Redundant uid is what makes the Progress screen's collection-group
          // query possible (Phase 1 §2).
          uid: user.uid,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
          workoutSession: payload,
        },
        { merge: true }
      );

      const stats = userDoc?.stats ?? {};
      const nextStreak = computeStreak(stats.lastWorkoutDate, today, stats.currentStreakDays ?? 0);

      batch.update(doc(db, 'users', user.uid), {
        uid: user.uid,
        'stats.totalWorkoutsCompleted': (stats.totalWorkoutsCompleted ?? 0) + 1,
        'stats.currentStreakDays': nextStreak,
        'stats.longestStreakDays': Math.max(stats.longestStreakDays ?? 0, nextStreak),
        'stats.lastWorkoutDate': today,
        updatedAt: serverTimestamp(),
      });

      // Not awaited: Firestore's local cache applies the write immediately and
      // queues it for the server, so navigating now is safe even offline
      // (Phase 3 §3.2). Awaiting would hang on bad gym Wi-Fi for no benefit.
      batch.commit().catch(() => {});

      session.endSession();
      setSummaryOpen(false);
      showToast('Workout saved ✓', 'success');
      router.replace('/(tabs)');
    } catch {
      showError('Couldn’t save that workout — please retry.');
    } finally {
      setSaving(false);
    }
  };

  if (isLoading) {
    return <DarkShell insets={insets}><Text style={styles.muted}>Loading your plan...</Text></DarkShell>;
  }

  if (!todaysPlanDay) {
    return (
      <DarkShell insets={insets}>
        <EmptyState
          title="No session today"
          message="You don’t have an active plan with a session for today."
          actionLabel="BACK TO HOME"
          onAction={() => router.replace('/(tabs)')}
        />
      </DarkShell>
    );
  }

  if (todaysPlanDay.isRestDay) {
    return (
      <DarkShell insets={insets}>
        <EmptyState
          title="Rest & recovery"
          message="Today is a programmed rest day. Recovery is where the adaptation happens."
          actionLabel="BACK TO HOME"
          onAction={() => router.replace('/(tabs)')}
        />
      </DarkShell>
    );
  }

  if (!exercise) {
    return <DarkShell insets={insets}><Text style={styles.muted}>Preparing session...</Text></DarkShell>;
  }

  const currentSetNumber = currentSetIndex === -1 ? exercise.sets.length : currentSetIndex + 1;
  const targetSet = exercise.sets[currentSetIndex === -1 ? exercise.sets.length - 1 : currentSetIndex];

  return (
    <View style={styles.flex}>
      <View style={styles.glow} />

      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <Pressable
          onPress={() => router.back()}
          hitSlop={10}
          style={styles.backRow}
          accessibilityLabel="Go back"
        >
          <Icon name="back" size={15} color={colors.text.onDarkMuted} />
          <Text style={styles.back}>Back</Text>
        </Pressable>
        <View style={styles.headerCenter}>
          <Text style={styles.headerEyebrow}>WORKOUT MODE</Text>
          <Text style={styles.headerDay} numberOfLines={1}>
            {todaysPlanDay.sessionName}
          </Text>
        </View>
        <Text style={styles.headerCount}>
          {`${session.exerciseIndex + 1}/${session.exercises.length}`}
        </Text>
      </View>

      <ExerciseSelectorStrip
        exercises={session.exercises}
        activeIndex={session.exerciseIndex}
        onSelect={(index) => {
          session.setExerciseIndex(index);
          restTimer.stop();
        }}
      />

      <ScrollView contentContainerStyle={styles.body}>
        <View>
          <Eyebrow color={colors.text.onDarkMuted}>
            {exercise.primaryMuscleGroup || 'Target'}
          </Eyebrow>
          <Text style={styles.exerciseName}>{exercise.name.toUpperCase()}</Text>
          {exercise.formCue ? <Text style={styles.cue}>{exercise.formCue}</Text> : null}
        </View>

        <View style={styles.tiles}>
          <BigTile label="SET" value={`${currentSetNumber} of ${exercise.sets.length}`} />
          <BigTile label="REPS" value={String(targetSet?.repsCompleted || exercise.repsRange || '—')} />
          <BigTile label="WEIGHT" value={`${targetSet?.weightKg ?? 0} kg`} />
        </View>

        <SetLogTable
          sets={exercise.sets}
          currentSetIndex={currentSetIndex}
          onChangeSet={(setIndex, patch) =>
            session.updateSet(session.exerciseIndex, setIndex, patch)
          }
        />

        {restTimer.isRunning ? (
          <InlineRestTimerCard secondsLeft={restTimer.secondsLeft} onSkip={restTimer.stop} />
        ) : null}

        <View style={styles.actionRow}>
          <Pressable
            onPress={allSetsDone ? undefined : handleLogSet}
            disabled={allSetsDone}
            style={[styles.logButton, allSetsDone && styles.logButtonDone]}
          >
            <Icon name="check" size={16} color="#FFFFFF" />
            <Text style={styles.logButtonText}>
              {allSetsDone ? 'ALL SETS DONE' : 'LOG SET'}
            </Text>
          </Pressable>
          <Pressable
            onPress={() => restTimer.start(exercise.restSeconds ?? 90)}
            style={styles.restButton}
          >
            <Icon name="timer" size={16} color="#FFFFFF" />
            <Text style={styles.restButtonText}>REST</Text>
          </Pressable>
        </View>

        {isLastExercise ? (
          <Pressable onPress={() => setSummaryOpen(true)} style={styles.finish}>
            <Text style={styles.finishText}>FINISH WORKOUT</Text>
            <Icon name="forward" size={16} color={colors.brand.red} />
          </Pressable>
        ) : (
          <Pressable
            onPress={() => {
              session.setExerciseIndex(session.exerciseIndex + 1);
              restTimer.stop();
            }}
            style={styles.next}
          >
            <Text style={styles.nextText} numberOfLines={1}>
              {`NEXT: ${session.exercises[session.exerciseIndex + 1]?.name ?? ''}`}
            </Text>
            <Icon name="forward" size={13} color={colors.text.onDarkMuted} />
          </Pressable>
        )}
      </ScrollView>

      <WorkoutSummaryModal
        visible={summaryOpen}
        saving={saving}
        onCancel={() => setSummaryOpen(false)}
        onConfirm={handleFinish}
        stats={summarize(session)}
      />
    </View>
  );
}

function DarkShell({ children, insets }) {
  return (
    <View style={[styles.flex, styles.centered, { paddingTop: insets.top + 40 }]}>{children}</View>
  );
}

function BigTile({ label, value }) {
  return (
    <View style={styles.tile}>
      <Text style={styles.tileLabel}>{label}</Text>
      <Text style={styles.tileValue} numberOfLines={1}>
        {value}
      </Text>
    </View>
  );
}

function summarize(session) {
  const completedSets = session.exercises.reduce(
    (total, ex) => total + ex.sets.filter((s) => s.completed).length,
    0
  );
  const volumeKg = session.exercises.reduce(
    (total, ex) =>
      total +
      ex.sets.reduce((t, s) => (s.completed ? t + s.repsCompleted * s.weightKg : t), 0),
    0
  );
  const durationMinutes = session.startTime
    ? Math.max(1, Math.round((Date.now() - session.startTime) / 60000))
    : 0;
  return { completedSets, volumeKg: Math.round(volumeKg), durationMinutes };
}

/** Consecutive-day streak: yesterday continues it, today keeps it, a gap resets. */
function computeStreak(lastWorkoutDate, today, currentStreak) {
  if (!lastWorkoutDate) return 1;
  if (lastWorkoutDate === today) return Math.max(currentStreak, 1);

  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  return lastWorkoutDate === toDateId(yesterday) ? currentStreak + 1 : 1;
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.ink.deep },
  centered: { alignItems: 'center', justifyContent: 'center', padding: spacing.xl },
  muted: { ...typography.body, color: colors.text.onDarkMuted },
  glow: {
    position: 'absolute',
    top: -110,
    left: -60,
    width: 320,
    height: 320,
    borderRadius: 160,
    backgroundColor: colors.brand.red,
    opacity: 0.16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.md,
    gap: spacing.md,
  },
  backRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  back: { ...typography.small, color: colors.text.onDarkMuted, fontWeight: '700' },
  headerCenter: { flex: 1, alignItems: 'center' },
  headerEyebrow: { ...typography.eyebrow, fontSize: 9, color: colors.text.onDarkMuted },
  headerDay: { ...typography.label, fontSize: 12, color: '#FFFFFF' },
  headerCount: { ...typography.eyebrow, fontSize: 10, color: colors.brand.red },
  body: { padding: spacing.xl, paddingTop: spacing.sm, gap: spacing.lg, paddingBottom: 120 },
  exerciseName: { ...typography.hero, fontSize: 34, color: colors.brand.red, marginTop: 4 },
  cue: { ...typography.small, color: colors.text.onDarkMuted, marginTop: 6, lineHeight: 18 },
  tiles: { flexDirection: 'row', gap: spacing.md },
  tile: {
    flex: 1,
    padding: spacing.lg,
    borderRadius: radius.lg,
    backgroundColor: 'rgba(255,255,255,0.07)',
    gap: 4,
  },
  tileLabel: { ...typography.eyebrow, fontSize: 8, color: colors.text.onDarkMuted },
  tileValue: { ...typography.h2, fontSize: 17, color: '#FFFFFF' },
  actionRow: { flexDirection: 'row', gap: spacing.md },
  logButton: {
    flex: 2,
    paddingVertical: spacing.lg,
    borderRadius: radius.pill,
    backgroundColor: colors.brand.red,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
  },
  logButtonDone: { backgroundColor: 'rgba(255,255,255,0.15)' },
  logButtonText: { ...typography.label, fontSize: 13, color: '#FFFFFF', letterSpacing: 1.5 },
  restButton: {
    flex: 1,
    paddingVertical: spacing.lg,
    borderRadius: radius.pill,
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.3)',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  restButtonText: { ...typography.label, fontSize: 12, color: '#FFFFFF' },
  next: { paddingVertical: spacing.md, flexDirection: 'row', alignItems: 'center', gap: 6 },
  nextText: {
    ...typography.eyebrow,
    fontSize: 10,
    color: colors.text.onDarkMuted,
    flexShrink: 1,
  },
  finish: {
    paddingVertical: spacing.lg,
    borderRadius: radius.pill,
    borderWidth: 2,
    borderColor: colors.brand.red,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
  },
  finishText: { ...typography.label, fontSize: 13, color: colors.brand.red, letterSpacing: 1.5 },
});
