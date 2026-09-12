import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, radius, spacing, typography } from '../../constants/theme';
import { Icon } from '../shared/Icon';

/**
 * Colour convention is deliberately reversed from a typical messenger:
 * the assistant is brand red on the left, the user is black on the right
 * (Phase 3 §2.4).
 */
export function ChatBubble({ role, content, pending, failed, onRetry, initial }) {
  const isUser = role === 'user';

  return (
    <View style={[styles.row, isUser && styles.rowUser]}>
      {!isUser ? (
        <View style={styles.avatar}>
          <Icon name="coachActive" size={17} color="#FFFFFF" />
        </View>
      ) : null}

      <View style={styles.column}>
        <View
          style={[
            styles.bubble,
            isUser ? styles.bubbleUser : styles.bubbleAssistant,
            pending && styles.pending,
          ]}
        >
          <Text style={styles.text}>{content}</Text>
        </View>
        {failed ? (
          <Pressable onPress={onRetry} hitSlop={6} style={styles.failedRow}>
            <Icon name="warning" size={12} color={colors.brand.red} />
            <Text style={styles.failed}>failed to send — tap to retry</Text>
          </Pressable>
        ) : null}
      </View>

      {isUser ? (
        <View style={[styles.avatar, styles.avatarUser]}>
          <Text style={styles.avatarInitial}>{initial}</Text>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: spacing.sm, alignItems: 'flex-end' },
  rowUser: { justifyContent: 'flex-end' },
  column: { flexShrink: 1, gap: 4 },
  avatar: {
    width: 30,
    height: 30,
    borderRadius: radius.sm,
    backgroundColor: colors.brand.red,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarUser: { backgroundColor: colors.ink.black },
  avatarInitial: { ...typography.label, fontSize: 12, color: '#FFFFFF' },
  bubble: { padding: spacing.md, borderRadius: radius.lg, maxWidth: 260 },
  bubbleAssistant: { backgroundColor: colors.brand.red, borderBottomLeftRadius: 4 },
  bubbleUser: { backgroundColor: colors.ink.black, borderBottomRightRadius: 4 },
  pending: { opacity: 0.6 },
  text: { ...typography.body, color: '#FFFFFF', lineHeight: 20 },
  failedRow: { flexDirection: 'row', alignItems: 'center', gap: 4, justifyContent: 'flex-end' },
  failed: { ...typography.small, color: colors.brand.red },
});
