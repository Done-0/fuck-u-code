/**
 * Score helpers. The analyzer scores 0–100 with 100 best; the UI shows the
 * inverted "mess index" (0 best) like the CLI does.
 */

// Same ladder and emoji as src/cli/output/console.ts; `icon` names a file in assets/emoji.
export const QUALITY_LEVELS = [
  { min: 0, key: 'level_clean', icon: 'seedling' },
  { min: 5, key: 'level_mild', icon: 'cherry-blossom' },
  { min: 15, key: 'level_moderate', icon: 'neutral-face' },
  { min: 25, key: 'level_bad', icon: 'medical-mask' },
  { min: 40, key: 'level_terrible', icon: 'pile-of-poo' },
  { min: 55, key: 'level_disaster', icon: 'head-bandage' },
  { min: 65, key: 'level_severe', icon: 'biohazard' },
  { min: 75, key: 'level_very_bad', icon: 'zombie' },
  { min: 85, key: 'level_extreme', icon: 'radioactive' },
  { min: 95, key: 'level_worst', icon: 'headstone' },
  { min: 100, key: 'level_ultimate', icon: 'pile-of-poo', crowned: true },
];

export function toMess(score) {
  return Math.max(0, Math.min(100, 100 - score));
}

export function qualityLevel(mess) {
  return [...QUALITY_LEVELS].reverse().find((level) => mess >= level.min) ?? QUALITY_LEVELS[0];
}

export function scoreComment(t, mess) {
  return t(`score_comment_${Math.min(Math.floor(mess / 10) * 10, 90)}`);
}

/** Four-step tone used for colors across the UI. */
export function tone(mess) {
  if (mess < 15) return 'good';
  if (mess < 35) return 'fair';
  if (mess < 60) return 'poor';
  return 'bad';
}

export const TONE_BADGE = { good: 'success', fair: 'warning', poor: 'orange', bad: 'error' };
export const TONE_PROGRESS = { good: 'success', fair: 'warning', poor: 'warning', bad: 'error' };

const METRIC_FAMILIES = [
  ['complexity', ['complexity', 'cyclomatic', 'cognitive']],
  ['length', ['length', 'function', 'file']],
  ['comment', ['comment', 'ratio']],
  ['naming', ['naming', 'convention']],
  ['structure', ['nesting', 'depth', 'structure']],
];

/** One-line verdict for a metric, mirroring the CLI's getMetricComment. */
export function metricComment(t, name, mess) {
  const level = mess < 20 ? 'good' : mess < 60 ? 'medium' : 'bad';
  const lower = name.toLowerCase();
  const family =
    METRIC_FAMILIES.find(([, words]) => words.some((w) => lower.includes(w)))?.[0] ?? 'complexity';
  return t(`metric_${family}_${level}`);
}

// Same names as LANGUAGE_DISPLAY_NAMES in src/parser/types.ts
export const LANGUAGE_NAMES = {
  go: 'Go',
  javascript: 'JavaScript',
  typescript: 'TypeScript',
  python: 'Python',
  java: 'Java',
  c: 'C',
  cpp: 'C++',
  rust: 'Rust',
  csharp: 'C#',
  lua: 'Lua',
  php: 'PHP',
  ruby: 'Ruby',
  swift: 'Swift',
  shell: 'Shell',
};

export function languageName(language) {
  return LANGUAGE_NAMES[language] ?? language;
}

export const SEVERITY_BADGE = {
  info: 'neutral',
  warning: 'warning',
  error: 'orange',
  critical: 'error',
};

export function fmt(value, digits = 1) {
  return Number(value).toFixed(digits);
}

export function fmtInt(value) {
  return new Intl.NumberFormat().format(Math.round(value));
}

export function fmtDuration(ms) {
  return ms < 1000 ? `${ms} ms` : `${(ms / 1000).toFixed(1)} s`;
}

export function countIssues(file) {
  return file.metrics.reduce((sum, metric) => sum + (metric.locations?.length ?? 0), 0);
}
