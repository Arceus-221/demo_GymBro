// constants/units.js — display-only unit conversion.
//
// Everything is STORED in kilograms: the Firestore schema (models/index.js),
// every AI prompt on the backend, and all existing write paths assume kg. This
// module exists purely to render those kg values in whichever unit the user
// prefers, and to convert typed input back to kg before it is saved. A value
// that has been through toDisplayWeight() must never reach Firestore or the
// backend.

const LB_PER_KG = 2.20462;

export const WEIGHT_UNITS = [
  { value: 'kg', label: 'Kilograms' },
  { value: 'lb', label: 'Pounds' },
];

/** kg -> the number to show in the chosen unit. */
export function toDisplayWeight(kg, unit) {
  if (kg == null || Number.isNaN(kg)) return null;
  return unit === 'lb' ? kg * LB_PER_KG : kg;
}

/** A number typed in the chosen unit -> kg for storage. */
export function toStoredWeight(value, unit) {
  if (value == null || Number.isNaN(value)) return null;
  return unit === 'lb' ? value / LB_PER_KG : value;
}

/** One decimal is enough for a weight and keeps lb values from looking noisy. */
export function round1(value) {
  if (value == null) return null;
  return Math.round(value * 10) / 10;
}

/** "72 kg" / "159 lb". Returns an em dash for missing values. */
export function formatWeight(kg, unit, { decimals = 0, withUnit = true } = {}) {
  const value = toDisplayWeight(kg, unit);
  if (value == null) return '—';
  const rounded = decimals > 0 ? value.toFixed(decimals) : String(Math.round(value));
  return withUnit ? `${rounded} ${unit}` : rounded;
}
