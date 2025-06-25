import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { loadGitignore, loadNestedGitignores, createMatcher } from '../../src/gitignore/parser.js';
import { mkdir, writeFile, rm } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';

describe('Gitignore Parser', () => {
  let testDir: string;

  beforeEach(async () => {
    testDir = join(tmpdir(), `gitignore-test-${Date.now()}`);
    await mkdir(testDir, { recursive: true });
  });

  afterEach(async () => {
    await rm(testDir, { recursive: true, force: true });
  });

  describe('loadGitignore', () => {
    it('should load root .gitignore file', async () => {
      await writeFile(join(testDir, '.gitignore'), 'node_modules/\n*.log\n');
      const ig = await loadGitignore(testDir);

      expect(ig.ignores('node_modules/package.json')).toBe(true);
      expect(ig.ignores('test.log')).toBe(true);
      expect(ig.ignores('src/index.ts')).toBe(false);
    });

    it('should always ignore .git directory', async () => {
      const ig = await loadGitignore(testDir);
      expect(ig.ignores('.git/config')).toBe(true);
      expect(ig.ignores('.git/HEAD')).toBe(true);
    });

    it('should handle missing .gitignore file', async () => {
      const ig = await loadGitignore(testDir);
      expect(ig.ignores('.git/config')).toBe(true);
      expect(ig.ignores('src/index.ts')).toBe(false);
    });

    it('should handle empty .gitignore file', async () => {
      await writeFile(join(testDir, '.gitignore'), '');
      const ig = await loadGitignore(testDir);
      expect(ig.ignores('.git/config')).toBe(true);
      expect(ig.ignores('src/index.ts')).toBe(false);
    });

    it('should handle .gitignore with comments and blank lines', async () => {
      await writeFile(join(testDir, '.gitignore'), '# Comment\n\nnode_modules/\n\n# Another comment\n*.log\n');
      const ig = await loadGitignore(testDir);
      expect(ig.ignores('node_modules/package.json')).toBe(true);
      expect(ig.ignores('test.log')).toBe(true);
    });

    it('should handle negation patterns', async () => {
      await writeFile(join(testDir, '.gitignore'), '*.log\n!important.log\n');
      const ig = await loadGitignore(testDir);
      expect(ig.ignores('test.log')).toBe(true);
      expect(ig.ignores('important.log')).toBe(false);
    });

    it('should handle directory-only patterns', async () => {
      await writeFile(join(testDir, '.gitignore'), 'build/\n');
      const ig = await loadGitignore(testDir);
      expect(ig.ignores('build/index.js')).toBe(true);
      expect(ig.ignores('src/build.ts')).toBe(false);
    });

    it('should handle wildcard patterns', async () => {
      await writeFile(join(testDir, '.gitignore'), '*.min.js\ntest-*.ts\n');
      const ig = await loadGitignore(testDir);
      expect(ig.ignores('bundle.min.js')).toBe(true);
      expect(ig.ignores('test-utils.ts')).toBe(true);
      expect(ig.ignores('index.js')).toBe(false);
    });

    it('should handle double-star patterns', async () => {
      await writeFile(join(testDir, '.gitignore'), '**/node_modules/\n');
      const ig = await loadGitignore(testDir);
      expect(ig.ignores('node_modules/package.json')).toBe(true);
      expect(ig.ignores('packages/app/node_modules/react')).toBe(true);
    });
  });

  describe('loadNestedGitignores', () => {
    it('should load nested .gitignore files', async () => {
      await mkdir(join(testDir, 'src'), { recursive: true });
      await writeFile(join(testDir, '.gitignore'), 'node_modules/\n');
      await writeFile(join(testDir, 'src', '.gitignore'), '*.tmp\n');

      const nested = await loadNestedGitignores(testDir);

      expect(nested.has('src')).toBe(true);

      const srcIgnore = nested.get('src');
      expect(srcIgnore?.ignores('test.tmp')).toBe(true);
    });

    it('should recursively load deeply nested .gitignore files', async () => {
      await mkdir(join(testDir, 'a', 'b', 'c'), { recursive: true });
      await writeFile(join(testDir, 'a', '.gitignore'), '*.a\n');
      await writeFile(join(testDir, 'a', 'b', '.gitignore'), '*.b\n');
      await writeFile(join(testDir, 'a', 'b', 'c', '.gitignore'), '*.c\n');

      const nested = await loadNestedGitignores(testDir);

      expect(nested.has('a')).toBe(true);
      expect(nested.has('a/b')).toBe(true);
      expect(nested.has('a/b/c')).toBe(true);
    });

    it('should skip directories ignored by root .gitignore', async () => {
      await mkdir(join(testDir, 'node_modules', 'pkg'), { recursive: true });
      await writeFile(join(testDir, '.gitignore'), 'node_modules/\n');
      await writeFile(join(testDir, 'node_modules', 'pkg', '.gitignore'), '*.tmp\n');

      const rootIgnore = await loadGitignore(testDir);
      const nested = await loadNestedGitignores(testDir, '', rootIgnore);

      expect(nested.has('node_modules')).toBe(false);
      expect(nested.has('node_modules/pkg')).toBe(false);
    });

    it('should handle permission errors gracefully', async () => {
      await mkdir(join(testDir, 'restricted'), { recursive: true });

      const nested = await loadNestedGitignores(testDir);
      expect(nested).toBeInstanceOf(Map);
    });

    it('should handle empty directory', async () => {
      const nested = await loadNestedGitignores(testDir);
      expect(nested.size).toBe(0);
    });

    it('should skip .git directory', async () => {
      await mkdir(join(testDir, '.git', 'hooks'), { recursive: true });
      await writeFile(join(testDir, '.git', '.gitignore'), '*.tmp\n');

      const nested = await loadNestedGitignores(testDir);
      expect(nested.has('.git')).toBe(false);
    });
  });

  describe('GitignoreMatcher', () => {
    it('should match files against root .gitignore', async () => {
      await writeFile(join(testDir, '.gitignore'), 'node_modules/\n*.log\n');
      const rootIgnore = await loadGitignore(testDir);
      const nested = await loadNestedGitignores(testDir);
      const matcher = createMatcher(rootIgnore, nested);

      expect(matcher.ignores('node_modules/package.json')).toBe(true);
      expect(matcher.ignores('test.log')).toBe(true);
      expect(matcher.ignores('src/index.ts')).toBe(false);
    });

    it('should match files against nested .gitignore', async () => {
      await mkdir(join(testDir, 'src'), { recursive: true });
      await writeFile(join(testDir, '.gitignore'), 'node_modules/\n');
      await writeFile(join(testDir, 'src', '.gitignore'), '*.tmp\n');

      const rootIgnore = await loadGitignore(testDir);
      const nested = await loadNestedGitignores(testDir);
      const matcher = createMatcher(rootIgnore, nested);

      expect(matcher.ignores('src/test.tmp')).toBe(true);
      expect(matcher.ignores('src/index.ts')).toBe(false);
      expect(matcher.ignores('test.tmp')).toBe(false);
    });

    it('should normalize path separators', async () => {
      await writeFile(join(testDir, '.gitignore'), 'node_modules/\n');
      const rootIgnore = await loadGitignore(testDir);
      const nested = await loadNestedGitignores(testDir);
      const matcher = createMatcher(rootIgnore, nested);

      expect(matcher.ignores('node_modules/package.json')).toBe(true);
      expect(matcher.ignores('src/index.ts')).toBe(false);
    });

    it('should handle paths with multiple levels', async () => {
      await mkdir(join(testDir, 'a', 'b', 'c'), { recursive: true });
      await writeFile(join(testDir, 'a', 'b', '.gitignore'), '*.tmp\n');

      const rootIgnore = await loadGitignore(testDir);
      const nested = await loadNestedGitignores(testDir);
      const matcher = createMatcher(rootIgnore, nested);

      expect(matcher.ignores('a/b/test.tmp')).toBe(true);
      expect(matcher.ignores('a/b/c/test.tmp')).toBe(true);
      expect(matcher.ignores('a/test.tmp')).toBe(false);
    });

    it('should handle root-level files', async () => {
      await writeFile(join(testDir, '.gitignore'), '*.log\n');
      const rootIgnore = await loadGitignore(testDir);
      const nested = await loadNestedGitignores(testDir);
      const matcher = createMatcher(rootIgnore, nested);

      expect(matcher.ignores('test.log')).toBe(true);
      expect(matcher.ignores('index.ts')).toBe(false);
    });

    it('should filter array of paths', async () => {
      await writeFile(join(testDir, '.gitignore'), '*.log\nnode_modules/\n');
      const rootIgnore = await loadGitignore(testDir);
      const nested = await loadNestedGitignores(testDir);
      const matcher = createMatcher(rootIgnore, nested);

      const paths = [
        'src/index.ts',
        'test.log',
        'node_modules/package.json',
        'README.md',
        'debug.log',
      ];

      const filtered = matcher.filter(paths);
      expect(filtered).toEqual(['src/index.ts', 'README.md']);
    });

    it('should handle empty and special paths', async () => {
      const rootIgnore = await loadGitignore(testDir);
      const nested = await loadNestedGitignores(testDir);
      const matcher = createMatcher(rootIgnore, nested);

      expect(matcher.ignores('')).toBe(false);
      expect(matcher.ignores('.')).toBe(false);
      expect(matcher.ignores('..')).toBe(false);
    });

    it('should handle dot files', async () => {
      await writeFile(join(testDir, '.gitignore'), '.env\n');
      const rootIgnore = await loadGitignore(testDir);
      const nested = await loadNestedGitignores(testDir);
      const matcher = createMatcher(rootIgnore, nested);

      expect(matcher.ignores('.env')).toBe(true);
      expect(matcher.ignores('.eslintrc')).toBe(false);
    });

    it('should handle complex nested patterns', async () => {
      await mkdir(join(testDir, 'packages', 'app', 'src'), { recursive: true });
      await writeFile(join(testDir, '.gitignore'), 'node_modules/\n*.log\n');
      await writeFile(join(testDir, 'packages', '.gitignore'), 'dist/\n');
      await writeFile(join(testDir, 'packages', 'app', '.gitignore'), '*.tmp\n');

      const rootIgnore = await loadGitignore(testDir);
      const nested = await loadNestedGitignores(testDir);
      const matcher = createMatcher(rootIgnore, nested);

      expect(matcher.ignores('node_modules/react')).toBe(true);
      expect(matcher.ignores('test.log')).toBe(true);
      expect(matcher.ignores('packages/dist/bundle.js')).toBe(true);
      expect(matcher.ignores('packages/app/test.tmp')).toBe(true);
      expect(matcher.ignores('packages/app/src/index.ts')).toBe(false);
    });

    it('should handle valid relative paths', async () => {
      const rootIgnore = await loadGitignore(testDir);
      const nested = await loadNestedGitignores(testDir);
      const matcher = createMatcher(rootIgnore, nested);

      expect(matcher.ignores('src/index.ts')).toBe(false);
      expect(matcher.ignores('test/file.js')).toBe(false);
    });
  });
});
