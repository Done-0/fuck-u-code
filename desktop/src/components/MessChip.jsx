import { tone } from '../score.js';

/** Compact colored number for the mess index, used in dense places like the nav. */
export function MessChip({ mess, digits = 0 }) {
  return <span className={`mess-chip tone-${tone(mess)}`}>{mess.toFixed(digits)}</span>;
}
