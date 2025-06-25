import { describe, it, expect } from 'vitest';
import { renderMarkdownToTerminal } from '../../src/utils/markdown.js';

/** Strip ANSI escape codes for content assertions */
function stripAnsi(str: string): string {
  return str.replace(/\x1b\[[0-9;]*[a-zA-Z]/g, '');
}

describe('renderMarkdownToTerminal', () => {
  describe('hanging indent on wrapped lines', () => {
    it('should indent continuation lines of unordered list items', () => {
      // "  • " is 4 columns; continuation should align under the text, not the bullet
      const longText = 'a'.repeat(200);
      const markdown = `- ${longText}`;
      const output = renderMarkdownToTerminal(markdown, 0);
      const lines = output.split('\n');

      expect(lines.length).toBeGreaterThan(1);
      const firstClean = stripAnsi(lines[0]!);
      expect(firstClean).toMatch(/^\s*•\s/);

      // Continuation lines should have hanging indent (4 spaces for "  • ")
      const secondClean = stripAnsi(lines[1]!);
      expect(secondClean).toMatch(/^\s{4}/);
    });

    it('should indent continuation lines of ordered list items', () => {
      const longText = 'b'.repeat(200);
      const markdown = `1. ${longText}`;
      const output = renderMarkdownToTerminal(markdown, 0);
      const lines = output.split('\n');

      expect(lines.length).toBeGreaterThan(1);
      const firstClean = stripAnsi(lines[0]!);
      expect(firstClean).toMatch(/^\s*\d+\.\s/);

      // "  1. " = 5 columns of hanging indent
      const secondClean = stripAnsi(lines[1]!);
      expect(secondClean).toMatch(/^\s{5}/);
    });

    it('should not add hanging indent for plain text', () => {
      const longText = 'c'.repeat(200);
      const output = renderMarkdownToTerminal(longText, 0);
      const lines = output.split('\n');

      if (lines.length > 1) {
        const secondClean = stripAnsi(lines[1]!);
        // Plain text should not have leading spaces on continuation
        expect(secondClean).not.toMatch(/^\s+/);
      }
    });

    it('should not add hanging indent for headings', () => {
      const longText = 'h'.repeat(200);
      const markdown = `## ${longText}`;
      const output = renderMarkdownToTerminal(markdown, 0);
      const lines = output.split('\n');

      if (lines.length > 1) {
        const secondClean = stripAnsi(lines[1]!);
        expect(secondClean).not.toMatch(/^\s+/);
      }
    });

    it('should add hanging indent for blockquotes', () => {
      const longText = 'q'.repeat(200);
      const markdown = `> ${longText}`;
      const output = renderMarkdownToTerminal(markdown, 0);
      const lines = output.split('\n');

      if (lines.length > 1) {
        const secondClean = stripAnsi(lines[1]!);
        // Blockquote depth 1 → hangingIndent = 4
        expect(secondClean).toMatch(/^\s{4}/);
      }
    });
  });

  describe('outer indent parameter', () => {
    it('should prepend indent spaces to every output line', () => {
      const markdown = 'hello\nworld';
      const output = renderMarkdownToTerminal(markdown, 5);
      const lines = output.split('\n');

      for (const line of lines) {
        if (line.trim() === '') continue;
        expect(stripAnsi(line)).toMatch(/^\s{5}/);
      }
    });
  });
});
