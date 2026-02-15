/**
 * Language-specific code quality thresholds
 *
 * All thresholds are based on official linter defaults and industry standards.
 * Sources are documented for each language.
 */

import type { Language } from '../../parser/types.js';

export interface ThresholdConfig {
  excellent: number;
  good: number;
  acceptable: number;
  poor: number;
}

export interface LanguageThresholds {
  cyclomaticComplexity: ThresholdConfig;
  cognitiveComplexity: ThresholdConfig;
  functionLength: ThresholdConfig;
  fileLength: ThresholdConfig;
  parameterCount: ThresholdConfig;
  nestingDepth: ThresholdConfig;
}

/**
 * Go language thresholds
 * Sources:
 * - gocyclo: default threshold 10 (https://github.com/fzipp/gocyclo)
 * - gocognit: default threshold 15 (https://github.com/uudashr/gocognit)
 * - Effective Go: recommends short functions (https://go.dev/doc/effective_go)
 * - staticcheck: no specific line limits, focuses on complexity
 */
const GO_THRESHOLDS: LanguageThresholds = {
  cyclomaticComplexity: { excellent: 5, good: 10, acceptable: 15, poor: 20 },
  cognitiveComplexity: { excellent: 7, good: 15, acceptable: 25, poor: 35 },
  functionLength: { excellent: 50, good: 100, acceptable: 200, poor: 300 },
  fileLength: { excellent: 300, good: 500, acceptable: 1000, poor: 1500 },
  parameterCount: { excellent: 3, good: 5, acceptable: 7, poor: 10 },
  nestingDepth: { excellent: 3, good: 4, acceptable: 5, poor: 7 },
};

/**
 * JavaScript/TypeScript thresholds
 * Sources:
 * - ESLint complexity rule: default 20 (https://eslint.org/docs/latest/rules/complexity)
 * - ESLint max-params: commonly set to 3-4
 * - ESLint max-depth: commonly set to 4
 * - ESLint max-lines-per-function: no default, 50-100 common
 * - @typescript-eslint follows same conventions
 */
const JAVASCRIPT_THRESHOLDS: LanguageThresholds = {
  cyclomaticComplexity: { excellent: 5, good: 10, acceptable: 20, poor: 30 },
  cognitiveComplexity: { excellent: 8, good: 15, acceptable: 25, poor: 40 },
  functionLength: { excellent: 50, good: 100, acceptable: 200, poor: 300 },
  fileLength: { excellent: 250, good: 400, acceptable: 800, poor: 1200 },
  parameterCount: { excellent: 3, good: 4, acceptable: 6, poor: 8 },
  nestingDepth: { excellent: 3, good: 4, acceptable: 5, poor: 7 },
};

/**
 * Python thresholds
 * Sources:
 * - Pylint max-complexity: default 10 (https://pylint.readthedocs.io/)
 * - Pylint max-args: default 5
 * - Pylint max-nested-blocks: default 5
 * - Pylint max-statements: default 50
 * - Pylint max-module-lines: default 1000
 * - McCabe complexity: threshold 10 (original paper recommendation)
 */
const PYTHON_THRESHOLDS: LanguageThresholds = {
  cyclomaticComplexity: { excellent: 5, good: 10, acceptable: 15, poor: 20 },
  cognitiveComplexity: { excellent: 7, good: 12, acceptable: 20, poor: 30 },
  functionLength: { excellent: 30, good: 50, acceptable: 100, poor: 150 },
  fileLength: { excellent: 300, good: 500, acceptable: 1000, poor: 1500 },
  parameterCount: { excellent: 3, good: 5, acceptable: 7, poor: 10 },
  nestingDepth: { excellent: 3, good: 5, acceptable: 7, poor: 10 },
};

/**
 * Java thresholds
 * Sources:
 * - SonarQube Java: complexity threshold 10 (https://rules.sonarsource.com/java/)
 * - Google Java Style: no hard limits, recommends short methods
 * - Checkstyle MethodLength: default 150 lines
 * - Checkstyle ParameterNumber: default 7
 * - PMD CyclomaticComplexity: default 10
 */
const JAVA_THRESHOLDS: LanguageThresholds = {
  cyclomaticComplexity: { excellent: 5, good: 10, acceptable: 15, poor: 20 },
  cognitiveComplexity: { excellent: 8, good: 15, acceptable: 25, poor: 35 },
  functionLength: { excellent: 50, good: 100, acceptable: 150, poor: 250 },
  fileLength: { excellent: 300, good: 500, acceptable: 1000, poor: 1500 },
  parameterCount: { excellent: 3, good: 5, acceptable: 7, poor: 10 },
  nestingDepth: { excellent: 3, good: 4, acceptable: 5, poor: 7 },
};

