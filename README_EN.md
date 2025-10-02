
# fuck-u-code [![English](https://img.shields.io/badge/Docs-English-red?style=flat-square)](README_EN.md) [![中文](https://img.shields.io/badge/文档-简体中文-blue?style=flat-square)](README.md) 

> [!Important]
> 📢 Remember this command: `fuck-u-code` - let bad code have nowhere to hide!

A tool designed to **expose shitty code quality** with sharp but humorous feedback, showing you exactly **how terrible your code is**.

## Features

* **Multi-language support**: Go, JS/TS, Python, Java, C/C++
* **Shit-Mountain Index**: Score 0~100, the higher, the worse
* **Seven quality checks**: Complexity / Function length / Comments / Error handling / Naming / Duplication / Structure
* **Colorful terminal report**: Criticism you can laugh at
* **Markdown output**: Easy for AI analysis & documentation
* **Flexible configuration**: Summary / Detailed mode, multi-language reports

> [!Note]
>
> * Higher scores = worse code. High scorers welcome!  
> * Runs fully offline. Your code never leaves your machine.

## Installation

```bash
# Method 1: Install via Go
go install github.com/Done-0/fuck-u-code/cmd/fuck-u-code@latest

# Method 2: Build from source
git clone https://github.com/Done-0/fuck-u-code.git
cd fuck-u-code && go build -o fuck-u-code ./cmd/fuck-u-code

# Method 3: Build with Docker
docker build -t fuck-u-code .
````

## Usage

```bash
# Basic analysis - local project
fuck-u-code analyze /path/to/project
# Or
fuck-u-code /path/to/project

# Analyze Git repository (auto clone)
fuck-u-code analyze https://github.com/user/repo.git
# Or
fuck-u-code https://github.com/user/repo

# Run with Docker
docker run --rm -v "/path/to/project:/build" fuck-u-code analyze

# Default: analyze current directory
fuck-u-code analyze
```

> [!Tip]
> **Direct Git repository analysis supported**: The tool automatically clones repositories to a temporary directory `tmp_proj` and cleans up after analysis. Supports GitHub, GitLab, Gitee, Bitbucket, and more.

### Common Options

| Option        | Short | Description                       |
| ------------- | ----- | --------------------------------- |
| `--verbose`   | `-v`  | Show detailed report              |
| `--top N`     | `-t`  | Show top N worst files            |
| `--issues N`  | `-i`  | Show N issues per file            |
| `--summary`   | `-s`  | Only show summary, skip details   |
| `--markdown`  | `-m`  | Output as Markdown report         |
| `--lang`      | `-l`  | Report language (zh-CN, en-US)    |
| `--exclude`   | `-e`  | Exclude specific files or folders |
| `--skipindex` | `-x`  | Skip index.js/ts files            |

### Examples

```bash
fuck-u-code analyze --verbose
fuck-u-code analyze --top 3
fuck-u-code analyze --lang en-US
fuck-u-code analyze --summary
fuck-u-code analyze --exclude "**/test/**"
fuck-u-code analyze --markdown > report.md
```

## Advanced Usage

### Markdown Output

Perfect for **AI analysis, documentation, CI/CD, team collaboration**

```bash
fuck-u-code analyze --markdown
fuck-u-code analyze --markdown > report.md
fuck-u-code analyze --markdown --top 10 --lang en-US > report.md
```

Markdown report includes: overall score / metrics table / problematic files / suggestions

### Default Exclusions

* Frontend: `node_modules`, `dist`, `build`, `*.min.js`, etc.
* Backend: `vendor`, `bin`, `target`, `logs`, `migrations`, etc.

## Troubleshooting

* `command not found` → Add Go bin path to `PATH`:

  ```bash
  export PATH="$PATH:$(go env GOPATH)/bin"
  ```

  Add it to `.bash_profile` / `.zshrc` etc.

## License

MIT

## Contributing

PRs welcome — let’s improve **fuck-u-code** together 🚀

## More Projects

- [Xuanxue Workshop](https://bazi.site) — AI-powered fortune-telling website  
- [Jank](https://github.com/Done-0/Jank) — Open-source blog system in Go
