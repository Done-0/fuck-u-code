# fuck-u-code [![中文](https://img.shields.io/badge/文档-简体中文-blue?style=flat-square)](README_ZH.md) [![繁體中文](https://img.shields.io/badge/文檔-繁體中文-blue?style=flat-square)](README_ZH-TW.md) [![English](https://img.shields.io/badge/Docs-English-red?style=flat-square)](README.md) [![Русский](https://img.shields.io/badge/Docs-Русский-blue?style=flat-square)](README_RU.md)

> [!Important]
> 📢 记住这个命令：fuck-u-code - 让代码不再烂到发指！

一款专门揭露屎山代码的质量分析工具，用犀利又搞笑的方式告诉你：**你的代码到底有多烂**。

## 特性

* **多语言支持**: Go, JavaScript, TypeScript, Python, Java, C, C++, Rust, C#, Lua, PHP, Ruby, Swift, Shell（14 种语言）
* **总体评分**: 0~100 分，越高代码质量越好
* **糟糕指数**: 单文件评分，越高越烂
* **七维度检测**: 复杂度 / 代码量 / 注释率 / 错误处理 / 命名 / 重复度 / 结构
* **AST 解析**: 基于 tree-sitter 的精确语法分析
* **AI 代码审查**: 集成 OpenAI 兼容 / Anthropic / DeepSeek / Gemini / Ollama
* **多格式输出**: 终端彩色 / Markdown / JSON / HTML
* **i18n**: 中文 / 英文 / 俄文
* **灵活配置**: `.fuckucoderc.json` 等多种格式，支持项目级和全局配置

> [!Note]
> 代码分析全程本地运行，不上传代码，安全无忧。
> AI 审查需要调用外部 API 或本地 Ollama。

## 安装

```bash
npm install -g eff-u-code
```

或源码构建：

```bash
git clone https://github.com/Done-0/fuck-u-code.git
cd fuck-u-code && npm install && npm run build
```

## 使用

### 代码分析

```bash
fuck-u-code analyze              # 分析当前目录
fuck-u-code analyze ./src        # 分析指定目录
fuck-u-code analyze . -v         # 详细模式（项目概览、语言分布、函数级指标）
fuck-u-code analyze . -t 20      # 显示最差的 20 个文件
fuck-u-code analyze . -l zh      # 中文输出
fuck-u-code analyze . -f markdown              # Markdown 终端渲染
fuck-u-code analyze . -f markdown -o report.md # 导出 Markdown
fuck-u-code analyze . -f html -o report.html   # 导出 HTML
fuck-u-code analyze . -f json -o report.json   # 导出 JSON
fuck-u-code analyze . -e "**/*.test.ts"        # 排除测试文件
```

| 选项 | 简写 | 说明 |
| --- | --- | --- |
| `--verbose` | `-v` | 详细输出 |
| `--top <n>` | `-t` | 最差前 N 个文件（默认 10） |
| `--format <fmt>` | `-f` | 格式: console/markdown/json/html |
| `--output <file>` | `-o` | 输出到文件 |
| `--exclude <glob>` | `-e` | 额外排除模式 |
| `--concurrency <n>` | `-c` | 并发数（默认 8） |
| `--locale <lang>` | `-l` | 语言: en/zh/ru/zh-tw |

> 提示：选项支持组合使用。例如：`fuck-u-code analyze . -v -l zh`（中文详细输出）。

### AI 代码审查

