import { useT } from '../i18n.js';
import { QUALITY_LEVELS, qualityLevel, tone } from '../score.js';
import { LevelEmoji } from './Emoji.jsx';

// Color bands follow the same thresholds as tone().
const BANDS = [
  { from: 0, to: 15, tone: 'good' },
  { from: 15, to: 35, tone: 'fair' },
  { from: 35, to: 60, tone: 'poor' },
  { from: 60, to: 100, tone: 'bad' },
];

// The last level ("ultimate") is the single point 100; it shares the final slot.
const SLOTS = QUALITY_LEVELS.slice(0, -1).map((level, i, levels) => ({
  ...level,
  max: levels[i + 1]?.min ?? 100,
}));

/** Horizontal ladder of every quality level with the project's position marked. */
export function LevelScale({ mess }) {
  const t = useT();
  const current = qualityLevel(mess);
  const position = Math.max(0, Math.min(100, mess));

  return (
    <div className="level-scale">
      <div className="level-scale-emojis">
        {SLOTS.map((slot, index) => {
          const isCurrent =
            slot.key === current.key || (index === SLOTS.length - 1 && current.min >= slot.min);
          return (
            <span
              key={slot.key}
              className={`level-scale-emoji${isCurrent ? ' is-current' : ''}`}
              style={{ left: `${(slot.min + slot.max) / 2}%` }}
              title={`${t(slot.key)} (${slot.min}–${slot.max})`}
              aria-hidden="true"
            >
              <LevelEmoji level={isCurrent ? current : slot} size={isCurrent ? 28 : 18} />
            </span>
          );
        })}
      </div>
      <div
        className="level-scale-track"
        role="img"
        aria-label={`${t(current.key)}: ${position.toFixed(1)} / 100`}
      >
        <div className="level-scale-bands">
          {BANDS.map((band) => (
            <span
              key={band.tone}
              className={`level-scale-band tone-${band.tone}`}
              style={{ left: `${band.from}%`, width: `${band.to - band.from}%` }}
            />
          ))}
          {SLOTS.slice(1).map((slot) => (
            <span key={slot.key} className="level-scale-tick" style={{ left: `${slot.min}%` }} />
          ))}
        </div>
        <span className={`level-scale-thumb tone-${tone(mess)}`} style={{ left: `${position}%` }} />
      </div>
      <div className="level-scale-ends">
        <span>0 · {t('level_clean')}</span>
        <span>{t('level_ultimate')} · 100</span>
      </div>
    </div>
  );
}
