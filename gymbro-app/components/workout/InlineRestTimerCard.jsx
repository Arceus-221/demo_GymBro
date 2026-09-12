import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, radius, spacing, typography } from '../../constants/theme';
import { Icon } from '../shared/Icon';

/** In-flow rest timer — deliberately a card, not a blocking modal overlay. */
export function InlineRestTimerCard({ secondsLeft, onSkip }) {
  const minutes = Math.floor(secondsLeft / 60);
  const seconds = secondsLeft % 60;

  return (
    <View style={styles.card}>
      <View style={styles.labelRow}>
        <Icon name="timer" size={14} color="#FFFFFF" />
        <Text style={styles.label}>REST TIMER</Text>
      </View>
      <Text style={styles.time}>{`${minutes}:${String(seconds).padStart(2, '0')}`}</Text>
      <Pressable onPress={onSkip} hitSlop={10}>
        <Text style={styles.skip}>SKIP</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.lg,
    borderRadius: radius.lg,
    borderWidth: 1.5,
    borderColor: colors.brand.red,
    backgroundColor: 'rgba(239,0,0,0.12)',
  },
  labelRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  label: { ...typography.eyebrow, fontSize: 9, color: '#FFFFFF' },
  time: { ...typography.h2, fontSize: 22, color: '#FFFFFF' },
  skip: { ...typography.eyebrow, fontSize: 10, color: colors.brand.red },
});
