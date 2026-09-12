import { useRouter } from 'expo-router';
import { StyleSheet, View } from 'react-native';
import { ChipGroup } from '../../components/onboarding/ChipGroup';
import { NumberField } from '../../components/onboarding/NumberField';
import { OnboardingCard } from '../../components/onboarding/OnboardingCard';
import {
  DIETARY_PREFERENCES,
  EQUIPMENT_OPTIONS,
  EXPERIENCE_LEVELS,
  GENDERS,
} from '../../constants/equipment';
import { spacing } from '../../constants/theme';
import { useOnboardingDraftStore } from '../../store/useOnboardingDraftStore';

export default function ProfileDetailsStep() {
  const router = useRouter();
  const draft = useOnboardingDraftStore((s) => s.draft);
  const setField = useOnboardingDraftStore((s) => s.setField);
  const toggleEquipment = useOnboardingDraftStore((s) => s.toggleEquipment);

  const isComplete =
    draft.experienceLevel &&
    draft.gender &&
    draft.age > 0 &&
    draft.heightCm > 0 &&
    draft.weightKg > 0 &&
    draft.availableEquipment.length > 0;

  return (
    <OnboardingCard
      step={2}
      title={'TELL US\nABOUT YOU'}
      subtitle="This shapes the exercises and volume we program."
      nextDisabled={!isComplete}
      onBack={() => router.back()}
      onNext={() => router.push('/(onboarding)/schedule-summary')}
    >
      <ChipGroup
        label="Experience level"
        options={EXPERIENCE_LEVELS}
        value={draft.experienceLevel}
        onChange={(v) => setField('experienceLevel', v)}
      />

      <View style={styles.row}>
        <NumberField
          label="Age"
          value={draft.age}
          onChange={(v) => setField('age', v)}
          placeholder="21"
        />
        <NumberField
          label="Height"
          suffix="cm"
          value={draft.heightCm}
          onChange={(v) => setField('heightCm', v)}
          placeholder="175"
        />
      </View>

      <View style={styles.row}>
        <NumberField
          label="Weight"
          suffix="kg"
          value={draft.weightKg}
          onChange={(v) => setField('weightKg', v)}
          placeholder="72"
        />
        <NumberField
          label="Target"
          suffix="kg, optional"
          value={draft.targetWeightKg}
          onChange={(v) => setField('targetWeightKg', v)}
          placeholder="68"
        />
      </View>

      <ChipGroup
        label="Gender"
        options={GENDERS}
        value={draft.gender}
        onChange={(v) => setField('gender', v)}
      />

      <ChipGroup
        label="Available equipment"
        options={EQUIPMENT_OPTIONS}
        value={draft.availableEquipment}
        onChange={toggleEquipment}
        multi
      />

      <ChipGroup
        label="Dietary preference"
        options={DIETARY_PREFERENCES}
        value={draft.dietaryPreference}
        onChange={(v) => setField('dietaryPreference', v)}
      />
    </OnboardingCard>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: spacing.lg },
});