/**
 * C thresholds
 * Sources:
 * - Linux Kernel Coding Style: max 3 levels of indentation
 * - Linux Kernel: functions should fit on 1-2 screens (24-48 lines)
 * - cppcheck: no default complexity threshold
 * - SonarQube C: complexity threshold 10
 */
const C_THRESHOLDS: LanguageThresholds = {
  cyclomaticComplexity: { excellent: 5, good: 10, acceptable: 15, poor: 20 },
  cognitiveComplexity: { excellent: 7, good: 12, acceptable: 20, poor: 30 },
  functionLength: { excellent: 40, good: 80, acceptable: 150, poor: 250 },
  fileLength: { excellent: 300, good: 500, acceptable: 1000, poor: 1500 },
  parameterCount: { excellent: 3, good: 5, acceptable: 7, poor: 10 },
  nestingDepth: { excellent: 3, good: 4, acceptable: 5, poor: 7 },
};

/**
 * C++ thresholds
 * Sources:
 * - Google C++ Style Guide: no hard limits on function length
 * - LLVM Coding Standards: prefer small focused functions
 * - clang-tidy readability-function-cognitive-complexity: default 25
 * - SonarQube C++: complexity threshold 10
 */
const CPP_THRESHOLDS: LanguageThresholds = {
  cyclomaticComplexity: { excellent: 5, good: 10, acceptable: 15, poor: 20 },
  cognitiveComplexity: { excellent: 8, good: 15, acceptable: 25, poor: 35 },
  functionLength: { excellent: 50, good: 100, acceptable: 200, poor: 300 },
  fileLength: { excellent: 300, good: 500, acceptable: 1000, poor: 1500 },
  parameterCount: { excellent: 3, good: 5, acceptable: 7, poor: 10 },
  nestingDepth: { excellent: 3, good: 4, acceptable: 5, poor: 7 },
};

/**
 * Rust thresholds
 * Sources:
 * - Clippy cognitive_complexity: default 25 (https://rust-lang.github.io/rust-clippy/)
 * - Clippy too_many_arguments: default 7
 * - Clippy too_many_lines: default 100
 * - Rust API Guidelines: prefer small focused functions
 */
const RUST_THRESHOLDS: LanguageThresholds = {
  cyclomaticComplexity: { excellent: 5, good: 10, acceptable: 15, poor: 20 },
  cognitiveComplexity: { excellent: 8, good: 15, acceptable: 25, poor: 35 },
  functionLength: { excellent: 50, good: 100, acceptable: 200, poor: 300 },
  fileLength: { excellent: 300, good: 500, acceptable: 1000, poor: 1500 },
  parameterCount: { excellent: 3, good: 5, acceptable: 7, poor: 10 },
  nestingDepth: { excellent: 3, good: 4, acceptable: 5, poor: 7 },
};

/**
 * C# thresholds
 * Sources:
 * - SonarQube C#: complexity threshold 10 (https://rules.sonarsource.com/csharp/)
 * - Microsoft C# conventions: no hard limits specified
 * - StyleCop SA1407: arithmetic expressions should declare precedence
 * - Roslyn analyzers: follow similar patterns to Java
 */
const CSHARP_THRESHOLDS: LanguageThresholds = {
  cyclomaticComplexity: { excellent: 5, good: 10, acceptable: 15, poor: 20 },
  cognitiveComplexity: { excellent: 8, good: 15, acceptable: 25, poor: 35 },
  functionLength: { excellent: 50, good: 100, acceptable: 200, poor: 300 },
  fileLength: { excellent: 300, good: 500, acceptable: 1000, poor: 1500 },
  parameterCount: { excellent: 3, good: 5, acceptable: 7, poor: 10 },
  nestingDepth: { excellent: 3, good: 4, acceptable: 5, poor: 7 },
};

/**
 * Lua thresholds
 * Sources:
 * - luacheck: no default complexity threshold (https://luacheck.readthedocs.io/)
 * - luacheck max_line_length: default 120
 * - luacheck max_code_line_length: default 120
 * - Using SonarQube defaults as fallback (no official Lua linter with complexity metrics)
 */
const LUA_THRESHOLDS: LanguageThresholds = {
  cyclomaticComplexity: { excellent: 5, good: 10, acceptable: 15, poor: 20 },
  cognitiveComplexity: { excellent: 8, good: 15, acceptable: 25, poor: 35 },
  functionLength: { excellent: 50, good: 100, acceptable: 200, poor: 300 },
  fileLength: { excellent: 300, good: 500, acceptable: 1000, poor: 1500 },
  parameterCount: { excellent: 3, good: 5, acceptable: 7, poor: 10 },
  nestingDepth: { excellent: 3, good: 4, acceptable: 5, poor: 7 },
};

/**
 * PHP thresholds
 * Sources:
 * - PHP_CodeSniffer: complexity threshold 10
 * - PHPMD (PHP Mess Detector): cyclomatic complexity 10, NPath complexity 200
 * - PSR-12: no specific complexity limits
 * - SonarQube PHP: complexity threshold 10
 */
