import { tone } from '../score.js';

const RADIUS = 80;
const ARC = `M 20 100 A ${RADIUS} ${RADIUS} 0 0 1 180 100`;
const ARC_LENGTH = Math.PI * RADIUS;

/** Half-circle gauge for the mess index (0 best, 100 worst). */
export function ScoreGauge({ mess, label, hint }) {
  const filled = (Math.max(0, Math.min(100, mess)) / 100) * ARC_LENGTH;
  return (
    <div
      className={`gauge tone-${tone(mess)}`}
      role="img"
      aria-label={`${label}: ${mess.toFixed(1)}`}
    >
      {/* The number lives in the SVG so it stays centered in the arc at any size. */}
      <svg viewBox="0 0 200 108" className="gauge-svg" aria-hidden="true">
        <path d={ARC} className="gauge-track" />
        <path
          d={ARC}
          className="gauge-value"
          style={{ strokeDasharray: `${filled} ${ARC_LENGTH}` }}
        />
        <text x="100" y="96" textAnchor="middle" className="gauge-number">
          {mess.toFixed(1)}
        </text>
      </svg>
      <div className="gauge-caption">
        <span className="gauge-label">{label}</span>
        {hint && <span className="gauge-hint">{hint}</span>}
      </div>
    </div>
  );
}
