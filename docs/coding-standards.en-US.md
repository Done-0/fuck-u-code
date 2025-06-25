# TypeScript Coding Standards

## 1. Naming Conventions

### Basic Principles

Follow the official [TypeScript Handbook](https://www.typescriptlang.org/docs/handbook/) and community best practices. Names should be clear, accurate, and descriptive. Avoid non-standard abbreviations.

### 1.1 Files and Directories

Use `kebab-case` (lowercase with hyphens).

```typescript
// Correct
src/file-discovery.ts
src/tree-sitter-parser.ts
src/ai-review.ts

// Incorrect
src/FileDiscovery.ts
src/treeSitterParser.ts
src/AIReview.ts
```

### 1.2 Classes, Interfaces, Type Aliases, and Enums

Use `PascalCase`.

```typescript
class FileAnalyzer { ... }
interface ParseResult { ... }
type MetricCategory = 'complexity' | 'size';
enum Severity { Info, Warning, Error }
```

### 1.3 Variables, Parameters, Functions, and Methods

Use `camelCase`.

```typescript
const fileCount = 3;
function analyzeFile(filePath: string): ParseResult { ... }
const calculateScore = (metrics: MetricResult[]) => { ... };
```

### 1.4 Constants

Use `UPPER_SNAKE_CASE` for global constants, `camelCase` for local constants.

```typescript
// Global constants
export const MAX_CONCURRENCY = 8;
export const DEFAULT_TIMEOUT = 30000;

// Local constants
const maxRetries = 3;
const defaultValue = 'unknown';
```

### 1.5 Generic Parameters

Use single uppercase letters or descriptive names.

```typescript
// Simple generics
function identity<T>(arg: T): T { return arg; }

// Descriptive generics
interface Repository<TEntity, TId> {
  findById(id: TId): Promise<TEntity | null>;
}
```

### 1.6 Private Members

Use `#` prefix (ES2022 private fields) or `private` keyword.

```typescript
class Parser {
  #cache: Map<string, ParseResult>;
  private config: Config;
}
```

## 2. Comment Guidelines

### Core Principle

Code should be self-explanatory. Minimize comments. Comments must explain "WHY", not "WHAT".

### 2.1 When to Add Comments

Add comments only for:
- Complex business logic or algorithms
- Non-obvious technical decisions
- Important performance considerations
- Temporary workarounds or hacks (must explain reason and plan)

Do NOT add comments for:
- Describing what code does (code itself should be clear)
- Repeating variable or function names
- Obvious logic
- Outdated or irrelevant content

### 2.2 Comment Language

Use English for all comments.

```typescript
// Correct
// Skip validation if user is admin to improve performance

// Incorrect
// 如果用户是管理员则跳过验证以提高性能
```

### 2.3 Documentation Comments

Use JSDoc style for public API documentation.

```typescript
/**
 * Analyzes code quality of a file.
 * @param filePath - Absolute path to the file
 * @param content - File content as string
 * @returns Parse result with metrics
 * @throws {ParseError} If the file cannot be parsed
 */
function analyzeFile(filePath: string, content: string): ParseResult {
  // ...
}
```

### 2.4 File Header Comments

Each file should start with a brief module description.

```typescript
/**
 * Tree-sitter based parser for Go language.
 * Provides accurate AST analysis for complexity metrics.
 */

import Parser from 'web-tree-sitter';
// ...
```

## 3. Code Style

### 3.1 Import Order

Order imports as follows, with blank lines between groups, sorted alphabetically within groups:

1. Node.js built-in modules (with `node:` prefix)
2. Third-party dependencies
3. Internal project modules (relative paths)
4. Type imports (`import type`)

```typescript
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';

import chalk from 'chalk';
import { glob } from 'glob';

import { createParser } from '../parser/index.js';
import { calculateScore } from '../scoring/index.js';

import type { ParseResult } from '../parser/types.js';
import type { Config } from '../config/schema.js';
```

### 3.2 Formatting

Use Prettier for code formatting with the following configuration:

```json
{
  "semi": true,
  "singleQuote": true,
  "tabWidth": 2,
  "trailingComma": "es5",
  "printWidth": 100
}
```

### 3.3 Type Declarations

Prefer `interface` for object types, use `type` for unions, intersections, or aliases.

```typescript
// Use interface for object types
interface User {
  id: string;
  name: string;
}

// Use type for union types
type Status = 'pending' | 'active' | 'completed';

// Use type for type aliases
type UserId = string;
```

### 3.4 Strict Type Checking

Enable all strict type checking options:

```json
{
  "compilerOptions": {
    "strict": true,
    "noImplicitAny": true,
    "strictNullChecks": true,
    "noUncheckedIndexedAccess": true
  }
}
```

### 3.5 Error Handling

Use type-safe error handling patterns.

```typescript
// Custom error class
class ParseError extends Error {
  constructor(
    message: string,
    public readonly filePath: string,
    public readonly line?: number
  ) {
    super(message);
    this.name = 'ParseError';
  }
}

// Result pattern (optional)
type Result<T, E = Error> = { ok: true; value: T } | { ok: false; error: E };
```

### 3.6 Async Code

Prefer `async/await` over promise chains.

```typescript
// Correct
async function fetchData(): Promise<Data> {
  const response = await fetch(url);
  const data = await response.json();
  return data;
}

// Incorrect
function fetchData(): Promise<Data> {
  return fetch(url)
    .then(response => response.json())
    .then(data => data);
}
```

### 3.7 Module Exports

Use named exports, avoid default exports.

```typescript
// Correct
export function createParser(): Parser { ... }
export class Analyzer { ... }

// Incorrect
export default class Analyzer { ... }
```

## 4. Project Architecture

### Directory Structure

```
src/
├── cli/                    # CLI entry and commands
│   ├── commands/           # Subcommand implementations
│   └── output/             # Output formatters
├── analyzer/               # Core analyzer
├── parser/                 # Language parsers
│   └── languages/          # Language-specific implementations
├── metrics/                # Metric calculations
│   ├── complexity/         # Complexity metrics
│   ├── size/               # Size metrics
│   └── ...
├── scoring/                # Scoring system
├── ai/                     # AI integration
│   └── providers/          # AI providers
├── config/                 # Configuration management
├── i18n/                   # Internationalization
│   └── locales/            # Language files
└── utils/                  # Utility functions
```

### Module Responsibilities

1. **CLI Layer**: Command-line argument parsing, user interaction
2. **Analyzer Layer**: File discovery, concurrency control, result aggregation
3. **Parser Layer**: AST parsing, language detection
4. **Metrics Layer**: Code quality metric calculations
5. **Scoring Layer**: Metric normalization, weighted scoring
6. **AI Layer**: AI provider abstraction, code review

## 5. Dependency Management

### Selection Principles

1. Prefer Node.js built-in modules
2. Choose well-maintained, community-approved libraries
3. Avoid excessive dependencies

### Core Dependencies

| Dependency | Purpose |
|------------|---------|
| commander | CLI framework |
| chalk | Terminal colors |
| ora | Progress indicators |
| glob | File matching |
| ignore | gitignore parsing |
| zod | Runtime type validation |
| web-tree-sitter | AST parsing |

## 6. Internationalization (i18n)

### Basic Principles

- All user-facing text must go through the `t()` function. No hardcoded strings.
- Three languages are supported: English (en), Chinese (zh), Russian (ru).
- Language files are located in `src/i18n/locales/` in JSON format.
- When adding new user-visible text, all three language files must be updated.

```typescript
// Correct
console.log(t('analysisComplete'));
logger.warn(t('warn_file_too_large', { size: fileSizeKB, file: relativePath }));

// Incorrect
console.log('Analysis complete');
console.warn(`Skipping large file: ${file}`);
```

## 7. Testing Standards

### Basic Principles

- Follow production-grade testing standards. Cover normal flows, edge cases, and malformed input.
- Use Vitest as the test framework.

### Files and Naming

- Test file naming: `*.test.ts` or `*.spec.ts`.
- Test files go in `tests/` directory or co-located with source files.

### Test Structure

```typescript
describe('RoundRobinSelector', () => {
  it('should return null when no providers enabled', () => {});
  it('should rotate through instances in order', () => {});
  it('should skip rate-limited instances', () => {});
  it('should handle empty config gracefully', () => {});
});
```

### Running Tests

```bash
npm test              # Run all tests
npm run test:coverage # Test coverage
```

## 8. Common Commands

### Development

```bash
# Install dependencies
npm install

# Development mode (watch)
npm run dev

# Build
npm run build

# Run
npm start
```

### Code Quality

```bash
# Format
npm run format

# Check format
npm run format:check

# Lint
npm run lint

# Lint and fix
npm run lint:fix
```

### Testing

```bash
# Run tests
npm test

# Test coverage
npm run test:coverage
```

## 9. Git Commit Guidelines

### Commit Message Format

```
<type>(<scope>): <subject>

<body>

<footer>
```

### Type Categories

- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation update
- `style`: Code formatting (no functional changes)
- `refactor`: Code refactoring
- `perf`: Performance optimization
- `test`: Test-related changes
- `chore`: Build/tooling changes

### Example

```
feat(parser): add tree-sitter support for Go language

- Implement GoParser using web-tree-sitter
- Add cyclomatic complexity calculation
- Support function and method detection

Closes #123
```
