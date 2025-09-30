# fuck-u-code [![中文](https://img.shields.io/badge/文档-简体中文-blue?style=flat-square)](README.md) [![English](https://img.shields.io/badge/Docs-English-red?style=flat-square)](README_EN.md) [![Русский](https://img.shields.io/badge/Docs-Русский-blue?style=flat-square)](README_RU.md)

> [!Important]
> 📢 记住这个命令：fuck-u-code - 让代码不再烂到发指！

一款专门揭露屎山代码的质量分析工具，用犀利又搞笑的方式告诉你：**你的代码到底有多烂**。

## 特性

* **多语言支持**: Go、JS/TS、Python、Java、C/C++
* **屎山指数**: 0\~100 分，越高越烂
* **七维度检测**: 复杂度 / 函数长度 / 注释率 / 错误处理 / 命名 / 重复度 / 结构
* **彩色终端报告**: 批评也能笑着听
* **Markdown 输出**: 方便 AI 分析与文档集成
* **灵活配置**: 摘要 / 详细模式，多语言报告

> [!Note]
>
> * 分数越高越烂，欢迎“高分大佬”上榜
> * 全程本地运行，不上传代码，安全无忧
  
## 安装

```bash
# 方法一：Go 安装
go install github.com/Done-0/fuck-u-code/cmd/fuck-u-code@latest

# 方法二：源码构建
git clone https://github.com/Done-0/fuck-u-code.git
cd fuck-u-code && go build -o fuck-u-code ./cmd/fuck-u-code

# 方法三：Docker 构建
docker build -t fuck-u-code .
```

## 使用方法

```bash
# 基本分析
fuck-u-code analyze /path/to/project
# 或
fuck-u-code /path/to/project

# Docker 运行
docker run --rm -v "/path/to/project:/build" fuck-u-code analyze

# 默认分析当前目录
fuck-u-code analyze
```

### 常用选项

| 选项            | 简写   | 描述                 |
| ------------- | ---- | ------------------ |
| `--verbose`   | `-v` | 显示详细报告             |
| `--top N`     | `-t` | 最烂的前 N 个文件         |
| `--issues N`  | `-i` | 每文件显示 N 个问题        |
| `--summary`   | `-s` | 只看总结，不看过程          |
| `--markdown`  | `-m` | 输出 Markdown 格式报告   |
| `--lang`      | `-l` | 报告语言 (zh-CN/en-US/ru-RU) |
| `--exclude`   | `-e` | 排除指定目录或文件          |
| `--skipindex` | `-x` | 跳过 index.js/ts 文件  |

### 示例

```bash
fuck-u-code analyze --verbose
fuck-u-code analyze --top 3
fuck-u-code analyze --lang en-US
fuck-u-code analyze --summary
fuck-u-code analyze --exclude "**/test/**"
fuck-u-code analyze --markdown > report.md
```

## 高级用法

### Markdown 输出

适合 **AI 分析、文档集成、CI/CD、团队协作**

```bash
fuck-u-code analyze --markdown
fuck-u-code analyze --markdown > report.md
fuck-u-code analyze --markdown --top 10 --lang en-US > report.md
```

Markdown 报告包含：总体评分 / 指标表格 / 问题文件 / 改进建议

### 默认排除路径

* 前端: `node_modules`、`dist`、`build`、`*.min.js` 等
* 后端: `vendor`、`bin`、`target`、`logs`、`migrations` 等

## 疑难解答

* `command not found` → 把 Go bin 路径加到 `PATH`：

  ```bash
  export PATH="$PATH:$(go env GOPATH)/bin"
  ```

  并写入 `.bash_profile` / `.zshrc` 等

## 许可证

MIT

## 贡献

欢迎提 PR，一起优化“fuck-u-code” 🚀

## 安利一下

- [玄学工坊](https://bazi.site) — AI 赛博算命网站  
- [Jank](https://github.com/Done-0/Jank) — Go 语言开源博客
