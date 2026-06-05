# Language-Specific Thresholds

Source: `src/metrics/thresholds/language-thresholds.ts` in the fuck-u-code project.

All threshold values are based on official linter defaults and industry standards. Sources are documented per language in the source code.

## Thresholds by Language

### Go
Sources: gocyclo, gocognit, Effective Go

| Metric | Excellent | Good | Acceptable | Poor |
|--------|-----------|------|------------|------|
| Cyclomatic Complexity | ≤ 5 | ≤ 10 | ≤ 15 | > 15 |
| Cognitive Complexity | ≤ 7 | ≤ 15 | ≤ 25 | > 25 |
| Function Length (lines) | ≤ 50 | ≤ 100 | ≤ 200 | > 200 |
| File Length (code lines) | ≤ 300 | ≤ 500 | ≤ 1000 | > 1000 |
| Parameter Count | ≤ 3 | ≤ 5 | ≤ 7 | > 7 |
| Nesting Depth | ≤ 3 | ≤ 4 | ≤ 5 | > 5 |

### JavaScript / TypeScript
Sources: ESLint complexity, max-params, max-depth rules

| Metric | Excellent | Good | Acceptable | Poor |
|--------|-----------|------|------------|------|
| Cyclomatic Complexity | ≤ 5 | ≤ 10 | ≤ 20 | > 20 |
| Cognitive Complexity | ≤ 8 | ≤ 15 | ≤ 25 | > 25 |
| Function Length (lines) | ≤ 50 | ≤ 100 | ≤ 200 | > 200 |
| File Length (code lines) | ≤ 250 | ≤ 400 | ≤ 800 | > 800 |
| Parameter Count | ≤ 3 | ≤ 4 | ≤ 6 | > 6 |
| Nesting Depth | ≤ 3 | ≤ 4 | ≤ 5 | > 5 |

### Python
Sources: Pylint, McCabe complexity

| Metric | Excellent | Good | Acceptable | Poor |
|--------|-----------|------|------------|------|
| Cyclomatic Complexity | ≤ 5 | ≤ 10 | ≤ 15 | > 15 |
| Cognitive Complexity | ≤ 7 | ≤ 12 | ≤ 20 | > 20 |
| Function Length (lines) | ≤ 30 | ≤ 50 | ≤ 100 | > 100 |
| File Length (code lines) | ≤ 300 | ≤ 500 | ≤ 1000 | > 1000 |
| Parameter Count | ≤ 3 | ≤ 5 | ≤ 7 | > 7 |
| Nesting Depth | ≤ 3 | ≤ 5 | ≤ 7 | > 7 |

### Java
Sources: SonarQube Java, Checkstyle, PMD

| Metric | Excellent | Good | Acceptable | Poor |
|--------|-----------|------|------------|------|
| Cyclomatic Complexity | ≤ 5 | ≤ 10 | ≤ 15 | > 15 |
| Cognitive Complexity | ≤ 8 | ≤ 15 | ≤ 25 | > 25 |
| Function Length (lines) | ≤ 50 | ≤ 100 | ≤ 150 | > 150 |
| File Length (code lines) | ≤ 300 | ≤ 500 | ≤ 1000 | > 1000 |
| Parameter Count | ≤ 3 | ≤ 5 | ≤ 7 | > 7 |
| Nesting Depth | ≤ 3 | ≤ 4 | ≤ 5 | > 5 |

### C
Sources: Linux Kernel Coding Style, SonarQube C

| Metric | Excellent | Good | Acceptable | Poor |
|--------|-----------|------|------------|------|
| Cyclomatic Complexity | ≤ 5 | ≤ 10 | ≤ 15 | > 15 |
| Cognitive Complexity | ≤ 7 | ≤ 12 | ≤ 20 | > 20 |
| Function Length (lines) | ≤ 40 | ≤ 80 | ≤ 150 | > 150 |
| File Length (code lines) | ≤ 300 | ≤ 500 | ≤ 1000 | > 1000 |
| Parameter Count | ≤ 3 | ≤ 5 | ≤ 7 | > 7 |
| Nesting Depth | ≤ 3 | ≤ 4 | ≤ 5 | > 5 |

### C++
Sources: Google C++ Style Guide, LLVM, clang-tidy

| Metric | Excellent | Good | Acceptable | Poor |
|--------|-----------|------|------------|------|
| Cyclomatic Complexity | ≤ 5 | ≤ 10 | ≤ 15 | > 15 |
| Cognitive Complexity | ≤ 8 | ≤ 15 | ≤ 25 | > 25 |
| Function Length (lines) | ≤ 50 | ≤ 100 | ≤ 200 | > 200 |
| File Length (code lines) | ≤ 300 | ≤ 500 | ≤ 1000 | > 1000 |
| Parameter Count | ≤ 3 | ≤ 5 | ≤ 7 | > 7 |
| Nesting Depth | ≤ 3 | ≤ 4 | ≤ 5 | > 5 |

### Rust
Sources: Clippy cognitive_complexity, too_many_arguments, too_many_lines

| Metric | Excellent | Good | Acceptable | Poor |
|--------|-----------|------|------------|------|
| Cyclomatic Complexity | ≤ 5 | ≤ 10 | ≤ 15 | > 15 |
| Cognitive Complexity | ≤ 8 | ≤ 15 | ≤ 25 | > 25 |
| Function Length (lines) | ≤ 50 | ≤ 100 | ≤ 200 | > 200 |
| File Length (code lines) | ≤ 300 | ≤ 500 | ≤ 1000 | > 1000 |
| Parameter Count | ≤ 3 | ≤ 5 | ≤ 7 | > 7 |
| Nesting Depth | ≤ 3 | ≤ 4 | ≤ 5 | > 5 |

