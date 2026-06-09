# fuck-u-code Skills

AI agent skills for [fuck-u-code](https://github.com/Done-0/fuck-u-code) — the code quality analyzer that exposes shitty code with sharp feedback.

## Skills

### [fuck-u-code-analysis](./fuck-u-code-analysis/)

Code quality analysis and review skill for AI agents (opencode, Claude Code, Cursor, etc.).

**When to use:** After code changes are complete, before committing or creating PRs. Also when users ask to check code quality, analyze technical debt, or review code smell.

**What it does:**

1. Runs `fuck-u-code analyze` to get quantitative metrics (0-100 score, 11 metrics across 7 dimensions)
2. Interprets results using language-specific thresholds (14 languages)
3. Provides actionable refactoring recommendations with exact line references

**Covers all 11 metrics:**

| Category | Metrics | Weight |
|----------|---------|--------|
| Complexity | Cyclomatic, Cognitive, Nesting Depth | 32% |
| Duplication | Code Duplication | 20% |
| Size | Function Length, File Length, Parameter Count | 18% |
| Structure | Structure Analysis | 12% |
| Error Handling | Error Handling | 8% |
| Documentation | Comment Ratio | 5% |
| Naming | Naming Convention | 5% |

**Quick start:**

```bash
fuck-u-code analyze . -f json -o /tmp/fuc-report.json
```

Then follow the skill's review standards to interpret results and write remediation recommendations.

## Installation

Copy the skill directory to your agent's skills path:

```bash
# opencode
cp -r skills/fuck-u-code-analysis ~/.config/opencode/skills/

# Claude Code
cp -r skills/fuck-u-code-analysis ~/.claude/skills/
```

## Requirements

- [fuck-u-code](https://www.npmjs.com/package/eff-u-code) installed globally: `npm install -g eff-u-code`
- Node.js >= 18.0.0
