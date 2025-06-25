/**
 * Terminal display utilities
 *
 * Provides terminal width detection, Unicode-aware string width calculation,
 * and display-width-based string padding/truncation for proper CJK alignment.
 */

// ANSI escape sequence pattern (SGR, cursor movement, etc.)
// ANSI escape sequence pattern (SGR, cursor movement, etc.)
const ANSI_REGEX = new RegExp(String.raw`\x1b\[[0-9;]*[a-zA-Z]`, 'g');

/**
 * Unicode block ranges that occupy 2 terminal columns.
 *
 * Based on Unicode Standard Annex #11 (East Asian Width) and common terminal
 * emulator behavior. Covers CJK Unified Ideographs, CJK Compatibility,
 * Hangul Syllables, Fullwidth Forms, and supplementary CJK planes.
 *
 * Reference: https://www.unicode.org/reports/tr11/
 */
const WIDE_CHAR_RANGES: [number, number][] = [
  [0x1100, 0x115f], // Hangul Jamo
  [0x2e80, 0x303e], // CJK Radicals Supplement, Kangxi Radicals, CJK Symbols
  [0x3040, 0x33bf], // Hiragana, Katakana, Bopomofo, CJK Compatibility
  [0x3400, 0x4dbf], // CJK Unified Ideographs Extension A
  [0x4e00, 0x9fff], // CJK Unified Ideographs
  [0xa000, 0xa4cf], // Yi Syllables, Yi Radicals
  [0xac00, 0xd7af], // Hangul Syllables
  [0xf900, 0xfaff], // CJK Compatibility Ideographs
  [0xfe10, 0xfe1f], // Vertical Forms
  [0xfe30, 0xfe6f], // CJK Compatibility Forms, Small Form Variants
  [0xff01, 0xff60], // Fullwidth ASCII variants
  [0xffe0, 0xffe6], // Fullwidth currency symbols
  [0x1f300, 0x1f9ff], // Miscellaneous Symbols and Pictographs, Emoticons
  [0x20000, 0x2a6df], // CJK Unified Ideographs Extension B
  [0x2a700, 0x2ceaf], // CJK Unified Ideographs Extensions C/D/E
  [0x2ceb0, 0x2ebef], // CJK Unified Ideographs Extension F
  [0x30000, 0x3134f], // CJK Unified Ideographs Extension G
];

/**
 * Check whether a Unicode code point occupies 2 terminal columns.
 * Uses binary search over pre-sorted wide character ranges.
 */
function isWideChar(codePoint: number): boolean {
  let low = 0;
  let high = WIDE_CHAR_RANGES.length - 1;

  while (low <= high) {
    const mid = (low + high) >>> 1;
    const range = WIDE_CHAR_RANGES[mid];
    if (!range) break;

    if (codePoint < range[0]) {
      high = mid - 1;
    } else if (codePoint > range[1]) {
      low = mid + 1;
    } else {
      return true;
    }
  }

  return false;
}

/**
 * Get current terminal width.
 *
 * Falls back to 80 columns when stdout is not a TTY (e.g. piped output, CI).
 * Clamped to [60, 200] to prevent degenerate layouts on extremely narrow
 * or wide terminals.
 */
export function getTerminalWidth(): number {
  const columns = process.stdout.columns || 80;
  return Math.max(60, Math.min(columns, 200));
}

/**
 * Calculate the display width of a string in terminal columns.
 *
 * Strips ANSI escape codes before measuring. CJK and other East Asian
 * wide characters count as 2 columns; all other printable characters
 * count as 1 column. Control characters (except ANSI sequences) are
 * counted as 0 columns.
 *
 * @param str - Input string, may contain ANSI escape codes
 * @returns Number of terminal columns the string occupies
 */
