# fuck-u-code [![English](https://img.shields.io/badge/Docs-English-red?style=flat-square)](README.md) [![中文](https://img.shields.io/badge/文档-简体中文-blue?style=flat-square)](README_ZH.md) [![Русский](https://img.shields.io/badge/Docs-Русский-blue?style=flat-square)](README_RU.md)

> [!Important]
> 📢 Remember this command: `fuck-u-code` - let bad code have nowhere to hide!

A tool designed to **expose shitty code quality** with sharp but humorous feedback, showing you exactly **how terrible your code is**.

## Features

* **Multi-language support**: Go, JavaScript, TypeScript, Python, Java, C, C++, Rust, C#, Lua, PHP, Ruby, Swift, Shell (14 languages)
* **Overall Score**: 0~100, higher = better code quality
* **Shit-Gas Index**: Per-file score, higher = worse code
* **Seven quality checks**: Complexity / Size / Comments / Error handling / Naming / Duplication / Structure
* **AST parsing**: Accurate syntax analysis powered by tree-sitter
* **AI code review**: Integrates OpenAI-compatible / Anthropic / DeepSeek / Gemini / Ollama
* **Multiple output formats**: Colored terminal / Markdown / JSON / HTML
* **i18n**: English / Chinese / Russian
* **Flexible config**: `.fuckucoderc.json` and more, project-level and global support

> [!Note]
> Code analysis runs fully offline — your code never leaves your machine.
> AI review requires an external API or local Ollama.

## Installation

```bash
npm install -g eff-u-code
```

Or build from source:

```bash
git clone https://github.com/Done-0/fuck-u-code.git
cd fuck-u-code && npm install && npm run build
```

## Usage

### Code Analysis

```bash
fuck-u-code analyze              # Analyze current directory
fuck-u-code analyze ./src        # Analyze specific directory
fuck-u-code analyze . -v         # Verbose (project overview, language stats, function metrics)
fuck-u-code analyze . -t 20      # Show top 20 worst files
fuck-u-code analyze . -l zh      # Chinese output
fuck-u-code analyze . -f markdown              # Markdown terminal rendering
fuck-u-code analyze . -f markdown -o report.md # Export Markdown
fuck-u-code analyze . -f html -o report.html   # Export HTML
fuck-u-code analyze . -f json -o report.json   # Export JSON
fuck-u-code analyze . -e "**/*.test.ts"        # Exclude test files
```

| Option | Short | Description |
| --- | --- | --- |
| `--verbose` | `-v` | Verbose output |
| `--top <n>` | `-t` | Top N worst files (default 10) |
| `--format <fmt>` | `-f` | Format: console/markdown/json/html |
| `--output <file>` | `-o` | Write to file |
| `--exclude <glob>` | `-e` | Additional exclude patterns |
| `--concurrency <n>` | `-c` | Concurrent workers (default 8) |
| `--locale <lang>` | `-l` | Language: en/zh/ru |

### AI Code Review