### C#
Sources: SonarQube C#, Microsoft conventions

| Metric | Excellent | Good | Acceptable | Poor |
|--------|-----------|------|------------|------|
| Cyclomatic Complexity | ≤ 5 | ≤ 10 | ≤ 15 | > 15 |
| Cognitive Complexity | ≤ 8 | ≤ 15 | ≤ 25 | > 25 |
| Function Length (lines) | ≤ 50 | ≤ 100 | ≤ 200 | > 200 |
| File Length (code lines) | ≤ 300 | ≤ 500 | ≤ 1000 | > 1000 |
| Parameter Count | ≤ 3 | ≤ 5 | ≤ 7 | > 7 |
| Nesting Depth | ≤ 3 | ≤ 4 | ≤ 5 | > 5 |

### Lua
Sources: luacheck, SonarQube defaults

| Metric | Excellent | Good | Acceptable | Poor |
|--------|-----------|------|------------|------|
| Cyclomatic Complexity | ≤ 5 | ≤ 10 | ≤ 15 | > 15 |
| Cognitive Complexity | ≤ 8 | ≤ 15 | ≤ 25 | > 25 |
| Function Length (lines) | ≤ 50 | ≤ 100 | ≤ 200 | > 200 |
| File Length (code lines) | ≤ 300 | ≤ 500 | ≤ 1000 | > 1000 |
| Parameter Count | ≤ 3 | ≤ 5 | ≤ 7 | > 7 |
| Nesting Depth | ≤ 3 | ≤ 4 | ≤ 5 | > 5 |

### PHP
Sources: PHP_CodeSniffer, PHPMD, SonarQube PHP

| Metric | Excellent | Good | Acceptable | Poor |
|--------|-----------|------|------------|------|
| Cyclomatic Complexity | ≤ 5 | ≤ 10 | ≤ 15 | > 15 |
| Cognitive Complexity | ≤ 8 | ≤ 15 | ≤ 25 | > 25 |
| Function Length (lines) | ≤ 50 | ≤ 100 | ≤ 200 | > 200 |
| File Length (code lines) | ≤ 300 | ≤ 500 | ≤ 1000 | > 1000 |
| Parameter Count | ≤ 3 | ≤ 5 | ≤ 7 | > 7 |
| Nesting Depth | ≤ 3 | ≤ 5 | ≤ 7 | > 7 |

### Ruby
Sources: RuboCop Metrics defaults

| Metric | Excellent | Good | Acceptable | Poor |
|--------|-----------|------|------------|------|
| Cyclomatic Complexity | ≤ 4 | ≤ 7 | ≤ 12 | > 12 |
| Cognitive Complexity | ≤ 5 | ≤ 8 | ≤ 15 | > 15 |
| Function Length (lines) | ≤ 20 | ≤ 50 | ≤ 100 | > 100 |
| File Length (code lines) | ≤ 250 | ≤ 400 | ≤ 800 | > 800 |
| Parameter Count | ≤ 3 | ≤ 4 | ≤ 6 | > 6 |
| Nesting Depth | ≤ 3 | ≤ 4 | ≤ 5 | > 5 |

Note: Ruby has stricter thresholds than most languages — RuboCop defaults emphasize short methods and low complexity.

### Swift
Sources: SwiftLint defaults, Apple Swift API Design Guidelines

| Metric | Excellent | Good | Acceptable | Poor |
|--------|-----------|------|------------|------|
| Cyclomatic Complexity | ≤ 5 | ≤ 10 | ≤ 20 | > 20 |
| Cognitive Complexity | ≤ 7 | ≤ 12 | ≤ 20 | > 20 |
| Function Length (lines) | ≤ 30 | ≤ 40 | ≤ 100 | > 100 |
| File Length (code lines) | ≤ 200 | ≤ 350 | ≤ 600 | > 600 |
| Parameter Count | ≤ 3 | ≤ 5 | ≤ 7 | > 7 |
| Nesting Depth | ≤ 3 | ≤ 4 | ≤ 5 | > 5 |

Note: Swift has the tightest file length thresholds (350 good, 600 acceptable). SwiftLint's default function body length warning is just 40 lines.

### Shell
Sources: Google Shell Style Guide, ShellCheck

| Metric | Excellent | Good | Acceptable | Poor |
|--------|-----------|------|------------|------|
| Cyclomatic Complexity | ≤ 5 | ≤ 10 | ≤ 15 | > 15 |
| Cognitive Complexity | ≤ 7 | ≤ 12 | ≤ 20 | > 20 |
| Function Length (lines) | ≤ 30 | ≤ 50 | ≤ 100 | > 100 |
| File Length (code lines) | ≤ 200 | ≤ 300 | ≤ 600 | > 600 |
| Parameter Count | ≤ 3 | ≤ 5 | ≤ 7 | > 7 |
| Nesting Depth | ≤ 3 | ≤ 4 | ≤ 5 | > 5 |

Note: Shell scripts have lower size thresholds due to inherently higher complexity per line compared to structured languages.

## Notable Language Differences

Languages that deviate significantly from the "standard" thresholds:

- **Ruby**: Stricter across the board (CC good ≤ 7, function length good ≤ 50 lines). Ruby culture values short methods.
- **Swift**: Tightest file length limits (good ≤ 350, acceptable ≤ 600). SwiftLint enforces small files.
- **Python**: Shorter good function length (≤ 50 lines). Pylint and Python culture prefer compact functions.
- **C**: Tighter function length good (≤ 80 lines). Linux kernel style emphasizes brevity.
- **Shell / Swift**: Smaller files expected. Shell due to complexity per line, Swift due to SwiftLint.
- **PHP / Python**: Allow deeper nesting (good ≤ 5, acceptable ≤ 7). More permissive than Go/JS/Java.
