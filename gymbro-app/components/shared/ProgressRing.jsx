import { StyleSheet, Text, View } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { colors, typography } from '../../constants/theme';

/**
 * Percentage ring used by the Dashboard consistency tile and the Nutrition
 * calorie panel. Drawn directly with react-native-svg rather than pulling in a
 * charting library — it's one arc, and the chart deps carry Expo Go friction.
 */
export function ProgressRing({
  percent,
  size = 96,
  strokeWidth = 10,
  color = colors.brand.red,
  trackColor = 'rgba(255,255,255,0.15)',
  label,
  sublabel,
  labelColor = '#FFFFFF',
}) {
  const clamped = Math.max(0, Math.min(100, Number.isFinite(percent) ? percent : 0));
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const dashOffset = circumference * (1 - clamped / 100);

  return (
    <View style={{ width: size, height: size }}>
      <Svg width={size} height={size}>
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={trackColor}
          strokeWidth={strokeWidth}
          fill="none"
        />
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          fill="none"
          strokeDasharray={circumference}
          strokeDashoffset={dashOffset}
          // Start the arc at 12 o'clock instead of 3 o'clock.
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      </Svg>
      <View style={styles.center}>
        <Text style={[styles.label, { color: labelColor }]}>{label}</Text>
        {sublabel ? (
          <Text style={[styles.sublabel, { color: labelColor }]}>{sublabel}</Text>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  center: { ...StyleSheet.absoluteFillObject, alignItems: 'center', justifyContent: 'center' },
  label: { ...typography.h2, fontSize: 20 },
  sublabel: { ...typography.eyebrow, fontSize: 8, opacity: 0.7, letterSpacing: 1 },
});
