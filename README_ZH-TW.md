# fuck-u-code [![中文](https://img.shields.io/badge/文檔-繁體中文-blue?style=flat-square)](README_ZH-TW.md) [![English](https://img.shields.io/badge/Docs-English-red?style=flat-square)](README.md) [![Русский](https://img.shields.io/badge/Docs-Русский-blue?style=flat-square)](README_RU.md)

<a href="https://trendshift.io/repositories/14999" target="_blank"><img src="https://trendshift.io/api/badge/repositories/14999" alt="Done-0%2Ffuck-u-code | Trendshift" style="width: 250px; height: 55px;" width="250" height="55"/></a>

> [!Important]
> 📢 記住這個命令：fuck-u-code - 讓程式不再爛到發指！

一款專門揭露屎山程式的品質分析工具，用犀利又搞笑的方式告訴你：**你的程式到底有多爛**。

## 特性

* **多語言支援**: Go, JavaScript, TypeScript, Python, Java, C, C++, Rust, C#, Lua, PHP, Ruby, Swift, Shell（14 種語言）
* **整體評分**: 0~100 分，越高程式品質越好
* **糟糕指數**: 單檔案評分，越高越爛
* **七維度檢測**: 複雜度 / 程式量 / 註解率 / 錯誤處理 / 命名 / 重複度 / 結構
* **AST 解析**: 基於 tree-sitter 的精確語法分析
* **AI 程式審查**: 整合 OpenAI 相容 / Anthropic / DeepSeek / Gemini / Ollama
* **多格式輸出**: 終端彩色 / Markdown / JSON / HTML
* **i18n**: 繁體中文 / 英文 / 俄文
* **靈活配置**: `.fuckucoderc.json` 等多種格式，支援專案級和全域配置

> [!Note]
> 程式分析全程本地運行，不上傳程式，安全無憂。
> AI 審查需要呼叫外部 API 或本地 Ollama。

## 安裝

```bash
npm install -g eff-u-code
```

或原始碼建構：

```bash
git clone https://github.com/Done-0/fuck-u-code.git
cd fuck-u-code && npm install && npm run build
```

## 使用

### 程式分析

```bash
fuck-u-code analyze              # 分析目前目錄
fuck-u-code analyze ./src        # 分析指定目錄
fuck-u-code analyze . -v         # 詳細模式（專案概覽、語言分布、函式級指標）
fuck-u-code analyze . -t 20      # 顯示最差的 20 個檔案
fuck-u-code analyze . -l zh-TW   # 繁體中文輸出
fuck-u-code analyze . -f markdown              # Markdown 終端渲染
fuck-u-code analyze . -f markdown -o report.md # 匯出 Markdown
fuck-u-code analyze . -f html -o report.html   # 匯出 HTML
fuck-u-code analyze . -f json -o report.json   # 匯出 JSON
fuck-u-code analyze . -e "**/*.test.ts"        # 排除測試檔案
```

| 選項 | 簡寫 | 說明 |
| --- | --- | --- |
| `--verbose` | `-v` | 詳細輸出 |
| `--top <n>` | `-t` | 最差前 N 個檔案（預設 10） |
| `--format <fmt>` | `-f` | 格式: console/markdown/json/html |
| `--output <file>` | `-o` | 輸出到檔案 |
| `--exclude <glob>` | `-e` | 額外排除模式 |
| `--concurrency <n>` | `-c` | 並發數（預設 8） |
| `--locale <lang>` | `-l` | 語言: en/zh/zh-TW/ru |

### AI 程式審查

