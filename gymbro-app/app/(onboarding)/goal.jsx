import { useRouter } from 'expo-router';
import { OnboardingCard } from '../../components/onboarding/OnboardingCard';
import { SelectRow } from '../../components/onboarding/SelectRow';
import { FITNESS_GOALS } from '../../constants/equipment';
import { useOnboardingDraftStore } from '../../store/useOnboardingDraftStore';

const GOAL_ICONS = {
  fat_loss: 'flame',
  muscle_gain: 'muscle',
  endurance: 'run',
  maintenance: 'scale',
};

export default function GoalStep() {
  const router = useRouter();
  const fitnessGoal = useOnboardingDraftStore((s) => s.draft.fitnessGoal);
  const setField = useOnboardingDraftStore((s) => s.setField);

  return (
    <OnboardingCard
      step={1}
      title={'WHAT’S YOUR\nMAIN GOAL?'}
      subtitle="Select one to personalize your plan."
      nextDisabled={!fitnessGoal}
      onNext={() => router.push('/(onboarding)/profile-details')}
    >
      {FITNESS_GOALS.map((goal) => (
        <SelectRow
          key={goal.value}
          label={goal.label}
          sub={goal.sub}
          icon={GOAL_ICONS[goal.value]}
          selected={fitnessGoal === goal.value}
          onPress={() => setField('fitnessGoal', goal.value)}
        />
      ))}
    </OnboardingCard>
  );
}
