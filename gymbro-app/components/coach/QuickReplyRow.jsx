import { Pressable, ScrollView, StyleSheet, Text } from 'react-native';
import { radius, spacing, typography } from '../../constants/theme';
import { useThemedStyles } from '../shared/ThemeProvider';

/**
 * Canned prompts that send on tap. Each carries the contextType to send with
 * the request, since the status chips are read-only and no longer the input
 * mechanism for it (Phase 3 §2.4).
 */
export const QUICK_REPLIES = [
  { label: 'Log today’s workout', prompt: 'Help me log today’s workout', contextType: 'workout_advice' },
  { label: 'Update meal plan', prompt: 'Can you help me update my meal plan?', contextType: 'nutrition' },
  { label: 'Check progress', prompt: 'How am I progressing so far?', contextType: 'motivation' },
  { label: 'Rest day advice', prompt: 'Should I take a rest day today?', contextType: 'recovery' },
];

export function QuickReplyRow({ onSelect, disabled }) {
  const { styles } = useThemedStyles(makeStyles);
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      style={styles.scroll}
      contentContainerStyle={styles.row}
    >
      {QUICK_REPLIES.map((reply) => (
        <Pressable
          key={reply.label}
          onPress={() => onSelect(reply)}
          disabled={disabled}
          style={[styles.chip, disabled && styles.disabled]}
        >
          <Text style={styles.text}>{reply.label}</Text>
        </Pressable>
      ))}
    </ScrollView>
  );
}

const makeStyles = (colors) => StyleSheet.create({
  // flexGrow:0 keeps the row at its content height instead of absorbing
  // leftover column space; alignItems:'center' overrides the content
  // container's default 'stretch', which is what let the chips grow into
  // tall blank boxes with their label stranded at the top (F4).
  scroll: { flexGrow: 0 },
  row: {
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    alignItems: 'center',
  },
  chip: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: radius.pill,
    borderWidth: 1.5,
    borderColor: colors.border.default,
    backgroundColor: colors.surface.primary,
    // Centre the label explicitly so a stretched chip can never strand it.
    alignItems: 'center',
    justifyContent: 'center',
  },
  disabled: { opacity: 0.5 },
  text: { ...typography.small, fontWeight: '700', color: colors.text.mid },
});
