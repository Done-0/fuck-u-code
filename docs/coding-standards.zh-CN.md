# TypeScript 编码规范

## 一、命名规范

### 基本原则

遵循 TypeScript 官方 [TypeScript Handbook](https://www.typescriptlang.org/docs/handbook/) 和社区最佳实践。命名应清晰、准确且具有描述性，避免使用非通用的缩写。

### 1. 文件与目录

必须使用 `kebab-case`（短横线命名法），全部小写，单词间用短横线分隔。

```typescript
// 正确
src/file-discovery.ts
src/tree-sitter-parser.ts
src/ai-review.ts

// 错误
src/FileDiscovery.ts
src/treeSitterParser.ts
src/AIReview.ts
```

### 2. 类、接口、类型别名与枚举

必须使用 `PascalCase`（大驼峰命名法）。

```typescript
class FileAnalyzer { ... }
interface ParseResult { ... }
type MetricCategory = 'complexity' | 'size';
enum Severity { Info, Warning, Error }
```

### 3. 变量、参数、函数与方法

必须使用 `camelCase`（小驼峰命名法）。

```typescript
const fileCount = 3;
function analyzeFile(filePath: string): ParseResult { ... }
const calculateScore = (metrics: MetricResult[]) => { ... };
```

### 4. 常量

全局常量使用 `UPPER_SNAKE_CASE`，局部常量使用 `camelCase`。

```typescript
// 全局常量
export const MAX_CONCURRENCY = 8;
export const DEFAULT_TIMEOUT = 30000;

// 局部常量
const maxRetries = 3;
const defaultValue = 'unknown';
```

### 5. 泛型参数

使用单个大写字母或描述性名称。

```typescript
// 简单泛型
function identity<T>(arg: T): T { return arg; }

// 描述性泛型
interface Repository<TEntity, TId> {
  findById(id: TId): Promise<TEntity | null>;
}
```

### 6. 私有成员

使用 `#` 前缀（ES2022 私有字段）或 `private` 关键字。

```typescript
class Parser {
  #cache: Map<string, ParseResult>;
  private config: Config;
}
```

## 二、注释规范

### 核心原则

代码应自解释，最小化注释。注释必须解释"为什么"（WHY），而不是"做什么"（WHAT）。

### 1. 何时添加注释

仅在以下情况添加注释：
- 复杂的业务逻辑或算法
- 非显而易见的技术决策
- 重要的性能优化考虑
- 临时的 workaround 或 hack（必须说明原因和计划）

禁止添加注释的情况：
- 描述代码"做了什么"（代码本身应该清晰表达）
- 重复变量名或函数名的信息
- 显而易见的逻辑
- 已过时或不再相关的内容

### 2. 注释语言

必须使用英文注释。

```typescript
// 正确：英文注释
// Skip validation if user is admin to improve performance

// 错误：中文注释
// 如果用户是管理员则跳过验证以提高性能
```

### 3. 文档注释

使用 JSDoc 风格进行公共 API 的文档注释。

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

### 4. 文件头注释

每个文件应以简短的模块说明开头。

```typescript
/**
 * Tree-sitter based parser for Go language.
 * Provides accurate AST analysis for complexity metrics.
 */

import Parser from 'web-tree-sitter';
// ...
```

## 三、代码风格

### 1. 导入规范 (Import)

顺序如下，每组之间用空行分隔，组内按字母顺序排序：

1. Node.js 内置模块（带 `node:` 前缀）
2. 第三方依赖
3. 项目内部模块（相对路径）
4. 类型导入（`import type`）

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

### 2. 格式化

必须使用 Prettier 格式化代码。配置如下：

```json
{
  "semi": true,
  "singleQuote": true,
  "tabWidth": 2,
  "trailingComma": "es5",
  "printWidth": 100
}
```

### 3. 类型声明

优先使用 `interface` 定义对象类型，使用 `type` 定义联合类型、交叉类型或类型别名。

```typescript
// 对象类型使用 interface
interface User {
  id: string;
  name: string;
}

// 联合类型使用 type
type Status = 'pending' | 'active' | 'completed';

// 类型别名使用 type
type UserId = string;
```

### 4. 严格类型检查

启用所有严格类型检查选项：

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

### 5. 错误处理

使用类型安全的错误处理模式。

```typescript
// 自定义错误类
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

// 使用 Result 模式（可选）
type Result<T, E = Error> = { ok: true; value: T } | { ok: false; error: E };
```

### 6. 异步代码

优先使用 `async/await`，避免回调地狱。

```typescript
// 正确
async function fetchData(): Promise<Data> {
  const response = await fetch(url);
  const data = await response.json();
  return data;
}

// 错误
function fetchData(): Promise<Data> {
  return fetch(url)
    .then(response => response.json())
    .then(data => data);
}
```

### 7. 模块导出

使用命名导出，避免默认导出。

```typescript
// 正确
export function createParser(): Parser { ... }
export class Analyzer { ... }

// 错误
export default class Analyzer { ... }
```

## 四、项目架构

### 目录结构

```
src/
├── cli/                    # CLI 入口和命令
│   ├── commands/           # 子命令实现
│   └── output/             # 输出格式化
├── analyzer/               # 分析器核心
├── parser/                 # 语言解析器
│   └── languages/          # 语言特定实现
├── metrics/                # 指标计算
│   ├── complexity/         # 复杂度指标
│   ├── size/               # 代码量指标
│   └── ...
├── scoring/                # 评分系统
├── ai/                     # AI 集成
│   └── providers/          # AI 提供商
├── config/                 # 配置管理
├── i18n/                   # 国际化
│   └── locales/            # 语言文件
└── utils/                  # 工具函数
```

### 模块职责

1. **CLI 层**：命令行参数解析、用户交互
2. **分析器层**：文件发现、并发控制、结果聚合
3. **解析器层**：AST 解析、语言检测
4. **指标层**：各类代码质量指标计算
5. **评分层**：指标归一化、加权评分
6. **AI 层**：AI 提供商抽象、代码审查

## 五、依赖管理

### 选择原则

1. 优先使用 Node.js 内置模块
2. 选择社区认可度高、维护活跃的库
3. 避免引入过多依赖

### 核心依赖

| 依赖 | 用途 |
|------|------|
| commander | CLI 框架 |
| chalk | 终端颜色 |
| ora | 进度指示器 |
| glob | 文件匹配 |
| ignore | gitignore 解析 |
| zod | 运行时类型验证 |
| web-tree-sitter | AST 解析 |

## 六、国际化（i18n）

### 基本原则

- 所有面向用户的文本必须通过 `t()` 函数输出，禁止硬编码字符串。
- 支持三种语言：英文（en）、中文（zh）、俄文（ru）。
- 语言文件位于 `src/i18n/locales/`，使用 JSON 格式。
- 新增用户可见文本时，必须同时更新三个语言文件。

```typescript
// 正确
console.log(t('analysisComplete'));
logger.warn(t('warn_file_too_large', { size: fileSizeKB, file: relativePath }));

// 错误
console.log('Analysis complete');
console.warn(`Skipping large file: ${file}`);
```

## 七、测试规范

### 基本原则

- 遵循生产级测试标准，须覆盖正常流程、边界条件及畸形输入。
- 使用 Vitest 作为测试框架。

### 文件与命名

- 测试文件命名：`*.test.ts` 或 `*.spec.ts`。
- 测试文件放在 `tests/` 目录或与源文件同目录。

### 测试结构

```typescript
describe('RoundRobinSelector', () => {
  it('should return null when no providers enabled', () => {});
  it('should rotate through instances in order', () => {});
  it('should skip rate-limited instances', () => {});
  it('should handle empty config gracefully', () => {});
});
```

### 运行测试

```bash
npm test              # 运行所有测试
npm run test:coverage # 测试覆盖率
```

## 八、常用命令

### 开发

```bash
# 安装依赖
npm install

# 开发模式（监听变更）
npm run dev

# 构建
npm run build

# 运行
npm start
```

### 代码质量

```bash
# 格式化
npm run format

# 检查格式
npm run format:check

# Lint
npm run lint

# Lint 并修复
npm run lint:fix
```

### 测试

```bash
# 运行测试
npm test

# 测试覆盖率
npm run test:coverage
```

## 九、Git 提交规范

### Commit Message 格式

```
<type>(<scope>): <subject>

<body>

<footer>
```

### Type 类型

- `feat`: 新功能
- `fix`: Bug 修复
- `docs`: 文档更新
- `style`: 代码格式（不影响功能）
- `refactor`: 重构
- `perf`: 性能优化
- `test`: 测试相关
- `chore`: 构建/工具变更

### 示例

```
feat(parser): add tree-sitter support for Go language

- Implement GoParser using web-tree-sitter
- Add cyclomatic complexity calculation
- Support function and method detection

Closes #123
```
