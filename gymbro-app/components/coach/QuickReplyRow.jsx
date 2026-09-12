import { Pressable, ScrollView, StyleSheet, Text } from 'react-native';
import { colors, radius, spacing, typography } from '../../constants/theme';

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
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.row}>
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

const styles = StyleSheet.create({
  row: { gap: spacing.sm, paddingHorizontal: spacing.lg, paddingVertical: spacing.sm },
  chip: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: radius.pill,
    borderWidth: 1.5,
    borderColor: colors.border.default,
    backgroundColor: colors.surface.light,
  },
  disabled: { opacity: 0.5 },
  text: { ...typography.small, fontWeight: '700', color: colors.text.mid },
});
