
# fuck-u-code [![Русский](https://img.shields.io/badge/Docs-Русский-blue?style=flat-square)](README_RU.md) [![English](https://img.shields.io/badge/Docs-English-red?style=flat-square)](README.md) [![中文](https://img.shields.io/badge/文档-简体中文-blue?style=flat-square)](README_ZH.md)

> [!Important]
> 📢 Запомните данную команду: `fuck-u-code` - пусть плохому коду негде будет спрятаться!

Инструмент для **выявления дерьмового качества кода** с резкими, но юмористическими отзывами, показывающий **насколько ужасен ваш код**.

## Особенности

* **Поддержка нескольких языков**: Go, JavaScript, TypeScript, Python, Java, C, C++, Rust, C#, Lua, PHP, Ruby, Swift, Shell (14 языков)
* **Общая оценка**: 0~100, чем выше, тем лучше качество кода
* **Индекс Shit-Gas**: Оценка по файлу, чем выше, тем хуже
* **Семь проверок качества**: Сложность / Размер / Комментарии / Обработка ошибок / Именование / Дублирование / Структура
* **AST-парсинг**: Точный синтаксический анализ на основе tree-sitter
* **AI-обзор кода**: Интеграция с OpenAI-совместимыми / Anthropic / DeepSeek / Gemini / Ollama
* **Множество форматов вывода**: Цветной терминал / Markdown / JSON / HTML
* **i18n**: Английский / Китайский / Русский
* **Гибкая настройка**: `.fuckucoderc.json` и другие форматы, поддержка проектной и глобальной конфигурации

> [!Note]
> Анализ кода работает полностью автономно — ваш код никогда не покидает ваш компьютер.
> AI-обзор требует внешнего API или локального Ollama.

## Установка

```bash
npm install -g eff-u-code
```

Или сборка из исходников:

```bash
git clone https://github.com/Done-0/fuck-u-code.git
cd fuck-u-code && npm install && npm run build
```

## Использование

### Анализ кода

```bash
fuck-u-code analyze              # Анализ текущей директории
fuck-u-code analyze ./src        # Анализ указанной директории
fuck-u-code analyze . -v         # Подробный режим (обзор проекта, языки, метрики функций)
fuck-u-code analyze . -t 20      # Показать 20 худших файлов
fuck-u-code analyze . -l ru      # Русский вывод
fuck-u-code analyze . -f markdown              # Markdown в терминале
fuck-u-code analyze . -f markdown -o report.md # Экспорт Markdown
fuck-u-code analyze . -f html -o report.html   # Экспорт HTML
fuck-u-code analyze . -f json -o report.json   # Экспорт JSON
fuck-u-code analyze . -e "**/*.test.ts"        # Исключить тесты
```

| Опция | Сокр. | Описание |
| --- | --- | --- |
| `--verbose` | `-v` | Подробный вывод |
| `--top <n>` | `-t` | Топ N худших файлов (по умолчанию 10) |
| `--format <fmt>` | `-f` | Формат: console/markdown/json/html |
| `--output <file>` | `-o` | Записать в файл |
| `--exclude <glob>` | `-e` | Дополнительные шаблоны исключения |
| `--concurrency <n>` | `-c` | Параллельные воркеры (по умолчанию 8) |
| `--locale <lang>` | `-l` | Язык: en/zh/ru |

### AI-обзор кода

