import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { radius, spacing, typography } from '../../constants/theme';
import { Button } from '../shared/Button';
import { Icon } from '../shared/Icon';
import { Heading, TabbedEyebrow } from '../shared/Typography';
import { useThemedStyles } from '../shared/ThemeProvider';

const TOTAL_STEPS = 3;

/**
 * Shared shell for all 3 onboarding steps: eyebrow + poster headline + scroll
 * body, with the "STEP n OF 3" dash footer and CTA pinned at the bottom.
 */
export function OnboardingCard({
  step,
  title,
  subtitle,
  children,
  onNext,
  onBack,
  nextLabel = 'NEXT',
  nextDisabled = false,
  nextLoading = false,
}) {
  const { styles, colors } = useThemedStyles(makeStyles);
  const insets = useSafeAreaInsets();

  return (
    <View style={styles.flex}>
      <ScrollView
        contentContainerStyle={[styles.body, { paddingTop: insets.top + 24 }]}
        keyboardShouldPersistTaps="handled"
      >
        <TabbedEyebrow>Onboarding</TabbedEyebrow>
        <Heading level={0} style={styles.title}>
          {title}
        </Heading>
        {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
        <View style={styles.content}>{children}</View>
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: insets.bottom + spacing.lg }]}>
        <View style={styles.stepInfo}>
          <Text style={styles.stepLabel}>{`STEP ${step} OF ${TOTAL_STEPS}`}</Text>
          <View style={styles.dashes}>
            {Array.from({ length: TOTAL_STEPS }, (_, i) => (
              <View key={i} style={[styles.dash, i < step && styles.dashActive]} />
            ))}
          </View>
          {onBack ? (
            <Pressable onPress={onBack} hitSlop={8} style={styles.backRow}>
              <Icon name="back" size={13} color={colors.text.muted} />
              <Text style={styles.back}>Back</Text>
            </Pressable>
          ) : null}
        </View>

        <Button
          label={nextLabel}
          onPress={onNext}
          disabled={nextDisabled}
          loading={nextLoading}
          style={styles.cta}
        />
      </View>
    </View>
  );
}

const makeStyles = (colors) => StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.surface.primary },
  body: { paddingHorizontal: spacing.xl, paddingBottom: spacing.xl, gap: spacing.xs },
  title: { marginTop: spacing.md },
  subtitle: { ...typography.body, color: colors.text.muted, marginTop: spacing.xs },
  content: { marginTop: spacing.xl, gap: spacing.lg },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.lg,
    borderTopWidth: 1,
    borderTopColor: colors.border.soft,
    gap: spacing.lg,
  },
  stepInfo: { gap: spacing.xs },
  stepLabel: { ...typography.eyebrow, color: colors.text.muted },
  dashes: { flexDirection: 'row', gap: 4 },
  dash: {
    width: 22,
    height: 4,
    borderRadius: radius.pill,
    backgroundColor: colors.border.default,
  },
  dashActive: { backgroundColor: colors.brand.red },
  backRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 },
  back: { ...typography.small, color: colors.text.muted },
  cta: { flexShrink: 0, paddingHorizontal: spacing.xl },
});
