# fuck-u-code Desktop

A desktop app for the fuck-u-code analyzer, built with Electron, React and the [Astryx](https://github.com/facebook/astryx) component library.

fuck-u-code 的桌面版：选一个文件夹（或直接拖进窗口），就能看到屎山指数、各项指标、最臭的文件和函数，还可以让 AI 给出重构建议。

## Features

- Pick or drag in a project folder; progress is shown while files are analyzed
- Overview: mess index gauge, quality level, metric breakdown, categories, languages
- Files: sortable and searchable table, with a detail panel showing metrics, issue locations and functions
- Functions: every function across the project, sorted by complexity
- AI review of the worst files (OpenAI-compatible, Anthropic, DeepSeek, Gemini, Ollama); set the URL and key, then pick from the models the provider lists
- Export the report as HTML, Markdown or JSON, and AI reviews as Markdown or HTML
- Recent projects reopen from a cached report (the last one opens on launch); analysis only runs again when you click Re-analyze
- Light/dark theme, UI in 简体中文 / 繁體中文 / English / Русский

## How it works

The app runs the same analyzer as the CLI. `npm run sync-core` compiles the
repository root (`tsc`) and copies `../dist` into `desktop/core`, where the
Electron main process imports it. File contents stay in the main process; the
renderer only receives scores and metrics through the preload bridge
(`window.fuc`).

Settings live in the user data directory. The AI API key is encrypted with the
operating system keychain (`safeStorage`) and never reaches the renderer. With
no model configured in the app, AI review falls back to the CLI's environment
variables (`OPENAI_API_KEY`, `ANTHROPIC_API_KEY`, ...) and `.fuckucoderc`.

## Development

Install the root dependencies first, then the desktop ones:

```bash
npm install
cd desktop
npm install
npm run dev
```

If the Electron binary download is slow or fails, point it at a mirror, for example
`ELECTRON_MIRROR=https://npmmirror.com/mirrors/electron/`.

| Script | What it does |
| --- | --- |
| `npm run dev` | Rebuild the analyzer, start Vite and open the app; the UI hot-reloads and changes under `electron/` restart Electron |
| `npm run build` | Rebuild the analyzer and build the renderer into `out/` |
| `npm start` | Run the built app |
| `npm run dist` | Build installers into `release/` (NSIS on Windows, DMG on macOS, AppImage on Linux) |
| `npm run preview:browser` | Run the UI in a normal browser at `http://127.0.0.1:5175/?project=<path>`, backed by the real analyzer (development only; AI review and file actions are disabled) |

## Credits

- Icons: [Phosphor Icons](https://phosphoricons.com) (MIT)
- Emoji: [Microsoft Fluent Emoji](https://github.com/microsoft/fluentui-emoji) 3D set (MIT), bundled in `src/assets/emoji` with its license

## Layout

```
desktop/
├── electron/
│   ├── main.mjs       window, menu and IPC handlers
│   ├── preload.cjs    window.fuc bridge
│   ├── service.mjs    analysis, exports and AI review on top of core/
│   └── settings.mjs   persisted settings and encrypted API key
├── scripts/           sync-core, dev runner, browser preview
└── src/               React renderer: App.jsx wires hooks/ (navigation, settings,
                       project, review, folder drop) to views/ via ViewRouter
```