Требуется настройка AI-провайдера (см. [Настройка AI](#настройка-ai)).

```bash
fuck-u-code ai-review . -m gpt-4o                          # OpenAI-совместимый
fuck-u-code ai-review . -p anthropic -m claude-sonnet-4-5-20250929  # Anthropic
fuck-u-code ai-review . -p ollama -m codellama              # Локальный Ollama
fuck-u-code ai-review . -m gpt-4o -t 3                     # Обзор 3 худших
fuck-u-code ai-review . -m gpt-4o -f markdown -o review.md # Экспорт Markdown
fuck-u-code ai-review . -b https://your-api.com/v1 -k sk-xxx -m model # Свой эндпоинт
```

| Опция | Сокр. | Описание |
| --- | --- | --- |
| `--model <model>` | `-m` | Модель (обязательно) |
| `--provider <name>` | `-p` | Провайдер: openai/anthropic/deepseek/gemini/ollama |
| `--base-url <url>` | `-b` | Пользовательский API-эндпоинт |
| `--api-key <key>` | `-k` | API-ключ |
| `--top <n>` | `-t` | Обзор N худших файлов (по умолчанию 5) |
| `--format <fmt>` | `-f` | Формат: console/markdown/html |
| `--output <file>` | `-o` | Записать в файл |
| `--verbose` | `-v` | Подробный вывод |
| `--locale <lang>` | `-l` | Язык: en/zh/ru |

### Управление конфигурацией

```bash
fuck-u-code config init                    # Создать .fuckucoderc.json
fuck-u-code config show                    # Показать конфигурацию
fuck-u-code config set i18n.locale ru      # Установить язык
fuck-u-code config set ai.provider openai  # Установить AI-провайдера
fuck-u-code config set ai.model gpt-4o     # Установить модель
fuck-u-code config set ai.apiKey sk-xxx    # Установить API-ключ
```

### Обновление

Обновить eff-u-code до последней версии:

```bash
fuck-u-code update    # Обновить до последней версии
```

Будет выполнено:
- Проверка текущей установленной версии
- Проверка последней версии на npm
- Автоматическая установка последней версии глобально

### Удаление

Удалить fuck-u-code и очистить все локальные файлы:

```bash
fuck-u-code uninstall    # Удалить глобальную конфигурацию, записи MCP и npm-пакет
```

Будет удалено:
- Глобальный файл конфигурации (`~/.fuckucoderc.json`)
- Записи MCP-сервера (Claude Code, Cursor)
- Глобальный npm-пакет (`eff-u-code`)

## Файл конфигурации

Автоматический поиск конфигурации от директории проекта вверх, затем глобальный `~/.fuckucoderc.json`.

Поддерживаемые форматы: `.fuckucoderc.json` / `.yaml` / `.js` / `fuckucode.config.js` / поле `"fuckucode"` в `package.json`.

Путь глобальной конфигурации: macOS/Linux `~/.fuckucoderc.json`, Windows `C:\Users\<имя>\.fuckucoderc.json`.

Полный пример (`.fuckucoderc.json`):

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
    "locale": "ru"
  }
}
```

## Настройка AI

Поддержка 5 провайдеров. Приоритет: флаги CLI > переменные окружения > файл конфигурации.

| Провайдер | Переменные окружения | Пример |
| --- | --- | --- |
| OpenAI-совместимый | `OPENAI_API_KEY` `OPENAI_MODEL` `OPENAI_BASE_URL` | `ai-review . -m gpt-4o` |
| Anthropic | `ANTHROPIC_API_KEY` | `ai-review . -p anthropic -m claude-sonnet-4-5-20250929` |
| DeepSeek | `DEEPSEEK_API_KEY` | `ai-review . -p deepseek -m deepseek-chat` |
| Gemini | `GEMINI_API_KEY` | `ai-review . -p gemini -m gemini-pro` |
| Ollama | `OLLAMA_HOST` (необязательно) | `ai-review . -p ollama -m codellama` |

Настройка через переменные окружения:

```bash
# OpenAI-совместимый (любой OpenAI-совместимый сервис)
export OPENAI_API_KEY="sk-your-key"
export OPENAI_BASE_URL="https://api.openai.com/v1"  # Необязательно

# Или через файл конфигурации
fuck-u-code config set ai.provider openai
fuck-u-code config set ai.model gpt-4o
fuck-u-code config set ai.apiKey sk-your-key
fuck-u-code config set ai.baseUrl https://api.openai.com/v1
```

## MCP Server

fuck-u-code предоставляет MCP (Model Context Protocol) Server, позволяющий AI-инструментам, таким как Claude Code, Cursor, Windsurf и др., напрямую вызывать анализ качества кода и AI-обзор кода.

### Настройка

```bash
# Глобальная установка
npm install -g eff-u-code

# Автоматическая настройка (интерактивная)
fuck-u-code mcp-install

# Или указать цель напрямую
fuck-u-code mcp-install claude
fuck-u-code mcp-install cursor
```

**Claude Code** (`~/.claude.json` или `.mcp.json` проекта):

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

**Без глобальной установки (npx)**:

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

### Доступные инструменты

- **analyze** — Анализ качества кода и генерация отчёта с оценкой
- **ai-review** — AI-обзор файлов с наихудшими оценками

## Исключение файлов

Инструмент читает `.gitignore` (включая вложенные) и следует стандартным правилам gitignore. Для дополнительных исключений используйте `--exclude` или поле `exclude` в конфигурации.

## Обратная связь

> 💬 Поделитесь своими мыслями
> Discord: <https://discord.gg/9ThNkAFGnT>

## Вклад

PR приветствуются — давайте улучшать **fuck-u-code** вместе 🚀

## Лицензия

MIT

## Контакты

- fenderisfine@gmail.com
- WeChat: l927171598

## Другие проекты

- [Value Realization](https://github.com/Done-0/value-realization) — AI-навык для анализа ценности продукта (100K+ просмотров за 24ч, 100+ звезд в первый день)
- [FateSpiral](https://fatespiral.com/) — AI-мультиплеерная RPG, бесконечные миры, развивающиеся истории
- [DestinyTeller](https://destinyteller.com/) — AI-сайт предсказаний судьбы
- [Jank](https://github.com/Done-0/Jank) — Блог-система с открытым исходным кодом на Go