需先配置 AI 提供商（见 [AI 配置](#ai-配置)）。

```bash
fuck-u-code ai-review . -m gpt-4o                          # OpenAI 兼容
fuck-u-code ai-review . -p anthropic -m claude-sonnet-4-5-20250929  # Anthropic
fuck-u-code ai-review . -p ollama -m codellama              # 本地 Ollama
fuck-u-code ai-review . -m gpt-4o -t 3                     # 审查最差 3 个文件
fuck-u-code ai-review . -m gpt-4o -f markdown -o review.md # 导出 Markdown
fuck-u-code ai-review . -b https://your-api.com/v1 -k sk-xxx -m model # 自定义端点
```

| 选项 | 简写 | 说明 |
| --- | --- | --- |
| `--model <model>` | `-m` | 模型名称（必填） |
| `--provider <name>` | `-p` | 提供商: openai/anthropic/deepseek/gemini/ollama |
| `--base-url <url>` | `-b` | 自定义 API 端点 |
| `--api-key <key>` | `-k` | API 密钥 |
| `--top <n>` | `-t` | 审查最差前 N 个文件（默认 5） |
| `--format <fmt>` | `-f` | 格式: console/markdown/html |
| `--output <file>` | `-o` | 输出到文件 |
| `--verbose` | `-v` | 详细输出 |
| `--locale <lang>` | `-l` | 语言: en/zh/ru |

> 提示：选项支持组合使用。例如：`fuck-u-code ai-review . -m gpt-4o -v -l zh`。

### 配置管理

```bash
fuck-u-code config init                    # 生成 .fuckucoderc.json
fuck-u-code config show                    # 查看当前配置
fuck-u-code config set i18n.locale zh      # 设置默认语言
fuck-u-code config set ai.provider openai  # 设置 AI 提供商
fuck-u-code config set ai.model gpt-4o     # 设置 AI 模型
fuck-u-code config set ai.apiKey sk-xxx    # 设置 API 密钥
```

### 更新

更新 eff-u-code 到最新版本：

```bash
fuck-u-code update    # 更新到最新版本
```

将会执行：
- 检查当前安装的版本
- 检查 npm 上的最新版本
- 自动安装最新版本到全局

### 卸载

移除 fuck-u-code 并清理所有本地文件：

```bash
fuck-u-code uninstall    # 移除全局配置、MCP 配置和 npm 包
```

将删除以下内容：
- 全局配置文件（`~/.fuckucoderc.json`）
- MCP 服务器配置（Claude Code、Cursor）
- 全局 npm 包（`eff-u-code`）

## 配置文件

通过配置文件自动搜索，优先级：项目目录向上查找 > 全局配置 `~/.fuckucoderc.json`。

支持格式：`.fuckucoderc.json` / `.yaml` / `.js` / `fuckucode.config.js` / `package.json` 中的 `"fuckucode"` 字段。

全局配置路径：macOS/Linux `~/.fuckucoderc.json`，Windows `C:\Users\<用户名>\.fuckucoderc.json`。

完整示例（`.fuckucoderc.json`）：

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
    "locale": "zh"
  }
}
```

## AI 配置

支持 5 种提供商，优先级：命令行参数 > 环境变量 > 配置文件。

| 提供商 | 环境变量 | 示例命令 |
| --- | --- | --- |
| OpenAI 兼容 | `OPENAI_API_KEY` `OPENAI_MODEL` `OPENAI_BASE_URL` | `ai-review . -m gpt-4o` |
| Anthropic | `ANTHROPIC_API_KEY` | `ai-review . -p anthropic -m claude-sonnet-4-5-20250929` |
| DeepSeek | `DEEPSEEK_API_KEY` | `ai-review . -p deepseek -m deepseek-chat` |
| Gemini | `GEMINI_API_KEY` | `ai-review . -p gemini -m gemini-pro` |
| Ollama | `OLLAMA_HOST`（可选） | `ai-review . -p ollama -m codellama` |

```bash
# OpenAI 兼容
export OPENAI_API_KEY="sk-your-key"
export OPENAI_BASE_URL="https://api.openai.com/v1"  # 可选

# 或通过配置文件
fuck-u-code config set ai.provider openai
fuck-u-code config set ai.model gpt-4o
fuck-u-code config set ai.apiKey sk-your-key
fuck-u-code config set ai.baseUrl https://api.openai.com/v1
```

## MCP Server

fuck-u-code 提供 MCP (Model Context Protocol) Server，让 Claude Code、Cursor、Windsurf 等 AI 工具可以直接调用代码质量分析和 AI 代码审查功能。

### 配置方式

```bash
# 全局安装
npm install -g eff-u-code

# 自动配置（交互式）
fuck-u-code mcp-install

# 或直接指定目标
fuck-u-code mcp-install claude
fuck-u-code mcp-install cursor
```

**Claude Code**（`~/.claude.json` 或项目 `.mcp.json`）：

```json
{
  "mcpServers": {
    "fuck-u-code": {
      "command": "fuck-u-code-mcp"
    }
  }
}
```

**Cursor**（`.cursor/mcp.json`）：

```json
{
  "mcpServers": {
    "fuck-u-code": {
      "command": "fuck-u-code-mcp"
    }
  }
}
```

**免安装方式（npx）**：

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

### 可用工具

- **analyze** — 分析代码质量并生成评分报告
- **ai-review** — 对评分最差的文件执行 AI 代码审查

## 文件排除

工具自动读取 `.gitignore`（含子目录），遵循标准 gitignore 规则。额外排除可用 `--exclude` 或配置文件的 `exclude` 字段。

## 反馈

> 💬 欢迎参与开放讨论
> Discord: <https://discord.gg/9ThNkAFGnT>

## 贡献

欢迎提 PR，一起优化"fuck-u-code" 🚀

## 许可证

MIT

## 联系方式

- fenderisfine@gmail.com
- WeChat: l927171598

## 安利一下

- [Value Realization](https://github.com/Done-0/value-realization) — 产品价值发现分析 AI 技能（24小时内10万+浏览，首日100+星）
- [FateSpiral](https://fatespiral.com/) — AI 驱动的多人 RPG，无限世界，无限剧情
- [玄学工坊](https://destinyteller.com/) — AI 赛博算命网站
- [Jank](https://github.com/Done-0/Jank) — Go 语言开源博客
