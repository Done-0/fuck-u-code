import { describe, it, expect } from 'vitest';
import { CodeDuplicationMetric } from '../../src/metrics/duplication/code-duplication.js';
import type { ParseResult } from '../../src/parser/types.js';

describe('CodeDuplicationMetric', () => {
  const metric = new CodeDuplicationMetric(0.20);

  const createParseResult = (content: string, functionCount: number): ParseResult => {
    const lines = content.split('\n');
    const functions = [];

    for (let i = 0; i < functionCount; i++) {
      const funcName = `func${i}`;
      let startLine = -1;
      let endLine = -1;

      for (let j = 0; j < lines.length; j++) {
        if (lines[j]?.includes(`function ${funcName}(`)) {
          startLine = j + 1;
          for (let k = j + 1; k < lines.length; k++) {
            if (lines[k]?.trim() === '}' && startLine > 0) {
              endLine = k + 1;
              break;
            }
          }
          break;
        }
      }

      if (startLine > 0 && endLine > 0) {
        functions.push({
          name: funcName,
          startLine,
          endLine,
          lineCount: endLine - startLine + 1,
          complexity: 1,
          parameterCount: 0,
          nestingDepth: 1,
          hasDocstring: false,
        });
      }
    }

    return {
      filePath: '/test/file.ts',
      language: 'typescript',
      functions,
      totalLines: lines.length,
      codeLines: Math.floor(lines.length * 0.8),
      commentLines: 0,
      blankLines: Math.floor(lines.length * 0.2),
      classes: [],
      imports: [],
      errors: [],
      content,
    };
  };

  describe('calculate', () => {
    it('should return info when less than 3 functions', () => {
      const content = `
        function func0() {
          return 1;
        }
        function func1() {
          return 2;
        }
      `;

      const result = metric.calculate(createParseResult(content, 2));

      expect(result.severity).toBe('info');
      expect(result.normalizedScore).toBe(100);
      expect(result.value).toBe(0);
    });

    it('should return info when content not available', () => {
      const parseResult = createParseResult('', 3);
      delete parseResult.content;

      const result = metric.calculate(parseResult);

      expect(result.severity).toBe('info');
      expect(result.normalizedScore).toBe(100);
    });

    it('should detect duplicate control flow patterns', () => {
      const content = `
        function func0() {
          if (x > 0) {
            for (let i = 0; i < 10; i++) {
              const a = 1;
              return i;
            }
          }
        }
        function func1() {
          const a = 1;
        }
        function func2() {
          if (y > 0) {
            for (let j = 0; j < 20; j++) {
              const b = 2;
              return j;
            }
          }
        }
      `;

      const result = metric.calculate(createParseResult(content, 3));

      expect(result.value).toBeGreaterThan(0);
      expect(result.locations).toBeDefined();
      expect(result.locations?.length).toBeGreaterThan(0);
    });

    it('should extract control flow signature correctly', () => {
      const content = `
        function func0() {
          if (x > 0) {
            for (let i = 0; i < 10; i++) {
              while (true) {
                switch (type) {
                  case 'a':
                    return 1;
                }
              }
            }
          }
          const x = 1;
        }
        function func1() {
          const y = 2;
        }
        function func2() {
          if (y > 0) {
            for (let j = 0; j < 20; j++) {
              while (false) {
                switch (kind) {
                  case 'b':
                    return 2;
                }
              }
            }
          }
          const z = 3;
        }
      `;

      const result = metric.calculate(createParseResult(content, 3));

      expect(result.locations?.length).toBeGreaterThan(0);
      expect(result.locations?.[0]?.message).toContain('Duplicate');
    });

    it('should ignore signatures shorter than MIN_SIGNATURE_LENGTH', () => {
      const content = `
        function func0() {
          return 1;
        }
        function func1() {
          return 2;
        }
        function func2() {
          return 3;
        }
      `;

      const result = metric.calculate(createParseResult(content, 3));

      // Signatures are too short (just 'R'), so no duplicates detected
      expect(result.locations).toBeUndefined();
    });

    it('should use duplicationPercent for value', () => {
      const content = `
        function func0() {
          if (x) {
            for (let i = 0; i < 10; i++) {
              const a = 1;
              const b = 2;
              return i;
            }
          }
        }
        function func1() {
          const x = 1;
        }
        function func2() {
          if (y) {
            for (let j = 0; j < 20; j++) {
              const c = 3;
              const d = 4;
              return j;
            }
          }
        }
        function func3() {
          const y = 2;
        }
      `;

      const result = metric.calculate(createParseResult(content, 4));

      // 1 duplicate out of 4 functions = 25%
      expect(result.value).toBeCloseTo(25);
    });

    it('should use non-linear scoring curve matching other metrics', () => {
      // All 3 functions have same pattern => 2 duplicates out of 3 = 66.7%
      const content = `
        function func0() {
          if (x) {
            for (let i = 0; i < 10; i++) {
              const a = 1;
              const b = 2;
              return i;
            }
          }
        }
        function func1() {
          if (y) {
            for (let j = 0; j < 20; j++) {
              const c = 3;
              const d = 4;
              return j;
            }
          }
        }
        function func2() {
          if (z) {
            for (let k = 0; k < 30; k++) {
              const e = 5;
              const f = 6;
              return k;
            }
          }
        }
      `;

      const result = metric.calculate(createParseResult(content, 3));

      // 66.7% > POOR(35%), so normalizedScore should be very low
      expect(result.normalizedScore).toBeLessThan(15);
      expect(result.severity).toBe('critical');
    });

    it('should assign info severity for duplicationPercent <= 5', () => {
      const content = `
        function func0() {
          const a = 1;
        }
        function func1() {
          const b = 2;
        }
        function func2() {
          const c = 3;
        }
      `;

      const result = metric.calculate(createParseResult(content, 3));

      expect(result.severity).toBe('info');
    });

    it('should assign warning severity for 5 < duplicationPercent <= 10', () => {
      // Need exactly 1 duplicate out of ~14 functions to get ~7%
      // Simpler: 1 dup out of 10 = 10% (at boundary)
      const funcs = [];
      for (let i = 0; i < 8; i++) {
        funcs.push(`
        function func${i}() {
          const v${i} = ${i};
        }`);
      }
      // Two functions with same pattern
      funcs.push(`
        function func8() {
          if (x) {
            for (let i = 0; i < 10; i++) {
              const a = 1;
              return i;
            }
          }
        }`);
      funcs.push(`
        function func9() {
          if (y) {
            for (let j = 0; j < 20; j++) {
              const b = 2;
              return j;
            }
          }
        }`);

      const content = funcs.join('\n');
      const result = metric.calculate(createParseResult(content, 10));

      // 1 dup out of 10 = 10%, which is at GOOD boundary
      expect(result.severity).toBe('warning');
    });

    it('should assign critical severity for duplicationPercent > 35', () => {
      const content = `
        function func0() {
          if (x) {
            for (let i = 0; i < 10; i++) {
              const a = 1;
              const b = 2;
              return i;
            }
          }
        }
        function func1() {
          if (y) {
            for (let j = 0; j < 20; j++) {
              const c = 3;
              const d = 4;
              return j;
            }
          }
        }
        function func2() {
          if (z) {
            for (let k = 0; k < 30; k++) {
              const e = 5;
              const f = 6;
              return k;
            }
          }
        }
      `;

      const result = metric.calculate(createParseResult(content, 3));

      // 2 dups out of 3 = 66.7% > POOR(35%)
      expect(result.severity).toBe('critical');
    });

    it('should detect if statements', () => {
      const content = `
        function func0() {
          if (x > 0) {
            const a = 1;
            const b = 2;
            const c = 3;
            return a;
          }
        }
        function func1() {
          const x = 1;
        }
        function func2() {
          if (y > 0) {
            const f = 6;
            const g = 7;
            const h = 8;
            return f;
          }
        }
      `;

      const result = metric.calculate(createParseResult(content, 3));

      expect(result.locations).toBeDefined();
      expect(result.locations?.length).toBeGreaterThan(0);
    });

    it('should detect for loops', () => {
      const content = `
        function func0() {
          for (let i = 0; i < 10; i++) {
            const a = 1;
            const b = 2;
            const c = 3;
          }
        }
        function func1() {
          const x = 1;
        }
        function func2() {
          for (let j = 0; j < 20; j++) {
            const f = 6;
            const g = 7;
            const h = 8;
          }
        }
      `;

      const result = metric.calculate(createParseResult(content, 3));

      expect(result.locations).toBeDefined();
      expect(result.locations?.length).toBeGreaterThan(0);
    });

    it('should detect while loops', () => {
      const content = `
        function func0() {
          while (x > 0) {
            const a = 1;
            const b = 2;
            const c = 3;
          }
        }
        function func1() {
          const x = 1;
        }
        function func2() {
          while (y > 0) {
            const f = 6;
            const g = 7;
            const h = 8;
          }
        }
      `;

      const result = metric.calculate(createParseResult(content, 3));

      expect(result.locations).toBeDefined();
      expect(result.locations?.length).toBeGreaterThan(0);
    });

    it('should detect switch-case patterns', () => {
      const content = `
        function func0() {
          switch (type) {
            case 'a':
              const a = 1;
              const b = 2;
              return a;
          }
        }
        function func1() {
          const x = 1;
        }
        function func2() {
          switch (kind) {
            case 'b':
              const c = 3;
              const d = 4;
              return c;
          }
        }
      `;

      const result = metric.calculate(createParseResult(content, 3));

      expect(result.locations).toBeDefined();
      expect(result.locations?.length).toBeGreaterThan(0);
    });

    it('should detect assignment patterns', () => {
      const content = `
        function func0() {
          const a = 1;
          const b = 2;
          const c = 3;
          const d = 4;
        }
        function func1() {
          const x = 1;
        }
        function func2() {
          const g = 7;
          const h = 8;
          const i = 9;
          const j = 10;
        }
      `;

      const result = metric.calculate(createParseResult(content, 3));

      expect(result.locations).toBeDefined();
      expect(result.locations?.length).toBeGreaterThan(0);
    });

    it('should not treat comparison operators as assignments', () => {
      const content = `
        function func0() {
          if (x == 1) {
            const a = 1;
          }
          if (y === 2) {
            const b = 2;
          }
        }
        function func1() {
          const x = 1;
        }
        function func2() {
          if (z != 3) {
            const c = 3;
          }
          if (w !== 4) {
            const d = 4;
          }
        }
      `;

      const result = metric.calculate(createParseResult(content, 3));

      expect(result).toBeDefined();
    });

    it('should handle empty lines', () => {
      const content = `
        function func0() {

          if (x) {

            return 1;

          }

        }
        function func1() {
          const x = 1;
        }
        function func2() {

          if (y) {

            return 2;

          }

        }
      `;

      const result = metric.calculate(createParseResult(content, 3));

      expect(result).toBeDefined();
    });

    it('should handle malformed code', () => {
      const content = `
        function func0() {
          if (x {
        }
        function func1() {
          const x = 1;
        }
        function func2() {
          if (y {
        }
      `;

      const result = metric.calculate(createParseResult(content, 3));

      expect(result).toBeDefined();
      expect(result.value).toBeGreaterThanOrEqual(0);
    });

    it('should use Math.round(x * 10) / 10 for normalizedScore', () => {
      const content = `
        function func0() {
          if (x) {
            for (let i = 0; i < 10; i++) {
              const a = 1;
              return i;
            }
          }
        }
        function func1() {
          if (y) {
            for (let j = 0; j < 20; j++) {
              const b = 2;
              return j;
            }
          }
        }
        function func2() {
          const z = 3;
        }
      `;

      const result = metric.calculate(createParseResult(content, 3));

      const scoreStr = String(result.normalizedScore);
      const decimalPart = scoreStr.split('.')[1];
      expect(!decimalPart || decimalPart.length <= 1).toBe(true);
    });

    it('should normalizedScore be between 0 and 100', () => {
      const content = `
        function func0() {
          if (x) {
            for (let i = 0; i < 10; i++) {
              const a = 1;
              const b = 2;
              return i;
            }
          }
        }
        function func1() {
          if (y) {
            for (let j = 0; j < 20; j++) {
              const c = 3;
              const d = 4;
              return j;
            }
          }
        }
        function func2() {
          if (z) {
            for (let k = 0; k < 30; k++) {
              const e = 5;
              const f = 6;
              return k;
            }
          }
        }
      `;

      const result = metric.calculate(createParseResult(content, 3));

      expect(result.normalizedScore).toBeGreaterThanOrEqual(0);
      expect(result.normalizedScore).toBeLessThanOrEqual(100);
    });
  });
});
