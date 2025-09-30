// Package i18n 提供国际化和本地化支持
// 创建者：Done-0
package i18n

import (
	"fmt"
	"strings"
)

// Language 表示支持的语言
type Language string

const (
	// ZhCN 简体中文
	ZhCN Language = "zh-CN"

	// EnUS 英文（美国）
	EnUS Language = "en-US"

	// RuRU
	RuRU Language = "ru-RU"
)

// Translator 翻译器接口
type Translator interface {
	// Translate 翻译指定的键
	Translate(key string, args ...interface{}) string

	// GetLanguage 获取当前语言
	GetLanguage() Language
}

// DefaultTranslator 默认翻译器实现
type DefaultTranslator struct {
	language Language
	messages map[string]string
}

// NewTranslator 创建新的翻译器
func NewTranslator(language Language) Translator {
	translator := &DefaultTranslator{
		language: language,
		messages: make(map[string]string),
	}

	// 加载语言包
	translator.loadMessages()

	return translator
}

// Translate 翻译指定的键
func (t *DefaultTranslator) Translate(key string, args ...interface{}) string {
	if msg, ok := t.messages[key]; ok {
		if len(args) > 0 {
			return fmt.Sprintf(msg, args...)
		}
		return msg
	}

	// 如果找不到翻译，返回键本身
	return key
}

// GetLanguage 获取当前语言
func (t *DefaultTranslator) GetLanguage() Language {
	return t.language
}

// loadMessages 加载语言包
func (t *DefaultTranslator) loadMessages() {
	switch t.language {
	case ZhCN:
		t.messages = zhCNMessages
	case EnUS:
		t.messages = enUSMessages
	case RuRU:
		t.messages = ruRuMessages
	default:
		t.messages = enUSMessages // 默认使用英文
	}
}

// FormatKey 格式化翻译键，将多个部分组合成一个键
func FormatKey(parts ...string) string {
	return strings.Join(parts, ".")
}

