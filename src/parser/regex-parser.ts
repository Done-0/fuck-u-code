/**
 * Regex-based parser fallback.
 * Used when tree-sitter WASM loading fails for a supported language.
 */

import type { Parser, ParseResult, Language, FunctionInfo, ClassInfo } from './types.js';

/** Per-language regex configuration */
interface LanguageConfig {
  functionPatterns: RegExp[];
  classPatterns: RegExp[];
  commentPatterns: {
    single: RegExp;
    multiStart: RegExp;
    multiEnd: RegExp;
  };
  branchKeywords: string[];
  loopKeywords: string[];
  /** Whether the language uses indentation for blocks (e.g. Python) */
  indentBased?: boolean;
  /** Patterns to detect methods inside a class body */
  methodPatterns?: RegExp[];
  /** Patterns to detect fields inside a class/struct body */
  fieldPatterns?: RegExp[];
}

const compiledComplexityRegexCache = new Map<string, RegExp[]>();

function getCompiledComplexityRegex(config: LanguageConfig, language: string): RegExp[] {
  const cached = compiledComplexityRegexCache.get(language);
  if (cached) return cached;

  const allKeywords = [...config.branchKeywords, ...config.loopKeywords];
  const regexes = allKeywords.map(
    (kw) => new RegExp(`\\b${kw.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'g')
  );
  compiledComplexityRegexCache.set(language, regexes);
  return regexes;
}

const LANGUAGE_CONFIGS: Record<string, LanguageConfig> = {
  go: {
    functionPatterns: [/^func\s+(?:\([^)]+\)\s+)?(\w+)\s*\(/],
    classPatterns: [/^type\s+(\w+)\s+struct\s*\{/],
    commentPatterns: {
      single: /^\s*\/\//,
      multiStart: /\/\*/,
      multiEnd: /\*\//,
    },
    branchKeywords: ['if', 'else if', 'case', 'default'],
    loopKeywords: ['for', 'range'],
    methodPatterns: [/^func\s+\([^)]+\)\s+(\w+)\s*\(/],
    fieldPatterns: [/^\s+\w+\s+\S+/],
  },
  javascript: {
    functionPatterns: [
      /^(?:async\s+)?function\s+(\w+)\s*\(/,
      /^(?:const|let|var)\s+(\w+)\s*=\s*(?:async\s+)?(?:function|\([^)]*\)\s*=>|\w+\s*=>)/,
      /^(\w+)\s*\([^)]*\)\s*\{/,
    ],
    classPatterns: [/^class\s+(\w+)/],
    commentPatterns: {
      single: /^\s*\/\//,
      multiStart: /\/\*/,
      multiEnd: /\*\//,
    },
    branchKeywords: ['if', 'else if', 'case', 'default', '?', '&&', '||', '??'],
    loopKeywords: ['for', 'while', 'do'],
    methodPatterns: [/^\s+(?:async\s+)?(\w+)\s*\([^)]*\)\s*\{/],
    fieldPatterns: [/^\s+(\w+)\s*[=;]/],
  },
  typescript: {
    functionPatterns: [
      /^(?:async\s+)?function\s+(\w+)\s*[<(]/,
      /^(?:const|let|var)\s+(\w+)\s*(?::\s*[^=]+)?\s*=\s*(?:async\s+)?(?:function|\([^)]*\)\s*=>|\w+\s*=>)/,
      /^(?:public|private|protected)?\s*(?:async\s+)?(\w+)\s*\([^)]*\)\s*(?::\s*[^{]+)?\s*\{/,
    ],
    classPatterns: [/^(?:export\s+)?(?:abstract\s+)?class\s+(\w+)/],
    commentPatterns: {
      single: /^\s*\/\//,
      multiStart: /\/\*/,
      multiEnd: /\*\//,
    },
    branchKeywords: ['if', 'else if', 'case', 'default', '?', '&&', '||', '??'],
    loopKeywords: ['for', 'while', 'do'],
    methodPatterns: [/^\s+(?:public|private|protected)?\s*(?:async\s+)?(\w+)\s*\([^)]*\)/],
    fieldPatterns: [/^\s+(?:public|private|protected)?\s*(?:readonly\s+)?(\w+)\s*[?:;=]/],
  },
  python: {
    functionPatterns: [/^(?:async\s+)?def\s+(\w+)\s*\(/],
    classPatterns: [/^class\s+(\w+)/],
    commentPatterns: {
      single: /^\s*#/,
      multiStart: /^"""/,
      multiEnd: /"""$/,
    },
    branchKeywords: ['if', 'elif', 'else', 'and', 'or'],
    loopKeywords: ['for', 'while'],
    indentBased: true,
    methodPatterns: [/^\s+(?:async\s+)?def\s+(\w+)\s*\(/],
    fieldPatterns: [/^\s+self\.(\w+)\s*=/],
  },
  java: {
    functionPatterns: [
      /^(?:public|private|protected)?\s*(?:static\s+)?(?:final\s+)?(?:\w+(?:<[^>]+>)?)\s+(\w+)\s*\(/,
    ],
    classPatterns: [/^(?:public\s+)?(?:abstract\s+)?(?:final\s+)?class\s+(\w+)/],
    commentPatterns: {
      single: /^\s*\/\//,
      multiStart: /\/\*/,
      multiEnd: /\*\//,
    },
    branchKeywords: ['if', 'else if', 'case', 'default', '?', '&&', '||'],
    loopKeywords: ['for', 'while', 'do'],
    methodPatterns: [
      /^\s+(?:public|private|protected)?\s*(?:static\s+)?(?:\w+(?:<[^>]+>)?)\s+(\w+)\s*\(/,
    ],
    fieldPatterns: [
      /^\s+(?:public|private|protected)?\s*(?:static\s+)?(?:final\s+)?(?:\w+(?:<[^>]+>)?)\s+(\w+)\s*[;=]/,
    ],
  },
  c: {
    functionPatterns: [/^(?:\w+\s+)+(\w+)\s*\([^)]*\)\s*\{/],
    classPatterns: [/^(?:typedef\s+)?struct\s+(\w+)/],
    commentPatterns: {
      single: /^\s*\/\//,
      multiStart: /\/\*/,
      multiEnd: /\*\//,
    },
    branchKeywords: ['if', 'else if', 'case', 'default', '?', '&&', '||'],
    loopKeywords: ['for', 'while', 'do'],
    fieldPatterns: [/^\s+\w+\s+\w+\s*;/],
  },
  cpp: {
    functionPatterns: [
      /^(?:virtual\s+)?(?:\w+(?:<[^>]+>)?\s+)+(\w+)\s*\([^)]*\)\s*(?:const\s*)?(?:override\s*)?\{/,
    ],
    classPatterns: [/^(?:template\s*<[^>]+>\s*)?class\s+(\w+)/],
    commentPatterns: {
      single: /^\s*\/\//,
      multiStart: /\/\*/,
      multiEnd: /\*\//,
    },
    branchKeywords: ['if', 'else if', 'case', 'default', '?', '&&', '||'],
    loopKeywords: ['for', 'while', 'do'],
    methodPatterns: [
      /^\s+(?:virtual\s+)?(?:\w+(?:<[^>]+>)?\s+)+(\w+)\s*\([^)]*\)\s*(?:const\s*)?(?:override\s*)?\{/,
    ],
    fieldPatterns: [/^\s+\w+\s+\w+\s*;/],
  },
  rust: {
    functionPatterns: [/^(?:pub\s+)?(?:async\s+)?fn\s+(\w+)/],
    classPatterns: [/^(?:pub\s+)?struct\s+(\w+)/, /^(?:pub\s+)?enum\s+(\w+)/],
    commentPatterns: {
      single: /^\s*\/\//,
      multiStart: /\/\*/,
      multiEnd: /\*\//,
    },
    branchKeywords: ['if', 'else if', 'match', '=>', '&&', '||'],
    loopKeywords: ['for', 'while', 'loop'],
    fieldPatterns: [/^\s+(?:pub\s+)?\w+\s*:/],
  },
  csharp: {
    functionPatterns: [
      /^(?:public|private|protected|internal)?\s*(?:static\s+)?(?:async\s+)?(?:\w+(?:<[^>]+>)?)\s+(\w+)\s*\(/,
    ],
    classPatterns: [/^(?:public\s+)?(?:abstract\s+)?(?:sealed\s+)?class\s+(\w+)/],
    commentPatterns: {
      single: /^\s*\/\//,
      multiStart: /\/\*/,
      multiEnd: /\*\//,
    },
    branchKeywords: ['if', 'else if', 'case', 'default', '?', '&&', '||', '??'],
    loopKeywords: ['for', 'foreach', 'while', 'do'],
    methodPatterns: [
      /^\s+(?:public|private|protected|internal)?\s*(?:static\s+)?(?:async\s+)?(?:\w+(?:<[^>]+>)?)\s+(\w+)\s*\(/,
    ],
    fieldPatterns: [
      /^\s+(?:public|private|protected|internal)?\s*(?:static\s+)?(?:\w+(?:<[^>]+>)?)\s+(\w+)\s*[;=]/,
    ],
  },
  lua: {
    functionPatterns: [
      /^(?:local\s+)?function\s+(\w+(?:\.\w+)*)\s*\(/,
      /^(\w+)\s*=\s*function\s*\(/,
    ],
    classPatterns: [],
    commentPatterns: {
      single: /^\s*--(?!\[)/,
      multiStart: /--\[\[/,
      multiEnd: /\]\]/,
    },
    branchKeywords: ['if', 'elseif', 'and', 'or'],
    loopKeywords: ['for', 'while', 'repeat'],
  },
};

/** Common import patterns shared across languages */
const IMPORT_PATTERNS: RegExp[] = [
  /^import\s+["']([^"']+)["']/,
  /^import\s+.*\s+from\s+["']([^"']+)["']/,
  /^from\s+(\S+)\s+import/,
  /^require\s*\(\s*["']([^"']+)["']\s*\)/,
  /^#include\s*[<"]([^>"]+)[>"]/,
  /^use\s+(\S+)/,
  /^using\s+(\S+)/,
];

/**
 * Regex-based parser fallback.
 * Provides approximate code analysis when tree-sitter WASM is unavailable.
 */
export class RegexParser implements Parser {
  private language: Language;
  private config: LanguageConfig;
  private complexityRegexes: RegExp[];

  constructor(language: Language) {
    this.language = language;
    this.config =
      LANGUAGE_CONFIGS[language] ?? LANGUAGE_CONFIGS.javascript ?? ({} as LanguageConfig);
    this.complexityRegexes = getCompiledComplexityRegex(this.config, language);
  }

  parse(filePath: string, content: string): ParseResult {
    const lines = content.split('\n');
    const totalLines = lines.length;

    const { commentLines, blankLines, codeLines } = this.countLines(lines);
    const functions = this.config.indentBased
      ? this.extractFunctionsIndent(lines)
      : this.extractFunctionsBrace(lines);
    const classes = this.config.indentBased
      ? this.extractClassesIndent(lines)
      : this.extractClassesBrace(lines);
    const imports = this.extractImports(lines);

    return {
      filePath,
      language: this.language,
      totalLines,
      codeLines,
      commentLines,
      blankLines,
      functions,
      classes,
      imports,
      errors: [],
    };
  }

  supportedLanguages(): Language[] {
    return Object.keys(LANGUAGE_CONFIGS) as Language[];
  }

  /** Count comment, blank, and code lines */
  private countLines(lines: string[]): {
    commentLines: number;
    blankLines: number;
    codeLines: number;
  } {
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
        if (this.config.commentPatterns.multiEnd.test(trimmed)) {
          inBlockComment = false;
        }
        continue;
      }

      if (this.config.commentPatterns.multiStart.test(trimmed)) {
        commentLines++;
        if (!this.config.commentPatterns.multiEnd.test(trimmed)) {
          inBlockComment = true;
        }
        continue;
      }

      if (this.config.commentPatterns.single.test(trimmed)) {
        commentLines++;
        continue;
      }
    }

    const codeLines = lines.length - commentLines - blankLines;
    return { commentLines, blankLines, codeLines };
  }

  /** Extract functions from brace-delimited languages */
  private extractFunctionsBrace(lines: string[]): FunctionInfo[] {
    const functions: FunctionInfo[] = [];
    const braceStack: number[] = [];
    let currentFunction: Partial<FunctionInfo> | null = null;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i] ?? '';
      const trimmed = line.trim();

      if (
        this.config.commentPatterns.single.test(trimmed) ||
        this.config.commentPatterns.multiStart.test(trimmed)
      ) {
        continue;
      }

      if (!currentFunction) {
        for (const pattern of this.config.functionPatterns) {
          const match = trimmed.match(pattern);
          if (match?.[1]) {
            currentFunction = {
              name: match[1],
              startLine: i + 1,
              complexity: 1,
              parameterCount: this.countParameters(trimmed),
              nestingDepth: 0,
              hasDocstring: this.hasDocstring(lines, i),
            };
            break;
          }
        }
      }

      let openBraces = 0;
      let closeBraces = 0;
      for (const ch of line) {
        if (ch === '{') openBraces++;
        else if (ch === '}') closeBraces++;
      }

      for (let j = 0; j < openBraces; j++) {
        braceStack.push(i);
      }

      for (let j = 0; j < closeBraces; j++) {
        braceStack.pop();
      }

      if (currentFunction) {
        currentFunction.complexity =
          (currentFunction.complexity ?? 1) + this.calculateLineComplexity(trimmed);
        currentFunction.nestingDepth = Math.max(
          currentFunction.nestingDepth ?? 0,
          braceStack.length
        );

        if (braceStack.length === 0 && closeBraces > 0) {
          functions.push({
            name: currentFunction.name ?? 'anonymous',
            startLine: currentFunction.startLine ?? i + 1,
            endLine: i + 1,
            lineCount: i + 1 - (currentFunction.startLine ?? i + 1) + 1,
            complexity: currentFunction.complexity ?? 1,
            parameterCount: currentFunction.parameterCount ?? 0,
            nestingDepth: currentFunction.nestingDepth ?? 0,
            hasDocstring: currentFunction.hasDocstring ?? false,
          });
          currentFunction = null;
        }
      }
    }

    return functions;
  }

  /** Extract classes from brace-delimited languages */
  private extractClassesBrace(lines: string[]): ClassInfo[] {
    const classes: ClassInfo[] = [];

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i] ?? '';
      const trimmed = line.trim();

      for (const pattern of this.config.classPatterns) {
        const match = trimmed.match(pattern);
        if (match?.[1]) {
          const endLine = this.findBlockEnd(lines, i);
          const { methodCount, fieldCount } = this.countClassMembers(lines, i + 1, endLine - 1);
          classes.push({
            name: match[1],
            startLine: i + 1,
            endLine,
            methodCount,
            fieldCount,
          });
          break;
        }
      }
    }

    return classes;
  }

  /** Count methods and fields within a brace-delimited class body */
  private countClassMembers(
    lines: string[],
    startIdx: number,
    endIdx: number
  ): { methodCount: number; fieldCount: number } {
    let methodCount = 0;
    let fieldCount = 0;
    const methodPatterns = this.config.methodPatterns ?? this.config.functionPatterns;
    const fieldPatterns = this.config.fieldPatterns ?? [];

    for (let i = startIdx; i < endIdx && i < lines.length; i++) {
      const trimmed = (lines[i] ?? '').trim();
      if (trimmed === '' || this.config.commentPatterns.single.test(trimmed)) continue;

      let matched = false;
      for (const pattern of methodPatterns) {
        if (pattern.test(trimmed)) {
          methodCount++;
          matched = true;
          break;
        }
      }
      if (!matched) {
        for (const pattern of fieldPatterns) {
          if (pattern.test(trimmed)) {
            fieldCount++;
            break;
          }
        }
      }
    }

    return { methodCount, fieldCount };
  }

  /**
   * Extract functions from indent-based languages (Python).
   * Uses indentation level to determine function boundaries.
   */
  private extractFunctionsIndent(lines: string[]): FunctionInfo[] {
    const functions: FunctionInfo[] = [];

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i] ?? '';
      const trimmed = line.trim();

      for (const pattern of this.config.functionPatterns) {
        const match = trimmed.match(pattern);
        if (match?.[1]) {
          const defIndent = line.length - line.trimStart().length;
          const startLine = i + 1;
          let endLine = i + 1;
          let complexity = 1;
          let nestingDepth = 0;

          // Scan body: lines with greater indentation or blank lines within the block
          for (let j = i + 1; j < lines.length; j++) {
            const bodyLine = lines[j] ?? '';
            const bodyTrimmed = bodyLine.trim();

            if (bodyTrimmed === '') {
              endLine = j + 1;
              continue;
            }

            const bodyIndent = bodyLine.length - bodyLine.trimStart().length;
            if (bodyIndent <= defIndent) break;

            endLine = j + 1;
            complexity += this.calculateLineComplexity(bodyTrimmed);

            // Approximate nesting by indentation depth relative to function body
            const relativeIndent = Math.floor((bodyIndent - defIndent - 4) / 4);
            if (relativeIndent > nestingDepth) nestingDepth = relativeIndent;
          }

          functions.push({
            name: match[1],
            startLine,
            endLine,
            lineCount: endLine - startLine + 1,
            complexity,
            parameterCount: this.countParameters(trimmed),
            nestingDepth: Math.max(0, nestingDepth),
            hasDocstring: this.hasDocstring(lines, i),
          });
          break;
        }
      }
    }

    return functions;
  }

  /**
   * Extract classes from indent-based languages (Python).
   * Uses indentation level to determine class boundaries and count members.
   */
  private extractClassesIndent(lines: string[]): ClassInfo[] {
    const classes: ClassInfo[] = [];

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i] ?? '';
      const trimmed = line.trim();

      for (const pattern of this.config.classPatterns) {
        const match = trimmed.match(pattern);
        if (match?.[1]) {
          const classIndent = line.length - line.trimStart().length;
          const startLine = i + 1;
          let endLine = i + 1;
          let methodCount = 0;
          let fieldCount = 0;

          const methodPatterns = this.config.methodPatterns ?? [];
          const fieldPatterns = this.config.fieldPatterns ?? [];

          for (let j = i + 1; j < lines.length; j++) {
            const bodyLine = lines[j] ?? '';
            const bodyTrimmed = bodyLine.trim();

            if (bodyTrimmed === '') {
              endLine = j + 1;
              continue;
            }

            const bodyIndent = bodyLine.length - bodyLine.trimStart().length;
            if (bodyIndent <= classIndent) break;

            endLine = j + 1;

            for (const mp of methodPatterns) {
              if (mp.test(bodyTrimmed)) {
                methodCount++;
                break;
              }
            }
            for (const fp of fieldPatterns) {
              if (fp.test(bodyTrimmed)) {
                fieldCount++;
                break;
              }
            }
          }

          classes.push({
            name: match[1],
            startLine,
            endLine,
            methodCount,
            fieldCount,
          });
          break;
        }
      }
    }

    return classes;
  }

  /** Extract import statements */
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

  /** Calculate complexity contribution of a single line */
  private calculateLineComplexity(line: string): number {
    let complexity = 0;

    for (const regex of this.complexityRegexes) {
      regex.lastIndex = 0;
      const matches = line.match(regex);
      if (matches) {
        complexity += matches.length;
      }
    }

    return complexity;
  }

  /** Count parameters from a function declaration line */
  private countParameters(line: string): number {
    const match = /\(([^)]*)\)/.exec(line);
    if (!match?.[1] || match[1].trim() === '') {
      return 0;
    }
    return match[1].split(',').length;
  }

  /** Check if a function has a docstring (comment above or Python body docstring) */
  private hasDocstring(lines: string[], functionLine: number): boolean {
    // Check comment directly above the function
    if (functionLine > 0) {
      const prevLine = lines[functionLine - 1]?.trim() ?? '';
      if (
        prevLine.startsWith('/**') ||
        prevLine.startsWith('///') ||
        prevLine.startsWith('//') ||
        prevLine.startsWith('"""') ||
        prevLine.startsWith("'''") ||
        prevLine.startsWith('--[')
      ) {
        return true;
      }
    }

    // Python: check for docstring as first statement in function body
    if (this.config.indentBased && functionLine + 1 < lines.length) {
      const nextLine = lines[functionLine + 1]?.trim() ?? '';
      if (nextLine.startsWith('"""') || nextLine.startsWith("'''")) {
        return true;
      }
    }

    return false;
  }

  /** Find end of a brace-delimited block */
  private findBlockEnd(lines: string[], startLine: number): number {
    let braceCount = 0;
    let started = false;

    for (let i = startLine; i < lines.length; i++) {
      const line = lines[i] ?? '';
      let openBraces = 0;
      let closeBraces = 0;
      for (const ch of line) {
        if (ch === '{') openBraces++;
        else if (ch === '}') closeBraces++;
      }

      if (openBraces > 0) started = true;
      braceCount += openBraces - closeBraces;

      if (started && braceCount === 0) {
        return i + 1;
      }
    }

    return lines.length;
  }
}
