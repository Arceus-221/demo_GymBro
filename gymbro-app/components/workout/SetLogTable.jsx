import { StyleSheet, Text, TextInput, View } from 'react-native';
import { colors, radius, spacing, typography } from '../../constants/theme';
import { Icon } from '../shared/Icon';

/**
 * Per-set log rows. Reps/weight are editable inline so a user can record what
 * they actually lifted rather than what was programmed.
 */
export function SetLogTable({ sets, currentSetIndex, onChangeSet }) {
  return (
    <View style={styles.table}>
      <View style={styles.headerRow}>
        <Text style={[styles.header, styles.colSet]}>SET</Text>
        <Text style={[styles.header, styles.colInput]}>REPS</Text>
        <Text style={[styles.header, styles.colInput]}>KG</Text>
        <Text style={[styles.header, styles.colStatus]}>STATUS</Text>
      </View>

      {sets.map((set, index) => {
        const isCurrent = index === currentSetIndex;
        return (
          <View
            key={set.setNumber}
            style={[styles.row, isCurrent && styles.rowCurrent, set.completed && styles.rowDone]}
          >
            <Text style={[styles.cell, styles.colSet]}>{set.setNumber}</Text>

            <TextInput
              value={set.repsCompleted ? String(set.repsCompleted) : ''}
              onChangeText={(t) =>
                onChangeSet(index, { repsCompleted: Number(t.replace(/[^0-9]/g, '')) || 0 })
              }
              keyboardType="number-pad"
              style={[styles.input, styles.colInput]}
              placeholder="0"
              placeholderTextColor="rgba(255,255,255,0.3)"
            />

            <TextInput
              value={set.weightKg ? String(set.weightKg) : ''}
              onChangeText={(t) =>
                onChangeSet(index, { weightKg: Number(t.replace(/[^0-9.]/g, '')) || 0 })
              }
              keyboardType="decimal-pad"
              style={[styles.input, styles.colInput]}
              placeholder="0"
              placeholderTextColor="rgba(255,255,255,0.3)"
            />

            <View style={[styles.colStatus, styles.status]}>
              <Icon
                name={set.completed ? 'check' : isCurrent ? 'dot' : 'circle'}
                size={set.completed ? 17 : 13}
                color={set.completed ? colors.brand.red : colors.text.onDarkMuted}
              />
            </View>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  table: {
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    overflow: 'hidden',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  header: { ...typography.eyebrow, fontSize: 9, color: colors.text.onDarkMuted },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.08)',
  },
  rowCurrent: { backgroundColor: 'rgba(239,0,0,0.12)' },
  rowDone: { opacity: 0.75 },
  cell: { ...typography.body, color: '#FFFFFF', fontWeight: '700' },
  input: {
    ...typography.body,
    color: '#FFFFFF',
    fontWeight: '700',
    paddingVertical: 6,
  },
  status: { alignItems: 'flex-end' },
  colSet: { width: 42 },
  colInput: { flex: 1 },
  colStatus: { width: 58, textAlign: 'right' },
});
