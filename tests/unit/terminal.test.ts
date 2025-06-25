import { describe, it, expect } from 'vitest';
import { wrapAnsiLine, displayWidth } from '../../src/utils/terminal.js';

describe('wrapAnsiLine', () => {
  it('should return single-element array for short lines', () => {
    const result = wrapAnsiLine('hello', 80);
    expect(result).toEqual(['hello']);
  });

  it('should wrap long lines at maxWidth boundary', () => {
    const line = 'a'.repeat(20);
    const result = wrapAnsiLine(line, 10);
    expect(result.length).toBe(2);
    expect(displayWidth(result[0]!.replace(/\x1b\[[0-9;]*[a-zA-Z]/g, ''))).toBe(10);
  });

  it('should return original line when maxWidth <= 4', () => {
    const result = wrapAnsiLine('hello world', 3);
    expect(result).toEqual(['hello world']);
  });

  describe('hangingIndent', () => {
    it('should not add indent to the first line', () => {
      const line = 'a'.repeat(20);
      const result = wrapAnsiLine(line, 10, 4);
      expect(result[0]!.replace(/\x1b\[[0-9;]*[a-zA-Z]/g, '')).not.toMatch(/^\s/);
    });

    it('should add hanging indent spaces to continuation lines', () => {
      const line = 'a'.repeat(20);
      const result = wrapAnsiLine(line, 10, 4);
      expect(result.length).toBeGreaterThan(1);
      // Continuation line starts with 4 spaces
      const continuation = result[1]!.replace(/\x1b\[[0-9;]*[a-zA-Z]/g, '');
      expect(continuation).toMatch(/^\s{4}/);
    });

    it('should reduce available width on continuation lines by hangingIndent', () => {
      // 15 chars, maxWidth=10, hangingIndent=4 → continuation has 6 usable columns
      const line = 'abcdefghijklmno';
      const result = wrapAnsiLine(line, 10, 4);
      // First line: 10 chars, second line: 4 spaces + up to 6 chars
      expect(result.length).toBeGreaterThanOrEqual(2);
      const secondClean = result[1]!.replace(/\x1b\[[0-9;]*[a-zA-Z]/g, '');
      expect(displayWidth(secondClean)).toBeLessThanOrEqual(10);
      expect(secondClean.startsWith('    ')).toBe(true);
    });

    it('should default hangingIndent to 0 when not provided', () => {
      const line = 'a'.repeat(20);
      const withDefault = wrapAnsiLine(line, 10);
      const withZero = wrapAnsiLine(line, 10, 0);
      expect(withDefault).toEqual(withZero);
    });

    it('should handle CJK characters with hanging indent', () => {
      // Each CJK char is 2 columns wide
      const line = '你好世界测试文本内容';
      const result = wrapAnsiLine(line, 10, 4);
      expect(result.length).toBeGreaterThan(1);
      const secondClean = result[1]!.replace(/\x1b\[[0-9;]*[a-zA-Z]/g, '');
      expect(secondClean.startsWith('    ')).toBe(true);
    });

    it('should preserve ANSI state across continuation lines with hanging indent', () => {
      const line = '\x1b[1m' + 'a'.repeat(20) + '\x1b[0m';
      const result = wrapAnsiLine(line, 10, 4);
      expect(result.length).toBeGreaterThan(1);
      // Continuation line should replay ANSI bold state after indent
      expect(result[1]).toContain('\x1b[1m');
    });
  });
});