// 中文语言包
var zhCNMessages = map[string]string{
	// 通用
	"app.name":        "屎山代码检测器",
	"app.description": "一个专为挖掘\"屎山代码\"设计的工具，能无情揭露代码的丑陋真相，并用毫不留情的幽默语言告诉你：你的代码到底有多烂。",

	// 指标名称
	"metric.cyclomatic_complexity": "循环复杂度",
	"metric.function_length":       "状态管理",
	"metric.comment_ratio":         "注释覆盖率",
	"metric.error_handling":        "错误处理",
	"metric.naming_convention":     "命名规范",
	"metric.code_duplication":      "代码重复度",
	"metric.structure_analysis":    "代码结构",

	// 分析器进度
	"analyzer.searching_files":   "正在搜索源代码文件...",
	"analyzer.files_found":       "已找到文件数",
	"analyzer.analyzing_files":   "正在分析文件...",
	"analyzer.analysis_complete": "分析完成",

	// 问题分类
	"report.no_issues":           "恭喜！没有特别多问题的文件！",
	"issue.category.complexity":  "复杂度问题",
	"issue.category.comment":     "注释问题",
	"issue.category.naming":      "命名问题",
	"issue.category.structure":   "结构问题",
	"issue.category.duplication": "重复问题",
	"issue.category.error":       "错误处理问题",
	"issue.category.other":       "其他问题",

	// 质量等级
	"level.clean":             "清新可人",
	"level.mild":              "偶有异味",
	"level.moderate":          "微臭青年",
	"level.bad":               "屎气扑鼻",
	"level.terrible":          "中度屎山",
	"level.disaster":          "隐性毒瘤",
	"level.disaster.severe":   "重度屎山",
	"level.disaster.very_bad": "代码化尸场",
	"level.disaster.extreme":  "核平级灾难",
	"level.disaster.worst":    "祖传老屎",
	"level.disaster.ultimate": "终极屎王",

	// 命令行
	"cmd.short":                      "💻 fuck-u-code",
	"cmd.long":                       "🔍 屎山代码检测器 - 客观评估您的代码质量\n\n它可以分析代码质量、输出评分，帮助您发现代码中的💩。适用于：\n- 项目重构前的质量评估\n- 团队代码审查辅助工具\n- 学习编程最佳实践",
	"cmd.analyze":                    "分析代码质量并输出评分",
	"cmd.analyze.long":               "深入分析代码库，检测各种代码潜在问题，输出质量报告。不指定路径时分析当前目录。",
	"cmd.completion":                 "生成自动补全脚本",
	"cmd.completion.long":            "为指定的shell生成自动补全脚本，支持bash、zsh、fish和PowerShell。",
	"cmd.completion.long_prefix":     "为指定的shell生成fuck-u-code的自动补全脚本。",
	"cmd.completion.long_suffix":     "查看每个子命令的帮助，了解如何使用生成的脚本。",
	"cmd.completion.bash":            "为bash生成自动补全脚本",
	"cmd.completion.zsh":             "为zsh生成自动补全脚本",
	"cmd.completion.fish":            "为fish生成自动补全脚本",
	"cmd.completion.powershell":      "为powershell生成自动补全脚本",
	"cmd.completion.bash.long":       "为bash shell生成自动补全脚本",
	"cmd.completion.zsh.long":        "为zsh shell生成自动补全脚本",
	"cmd.completion.fish.long":       "为fish shell生成自动补全脚本",
	"cmd.completion.powershell.long": "为powershell生成自动补全脚本",
	"cmd.help":                       "获取帮助信息",
	"cmd.help.long":                  "获取关于任何命令的帮助信息。",
	"cmd.help_flag":                  "获取关于fuck-u-code的帮助",
	"cmd.no_descriptions":            "禁用补全描述",
	"cmd.path_not_found":             "路径不可访问 '%s': %v",
	"cmd.analysis_failed":            "分析失败：%v",
	"cmd.lang":                       "指定输出语言（支持：zh-CN, en-US，默认：zh-CN）",
	"cmd.verbose":                    "显示详细分析报告",
	"cmd.top":                        "显示问题最多的文件数量（默认5个）",
	"cmd.issues":                     "每个文件显示多少条问题（默认5个）",
	"cmd.summary":                    "只看结论，过程略过",
	"cmd.markdown":                   "输出Markdown格式的精简报告，便于AI工具处理",
	"cmd.exclude":                    "排除的文件/目录模式 (可多次使用，默认已排除常见依赖目录)",
	"cmd.skipindex":                  "跳过所有 index.js/index.ts 文件",
	"cmd.start_analyzing":            "开始嗅探：%s",
	"cmd.exclude_patterns":           "排除以下文件/目录模式:",

	// Cobra框架内部文本
	"cobra.available_commands": "可用命令",
	"cobra.flags":              "选项",
	"cobra.global_flags":       "全局选项",
	"cobra.additional_help":    "附加帮助主题",
	"cobra.use_help_cmd":       "使用",
	"cobra.for_more_info":      "获取关于命令的更多信息",
	"cobra.usage":              "用法",

	// 报告
	"report.title":                   "屎山代码分析报告",
	"report.overall_score":           "总体评分: %.2f / 100",
	"report.level":                   "屎山等级: %s",
	"report.metrics_details":         "评分指标详情",
	"report.worst_files":             "最屎代码排行榜",
	"report.conclusion":              "诊断结论",
	"report.file_score":              "屎气指数: %.2f",
	"report.more_issues":             "...还有 %d 个问题实在太屎，列不完了",
	"report.score_calc":              "评分计算: ",
	"report.overall_assessment":      "总体评估",
	"report.quality_score":           "质量评分",
	"report.quality_level":           "质量等级",
	"report.analyzed_files":          "分析文件数",
	"report.total_lines":             "代码总行数",
	"report.quality_metrics":         "质量指标",
	"report.metric":                  "指标",
	"report.score":                   "得分",
	"report.weight":                  "权重",
	"report.status":                  "状态",
	"report.problem_files":           "问题文件",
	"report.issue_categories":        "问题分类",
	"report.main_issues":             "主要问题",
	"report.and":                     "还有",
	"report.more_issues_short":       "个问题",
	"report.improvement_suggestions": "改进建议",

	// 指标评分后缀
	"metric.score.suffix": "分",

	// 循环复杂度评价
	"metric.complexity.good":   "结构清晰，不绕弯子，赞",
	"metric.complexity.medium": "绕来绕去，跟你脑子一样乱",
	"metric.complexity.bad":    "函数像迷宫，维护像打副本",

	// 函数长度评价
	"metric.length.good":   "状态管理清晰，变量作用域合理，状态可预测",
	"metric.length.medium": "状态管理一般，存在部分全局状态或状态变化不明确的情况",
	"metric.length.bad":    "状态管理混乱，大量使用全局变量，状态变化难以追踪",

	// 注释覆盖率评价
	"metric.comment.good":   "注释不错，能靠它活下来",
	"metric.comment.medium": "注释稀薄，读者全靠脑补",
	"metric.comment.bad":    "没有注释，靠缘分理解吧",

	// 错误处理评价
	"metric.error.good":   "错误都照顾到了，代码有大爱",
	"metric.error.medium": "有处理，但处理得跟没处理一样",
	"metric.error.bad":    "err 见了就跳过？宛如人生",

	// 命名规范评价
	"metric.naming.good":   "命名清晰，程序员的文明之光",
	"metric.naming.medium": "命名还行，有些得猜",
	"metric.naming.bad":    "变量名像键盘砸出来的：x, y, z, tmp, xxx",

	// 代码重复度评价
	"metric.duplication.good":   "该抽象的都抽象了，强迫症舒服了",
	"metric.duplication.medium": "有点重复，抽象一下不难吧",
	"metric.duplication.bad":    "一眼复制痕迹，Ctrl+C/V 荣誉勋章",

	// 代码结构评价
	"metric.structure.good":   "结构优美，不容易看岔",
	"metric.structure.medium": "结构还行，但有点混乱",
	"metric.structure.bad":    "层层嵌套，套娃结构，看完眼花",

	// 质量建议
	"advice.good":     "👍 继续保持，你是编码界的一股清流，代码洁癖者的骄傲",
	"advice.moderate": "🔧 建议：这代码像个叛逆期的青少年，需要适当管教才能成才",
	"advice.bad":      "🧨 建议：删库跑路是唯一出路，或者封印它，等下辈子再维护",

	// 改进建议优先级
	"advice.priority.high":   "高优先级",
	"advice.priority.medium": "中优先级",
	"advice.priority.low":    "低优先级",

	// 良好代码的建议
	"advice.good.maintain": "继续保持当前的代码质量标准",
	"advice.good.optimize": "可以考虑进一步优化性能和可读性",
	"advice.good.document": "完善文档和注释，便于团队协作",

	// 中等代码的建议
	"advice.moderate.refactor":    "重构复杂度过高的函数和模块",
	"advice.moderate.complexity":  "降低循环复杂度，简化控制流",
	"advice.moderate.naming":      "改善变量和函数命名规范",
	"advice.moderate.comments":    "增加代码注释覆盖率",
	"advice.moderate.duplication": "消除重复代码，提取公共方法",
	"advice.moderate.structure":   "优化代码结构，减少嵌套层级",
	"advice.moderate.style":       "统一代码风格和格式",

	// 较差代码的建议
	"advice.bad.urgent_refactor": "紧急重构过长函数，遵循单一职责原则",
	"advice.bad.complexity":      "大幅降低循环复杂度，拆分复杂逻辑",
	"advice.bad.error_handling":  "添加完善的错误处理机制",
	"advice.bad.naming":          "全面改善命名规范，避免使用无意义变量名",
	"advice.bad.duplication":     "彻底消除重复代码，建立代码复用机制",
	"advice.bad.comments":        "大幅增加代码注释，提高可读性",
	"advice.bad.structure":       "重新设计代码架构，改善整体结构",
	"advice.bad.style":           "建立并执行严格的代码规范",

	// 指标描述
	"metric.function_length.description":       "检测代码中状态变量的管理，良好的状态管理能提高代码可维护性和可预测性",
	"metric.comment_ratio.description":         "检测代码的注释覆盖率，良好的注释能提高代码可读性和可维护性",
	"metric.error_handling.description":        "检测代码中的错误处理情况，良好的错误处理能提高代码的健壮性",
	"metric.naming_convention.description":     "检测代码中的命名规范，良好的命名能提高代码可读性",
	"metric.code_duplication.description":      "评估代码中重复逻辑的比例，重复代码越多，越需要抽象和重构",
	"metric.structure_analysis.description":    "检测代码的嵌套深度和引用复杂度，评估结构清晰度",
	"metric.cyclomatic_complexity.description": "测量函数的控制流复杂度，复杂度越高，代码越难理解和测试",

	// 质量等级描述
	"level.clean.description":             "代码洁净，令人赏心悦目",
	"level.mild.description":              "基本没事，但是有伤风化",
	"level.moderate.description":          "略有异味，建议适量通风",
	"level.bad.description":               "代码开始散发气味，谨慎维护",
	"level.terrible.description":          "臭味明显，开窗也救不了",
	"level.disaster.description":          "写的时候爽，改的时候哭",
	"level.disaster.severe.description":   "毒气弥漫，建议戴防毒面具",
	"level.disaster.very_bad.description": "进去的程序员没有一个活着出来",
	"level.disaster.extreme.description":  "反人类罪行，建议火化",
	"level.disaster.worst.description":    "历代工程师共创的遗产，无法维护",
	"level.disaster.ultimate.description": "写的时候热血澎湃，改的时候亲妈不认",

	// 总体评分评价
	"score.comment.0":  "如沐春风，仿佛被天使亲吻过",
	"score.comment.10": "清新宜人，初闻像早晨的露珠",
	"score.comment.20": "略带清香，偶尔飘过一丝酸爽",
	"score.comment.30": "有点臭味，但还不至于熏死人",
	"score.comment.40": "臭气扑鼻，建议佩戴口罩阅读",
	"score.comment.50": "毒气缭绕，代码审查犹如酷刑",
	"score.comment.60": "熏天臭气，维护者已开始咳血",
	"score.comment.70": "生化危机，接手前请立好遗嘱",
	"score.comment.80": "核废料现场，需穿防护服维护",
	"score.comment.90": "厄难级毒瘤，看一眼减寿十年",

	// 错误消息
	"error.path_not_accessible":    "无法访问路径: %v",
	"error.file_read_failed":       "读取文件 %s 失败: %v",
	"error.code_parse_failed":      "解析代码 %s 失败: %v",
	"error.source_files_not_found": "查找源文件失败: %v",
	"error.file_analysis_failed":   "分析文件 %s 失败: %v",

	// 警告和提示
	"warning.format": "警告: %v\n",

	// 函数复杂度问题
	"issue.high_complexity":        "函数 %s 的循环复杂度过高 (%d)，考虑重构",
	"issue.medium_complexity":      "函数 %s 的循环复杂度较高 (%d)，建议简化",
	"issue.file_high_complexity":   "文件循环复杂度过高 (%d)，建议拆分为多个文件",
	"issue.file_medium_complexity": "文件循环复杂度较高 (%d)，建议优化",

	// 函数长度问题
	"issue.function_very_long": "函数 %s 代码行数过多 (%d 行)，极度建议拆分",
	"issue.function_long":      "函数 %s 代码行数较多 (%d 行)，建议拆分为多个小函数",
	"issue.function_medium":    "函数 %s 长度为 %d 行，考虑是否可以简化",
	"issue.file_very_long":     "文件代码行数过多 (%d 行)，建议拆分为多个文件",
	"issue.file_long":          "文件代码行数较多 (%d 行)，考虑是否可以优化结构",

	// 注释覆盖率问题
	"issue.comment_very_low":         "代码注释率极低 (%.2f%%)，几乎没有注释",
	"issue.comment_low":              "代码注释率较低 (%.2f%%)，建议增加注释",
	"issue.exported_func_no_comment": "导出函数 %s 缺少文档注释",
	"issue.exported_type_no_comment": "导出类型 %s 缺少文档注释",

	// 详细报告
	"verbose.basic_statistics":  "📊 基本统计:",
	"verbose.total_files":       "总文件数:",
	"verbose.total_lines":       "总代码行:",
	"verbose.total_issues":      "总问题数:",
	"verbose.metric_details":    "🔍 指标详细信息:",
	"verbose.weight":            "权重:",
	"verbose.description":       "描述:",
	"verbose.score":             "得分:",
	"verbose.all_files":         "全部代码文件分析",
	"verbose.no_files_found":    "🎉 没有找到需要分析的文件！",
	"verbose.file_good_quality": "代码质量良好，没有明显问题",

	// 文件分析进度
	"report.analyzing_files": "已分析文件",
	"report.files":           "个文件",

	// 评分指标显示
}

