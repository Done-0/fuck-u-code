/**
 * Language-specific thresholds test
 */

import { describe, it, expect } from 'vitest';
import { getThresholds, LANGUAGE_THRESHOLDS } from '../../dist/metrics/thresholds/language-thresholds.js';
import type { Language } from '../../dist/parser/types.js';

describe('Language-specific thresholds', () => {
  const languages: Exclude<Language, 'unknown'>[] = [
    'go',
    'javascript',
    'typescript',
    'python',
    'java',
    'c',
    'cpp',
    'rust',
    'csharp',
    'lua',
    'php',
    'ruby',
    'swift',
    'shell',
  ];

  it('should have thresholds for all supported languages', () => {
    languages.forEach((lang) => {
      expect(LANGUAGE_THRESHOLDS[lang]).toBeDefined();
      expect(LANGUAGE_THRESHOLDS[lang].cyclomaticComplexity).toBeDefined();
      expect(LANGUAGE_THRESHOLDS[lang].cognitiveComplexity).toBeDefined();
      expect(LANGUAGE_THRESHOLDS[lang].functionLength).toBeDefined();
      expect(LANGUAGE_THRESHOLDS[lang].fileLength).toBeDefined();
      expect(LANGUAGE_THRESHOLDS[lang].parameterCount).toBeDefined();
      expect(LANGUAGE_THRESHOLDS[lang].nestingDepth).toBeDefined();
    });
  });

  it('should have valid threshold values (excellent < good < acceptable < poor)', () => {
    languages.forEach((lang) => {
      const thresholds = LANGUAGE_THRESHOLDS[lang];
      Object.entries(thresholds).forEach(([_metric, config]) => {
        expect(config.excellent).toBeLessThan(config.good);
        expect(config.good).toBeLessThan(config.acceptable);
        expect(config.acceptable).toBeLessThan(config.poor);
      });
    });
  });

  it('should return language-specific thresholds via getThresholds', () => {
    const goComplexity = getThresholds('go', 'cyclomaticComplexity');
    const pythonComplexity = getThresholds('python', 'cyclomaticComplexity');

    expect(goComplexity).toEqual(LANGUAGE_THRESHOLDS.go.cyclomaticComplexity);
    expect(pythonComplexity).toEqual(LANGUAGE_THRESHOLDS.python.cyclomaticComplexity);
  });

  it('should use JavaScript thresholds as fallback for unknown language', () => {
    const unknownThresholds = getThresholds('unknown', 'cyclomaticComplexity');
    const jsThresholds = LANGUAGE_THRESHOLDS.javascript.cyclomaticComplexity;

    expect(unknownThresholds).toEqual(jsThresholds);
  });

  it('should have different thresholds for different languages', () => {
    // Go has stricter cyclomatic complexity than JavaScript
    const goComplexity = LANGUAGE_THRESHOLDS.go.cyclomaticComplexity;
    const jsComplexity = LANGUAGE_THRESHOLDS.javascript.cyclomaticComplexity;

    expect(goComplexity.acceptable).toBeLessThanOrEqual(jsComplexity.acceptable);
  });

  it('should have Python-specific thresholds matching Pylint defaults', () => {
    const pythonComplexity = LANGUAGE_THRESHOLDS.python.cyclomaticComplexity;
    const pythonParams = LANGUAGE_THRESHOLDS.python.parameterCount;
    const pythonNesting = LANGUAGE_THRESHOLDS.python.nestingDepth;

    // Pylint defaults: max-complexity=10, max-args=5, max-nested-blocks=5
    expect(pythonComplexity.good).toBe(10);
    expect(pythonParams.good).toBe(5);
    expect(pythonNesting.good).toBe(5);
  });

  it('should have C-specific thresholds with strict nesting (Linux Kernel style)', () => {
    const cNesting = LANGUAGE_THRESHOLDS.c.nestingDepth;

    // Linux Kernel Coding Style: max 3 levels of indentation
    expect(cNesting.excellent).toBe(3);
  });

  it('should have Rust-specific thresholds matching Clippy defaults', () => {
    const rustComplexity = LANGUAGE_THRESHOLDS.rust.cognitiveComplexity;
    const rustParams = LANGUAGE_THRESHOLDS.rust.parameterCount;

    // Clippy: cognitive_complexity=25, too_many_arguments=7
    expect(rustComplexity.acceptable).toBe(25);
    expect(rustParams.acceptable).toBe(7);
  });

  it('should have TypeScript using same thresholds as JavaScript', () => {
    expect(LANGUAGE_THRESHOLDS.typescript).toBe(LANGUAGE_THRESHOLDS.javascript);
  });
});