Requires AI provider setup (see [AI Configuration](#ai-configuration)).

```bash
fuck-u-code ai-review . -m gpt-4o                          # OpenAI-compatible
fuck-u-code ai-review . -p anthropic -m claude-sonnet-4-5-20250929  # Anthropic
fuck-u-code ai-review . -p ollama -m codellama              # Local Ollama
fuck-u-code ai-review . -m gpt-4o -t 3                     # Review top 3 worst
fuck-u-code ai-review . -m gpt-4o -f markdown -o review.md # Export Markdown
fuck-u-code ai-review . -b https://your-api.com/v1 -k sk-xxx -m model # Custom endpoint
```

| Option | Short | Description |
| --- | --- | --- |
| `--model <model>` | `-m` | Model name (required) |
| `--provider <name>` | `-p` | Provider: openai/anthropic/deepseek/gemini/ollama |
| `--base-url <url>` | `-b` | Custom API endpoint |
| `--api-key <key>` | `-k` | API key |
| `--top <n>` | `-t` | Review top N worst files (default 5) |
| `--format <fmt>` | `-f` | Format: console/markdown/html |
| `--output <file>` | `-o` | Write to file |
| `--verbose` | `-v` | Verbose output |
| `--locale <lang>` | `-l` | Language: en/zh/ru |

### Config Management

```bash
fuck-u-code config init                    # Generate .fuckucoderc.json
fuck-u-code config show                    # Show current config
fuck-u-code config set i18n.locale zh      # Set default language
fuck-u-code config set ai.provider openai  # Set AI provider
fuck-u-code config set ai.model gpt-4o     # Set AI model
fuck-u-code config set ai.apiKey sk-xxx    # Set API key
```

### Uninstall

Remove fuck-u-code and clean up all local files:

```bash
fuck-u-code uninstall    # Remove global config, MCP entries, and npm package
```

This will remove:
- Global config file (`~/.fuckucoderc.json`)
- MCP server entries (Claude Code, Cursor)
- Global npm package (`eff-u-code`)

## Configuration File

Auto-discovered from project directory upward, then falls back to global `~/.fuckucoderc.json`.

Supported formats: `.fuckucoderc.json` / `.yaml` / `.js` / `fuckucode.config.js` / `"fuckucode"` field in `package.json`.

Global config path: macOS/Linux `~/.fuckucoderc.json`, Windows `C:\Users\<username>\.fuckucoderc.json`.

Full example (`.fuckucoderc.json`):

```json
{
  "exclude": ["**/*.test.ts", "docs/**"],
  "include": ["**/*"],
  "concurrency": 8,
  "verbose": false,
  "output": {
    "format": "console",
    "top": 10,
    "maxIssues": 5,
    "showDetails": true
  },
  "metrics": {
    "weights": {
      "complexity": 0.32,
      "duplication": 0.20,
      "size": 0.18,
      "structure": 0.12,
      "error": 0.08,
      "documentation": 0.05,
      "naming": 0.05
    }
  },
  "ai": {
    "enabled": true,
    "provider": "openai",
    "model": "gpt-4o",
    "baseUrl": "https://api.openai.com/v1",
    "apiKey": "sk-your-api-key"
  },
  "i18n": {
    "locale": "en"
  }
}
```

## AI Configuration

Supports 5 providers. Priority: CLI flags > environment variables > config file.

| Provider | Environment Variables | Example |
| --- | --- | --- |
| OpenAI-compatible | `OPENAI_API_KEY` `OPENAI_MODEL` `OPENAI_BASE_URL` | `ai-review . -m gpt-4o` |
| Anthropic | `ANTHROPIC_API_KEY` | `ai-review . -p anthropic -m claude-sonnet-4-5-20250929` |
| DeepSeek | `DEEPSEEK_API_KEY` | `ai-review . -p deepseek -m deepseek-chat` |
| Gemini | `GEMINI_API_KEY` | `ai-review . -p gemini -m gemini-pro` |
| Ollama | `OLLAMA_HOST` (optional) | `ai-review . -p ollama -m codellama` |

```bash
# OpenAI-compatible
export OPENAI_API_KEY="sk-your-key"
export OPENAI_BASE_URL="https://api.openai.com/v1"  # Optional

# Or via config file
fuck-u-code config set ai.provider openai
fuck-u-code config set ai.model gpt-4o
fuck-u-code config set ai.apiKey sk-your-key
fuck-u-code config set ai.baseUrl https://api.openai.com/v1
```

## MCP Server

fuck-u-code provides an MCP (Model Context Protocol) Server, allowing AI tools like Claude Code, Cursor, Windsurf, etc. to directly invoke code quality analysis and AI code review.

### Setup

```bash
# Global install
npm install -g eff-u-code

# Auto-configure (interactive)
fuck-u-code mcp-install

# Or specify target directly
fuck-u-code mcp-install claude
fuck-u-code mcp-install cursor
```

**Claude Code** (`~/.claude.json` or project `.mcp.json`):

```json
{
  "mcpServers": {
    "fuck-u-code": {
      "command": "fuck-u-code-mcp"
    }
  }
}
```

**Cursor** (`.cursor/mcp.json`):

```json
{
  "mcpServers": {
    "fuck-u-code": {
      "command": "fuck-u-code-mcp"
    }
  }
}
```

**Without global install (npx)**:

```json
{
  "mcpServers": {
    "fuck-u-code": {
      "command": "npx",
      "args": ["-y", "eff-u-code-mcp"]
    }
  }
}
```

### Available Tools

- **analyze** — Analyze code quality and generate a score report
- **ai-review** — Run AI-powered code review on the worst-scoring files

## File Exclusion

The tool reads `.gitignore` files (including nested ones) and follows standard gitignore rules. For additional exclusions, use `--exclude` or the `exclude` config field.

## Feedback

> 💬 Share your thoughts
> Discord: <https://discord.gg/9ThNkAFGnT>

## Contributing

PRs welcome — let's improve **fuck-u-code** together 🚀

## License

MIT

## Contact

- fenderisfine@gmail.com
- WeChat: l927171598

## More Projects

- [FateSpiral](https://fatespiral.com/) — AI-driven multiplayer RPG, infinite worlds, evolving stories
- [DestinyTeller](https://destinyteller.com/) — AI-powered destiny reading website
- [Jank](https://github.com/Done-0/Jank) — Open-source blog system in Go
