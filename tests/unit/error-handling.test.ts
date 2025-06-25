import { describe, it, expect } from 'vitest';
import { ErrorHandlingMetric } from '../../src/metrics/error/error-handling.js';
import type { ParseResult } from '../../src/parser/types.js';

describe('ErrorHandlingMetric', () => {
  const metric = new ErrorHandlingMetric(0.08);

  const createParseResult = (content: string, functionCount: number = 1): ParseResult => ({
    filePath: '/test/file.ts',
    language: 'typescript',
    functions: Array.from({ length: functionCount }, (_, i) => ({
      name: `func${i}`,
      startLine: i * 10 + 1,
      endLine: i * 10 + 5,
      lineCount: 5,
      complexity: 1,
      parameterCount: 0,
      nestingDepth: 1,
      hasDocstring: false,
    })),
    totalLines: 100,
    codeLines: 80,
    commentLines: 10,
    blankLines: 10,
    classes: [],
    imports: [],
    errors: [],
    content,
  });

  describe('calculate', () => {
    it('should return info when no functions', () => {
      const result = metric.calculate({
        ...createParseResult('', 0),
        functions: [],
      });

      expect(result.severity).toBe('info');
      expect(result.normalizedScore).toBe(100);
    });

    it('should return info when content not available', () => {
      const parseResult = createParseResult('', 1);
      delete parseResult.content;

      const result = metric.calculate(parseResult);

      expect(result.severity).toBe('info');
      expect(result.normalizedScore).toBe(100);
    });

    it('should return info when no error-prone calls detected', () => {
      const content = `
        function test() {
          const x = 1;
          return x + 1;
        }
      `;

      const result = metric.calculate(createParseResult(content));

      expect(result.severity).toBe('info');
      expect(result.normalizedScore).toBe(100);
      expect(result.value).toBe(0);
    });

    it('should detect ignored error with underscore assignment', () => {
      const content = `
        function test() {
          _ = readFile('test.txt');
        }
      `;

      const result = metric.calculate(createParseResult(content));

      expect(result.value).toBeGreaterThan(0);
      expect(result.locations).toBeDefined();
      expect(result.locations?.length).toBe(1);
      expect(result.locations?.[0]?.message).toBe('Ignored error return value');
    });

    it('should detect unhandled error-prone call', () => {
      const content = `
        function test() {
          readFile('test.txt');
        }
      `;

      const result = metric.calculate(createParseResult(content));

      expect(result.value).toBeGreaterThan(0);
      expect(result.locations).toBeDefined();
      expect(result.locations?.[0]?.message).toBe('Unhandled error-prone call');
    });

    it('should not flag error-prone calls with proper assignment', () => {
      const content = `
        function test() {
          const data = readFile('test.txt');
          return data;
        }
      `;

      const result = metric.calculate(createParseResult(content));

      expect(result.locations).toBeUndefined();
    });

    it('should not flag error-prone calls inside try-catch', () => {
      const content = `
        function test() {
          try {
            readFile('test.txt');
          } catch (e) {
            console.log(e);
          }
        }
      `;

      const result = metric.calculate(createParseResult(content));

      expect(result.locations).toBeUndefined();
    });

    it('should not flag calls with .catch() or .then()', () => {
      const content = `
        function test() {
          fetch('api.com').then(r => r.json()).catch(e => console.log(e));
        }
      `;

      const result = metric.calculate(createParseResult(content));

      expect(result.locations).toBeUndefined();
    });

    it('should assign info severity for ignoredPercent <= 5', () => {
      const content = `
        function test() {
          const data = readFile('test.txt');
        }
      `;

      const result = metric.calculate(createParseResult(content));

      expect(result.severity).toBe('info');
    });

    it('should assign warning severity for 5 < ignoredPercent <= 15', () => {
      // 1 ignored out of 10 calls = 10%
      const lines = [];
      for (let i = 0; i < 9; i++) {
        lines.push(`          const d${i} = readFile('f${i}.txt');`);
      }
      lines.push(`          readFile('bad.txt');`);
      const content = `
        function test() {
${lines.join('\n')}
        }
      `;

      const result = metric.calculate(createParseResult(content));

      expect(result.severity).toBe('warning');
    });

    it('should assign error severity for 15 < ignoredPercent <= 30', () => {
      // 1 ignored out of 4 calls = 25%
      const content = `
        function test() {
          const a = readFile('a.txt');
          const b = readFile('b.txt');
          const c = readFile('c.txt');
          readFile('d.txt');
        }
      `;

      const result = metric.calculate(createParseResult(content));

      expect(result.severity).toBe('error');
    });

    it('should assign critical severity for ignoredPercent > 50', () => {
      // 2 ignored out of 3 calls = 66.7%
      const content = `
        function test() {
          const a = readFile('a.txt');
          readFile('b.txt');
          readFile('c.txt');
        }
      `;

      const result = metric.calculate(createParseResult(content));

      expect(result.severity).toBe('critical');
    });

    it('should detect file I/O operations', () => {
      const content = `
        function test() {
          readFile('file.txt');
          writeFile('file.txt', 'data');
          readdir('dir');
          stat('file.txt');
        }
      `;

      const result = metric.calculate(createParseResult(content));

      expect(result.value).toBeGreaterThan(0);
    });

    it('should detect network operations', () => {
      const content = `
        function test() {
          fetch('api.com');
          request('api.com');
          send(data);
          connect('server');
        }
      `;

      const result = metric.calculate(createParseResult(content));

      expect(result.value).toBeGreaterThan(0);
    });

    it('should detect JSON and database operations', () => {
      const content = `
        function test() {
          parse(jsonString);
          query('SELECT * FROM users');
          execute('DELETE FROM users');
        }
      `;

      const result = metric.calculate(createParseResult(content));

      expect(result.value).toBeGreaterThan(0);
    });

    it('should use Math.round(x * 10) / 10 for normalizedScore', () => {
      const content = `
        function test() {
          const a = readFile('a.txt');
          readFile('b.txt');
        }
      `;

      const result = metric.calculate(createParseResult(content));

      const scoreStr = String(result.normalizedScore);
      const decimalPart = scoreStr.split('.')[1];
      expect(!decimalPart || decimalPart.length <= 1).toBe(true);
    });

    it('should handle empty lines in content', () => {
      const content = `
        function test() {

          readFile('test.txt');

        }
      `;

      const result = metric.calculate(createParseResult(content));

      expect(result).toBeDefined();
      expect(result.value).toBeGreaterThanOrEqual(0);
    });

    it('should handle malformed code', () => {
      const content = `
        function test() {
          readFile(
        }
      `;

      const result = metric.calculate(createParseResult(content));

      expect(result).toBeDefined();
    });

    it('should normalizedScore be between 0 and 100', () => {
      const content = `
        function test() {
          _ = readFile('a.txt');
          _ = readFile('b.txt');
          _ = readFile('c.txt');
        }
      `;

      const result = metric.calculate(createParseResult(content));

      expect(result.normalizedScore).toBeGreaterThanOrEqual(0);
      expect(result.normalizedScore).toBeLessThanOrEqual(100);
    });
  });
});
