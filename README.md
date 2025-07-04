# fuck-u-code

> [!Important]
>
> 📢 记住这个命令：`fuck-u-code` - 让代码不再烂到发指！

一个专为挖掘项目"屎坑"设计的代码质量分析工具，能无情揭露代码的丑陋真相，并用毫不留情的幽默语言告诉你：你的代码到底有多烂。

## 特性

- **多语言支持**: 全面分析 Go、JavaScript/TypeScript、Python、Java、C/C++ 等多种编程语言
- **屎山指数评分**: 0~100 分的质量评分系统
- **全面质量检测**: 七大维度（循环复杂度/函数长度/注释覆盖率/错误处理/命名规范/代码重复度/代码结构）评估代码质量
- **彩色终端报告**: 让代码审查不再枯燥，让队友笑着接受批评
- **灵活配置**: 支持详细模式、摘要模式、自定义报告选项以及多语言输出

> [!Note]
> 满分 100 分，分数越高表示代码质量越差，越像屎山代码。
> 欢迎各位高分大佬袭榜！

## 安装

### 1. 从源码安装

```bash
go install github.com/Done-0/fuck-u-code/cmd/fuck-u-code@latest
```

### 2. 从源码构建

```bash
git clone https://github.com/Done-0/fuck-u-code.git
cd fuck-u-code
go build -o fuck-u-code ./cmd/fuck-u-code
```

## 使用方法

### 基本分析

```bash
fuck-u-code analyze /path/to/your/project
# 或者 fuck-u-code /path/to/your/project
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
| `--lang`     | `-l`   | 指定输出语言 (zh-CN, en-US)        |
| `--exclude`  | `-e`   | 排除特定文件/目录模式 (可多次使用) |

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
```

## 高级用法

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

## 许可证

本项目采用 MIT 许可证

## 安利一下

另一个开源项目 [Jank](https://github.com/Done-0/Jank)
