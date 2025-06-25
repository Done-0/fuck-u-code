/**
 * Parser type definitions
 */

/** Supported programming languages */
export type Language =
  | 'go'
  | 'javascript'
  | 'typescript'
  | 'python'
  | 'java'
  | 'c'
  | 'cpp'
  | 'rust'
  | 'csharp'
  | 'lua'
  | 'unknown';

/** Function information */
export interface FunctionInfo {
  name: string;
  startLine: number;
  endLine: number;
  lineCount: number;
  complexity: number;
  parameterCount: number;
  nestingDepth: number;
  hasDocstring: boolean;
}

/** Class/struct information */
export interface ClassInfo {
  name: string;
  startLine: number;
  endLine: number;
  methodCount: number;
  fieldCount: number;
}

/** Parse result */
export interface ParseResult {
  filePath: string;
  language: Language;
  totalLines: number;
  codeLines: number;
  commentLines: number;
  blankLines: number;
  functions: FunctionInfo[];
  classes: ClassInfo[];
  imports: string[];
  errors: string[];
  content?: string;
}

/** Parser interface */
export interface Parser {
  parse(filePath: string, content: string): ParseResult | Promise<ParseResult>;
  supportedLanguages(): Language[];
}

/** Language display names for CLI output */
export const LANGUAGE_DISPLAY_NAMES: Record<Exclude<Language, 'unknown'>, string> = {
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
};

/** File extension to language mapping */
export const EXTENSION_LANGUAGE_MAP: Record<string, Language> = {
  '.go': 'go',
  '.js': 'javascript',
  '.mjs': 'javascript',
  '.cjs': 'javascript',
  '.jsx': 'javascript',
  '.ts': 'typescript',
  '.mts': 'typescript',
  '.cts': 'typescript',
  '.tsx': 'typescript',
  '.py': 'python',
  '.pyw': 'python',
  '.java': 'java',
  '.c': 'c',
  '.h': 'c',
  '.cpp': 'cpp',
  '.cc': 'cpp',
  '.cxx': 'cpp',
  '.hpp': 'cpp',
  '.hxx': 'cpp',
  '.rs': 'rust',
  '.cs': 'csharp',
  '.lua': 'lua',
};

/**
 * Detect language from file extension
 */
export function detectLanguage(filePath: string): Language {
  const ext = filePath.slice(filePath.lastIndexOf('.')).toLowerCase();
  return EXTENSION_LANGUAGE_MAP[ext] ?? 'unknown';
}