export function displayWidth(str: string): number {
  const clean = str.replace(ANSI_REGEX, '');
  let width = 0;

  for (const char of clean) {
    const codePoint = char.codePointAt(0);
    if (codePoint === undefined) continue;

    // Skip common control characters (tab, newline, etc.)
    if (codePoint < 0x20 && codePoint !== 0x09) continue;

    // Tab counts as 1 for simplicity (actual rendering depends on terminal)
    if (codePoint === 0x09) {
      width += 1;
      continue;
    }

    width += isWideChar(codePoint) ? 2 : 1;
  }

  return width;
}

/**
 * Pad a string with trailing spaces to reach the target display width.
 *
 * Unlike `String.prototype.padEnd`, this accounts for CJK characters
 * that occupy 2 terminal columns. If the string already meets or exceeds
 * the target width, it is returned unchanged.
 *
 * @param str - Input string to pad
 * @param targetWidth - Desired display width in terminal columns
 * @returns Padded string
 */
export function padEndByWidth(str: string, targetWidth: number): string {
  const currentWidth = displayWidth(str);
  if (currentWidth >= targetWidth) return str;
  return str + ' '.repeat(targetWidth - currentWidth);
}

/**
 * Truncate a string to fit within a maximum display width.
 *
 * If the string exceeds `maxWidth`, it is truncated and an ellipsis suffix
 * is appended. CJK characters are handled correctly — truncation never
 * splits a wide character. ANSI escape codes are preserved for characters
 * that remain in the output.
 *
 * @param str - Input string (plain text, no ANSI codes expected)
 * @param maxWidth - Maximum display width in terminal columns
 * @param suffix - Suffix to append when truncated (default: "..")
 * @returns Truncated string fitting within maxWidth columns
 */
/**
 * Wrap a string containing ANSI escape codes to fit within maxWidth display columns.
 *
 * Splits the line into segments that each fit within maxWidth. ANSI style state
 * is tracked and replayed on continuation lines so colors/bold carry over correctly.
 *
 * @returns Array of line segments (at least one element)
 */
export function wrapAnsiLine(line: string, maxWidth: number, hangingIndent = 0): string[] {
  if (maxWidth <= 4) return [line];

  const result: string[] = [];
  let current = '';
  let width = 0;
  let ansiState = '';
  let i = 0;

  while (i < line.length) {
    if (line.charCodeAt(i) === 0x1b && i + 1 < line.length && line.charCodeAt(i + 1) === 0x5b) {
      let j = i + 2;
      while (j < line.length && line.charCodeAt(j) !== 0x6d) j++;
      const seq = line.slice(i, j + 1);
      current += seq;
      ansiState += seq;
      i = j + 1;
      continue;
    }

    const code = line.codePointAt(i);
    if (code === undefined) {
      i++;
      continue;
    }
    const char = String.fromCodePoint(code);
    const step = char.length;
    const cw = isWideChar(code) ? 2 : 1;

    // Continuation lines have reduced available width due to hanging indent
    const effectiveMax = result.length === 0 ? maxWidth : maxWidth - hangingIndent;

    if (width > 0 && width + cw > effectiveMax) {
      result.push(current + '\x1b[0m');
      const prefix = hangingIndent > 0 ? ' '.repeat(hangingIndent) : '';
      current = prefix + ansiState + char;
      width = hangingIndent + cw;
    } else {
      current += char;
      width += cw;
    }
    i += step;
  }

  if (current) result.push(current);
  return result.length > 0 ? result : [''];
}

export function truncateByWidth(str: string, maxWidth: number, suffix = '..'): string {
  if (displayWidth(str) <= maxWidth) return str;

  const suffixWidth = displayWidth(suffix);
  const availableWidth = maxWidth - suffixWidth;
  if (availableWidth <= 0) return suffix.slice(0, maxWidth);

  let width = 0;
  let result = '';

  for (const char of str) {
    const codePoint = char.codePointAt(0);
    if (codePoint === undefined) continue;

    const charWidth = isWideChar(codePoint) ? 2 : 1;
    if (width + charWidth > availableWidth) break;

    result += char;
    width += charWidth;
  }

  return result + suffix;
}