// 英文语言包
var enUSMessages = map[string]string{
	// 通用
	"app.name":        "Legacy Mess Detector",
	"app.description": "A ruthless tool for digging up code disasters, exposing the ugly truth, and roasting your code with savage humor. Find out just how bad your code really is!",

	// 指标名称
	"metric.cyclomatic_complexity": "Cyclomatic Complexity",
	"metric.function_length":       "State Management",
	"metric.comment_ratio":         "Comment Ratio",
	"metric.error_handling":        "Error Handling",
	"metric.naming_convention":     "Naming Convention",
	"metric.code_duplication":      "Code Duplication",
	"metric.structure_analysis":    "Code Structure",

	// 分析器进度
	"analyzer.searching_files":   "Searching for source code files...",
	"analyzer.files_found":       "Files found",
	"analyzer.analyzing_files":   "Analyzing files...",
	"analyzer.analysis_complete": "Analysis complete",

	// 问题分类
	"report.no_issues":           "Congratulations! No problematic files found!",
	"issue.category.complexity":  "Complexity Issues",
	"issue.category.comment":     "Comment Issues",
	"issue.category.naming":      "Naming Issues",
	"issue.category.structure":   "Structure Issues",
	"issue.category.duplication": "Duplication Issues",
	"issue.category.error":       "Error Handling Issues",
	"issue.category.other":       "Other Issues",

	// 质量等级
	"level.clean":             "Fresh as spring breeze",
	"level.mild":              "A whiff of trouble",
	"level.moderate":          "Slightly stinky youth",
	"level.bad":               "Code reeks, mask up",
	"level.terrible":          "Medium legacy mess",
	"level.disaster":          "Hidden toxic tumor",
	"level.disaster.severe":   "Severe legacy mess",
	"level.disaster.very_bad": "Code graveyard, no one survives",
	"level.disaster.extreme":  "Nuclear disaster zone",
	"level.disaster.worst":    "Generational legacy mess",
	"level.disaster.ultimate": "Ultimate King of Mess",

	// 命令行
	"cmd.short":                      "💻 fuck-u-code",
	"cmd.long":                       "🔍 Code Quality Detector - Objectively assess your code quality\n\nIt can analyze code quality, output scores, and help you find 💩 in your code. Suitable for:\n- Quality assessment before project refactoring\n- Team code review assistance tool\n- Learning programming best practices",
	"cmd.analyze":                    "Analyze code quality and output score",
	"cmd.analyze.long":               "Deeply analyze the codebase, detect various potential code issues, and output a quality report. When no path is specified, the current directory is analyzed.",
	"cmd.completion":                 "Generate the autocompletion script for the specified shell",
	"cmd.completion.long":            "Generate the autocompletion script for the specified shell, supporting bash, zsh, fish and PowerShell.",
	"cmd.completion.long_prefix":     "Generate the autocompletion script for fuck-u-code for the specified shell.",
	"cmd.completion.long_suffix":     "See each sub-command's help for details on how to use the generated script.",
	"cmd.completion.bash":            "Generate the autocompletion script for bash",
	"cmd.completion.zsh":             "Generate the autocompletion script for zsh",
	"cmd.completion.fish":            "Generate the autocompletion script for fish",
	"cmd.completion.powershell":      "Generate the autocompletion script for powershell",
	"cmd.completion.bash.long":       "Generate the autocompletion script for the bash shell",
	"cmd.completion.zsh.long":        "Generate the autocompletion script for the zsh shell",
	"cmd.completion.fish.long":       "Generate the autocompletion script for the fish shell",
	"cmd.completion.powershell.long": "Generate the autocompletion script for powershell",
	"cmd.help":                       "Help about any command",
	"cmd.help.long":                  "Help provides help for any command in the application.",
	"cmd.help_flag":                  "help for fuck-u-code",
	"cmd.no_descriptions":            "disable completion descriptions",
	"cmd.path_not_found":             "Path not accessible '%s': %v",
	"cmd.analysis_failed":            "Analysis failed: %v",
	"cmd.lang":                       "Specify output language (supported: zh-CN, en-US, default: zh-CN)",
	"cmd.verbose":                    "Show detailed analysis report",
	"cmd.top":                        "Show the number of files with the most issues (default 5)",
	"cmd.issues":                     "How many issues to show for each file (default 5)",
	"cmd.summary":                    "Show only conclusion, skip the process",
	"cmd.markdown":                   "Output streamlined Markdown format report, suitable for AI tool processing",
	"cmd.exclude":                    "Exclude file/directory patterns (can be used multiple times, common dependency directories are excluded by default)",
	"cmd.skipindex":                  "Skip all index.js/index.ts files",
	"cmd.start_analyzing":            "Start analyzing: %s",
	"cmd.exclude_patterns":           "Excluding the following file/directory patterns:",

	// Cobra框架内部文本
	"cobra.available_commands": "Available Commands",
	"cobra.flags":              "Flags",
	"cobra.global_flags":       "Global Flags",
	"cobra.additional_help":    "Additional help topics",
	"cobra.use_help_cmd":       "Use",
	"cobra.for_more_info":      "for more information about a command",
	"cobra.usage":              "Usage",

	// 报告
	"report.title":                   "Code Quality Analysis Report",
	"report.overall_score":           "Overall Score: %.2f / 100",
	"report.level":                   "Quality Level: %s",
	"report.metrics_details":         "Metrics Details",
	"report.worst_files":             "Problem Files Ranking",
	"report.conclusion":              "Conclusion",
	"report.file_score":              "Issue Score: %.2f",
	"report.more_issues":             "...and %d more issues",
	"report.score_calc":              "Score Calculation: ",
	"report.overall_assessment":      "Overall Assessment",
	"report.quality_score":           "Quality Score",
	"report.quality_level":           "Quality Level",
	"report.analyzed_files":          "Analyzed Files",
	"report.total_lines":             "Total Lines",
	"report.quality_metrics":         "Quality Metrics",
	"report.metric":                  "Metric",
	"report.score":                   "Score",
	"report.weight":                  "Weight",
	"report.status":                  "Status",
	"report.problem_files":           "Problem Files",
	"report.issue_categories":        "Issue Categories",
	"report.main_issues":             "Main Issues",
	"report.and":                     "and",
	"report.more_issues_short":       "more issues",
	"report.improvement_suggestions": "Improvement Suggestions",

	// 指标评分后缀
	"metric.score.suffix": " pts",

	// 循环复杂度评价
	"metric.complexity.good":   "Clear structure, no unnecessary complexity, great!",
	"metric.complexity.medium": "Winding logic, like a maze for your brain",
	"metric.complexity.bad":    "Functions like labyrinths, maintenance like a dungeon raid",

	// 函数长度评价
	"metric.length.good":   "Clear state management, reasonable variable scope, predictable state",
	"metric.length.medium": "Average state management, some global state or unclear state changes",
	"metric.length.bad":    "Chaotic state management, excessive use of global variables, difficult to track state changes",

	// 注释覆盖率评价
	"metric.comment.good":   "Good comments, they'll help you survive",
	"metric.comment.medium": "Sparse comments, readers need imagination",
	"metric.comment.bad":    "No comments, understanding depends on luck",

	// 错误处理评价
	"metric.error.good":   "Errors are handled with care, code shows compassion",
	"metric.error.medium": "Error handling exists, but barely helps",
	"metric.error.bad":    "Errors ignored? Just like life's problems",

	// 命名规范评价
	"metric.naming.good":   "Clear naming, the light of programmer civilization",
	"metric.naming.medium": "Naming is okay, some guesswork needed",
	"metric.naming.bad":    "Variable names look like keyboard smashes: x, y, z, tmp, xxx",

	// 代码重复度评价
	"metric.duplication.good":   "Proper abstraction, satisfying for the OCD programmer",
	"metric.duplication.medium": "Some repetition, abstraction wouldn't hurt",
	"metric.duplication.bad":    "Copy-paste evidence everywhere, Ctrl+C/V medal earned",

	// 代码结构评价
	"metric.structure.good":   "Beautiful structure, easy to follow",
	"metric.structure.medium": "Structure is okay, but somewhat confusing",
	"metric.structure.bad":    "Nested like Russian dolls, dizzying to read",

	// 质量建议
	"advice.good":     "👍 Keep going, you're the clean freak of the coding world, a true code hygiene champion",
	"advice.moderate": "🔧 Suggestion: This code is like a rebellious teenager, needs some tough love to become useful",
	"advice.bad":      "🧨 Suggestion: Delete the repo and run, or seal it for the next generation to suffer",

	// 改进建议优先级
	"advice.priority.high":   "High Priority",
	"advice.priority.medium": "Medium Priority",
	"advice.priority.low":    "Low Priority",

	// 良好代码的建议
	"advice.good.maintain": "Keep up the clean code standards, don't let the mess creep in",
	"advice.good.optimize": "Go further—optimize for performance and readability, just because you can",
	"advice.good.document": "Polish your docs and comments, make your team love you even more",

	// 中等代码的建议
	"advice.moderate.refactor":    "Refactor those spaghetti functions and modules before they strangle you",
	"advice.moderate.complexity":  "Cut down the cyclomatic complexity, make your code less of a maze",
	"advice.moderate.naming":      "Give variables and functions real names, not cryptic nonsense",
	"advice.moderate.comments":    "Add more comments, unless you want future you to suffer",
	"advice.moderate.duplication": "Wipe out duplicate code, extract common stuff, stop the Ctrl+C/V madness",
	"advice.moderate.structure":   "Untangle the nesting, make the structure readable for humans",
	"advice.moderate.style":       "Unify your code style, don't let formatting chaos reign",

	// 较差代码的建议
	"advice.bad.urgent_refactor": "Emergency! Refactor those monster functions, one job per function please",
	"advice.bad.complexity":      "Slash the cyclomatic complexity, break up the logic before it breaks you",
	"advice.bad.error_handling":  "Add real error handling, not just wishful thinking",
	"advice.bad.naming":          "Fix all the names, no more x, y, z, tmp, or xxx",
	"advice.bad.duplication":     "Exterminate duplicate code, build a real reuse system",
	"advice.bad.comments":        "Flood the code with comments, make it readable for mortals",
	"advice.bad.structure":       "Redesign the architecture, save the project from itself",
	"advice.bad.style":           "Set up strict coding standards and actually follow them",

	// 指标描述
	"metric.function_length.description":       "Detects how you manage state variables. Good state management means you won't lose your mind maintaining this code.",
	"metric.comment_ratio.description":         "Checks if your code has enough comments. Good comments mean you won't curse your past self.",
	"metric.error_handling.description":        "Sniffs out your error handling. Good error handling means your code won't explode at runtime.",
	"metric.naming_convention.description":     "Checks if your naming is civilized. Good names mean less guessing, more coding.",
	"metric.code_duplication.description":      "Evaluates how much copy-paste you did. More duplication means you need to refactor, or just admit you love Ctrl+C/V.",
	"metric.structure_analysis.description":    "Detects nesting depth and reference complexity. The less Russian doll, the less headache.",
	"metric.cyclomatic_complexity.description": "Measures how twisted your control flow is. The higher the complexity, the more likely you'll regret touching this code.",

	// 质量等级描述
	"level.clean.description":             "Code so clean, it's a joy to read—like a spa day for your eyes.",
	"level.mild.description":              "Mostly fine, but a little stinky. Air it out and you'll survive.",
	"level.moderate.description":          "A faint whiff, open a window and hope for the best.",
	"level.bad.description":               "Code is starting to stink, approach with caution and a mask.",
	"level.terrible.description":          "Obvious code odor, even fresh air can't save it.",
	"level.disaster.description":          "Fun to write, but you'll cry when you have to fix it.",
	"level.disaster.severe.description":   "Toxic fumes everywhere, gas mask recommended.",
	"level.disaster.very_bad.description": "No programmer enters and leaves alive—abandon hope.",
	"level.disaster.extreme.description":  "A crime against humanity, best to incinerate it.",
	"level.disaster.worst.description":    "Legacy mess, built by generations, impossible to maintain.",
	"level.disaster.ultimate.description": "So wild your own mother would disown you for writing it.",

	// 总体评分评价
	"score.comment.0":  "Like a spring breeze, kissed by angels—code so clean it heals your soul.",
	"score.comment.10": "Fresh and pleasant, like morning dew—almost makes you want to refactor for fun.",
	"score.comment.20": "A hint of fragrance, sometimes a whiff of funk—still safe to touch.",
	"score.comment.30": "A bit smelly, but not lethal—just hold your nose and keep going.",
	"score.comment.40": "Stench hits you, mask recommended—read at your own risk.",
	"score.comment.50": "Toxic fumes everywhere, code review is torture—bring snacks and tissues.",
	"score.comment.60": "Stench fills the air, maintainers coughing blood—pray for mercy.",
	"score.comment.70": "Biohazard zone, write your will before taking over—may luck be with you.",
	"score.comment.80": "Nuclear waste site, bring a hazmat suit—every edit is a gamble.",
	"score.comment.90": "Disaster level tumor, every glance shortens your life by ten years—run while you still can.",

	// 错误消息
	"error.path_not_accessible":    "Cannot access path: %v",
	"error.file_read_failed":       "Failed to read file %s: %v",
	"error.code_parse_failed":      "Failed to parse code %s: %v",
	"error.source_files_not_found": "Failed to find source files: %v",
	"error.file_analysis_failed":   "Failed to analyze file %s: %v",

	// 警告和提示
	"warning.format": "Warning: %v\n",

	// 函数复杂度问题
	"issue.high_complexity":        "Function %s has very high cyclomatic complexity (%d), consider refactoring",
	"issue.medium_complexity":      "Function %s has high cyclomatic complexity (%d), consider simplifying",
	"issue.file_high_complexity":   "File has very high complexity (%d), consider splitting into multiple files",
	"issue.file_medium_complexity": "File has high complexity (%d), consider optimizing",

	// 函数长度问题
	"issue.function_very_long": "Function %s has too many lines of code (%d), strongly recommend splitting",
	"issue.function_long":      "Function %s has many lines of code (%d), consider splitting into smaller functions",
	"issue.function_medium":    "Function %s has %d lines of code, consider if it can be simplified",
	"issue.file_very_long":     "File has too many lines of code (%d), recommend splitting into multiple files",
	"issue.file_long":          "File has many lines of code (%d), consider optimizing the structure",

	// 注释覆盖率问题
	"issue.comment_very_low":         "Code comment ratio is extremely low (%.2f%%), almost no comments",
	"issue.comment_low":              "Code comment ratio is low (%.2f%%), consider adding more comments",
	"issue.exported_func_no_comment": "Exported function %s lacks documentation comment",
	"issue.exported_type_no_comment": "Exported type %s lacks documentation comment",

	// 详细报告
	"verbose.basic_statistics":  "📊 Basic stats (brace yourself):",
	"verbose.total_files":       "Total files:",
	"verbose.total_lines":       "Total lines:",
	"verbose.total_issues":      "Total issues:",
	"verbose.metric_details":    "🔍 Metric details (the juicy bits):",
	"verbose.weight":            "Weight:",
	"verbose.description":       "Description:",
	"verbose.score":             "Score:",
	"verbose.all_files":         "All code files analyzed (no mercy):",
	"verbose.no_files_found":    "🎉 No files found for analysis! Your repo is either empty or blessed.",
	"verbose.file_good_quality": "Code quality is decent, nothing too tragic—keep it up!",

	// 文件分析进度
	"report.analyzing_files": "Files analyzed",
	"report.files":           "files",

	// 评分指标显示
}

