import { doc, serverTimestamp, setDoc } from 'firebase/firestore';
import { useState } from 'react';
import { StyleSheet, Text, TextInput, View } from 'react-native';
import { ChipGroup } from '../../components/onboarding/ChipGroup';
import { OnboardingCard } from '../../components/onboarding/OnboardingCard';
import { Card } from '../../components/shared/Card';
import { Eyebrow } from '../../components/shared/Typography';
import { DURATION_OPTIONS } from '../../constants/equipment';
import { colors, radius, spacing, typography } from '../../constants/theme';
import { useCallBackend } from '../../hooks/useCallBackend';
import { db } from '../../services/firebase';
import { useAuthStore } from '../../store/useAuthStore';
import { useOnboardingDraftStore } from '../../store/useOnboardingDraftStore';
import { useUIStore } from '../../store/useUIStore';

const DAY_OPTIONS = [2, 3, 4, 5, 6].map((n) => ({ value: n, label: `${n} days` }));
const DURATION_CHIPS = DURATION_OPTIONS.map((n) => ({ value: n, label: `${n} min` }));

export default function ScheduleSummaryStep() {
  const draft = useOnboardingDraftStore((s) => s.draft);
  const setField = useOnboardingDraftStore((s) => s.setField);
  const resetDraft = useOnboardingDraftStore((s) => s.reset);
  const user = useAuthStore((s) => s.user);
  const showToast = useUIStore((s) => s.showToast);
  const { execute } = useCallBackend();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleFinish = async () => {
    if (!user) return;
    setIsSubmitting(true);

    try {
      // The only Firestore write in the whole wizard (Phase 3 §2.1).
      await setDoc(
        doc(db, 'users', user.uid),
        {
          uid: user.uid,
          profile: {
            age: draft.age,
            gender: draft.gender,
            heightCm: draft.heightCm,
            weightKg: draft.weightKg,
            targetWeightKg: draft.targetWeightKg ?? null,
            fitnessGoal: draft.fitnessGoal,
            experienceLevel: draft.experienceLevel,
            availableEquipment: draft.availableEquipment,
            dietaryPreference: draft.dietaryPreference,
            workoutDaysPerWeek: draft.workoutDaysPerWeek,
            preferredDurationMinutes: draft.preferredDurationMinutes,
            medicalNotes: draft.medicalNotes?.trim() || null,
          },
          onboardingComplete: true,
          updatedAt: serverTimestamp(),
        },
        { merge: true }
      );

      resetDraft();

      // Flipping onboardingComplete makes the root layout redirect to (tabs),
      // so this screen may unmount mid-flight. That's fine and intended: the
      // backend writes the plan to Firestore itself, and the Dashboard's live
      // subscription renders it whenever it lands. A failure here is not fatal
      // either — the Dashboard offers a manual "generate plan" CTA.
      execute('/api/ai/generate-plan', { weekPreference: 4 }).catch(() => {});
      showToast('Profile saved — building your first plan', 'success');
    } catch {
      useUIStore.getState().showError('Couldn’t save your profile — please retry.');
      setIsSubmitting(false);
    }
  };

  return (
    <OnboardingCard
      step={3}
      title={'YOUR\nSCHEDULE'}
      subtitle="Last step — then we’ll write your plan."
      nextLabel="FINISH SETUP"
      nextLoading={isSubmitting}
      onNext={handleFinish}
    >
      <ChipGroup
        label="Workout days per week"
        options={DAY_OPTIONS}
        value={draft.workoutDaysPerWeek}
        onChange={(v) => setField('workoutDaysPerWeek', v)}
      />

      <ChipGroup
        label="Preferred session length"
        options={DURATION_CHIPS}
        value={draft.preferredDurationMinutes}
        onChange={(v) => setField('preferredDurationMinutes', v)}
      />

      <View style={styles.notes}>
        <Eyebrow>Injuries or medical notes (optional)</Eyebrow>
        <TextInput
          value={draft.medicalNotes ?? ''}
          onChangeText={(t) => setField('medicalNotes', t)}
          placeholder="e.g. bad knees, avoid deep squats"
          placeholderTextColor={colors.text.faint}
          multiline
          style={styles.notesInput}
        />
      </View>

      <Card style={styles.recap}>
        <Eyebrow>Your setup</Eyebrow>
        <RecapRow label="Goal" value={labelize(draft.fitnessGoal)} />
        <RecapRow label="Experience" value={labelize(draft.experienceLevel)} />
        <RecapRow label="Body" value={`${draft.heightCm ?? '—'} cm · ${draft.weightKg ?? '—'} kg`} />
        <RecapRow
          label="Equipment"
          value={draft.availableEquipment.map(labelize).join(', ') || '—'}
        />
        <RecapRow label="Diet" value={labelize(draft.dietaryPreference)} />
        <RecapRow
          label="Schedule"
          value={`${draft.workoutDaysPerWeek}× / week · ${draft.preferredDurationMinutes} min`}
        />
      </Card>
    </OnboardingCard>
  );
}

function RecapRow({ label, value }) {
  return (
    <View style={styles.recapRow}>
      <Text style={styles.recapLabel}>{label}</Text>
      <Text style={styles.recapValue} numberOfLines={2}>
        {value}
      </Text>
    </View>
  );
}

/** 'muscle_gain' -> 'Muscle gain' */
function labelize(value) {
  if (!value) return '—';
  const text = String(value).replace(/_/g, ' ');
  return text.charAt(0).toUpperCase() + text.slice(1);
}

const styles = StyleSheet.create({
  notes: { gap: spacing.xs },
  notesInput: {
    borderWidth: 1.5,
    borderColor: colors.border.default,
    borderRadius: radius.md,
    padding: spacing.lg,
    minHeight: 84,
    textAlignVertical: 'top',
    fontSize: 15,
    fontWeight: '500',
    color: colors.text.primary,
    backgroundColor: colors.surface.muted,
  },
  recap: { gap: spacing.sm, backgroundColor: colors.surface.muted },
  recapRow: { flexDirection: 'row', justifyContent: 'space-between', gap: spacing.lg },
  recapLabel: { ...typography.small, color: colors.text.muted },
  recapValue: {
    ...typography.small,
    fontWeight: '700',
    color: colors.text.primary,
    flexShrink: 1,
    textAlign: 'right',
  },
});