需先設定 AI 服務商（見 [AI 設定](#ai-設定)）。

```bash
fuck-u-code ai-review . -m gpt-4o                          # OpenAI 相容
fuck-u-code ai-review . -p anthropic -m claude-sonnet-4-5-20250929  # Anthropic
fuck-u-code ai-review . -p ollama -m codellama              # 本地 Ollama
fuck-u-code ai-review . -m gpt-4o -t 3                     # 審查最差 3 個檔案
fuck-u-code ai-review . -m gpt-4o -f markdown -o review.md # 匯出 Markdown
fuck-u-code ai-review . -b https://your-api.com/v1 -k sk-xxx -m model # 自訂端點
```

| 選項 | 簡寫 | 說明 |
| --- | --- | --- |
| `--model <model>` | `-m` | 模型名稱（必填） |
| `--provider <name>` | `-p` | 服務商: openai/anthropic/deepseek/gemini/ollama |
| `--base-url <url>` | `-b` | 自訂 API 端點 |
| `--api-key <key>` | `-k` | API 金鑰 |
| `--top <n>` | `-t` | 審查最差前 N 個檔案（預設 5） |
| `--format <fmt>` | `-f` | 格式: console/markdown/html |
| `--output <file>` | `-o` | 輸出到檔案 |
| `--verbose` | `-v` | 詳細輸出 |
| `--locale <lang>` | `-l` | 語言: en/zh/zh-TW/ru |

### 設定管理

```bash
fuck-u-code config init                    # 生成 .fuckucoderc.json
fuck-u-code config show                    # 檢視目前設定
fuck-u-code config set i18n.locale zh-TW   # 設定預設語言
fuck-u-code config set ai.provider openai  # 設定 AI 服務商
fuck-u-code config set ai.model gpt-4o     # 設定 AI 模型
fuck-u-code config set ai.apiKey sk-xxx    # 設定 API 金鑰
```

### 更新

更新 eff-u-code 至最新版本：

```bash
fuck-u-code update    # 更新至最新版本
```

將會執行：
- 檢查目前安裝的版本
- 檢查 npm 上的最新版本
- 自動安裝最新版本至全域

### 移除

移除 fuck-u-code 並清理所有本機檔案：

```bash
fuck-u-code uninstall    # 移除全域設定、MCP 設定和 npm 套件
```

將會刪除以下內容：
- 全域設定檔（`~/.fuckucoderc.json`）
- MCP 伺服器設定（Claude Code、Cursor）
- 全域 npm 套件（`eff-u-code`）

## 設定檔

透過設定檔自動搜尋，優先級：專案目錄向上搜尋 > 全域設定 `~/.fuckucoderc.json`。

支援格式：`.fuckucoderc.json` / `.yaml` / `.js` / `fuckucode.config.js` / `package.json` 中的 `"fuckucode"` 欄位。

全域設定路徑：macOS/Linux `~/.fuckucoderc.json`，Windows `C:\Users\<使用者名稱>\.fuckucoderc.json`。

完整範例（`.fuckucoderc.json`）：

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
    "locale": "zh-TW"
  }
}
```

## AI 設定

支援 5 種服務商，優先級：命令列引數 > 環境變數 > 設定檔。

| 服務商 | 環境變數 | 範例命令 |
| --- | --- | --- |
| OpenAI 相容 | `OPENAI_API_KEY` `OPENAI_MODEL` `OPENAI_BASE_URL` | `ai-review . -m gpt-4o` |
| Anthropic | `ANTHROPIC_API_KEY` | `ai-review . -p anthropic -m claude-sonnet-4-5-20250929` |
| DeepSeek | `DEEPSEEK_API_KEY` | `ai-review . -p deepseek -m deepseek-chat` |
| Gemini | `GEMINI_API_KEY` | `ai-review . -p gemini -m gemini-pro` |
| Ollama | `OLLAMA_HOST`（可選） | `ai-review . -p ollama -m codellama` |

```bash
# OpenAI 相容
export OPENAI_API_KEY="sk-your-key"
export OPENAI_BASE_URL="https://api.openai.com/v1"  # 可選

# 或透過設定檔
fuck-u-code config set ai.provider openai
fuck-u-code config set ai.model gpt-4o
fuck-u-code config set ai.apiKey sk-your-key
fuck-u-code config set ai.baseUrl https://api.openai.com/v1
```

## MCP Server

fuck-u-code 提供 MCP (Model Context Protocol) Server，讓 Claude Code、Cursor、Windsurf 等 AI 工具可以直接呼叫程式品質分析和 AI 程式審查功能。

### 設定方式

```bash
# 全域安裝
npm install -g eff-u-code

# 自動設定（互動式）
fuck-u-code mcp-install

# 或直接指定目標
fuck-u-code mcp-install claude
fuck-u-code mcp-install cursor
```

**Claude Code**（`~/.claude.json` 或專案 `.mcp.json`）：

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

**免安裝方式（npx）**：

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

- **analyze** — 分析程式品質並產生評分報告
- **ai-review** — 對評分最差的檔案執行 AI 程式審查

## 檔案排除

工具自動讀取 `.gitignore`（含子目錄），遵循標準 gitignore 規則。額外排除可用 `--exclude` 或設定檔的 `exclude` 欄位。

## 回饋

> 💬 歡迎參與開放討論
> Discord: <https://discord.gg/9ThNkAFGnT>

## 貢獻

歡迎提 PR，一起最佳化"fuck-u-code" 🚀

## 許可證

MIT

## 聯絡方式

- fenderisfine@gmail.com
- WeChat: l927171598

## 安利一下

- [Value Realization](https://github.com/Done-0/value-realization) — 產品價值發現分析 AI 技能（24小時內10萬+瀏覽，首日100+星）
- [FateSpiral](https://fatespiral.com/) — AI 驅動的多人 RPG，無限世界，無限劇情
- [玄學工坊](https://destinyteller.com/) — AI 賽博算命網站
- [Jank](https://github.com/Done-0/Jank) — Go 語言開源部落格