const PHP_THRESHOLDS: LanguageThresholds = {
  cyclomaticComplexity: { excellent: 5, good: 10, acceptable: 15, poor: 20 },
  cognitiveComplexity: { excellent: 8, good: 15, acceptable: 25, poor: 35 },
  functionLength: { excellent: 50, good: 100, acceptable: 200, poor: 300 },
  fileLength: { excellent: 300, good: 500, acceptable: 1000, poor: 1500 },
  parameterCount: { excellent: 3, good: 5, acceptable: 7, poor: 10 },
  nestingDepth: { excellent: 3, good: 5, acceptable: 7, poor: 10 },
};

/**
 * Ruby thresholds
 * Sources:
 * - RuboCop Metrics/CyclomaticComplexity: default 7
 * - RuboCop Metrics/PerceivedComplexity: default 8
 * - RuboCop Metrics/MethodLength: default 10 lines
 * - Ruby Style Guide: prefer short methods
 */
const RUBY_THRESHOLDS: LanguageThresholds = {
  cyclomaticComplexity: { excellent: 4, good: 7, acceptable: 12, poor: 18 },
  cognitiveComplexity: { excellent: 5, good: 8, acceptable: 15, poor: 25 },
  functionLength: { excellent: 20, good: 50, acceptable: 100, poor: 200 },
  fileLength: { excellent: 250, good: 400, acceptable: 800, poor: 1200 },
  parameterCount: { excellent: 3, good: 4, acceptable: 6, poor: 8 },
  nestingDepth: { excellent: 3, good: 4, acceptable: 5, poor: 7 },
};

/**
 * Swift thresholds
 * Sources:
 * - SwiftLint cyclomatic_complexity: warning 10, error 20
 * - SwiftLint function_body_length: warning 40, error 100
 * - SwiftLint type_body_length: warning 200, error 350
 * - Apple Swift API Design Guidelines: prefer clarity
 */
const SWIFT_THRESHOLDS: LanguageThresholds = {
  cyclomaticComplexity: { excellent: 5, good: 10, acceptable: 20, poor: 30 },
  cognitiveComplexity: { excellent: 7, good: 12, acceptable: 20, poor: 30 },
  functionLength: { excellent: 30, good: 40, acceptable: 100, poor: 150 },
  fileLength: { excellent: 200, good: 350, acceptable: 600, poor: 1000 },
  parameterCount: { excellent: 3, good: 5, acceptable: 7, poor: 10 },
  nestingDepth: { excellent: 3, good: 4, acceptable: 5, poor: 7 },
};

/**
 * Shell thresholds
 * Sources:
 * - ShellCheck: no complexity metrics
 * - Google Shell Style Guide: functions should be short
 * - Using conservative thresholds due to shell script complexity
 */
const SHELL_THRESHOLDS: LanguageThresholds = {
  cyclomaticComplexity: { excellent: 5, good: 10, acceptable: 15, poor: 20 },
  cognitiveComplexity: { excellent: 7, good: 12, acceptable: 20, poor: 30 },
  functionLength: { excellent: 30, good: 50, acceptable: 100, poor: 150 },
  fileLength: { excellent: 200, good: 300, acceptable: 600, poor: 1000 },
  parameterCount: { excellent: 3, good: 5, acceptable: 7, poor: 10 },
  nestingDepth: { excellent: 3, good: 4, acceptable: 5, poor: 7 },
};

/**
 * Language-specific thresholds map
 */
export const LANGUAGE_THRESHOLDS: Record<Exclude<Language, 'unknown'>, LanguageThresholds> = {
  go: GO_THRESHOLDS,
  javascript: JAVASCRIPT_THRESHOLDS,
  typescript: JAVASCRIPT_THRESHOLDS, // TypeScript follows JavaScript conventions
  python: PYTHON_THRESHOLDS,
  java: JAVA_THRESHOLDS,
  c: C_THRESHOLDS,
  cpp: CPP_THRESHOLDS,
  rust: RUST_THRESHOLDS,
  csharp: CSHARP_THRESHOLDS,
  lua: LUA_THRESHOLDS,
  php: PHP_THRESHOLDS,
  ruby: RUBY_THRESHOLDS,
  swift: SWIFT_THRESHOLDS,
  shell: SHELL_THRESHOLDS,
};

/**
 * Get thresholds for a specific language and metric
 */
export function getThresholds(
  language: Language,
  metric: keyof LanguageThresholds
): ThresholdConfig {
  if (language === 'unknown') {
    // Fallback to JavaScript thresholds for unknown languages
    return JAVASCRIPT_THRESHOLDS[metric];
  }
  return LANGUAGE_THRESHOLDS[language][metric];
}
