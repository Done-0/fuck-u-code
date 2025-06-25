/**
 * Generic parser for unsupported languages.
 * Last-resort fallback that extracts basic structure using
 * common cross-language patterns (function/def/fn keywords, class/struct, imports).
 */

import type { Parser, ParseResult, Language, FunctionInfo, ClassInfo } from './types.js';

/** Common function declaration patterns across languages */
const FUNCTION_PATTERNS: RegExp[] = [
  /^(?:export\s+)?(?:async\s+)?function\s+(\w+)/,
  /^(?:pub\s+)?(?:async\s+)?fn\s+(\w+)/,
  /^(?:async\s+)?def\s+(\w+)/,
  /^func\s+(?:\([^)]+\)\s+)?(\w+)/,
  /^(?:public|private|protected)?\s*(?:static\s+)?(?:\w+\s+)+(\w+)\s*\([^)]*\)\s*\{/,
  /^(?:local\s+)?function\s+(\w+)/,
];

/** Common class/struct declaration patterns */
const CLASS_PATTERNS: RegExp[] = [
  /^(?:export\s+)?(?:abstract\s+)?class\s+(\w+)/,
  /^(?:pub\s+)?struct\s+(\w+)/,
  /^type\s+(\w+)\s+struct/,
  /^(?:pub\s+)?enum\s+(\w+)/,
];

/** Common import patterns */
const IMPORT_PATTERNS: RegExp[] = [
  /^import\s+["']([^"']+)["']/,
  /^import\s+.*\s+from\s+["']([^"']+)["']/,
  /^from\s+(\S+)\s+import/,
  /^require\s*\(\s*["']([^"']+)["']\s*\)/,
  /^#include\s*[<"]([^>"]+)[>"]/,
  /^use\s+(\S+)/,
  /^using\s+(\S+)/,
  /^import\s+"([^"]+)"/,
];

/**
 * Generic parser for languages without dedicated tree-sitter or regex support.
 * Provides best-effort extraction using common cross-language patterns.
 */
export class GenericParser implements Parser {
  parse(filePath: string, content: string): ParseResult {
    const lines = content.split('\n');
    const totalLines = lines.length;
    const { commentLines, blankLines } = this.countLines(lines);

    return {
      filePath,
      language: 'unknown',
      totalLines,
      codeLines: totalLines - commentLines - blankLines,
      commentLines,
      blankLines,
      functions: this.extractFunctions(lines),
      classes: this.extractClasses(lines),
      imports: this.extractImports(lines),
      errors: [],
    };
  }

  supportedLanguages(): Language[] {
    return ['unknown'];
  }

  /** Count comment and blank lines using common comment syntax */
  private countLines(lines: string[]): { commentLines: number; blankLines: number } {
    let commentLines = 0;
    let blankLines = 0;
    let inBlockComment = false;

    for (const line of lines) {
      const trimmed = line.trim();

      if (trimmed === '') {
        blankLines++;
        continue;
      }

      if (inBlockComment) {
        commentLines++;
        if (trimmed.includes('*/')) inBlockComment = false;
        continue;
      }

      if (trimmed.startsWith('/*')) {
        commentLines++;
        if (!trimmed.includes('*/')) inBlockComment = true;
        continue;
      }

      if (trimmed.startsWith('//') || trimmed.startsWith('#') || trimmed.startsWith('--')) {
        commentLines++;
      }
    }

    return { commentLines, blankLines };
  }

  /** Extract functions using common cross-language patterns */
  private extractFunctions(lines: string[]): FunctionInfo[] {
    const functions: FunctionInfo[] = [];
    let inBlockComment = false;

    for (let i = 0; i < lines.length; i++) {
      const trimmed = (lines[i] ?? '').trim();

      if (trimmed === '') continue;
      if (inBlockComment) {
        if (trimmed.includes('*/')) inBlockComment = false;
        continue;
      }
      if (trimmed.startsWith('/*')) {
        if (!trimmed.includes('*/')) inBlockComment = true;
        continue;
      }
      if (trimmed.startsWith('//') || trimmed.startsWith('#') || trimmed.startsWith('--')) continue;

      for (const pattern of FUNCTION_PATTERNS) {
        const match = trimmed.match(pattern);
        if (match?.[1]) {
          const startLine = i + 1;
          const endLine = this.findBlockEnd(lines, i);
          const paramMatch = /\(([^)]*)\)/.exec(trimmed);
          const parameterCount =
            paramMatch?.[1] && paramMatch[1].trim() !== '' ? paramMatch[1].split(',').length : 0;

          functions.push({
            name: match[1],
            startLine,
            endLine,
            lineCount: endLine - startLine + 1,
            complexity: 1,
            parameterCount,
            nestingDepth: 0,
            hasDocstring: false,
          });
          break;
        }
      }
    }

    return functions;
  }

  /** Extract classes/structs using common cross-language patterns */
  private extractClasses(lines: string[]): ClassInfo[] {
    const classes: ClassInfo[] = [];
    let inBlockComment = false;

    for (let i = 0; i < lines.length; i++) {
      const trimmed = (lines[i] ?? '').trim();

      if (trimmed === '') continue;
      if (inBlockComment) {
        if (trimmed.includes('*/')) inBlockComment = false;
        continue;
      }
      if (trimmed.startsWith('/*')) {
        if (!trimmed.includes('*/')) inBlockComment = true;
        continue;
      }
      if (trimmed.startsWith('//') || trimmed.startsWith('#') || trimmed.startsWith('--')) continue;

      for (const pattern of CLASS_PATTERNS) {
        const match = trimmed.match(pattern);
        if (match?.[1]) {
          const startLine = i + 1;
          const endLine = this.findBlockEnd(lines, i);
          classes.push({
            name: match[1],
            startLine,
            endLine,
            methodCount: 0,
            fieldCount: 0,
          });
          break;
        }
      }
    }

    return classes;
  }

  /** Extract imports using common cross-language patterns */
  private extractImports(lines: string[]): string[] {
    const imports: string[] = [];

    for (const line of lines) {
      const trimmed = line.trim();
      for (const pattern of IMPORT_PATTERNS) {
        const match = trimmed.match(pattern);
        if (match?.[1]) {
          imports.push(match[1]);
          break;
        }
      }
    }

    return imports;
  }

  /**
   * Find end of a block using brace counting.
   * Falls back to indentation-based detection for braceless languages.
   */
  private findBlockEnd(lines: string[], startLine: number): number {
    let braceCount = 0;
    let foundBrace = false;

    for (let i = startLine; i < lines.length; i++) {
      const line = lines[i] ?? '';
      for (const ch of line) {
        if (ch === '{') {
          braceCount++;
          foundBrace = true;
        } else if (ch === '}') {
          braceCount--;
        }
      }
      if (foundBrace && braceCount === 0) return i + 1;
    }

    // No braces found — use indentation-based block end detection
    const baseLine = lines[startLine] ?? '';
    const baseIndent = baseLine.length - baseLine.trimStart().length;
    for (let i = startLine + 1; i < lines.length; i++) {
      const line = lines[i] ?? '';
      if (line.trim() === '') continue;
      const indent = line.length - line.trimStart().length;
      if (indent <= baseIndent) return i;
    }

    return lines.length;
  }
}
