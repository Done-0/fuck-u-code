# fuck-u-code

> [!Important]
>
> 📢 记住这个命令：`fuck-u-code` - 让代码不再烂到发指！

一个专为挖掘项目"屎坑"设计的代码质量分析工具，能无情揭露代码的丑陋真相，并用毫不留情的幽默语言告诉你：你的代码到底有多烂。

## 特性

- **多语言支持**: 全面分析 Go、JavaScript/TypeScript、Python、Java、C/C++、Rust 等多种编程语言
- **屎山指数评分**: 0~100 分的质量评分系统
- **全面质量检测**: 七大维度（循环复杂度/函数长度/注释覆盖率/错误处理/命名规范/代码重复度/代码结构）评估代码质量
- **彩色终端报告**: 让代码审查不再枯燥，让队友笑着接受批评
- **Markdown输出**: 生成结构化报告，便于AI工具处理和文档集成
- **灵活配置**: 支持详细模式、摘要模式、自定义报告选项以及多语言输出

> [!Note]
> 满分 100 分，分数越高表示代码质量越差，越像屎山代码。
> 欢迎各位高分大佬袭榜！
>
> 声明：本项目无需联网，完全基于本地运行，并不会获取到您宝贵的代码，从而带来安全隐患。

## 安利一下

AI 赛博算命网站 👉 [玄学工坊](https://bazi.site)

开源博客项目 [Jank](https://github.com/Done-0/Jank)

## 安装

### 1. 从源码安装

#### 使用Go安装

```bash
go install github.com/Done-0/fuck-u-code/cmd/fuck-u-code@latest
```

#### 使用npm安装

```bash
npm install -g fuck-u-code
```

### 2. 从源码构建

```bash
git clone https://github.com/Done-0/fuck-u-code.git
cd fuck-u-code
go build -o fuck-u-code ./cmd/fuck-u-code
```

### 3. 从Docker构建

```bash
docker build -t fuck-u-code .
```

## 使用方法

### 基本分析

```bash
fuck-u-code analyze /path/to/your/project
# 或者 fuck-u-code /path/to/your/project
```

从Docker镜像中运行:

```bash
docker run --rm -v "/path/to/your/project:/build" fuck-u-code analyze
```

不指定路径时，默认分析当前目录:

```bash
fuck-u-code analyze
```

### 命令行选项

| 选项         | 简写   | 描述                               |
| ------------ | ------ | ---------------------------------- |
| `--verbose`  | `-v`   | 显示详细分析报告                   |
| `--top N`    | `-t N` | 显示问题最多的前 N 个文件 (默认 5) |
| `--issues N` | `-i N` | 每个文件显示 N 个问题 (默认 5)     |
| `--summary`  | `-s`   | 只显示总结结论，不看过程           |
| `--markdown` | `-m`   | 输出Markdown格式报告，便于AI工具处理 |
| `--lang`     | `-l`   | 指定输出语言 (zh-CN, en-US)        |
| `--exclude`  | `-e`   | 排除特定文件/目录模式 (可多次使用) |
| `--skipindex`  | `-x`   | 跳过index.js/index.ts文件 |
### 使用示例

```bash
# 分析并显示详细报告
fuck-u-code analyze --verbose

# 只查看最糟糕的3个文件
fuck-u-code analyze --top 3

# 英文报告
fuck-u-code analyze --lang en-US

# 只查看总结信息
fuck-u-code analyze --summary

# 排除特定文件夹
fuck-u-code analyze --exclude "**/test/**" --exclude "**/legacy/**"

# 输出Markdown格式报告
fuck-u-code analyze --markdown

# 保存Markdown报告到文件
fuck-u-code analyze --markdown > report.md

# 生成英文Markdown报告
fuck-u-code analyze --markdown --lang en-US > english-report.md
```

## 高级用法

### Markdown 输出

使用 `--markdown` 选项可以输出结构化的Markdown格式报告，特别适合：

- **AI工具处理**: 便于ChatGPT、Claude等AI工具分析和提供修复建议
- **文档集成**: 直接集成到项目文档或Wiki中
- **CI/CD流程**: 在持续集成中生成代码质量报告
- **团队协作**: 分享给团队成员进行代码审查

```bash
# 基本Markdown输出
fuck-u-code analyze --markdown

# 保存到文件
fuck-u-code analyze --markdown > code-quality-report.md

# 结合其他选项
fuck-u-code analyze --markdown --top 10 --lang en-US > detailed-report.md

# 只输出总结（适合概览）
fuck-u-code analyze --markdown --summary > summary.md
```

Markdown输出包含：
- 📊 **总体评估**: 质量评分、等级、文件统计
- 📋 **质量指标表格**: 各项指标得分和状态
- 🔍 **问题文件列表**: 按严重程度排序的问题文件
- 💡 **改进建议**: 按优先级分类的具体建议

### 分析前端项目

前端项目通常包含大量依赖和生成文件，工具默认已排除以下路径：

- node_modules、bower_components
- dist、build、.next、out、.cache、.nuxt、.output
- 压缩文件 (_.min.js, _.bundle.js, \_.chunk.js)
- 静态资源文件夹 (public/assets, static/js, static/css)

### 分析后端项目

分析后端项目时，工具默认会排除以下内容：

- vendor、bin、target、obj
- 临时文件夹 (tmp, temp, logs)
- 生成文件 (generated, migrations)
- 测试数据 (testdata, test-results)

## 疑难解答

- 在 Linux、Mac 运行时提示`command not found`、`Unknown command`等

  - 这是因为 go 的 bin 目录没有加入到 PATH 中，运行`export PATH="$PATH:$(go env GOPATH)/bin"`后再试

  - 将这条指令加入到 .bash_profile、.zshrc、fish.config 中，就不需要每次打开终端都执行了

## 许可证

本项目采用 MIT 许可证

## 贡献

欢迎提交 PR 为屎山代码检测器贡献您的代码