var ruRuMessages = map[string]string{
	"app.name":                                 "Detector Legacy Mess",
	"app.description":                          "Безжалостный инструмент для раскопок катастроф по коде, разоблачения уродливой истины и обжаривания вашего кода диким юмором. ",
	"metric.cyclomatic_complexity":             "Цикломатическая сложность",
	"metric.function_length":                   "Государственное управление",
	"metric.comment_ratio":                     "Соотношение комментариев",
	"metric.error_handling":                    "Обработка ошибок",
	"metric.naming_convention":                 "Конвенция об именах",
	"metric.code_duplication":                  "Кодовое дублирование",
	"metric.structure_analysis":                "Структура кода",
	"analyzer.searching_files":                 "Поиск файлов исходного кода ...",
	"analyzer.files_found":                     "Файлы найдены",
	"analyzer.analyzing_files":                 "Анализ файлов ...",
	"analyzer.analysis_complete":               "Анализ завершен",
	"report.no_issues":                         "Поздравляю! ",
	"issue.category.complexity":                "Проблемы сложности",
	"issue.category.comment":                   "Комментарий",
	"issue.category.naming":                    "Проблемы именования",
	"issue.category.structure":                 "Структурные проблемы",
	"issue.category.duplication":               "Проблемы дублирования",
	"issue.category.error":                     "Проблемы с обработкой ошибок",
	"issue.category.other":                     "Другие проблемы",
	"level.clean":                              "Свежий, как весенний ветерок",
	"level.mild":                               "Убий",
	"level.moderate":                           "Слегка вонючая молодость",
	"level.bad":                                "Код пахнет, маскируется",
	"level.terrible":                           "Средний унаследованный беспорядок",
	"level.disaster":                           "Скрытая токсичная опухоль",
	"level.disaster.severe":                    "Суровый унаследованный беспорядок",
	"level.disaster.very_bad":                  "Кодовое кладбище, никто не выживает",
	"level.disaster.extreme":                   "Зона ядерной катастрофы",
	"level.disaster.worst":                     "Поколнестный устаревший беспорядок",
	"level.disaster.ultimate":                  "Конечный король беспорядка",
	"cmd.short":                                "💻 Fuck-U-Code",
	"cmd.long":                                 "🔍 Детектор качества кода - объективно оценить качество кода\n\n",
	"cmd.analyze":                              "Анализ качества кода и результата вывода",
	"cmd.analyze.long":                         "Глубоко проанализируйте кодовую базу, выявляйте различные потенциальные проблемы с кодом и выводит отчет о качестве. ",
	"cmd.completion":                           "Создать сценарий автозаполнения для указанной оболочки",
	"cmd.completion.long":                      "Создайте сценарий автозаполнения для указанной оболочки, поддерживая Bash, ZSH, Fish и PowerShell.",
	"cmd.completion.long_prefix":               "Создайте сценарий автозаполнения для Fuck-U-код для указанной оболочки.",
	"cmd.completion.long_suffix":               "Посмотрите на помощь каждого подкоманда для получения подробной информации о том, как использовать сгенерированный сценарий.",
	"cmd.completion.bash":                      "Генерировать сценарий автозаполнения для Bash",
	"cmd.completion.zsh":                       "Генерировать сценарий автозаполнения для ZSH",
	"cmd.completion.fish":                      "Генерировать сценарий автозаполнения для рыбы",
	"cmd.completion.powershell":                "Создать сценарий автозаполнения для PowerShell",
	"cmd.completion.bash.long":                 "Создать сценарий автозаполнения для оболочки Bash",
	"cmd.completion.zsh.long":                  "Создать сценарий автозаполнения для оболочки ZSH",
	"cmd.completion.fish.long":                 "Создать сценарий автозаполнения для раковины рыбы",
	"cmd.completion.powershell.long":           "Создать сценарий автозаполнения для PowerShell",
	"cmd.help":                                 "Помогите о любой команде",
	"cmd.help.long":                            "Справка предоставляет помощь для любой команды в приложении.",
	"cmd.help_flag":                            "Помогите Fuck-U-код",
	"cmd.no_descriptions":                      "Отключить описания завершения",
	"cmd.path_not_found":                       "Путь не доступен ' %s': %v",
	"cmd.analysis_failed":                      "Анализ не удался: %v",
	"cmd.lang":                                 "Укажите язык вывода (поддерживается: ZH-CN, EN-US, по умолчанию: ZH-CN)",
	"cmd.verbose":                              "Показать подробный отчет об анализе",
	"cmd.top":                                  "Показать количество файлов с наибольшим количеством проблем (по умолчанию 5)",
	"cmd.issues":                               "Сколько вопросов следует отобразить для каждого файла (по умолчанию 5)",
	"cmd.summary":                              "Покажите только вывод, пропустите процесс",
	"cmd.markdown":                             "Отчет об оптимизированном виде вывода, подходящий для обработки инструментов ИИ",
	"cmd.exclude":                              "Исключить шаблоны файла/каталогов (можно использовать несколько раз, общие каталоги зависимостей исключаются по умолчанию)",
	"cmd.skipindex":                            "Пропустить все файлы index.js/index.ts",
	"cmd.start_analyzing":                      "Начать анализ: %s",
	"cmd.exclude_patterns":                     "За исключением следующих шаблонов файла/каталогов:",
	"cobra.available_commands":                 "Доступные команды",
	"cobra.flags":                              "Флаги",
	"cobra.global_flags":                       "Глобальные флаги",
	"cobra.additional_help":                    "Дополнительные темы помощи",
	"cobra.use_help_cmd":                       "Использовать",
	"cobra.for_more_info":                      "Для получения дополнительной информации о команде",
	"cobra.usage":                              "Использование",
	"report.title":                             "Отчет об анализе качества кода",
	"report.overall_score":                     "Общий балл: %.2f / 100",
	"report.level":                             "Уровень качества: %s",
	"report.metrics_details":                   "Детали метрик",
	"report.worst_files":                       "Проблемы с файлами проблем",
	"report.conclusion":                        "Заключение",
	"report.file_score":                        "Оценка выпуска: %.2f",
	"report.more_issues":                       "... и %D больше проблем",
	"report.score_calc":                        "Расчет баллов: ",
	"report.overall_assessment":                "Общая оценка",
	"report.quality_score":                     "Качество оценки",
	"report.quality_level":                     "Уровень качества",
	"report.analyzed_files":                    "Анализируются файлы",
	"report.total_lines":                       "Общие строки",
	"report.quality_metrics":                   "Качественные показатели",
	"report.metric":                            "Показатель",
	"report.score":                             "Счет",
	"report.weight":                            "Масса",
	"report.status":                            "Статус",
	"report.problem_files":                     "Проблемные файлы",
	"report.issue_categories":                  "Выпуска категории",
	"report.main_issues":                       "Основные проблемы",
	"report.and":                               "и",
	"report.more_issues_short":                 "больше проблем",
	"report.improvement_suggestions":           "Предложения по улучшению",
	"metric.score.suffix":                      " пта",
	"metric.complexity.good":                   "Четкая структура, нет ненужной сложности, отличная!",
	"metric.complexity.medium":                 "Логика обмотки, как лабиринт для вашего мозга",
	"metric.complexity.bad":                    "Функции, такие как лабиринты, обслуживание, как набег подземелья",
	"metric.length.good":                       "Четкое управление государством, разумная сфера переменной, предсказуемое состояние",
	"metric.length.medium":                     "Среднее государственное управление, некоторые глобальные государственные или неясные изменения в государстве",
	"metric.length.bad":                        "Хаотическое управление государством, чрезмерное использование глобальных переменных, трудно отслеживать изменения состояния",
	"metric.comment.good":                      "Хорошие комментарии, они помогут вам выжить",
	"metric.comment.medium":                    "Разреженные комментарии, читателям нужно воображение",
	"metric.comment.bad":                       "Нет комментариев, понимание зависит от удачи",
	"metric.error.good":                        "Ошибки обрабатываются с осторожностью, код показывает сострадание",
	"metric.error.medium":                      "Обработка ошибок существует, но едва помогает",
	"metric.error.bad":                         "Ошибки игнорируются? ",
	"metric.naming.good":                       "Ясное именование, свет цивилизации программиста",
	"metric.naming.medium":                     "Наименование - это нормально, необходимы некоторые догадки",
	"metric.naming.bad":                        "Имена переменных похожи на разбивание клавиатуры: x, y, z, tmp, xxx",
	"metric.duplication.good":                  "Правильная абстракция, удовлетворительная для программиста ОКР",
	"metric.duplication.medium":                "Некоторое повторение, абстракция не повредит",
	"metric.duplication.bad":                   "Свидетельство о вставке везде, CTRL+C/V Медаль заработана",
	"metric.structure.good":                    "Красивая структура, легко следовать",
	"metric.structure.medium":                  "Структура в порядке, но несколько сбивает с толку",
	"metric.structure.bad":                     "Вложенные как русские куклы, головокружившись, чтобы читать",
	"advice.good":                              "👍 Продолжайте, вы чистый урод мира кодирования, чемпиона истинного гигиены кода",
	"advice.moderate":                          "🔧 Предложение: этот код похож на мятежного подростка, нуждается в тяжелой любви, чтобы стать полезным",
	"advice.bad":                               "🧨 Предложение: удалить репо и запустить, или запечатать его, чтобы следующее поколение пострадало",
	"advice.priority.high":                     "Высокий приоритет",
	"advice.priority.medium":                   "Средний приоритет",
	"advice.priority.low":                      "Низкий приоритет",
	"advice.good.maintain":                     "Продолжайте в том же духе стандарты кода, не позволяйте беспорядку ползути",
	"advice.good.optimize":                     "Идите дальше - оптимизируйте производительность и читаемость, просто потому, что вы можете",
	"advice.good.document":                     "Отличите свои документы и комментарии, сделайте вашу команду любить вас еще больше",
	"advice.moderate.refactor":                 "Рефактор тех функций и модулей спагетти, прежде чем они задушивают вас",
	"advice.moderate.complexity":               "Разрежьте цикломатическую сложность, сделайте свой код меньше лабиринта",
	"advice.moderate.naming":                   "Дайте переменные и функции реальные имена, а не загадочная чепуха",
	"advice.moderate.comments":                 "Добавьте больше комментариев, если вы не хотите, чтобы в будущем вы страдали",
	"advice.moderate.duplication":              "Вытрите дублированный код, извлеките общие вещи, остановите Ctrl+C/V Madness",
	"advice.moderate.structure":                "Распутать гнездование, сделайте структуру читаемой для людей",
	"advice.moderate.style":                    "Объединить свой стиль кода, не позволяйте форматировать хаос царствование",
	"advice.bad.urgent_refactor":               "Чрезвычайная ситуация! ",
	"advice.bad.complexity":                    "Разбивайте цикломатическую сложность, разбивайте логику, прежде чем она сломает вас",
	"advice.bad.error_handling":                "Добавьте реальную обработку ошибок, а не просто желаемое за действительное мышление",
	"advice.bad.naming":                        "Исправьте все имена, больше x, y, z, tmp или xxx",
	"advice.bad.duplication":                   "Истребить дубликат кода, создайте реальную систему повторного использования",
	"advice.bad.comments":                      "Затопьте код комментариями, сделайте его читаемым для смертных",
	"advice.bad.structure":                     "Перепроектировать архитектуру, сохранить проект от себя",
	"advice.bad.style":                         "Установите строгие стандарты кодирования и фактически следуйте за ними",
	"metric.function_length.description":       "Выявляет, как вы управляете переменными состояния. ",
	"metric.comment_ratio.description":         "Проверяет, есть ли у вашего кода достаточно комментариев. ",
	"metric.error_handling.description":        "Обнюхает вашу обработку ошибок. ",
	"metric.naming_convention.description":     "Проверяет, если ваше именование цивилизовано. ",
	"metric.code_duplication.description":      "Оцените, сколько вы сделали вставку. ",
	"metric.structure_analysis.description":    "Обнаруживает глубину гнездования и справочную сложность. ",
	"metric.cyclomatic_complexity.description": "Измеряет, насколько искажен ваш поток управления. ",
	"level.clean.description":                  "Код такой чистый, это радость читать - как спа -день для ваших глаз.",
	"level.mild.description":                   "В основном хорошо, но немного вонючий. ",
	"level.moderate.description":               "Слабый запах, откройте окно и надеется на лучшее.",
	"level.bad.description":                    "Код начинает вонять, подходить с осторожностью и маской.",
	"level.terrible.description":               "Очевидный запах кода, даже свежий воздух не может спасти его.",
	"level.disaster.description":               "Весело писать, но вы будете плакать, когда вам придется это исправить.",
	"level.disaster.severe.description":        "Токсичные пары повсюду, рекомендуется газовая маска.",
	"level.disaster.very_bad.description":      "Ни один программист не входит и остается в живых - отдает надежду.",
	"level.disaster.extreme.description":       "Преступление против человечества, лучше всего его сжимать.",
	"level.disaster.worst.description":         "Legacy Mess, построенный поколениями, невозможно поддерживать.",
	"level.disaster.ultimate.description":      "Так дикая ваша собственная мать отрекся от вас за то, что вы написали это.",
	"score.comment.0":                          "Как весенний ветерок, поцелованный ангелами - код такой чистой, что исцеляет вашу душу.",
	"score.comment.10":                         "Свежая и приятная, как утренняя роса - почти заставляет вас хотеть рефакторировать для развлечения.",
	"score.comment.20":                         "Намек на аромат, иногда падение фанка - все еще безопасно.",
	"score.comment.30":                         "Немного вонючий, но не смертельный - просто держите нос и продолжайте.",
	"score.comment.40":                         "Wtench поражает вас, рекомендовал Маск - прочитайте свой собственный риск.",
	"score.comment.50":                         "Токсичные пары Повсюду, обзор кода - это пытка - закуски и ткани.",
	"score.comment.60":                         "Злоб заполняет воздух, содействующие, кашляющие кровь - бьют по милости.",
	"score.comment.70":                         "Биологическая зона, напишите свою волю, прежде чем взять на себя, может быть, удача с вами.",
	"score.comment.80":                         "Участок ядерных отходов, принесите костюм для хахмата - все редактирование - это игра.",
	"score.comment.90":                         "Опухоль уровня бедствий, каждый взгляд сокращает вашу жизнь на десять лет - разгружается, пока вы все еще можете.",
	"error.path_not_accessible":                "Невозможно получить доступ к пути: %v",
	"error.file_read_failed":                   "Не удалось прочитать файл %s: %v",
	"error.code_parse_failed":                  "Не удалось проанализировать код %s: %v",
	"error.source_files_not_found":             "Не удалось найти исходные файлы: %v",
	"error.file_analysis_failed":               "Не удалось проанализировать файл %s: %v",
	"warning.format":                           "Предупреждение: %v\n",
	"issue.high_complexity":                    "Функция %s имеет очень высокую цикломатическую сложность ( %d), рассмотрим рефакторинг",
	"issue.medium_complexity":                  "Функция %s имеет высокую цикломатическую сложность ( %d), рассмотрите возможность упрощения",
	"issue.file_high_complexity":               "Файл имеет очень высокую сложность (%d), рассмотрите возможность разделения на несколько файлов",
	"issue.file_medium_complexity":             "Файл имеет высокую сложность (%d), рассмотрите возможность оптимизации",
	"issue.function_very_long":                 "Функция %s имеет слишком много строк кода ( %d), настоятельно рекомендую расщеплять",
	"issue.function_long":                      "Функция %s имеет много строк кода ( %d), рассмотрите возможность разделения на меньшие функции",
	"issue.function_medium":                    "Функция %s имеет %d строк кода, рассмотрите, можно ли упростить ее",
	"issue.file_very_long":                     "Файл имеет слишком много строк кода (%d), рекомендуйте разделить несколько файлов",
	"issue.file_long":                          "Файл имеет много строк кода (%d), рассмотрите возможность оптимизации структуры",
	"issue.comment_very_low":                   "Соотношение комментариев кода чрезвычайно низкое (%.2f %%), почти без комментариев",
	"issue.comment_low":                        "Соотношение комментариев кода низкое (%.2f %%), рассмотрите возможность добавления большего количества комментариев",
	"issue.exported_func_no_comment":           "Экспортируемая функция %s не хватает комментариев документации",
	"issue.exported_type_no_comment":           "Экспортированный тип %S не хватает комментариев документации",
	"verbose.basic_statistics":                 "📊 Основная статистика (приготовьте сами):",
	"verbose.total_files":                      "Всего файлов:",
	"verbose.total_lines":                      "Общие строки:",
	"verbose.total_issues":                     "Общие проблемы:",
	"verbose.metric_details":                   "🔍 Метрические детали (сочные кусочки):",
	"verbose.weight":                           "Масса:",
	"verbose.description":                      "Описание:",
	"verbose.score":                            "Счет:",
	"verbose.all_files":                        "Все файлы кода проанализированы (без милосердия):",
	"verbose.no_files_found":                   "🎉 Файлы не найдены для анализа! ",
	"verbose.file_good_quality":                "Качество кода прилично, ничего слишком трагична - поддерживать его!",
	"report.analyzing_files":                   "Файлы проанализированы",
	"report.files":                             "файлы",
}
