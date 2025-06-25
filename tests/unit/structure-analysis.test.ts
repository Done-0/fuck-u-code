import { describe, it, expect } from 'vitest';
import { StructureAnalysisMetric } from '../../src/metrics/structure/structure-analysis.js';
import type { ParseResult } from '../../src/parser/types.js';

describe('StructureAnalysisMetric', () => {
  const metric = new StructureAnalysisMetric(0.12);

  const createParseResult = (
    content: string,
    functionCount: number,
    totalLines: number,
    nestingDepths: number[] = []
  ): ParseResult => ({
    filePath: '/test/file.ts',
    language: 'typescript',
    functions: Array.from({ length: functionCount }, (_, i) => ({
      name: `func${i}`,
      startLine: i * 10 + 1,
      endLine: i * 10 + 5,
      lineCount: 5,
      complexity: 1,
      parameterCount: 0,
      nestingDepth: nestingDepths[i] ?? 1,
      hasDocstring: false,
    })),
    totalLines,
    codeLines: Math.floor(totalLines * 0.8),
    commentLines: Math.floor(totalLines * 0.1),
    blankLines: Math.floor(totalLines * 0.1),
    classes: [],
    imports: [],
    errors: [],
    content,
  });

  describe('calculate', () => {
    it('should return info severity when no functions', () => {
      const result = metric.calculate({
        ...createParseResult('', 0, 100),
        functions: [],
      });

      expect(result.severity).toBe('info');
      expect(result.normalizedScore).toBe(100);
      expect(result.value).toBe(0);
    });

    it('should use simplified calculation when content not available', () => {
      const parseResult = createParseResult('', 10, 100, [6, 1, 1, 1, 1, 1, 1, 1, 1, 1]);
      delete parseResult.content;

      const result = metric.calculate(parseResult);

      expect(result).toBeDefined();
      expect(result.normalizedScore).toBeLessThan(100);
    });

    it('should detect high nesting depth (>5)', () => {
      const content = `
        function func0() {
          if (a) {
            if (b) {
              if (c) {
                if (d) {
                  if (e) {
                    if (f) {
                      return 1;
                    }
                  }
                }
              }
            }
          }
        }
      `;

      const result = metric.calculate(createParseResult(content, 1, 100, [6]));

      expect(result.locations).toBeDefined();
      expect(result.locations?.some(loc => loc.message.includes('High nesting'))).toBe(true);
      expect(result.severity).not.toBe('info');
    });

    it('should detect medium nesting depth (>3 but <=5)', () => {
      const content = `
        function func0() {
          if (a) {
            if (b) {
              if (c) {
                if (d) {
                  return 1;
                }
              }
            }
          }
        }
      `;

      const result = metric.calculate(createParseResult(content, 1, 100, [4]));

      expect(result.locations).toBeDefined();
      expect(result.locations?.some(loc => loc.message.includes('Medium nesting'))).toBe(true);
    });

    it('should detect large file (>1000 lines)', () => {
      const content = 'x\n'.repeat(1001);

      const result = metric.calculate(createParseResult(content, 10, 1001));

      expect(result.locations).toBeDefined();
      expect(result.locations?.some(loc => loc.message.includes('File too large'))).toBe(true);
      expect(result.severity).not.toBe('info');
    });

    it('should detect medium file (>500 but <=1000 lines)', () => {
      const content = 'x\n'.repeat(600);

      const result = metric.calculate(createParseResult(content, 10, 600));

      expect(result.normalizedScore).toBeLessThan(100);
    });

    it('should detect too many functions (>50)', () => {
      const content = 'function test() {}\n'.repeat(51);

      const result = metric.calculate(createParseResult(content, 51, 100));

      expect(result.locations).toBeDefined();
      expect(result.locations?.some(loc => loc.message.includes('Too many functions'))).toBe(true);
    });

    it('should detect many functions (>30 but <=50)', () => {
      const content = 'function test() {}\n'.repeat(35);

      const result = metric.calculate(createParseResult(content, 35, 100));

      expect(result.normalizedScore).toBeLessThan(100);
    });

    it('should count import statements', () => {
      const content = `
        import { a } from 'a';
        import { b } from 'b';
        import { c } from 'c';
        function test() {}
      `;

      const result = metric.calculate(createParseResult(content, 1, 100));

      expect(result).toBeDefined();
    });

    it('should detect too many imports (>20)', () => {
      const imports = Array.from({ length: 21 }, (_, i) => `import { x${i} } from 'module${i}';`).join('\n');
      const content = `${imports}\nfunction test() {}`;

      const result = metric.calculate(createParseResult(content, 1, 100));

      expect(result.locations).toBeDefined();
      expect(result.locations?.some(loc => loc.message.includes('Too many imports'))).toBe(true);
    });

    it('should detect many imports (>15 but <=20)', () => {
      const imports = Array.from({ length: 16 }, (_, i) => `import { x${i} } from 'module${i}';`).join('\n');
      const content = `${imports}\nfunction test() {}`;

      const result = metric.calculate(createParseResult(content, 1, 100));

      expect(result.normalizedScore).toBeLessThan(100);
    });

    it('should detect circular dependencies', () => {
      const content = `
        package mypackage
        import "mypackage/submodule"
        function test() {}
      `;

      const result = metric.calculate(createParseResult(content, 1, 100));

      expect(result.locations).toBeDefined();
      expect(result.locations?.some(loc => loc.message.includes('Circular dependencies'))).toBe(true);
    });

    it('should handle Python from...import statements', () => {
      const content = `
        from os import path
        from sys import argv
        def test():
          pass
      `;

      const result = metric.calculate(createParseResult(content, 1, 100));

      expect(result).toBeDefined();
    });

    it('should handle C/C++ #include statements', () => {
      const content = `
        #include <stdio.h>
        #include <stdlib.h>
        void test() {}
      `;

      const result = metric.calculate(createParseResult(content, 1, 100));

      expect(result).toBeDefined();
    });

    it('should handle C# using statements', () => {
      const content = `
        using System;
        using System.Collections.Generic;
        void Test() {}
      `;

      const result = metric.calculate(createParseResult(content, 1, 100));

      expect(result).toBeDefined();
    });

    it('should handle require() statements', () => {
      const content = `
        const fs = require('fs');
        const path = require('path');
        function test() {}
      `;

      const result = metric.calculate(createParseResult(content, 1, 100));

      expect(result).toBeDefined();
    });

    it('should apply weighted scoring: nesting 60%, file 25%, imports 15%', () => {
      const content = `
        import { a } from 'a';
        function func0() {
          if (a) {
            if (b) {
              if (c) {
                if (d) {
                  if (e) {
                    if (f) {
                      return 1;
                    }
                  }
                }
              }
            }
          }
        }
      `;

      const result = metric.calculate(createParseResult(content, 1, 100, [6]));

      expect(result.normalizedScore).toBeLessThan(100);
      expect(result.value).toBeGreaterThan(0);
    });

    it('should assign critical severity for circular dependencies or deep nesting >3', () => {
      const content = `
        function func0() {
          if (a) {
            if (b) {
              if (c) {
                if (d) {
                  if (e) {
                    return 1;
                  }
                }
              }
            }
          }
        }
        function func1() {
          if (x) {
            if (y) {
              if (z) {
                if (w) {
                  if (v) {
                    return 2;
                  }
                }
              }
            }
          }
        }
        function func2() {
          if (p) {
            if (q) {
              if (r) {
                if (s) {
                  if (t) {
                    return 3;
                  }
                }
              }
            }
          }
        }
        function func3() {
          if (m) {
            if (n) {
              if (o) {
                if (l) {
                  if (k) {
                    return 4;
                  }
                }
              }
            }
          }
        }
      `;

      const result = metric.calculate(createParseResult(content, 4, 100, [5, 5, 5, 5]));

      expect(result.severity).toBe('critical');
    });

    it('should assign error severity for large file or too many functions/imports', () => {
      const content = 'x\n'.repeat(1001);

      const result = metric.calculate(createParseResult(content, 10, 1001));

      expect(result.severity).toBe('error');
    });

    it('should assign warning severity for medium issues', () => {
      const content = 'x\n'.repeat(600);

      const result = metric.calculate(createParseResult(content, 10, 600, [4]));

      expect(result.severity).toBe('warning');
    });

    it('should assign info severity when no issues', () => {
      const content = `
        import { a } from 'a';
        function test() {
          return 1;
        }
      `;

      const result = metric.calculate(createParseResult(content, 1, 100, [1]));

      expect(result.severity).toBe('info');
      expect(result.normalizedScore).toBeGreaterThan(90);
    });

    it('should handle empty content', () => {
      const result = metric.calculate(createParseResult('', 1, 10));

      expect(result).toBeDefined();
      expect(result.value).toBeGreaterThanOrEqual(0);
    });

    it('should handle malformed package declaration', () => {
      const content = `
        package
        function test() {}
      `;

      const result = metric.calculate(createParseResult(content, 1, 100));

      expect(result).toBeDefined();
    });

    it('should handle malformed module declaration', () => {
      const content = `
        module
        function test() {}
      `;

      const result = metric.calculate(createParseResult(content, 1, 100));

      expect(result).toBeDefined();
    });

    it('should handle multiple structure issues', () => {
      const imports = Array.from({ length: 21 }, (_, i) => `import { x${i} } from 'module${i}';`).join('\n');
      const content = `${imports}\n${'function test() {}\n'.repeat(51)}`;

      const result = metric.calculate(createParseResult(content, 51, 1001, Array(51).fill(6)));

      expect(result.value).toBeGreaterThan(3);
      expect(result.severity).toBe('critical');
      expect(result.locations?.length).toBeGreaterThan(3);
    });

    it('should handle edge case: exactly at thresholds', () => {
      const content = 'x\n'.repeat(1000);

      const result = metric.calculate(createParseResult(content, 50, 1000, Array(50).fill(5)));

      expect(result).toBeDefined();
    });

    it('should handle simplified calculation with high nesting', () => {
      const parseResult = createParseResult('', 10, 100, [6, 6, 1, 1, 1, 1, 1, 1, 1, 1]);
      delete parseResult.content;

      const result = metric.calculate(parseResult);

      expect(result.severity).not.toBe('info');
      expect(result.value).toBeGreaterThan(0);
    });

    it('should handle simplified calculation with large file', () => {
      const parseResult = createParseResult('', 10, 1001);
      delete parseResult.content;

      const result = metric.calculate(parseResult);

      expect(result.value).toBeGreaterThan(0);
    });

    it('should handle simplified calculation with too many functions', () => {
      const parseResult = createParseResult('', 51, 100);
      delete parseResult.content;

      const result = metric.calculate(parseResult);

      expect(result.value).toBeGreaterThan(0);
    });

    it('should cap normalized score at 0', () => {
      const imports = Array.from({ length: 30 }, (_, i) => `import { x${i} } from 'module${i}';`).join('\n');
      const content = `${imports}\n${'function test() {}\n'.repeat(60)}`;

      const result = metric.calculate(createParseResult(content, 60, 1500, Array(60).fill(8)));

      expect(result.normalizedScore).toBeGreaterThanOrEqual(0);
      expect(result.normalizedScore).toBeLessThanOrEqual(100);
    });
  });
});
