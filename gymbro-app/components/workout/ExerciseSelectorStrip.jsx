import { Pressable, ScrollView, StyleSheet, Text } from 'react-native';
import { colors, radius, spacing, typography } from '../../constants/theme';
import { Icon } from '../shared/Icon';

/** Horizontal pill scroller — ✓ for finished exercises, tap to jump. */
export function ExerciseSelectorStrip({ exercises, activeIndex, onSelect }) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.strip}
    >
      {exercises.map((exercise, index) => {
        const done = exercise.sets.every((s) => s.completed);
        const active = index === activeIndex;
        return (
          <Pressable
            key={exercise.exerciseId}
            onPress={() => onSelect(index)}
            style={[styles.pill, done && styles.pillDone, active && styles.pillActive]}
          >
            <Text
              style={[styles.text, (done || active) && styles.textOn]}
              numberOfLines={1}
            >
              {`${index + 1}. ${exercise.name}`}
            </Text>
            {done ? <Icon name="check" size={13} color="#FFFFFF" /> : null}
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  strip: { gap: spacing.sm, paddingHorizontal: spacing.xl, paddingVertical: spacing.md },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: radius.pill,
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.2)',
    maxWidth: 190,
    // Must be OPAQUE, not a translucent white lift like the rest of this
    // screen: the red glow is absolutely positioned behind the strip, and
    // anything see-through lets it bleed through the label (F3). ink.black
    // over the screen's ink.deep also reads as a slight raise.
    backgroundColor: colors.ink.black,
  },
  pillDone: { backgroundColor: colors.brand.red, borderColor: colors.brand.red },
  pillActive: { borderColor: '#FFFFFF', borderWidth: 2 },
  text: { ...typography.eyebrow, fontSize: 9, color: colors.text.onDarkMuted },
  textOn: { color: '#FFFFFF' },
});
