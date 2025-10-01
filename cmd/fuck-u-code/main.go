// Package main 提供代码质量分析工具的入口点
// 创建者：Done-0
package main

import (
	"fmt"
	"os"
	"strings"

	"github.com/spf13/cobra"

	"github.com/Done-0/fuck-u-code/pkg/analyzer"
	"github.com/Done-0/fuck-u-code/pkg/i18n"
	"github.com/Done-0/fuck-u-code/pkg/report"
)

// 全局配置选项
var (
	verbose        bool            // 是否输出详细报告
	topFiles       int             // 问题最多的文件数量
	maxIssues      int             // 每个文件最多列出的问题数
	summaryOnly    bool            // 是否只显示结论，不看过程
	markdownOutput bool            // 是否输出Markdown格式
	language       string          // 输出语言
	translator     i18n.Translator // 翻译器
	exclude        []string        // 排除的文件/目录模式
	skipIndex      bool            // 是否跳过所有index.js/index.ts文件
)

// 默认排除的模式
var defaultExcludes = []string{
	// 前端项目通用排除
	"**/node_modules/**", "**/dist/**", "**/build/**", "**/.next/**",
	"**/public/assets/**", "**/out/**", "**/.cache/**", "**/.nuxt/**",
	"**/.output/**", "**/coverage/**", "**/.vscode/**", "**/.idea/**",
	"**/.git/**", "**/bower_components/**", "**/*.min.js", "**/*.bundle.js",
	"**/*.chunk.js", "**/static/js/*.js", "**/static/css/*.css",

	// 后端项目通用排除
	"**/vendor/**", "**/bin/**", "**/obj/**", "**/target/**",
	"**/__pycache__/**", "**/*.pyc", "**/venv/**", "**/.env/**",
	"**/migrations/**", "**/generated/**", "**/node_modules/**",
	"**/logs/**", "**/tmp/**", "**/temp/**", "**/dist/**", "**/test-results/**",
	"**/testdata/**",

	// 测试文件排除
	// Go语言测试文件
	"**/*_test.go", "**/testdata/**/*.go",

	// Python测试文件
	"**/test_*.py", "**/*_test.py", "**/tests/**/*.py", "**/testing/**/*.py", "**/pytest/**/*.py",

	// JavaScript/TypeScript测试文件
	"**/*.spec.js", "**/*.test.js", "**/__tests__/**/*.js", "**/test/**/*.js", "**/tests/**/*.js",
	"**/*.spec.ts", "**/*.test.ts", "**/__tests__/**/*.ts", "**/test/**/*.ts", "**/tests/**/*.ts",
	"**/*.spec.jsx", "**/*.test.jsx", "**/*.spec.tsx", "**/*.test.tsx",
	"**/jest.config.js", "**/jest.setup.js", "**/jest.config.ts", "**/cypress/**",

	// Java测试文件
	"**/src/test/**/*.java", "**/*Test.java", "**/*Tests.java", "**/*IT.java", "**/JUnit/**/*.java",

	// C/C++测试文件
	"**/*_test.c", "**/*_test.cpp", "**/*_tests.c", "**/*_tests.cpp",
	"**/test/**/**.c", "**/test/**/**.cpp", "**/tests/**/**.c", "**/tests/**/**.cpp",
	"**/gtest/**", "**/googletest/**", "**/catch/**", "**/boost/test/**",
}

func main() {
	// 检查是否有语言参数，提前设置语言
	detectLanguage()

	// 设置默认翻译器（默认英语）
	translator = i18n.NewTranslator(i18n.EnUS)

	// 如果检测到语言参数，提前设置语言
	if language != "" {
		setLanguage(language)
	}

	// 创建根命令
	rootCmd := createRootCommand()

	// 添加命令行参数
	addFlags(rootCmd)

	// 添加子命令
	addSubCommands(rootCmd)

	// 执行命令
	if err := rootCmd.Execute(); err != nil {
		fmt.Println(err)
		os.Exit(1)
	}
}

// createRootCommand 创建根命令
func createRootCommand() *cobra.Command {
	rootCmd := &cobra.Command{
		Use:   "fuck-u-code [path]",
		Short: translator.Translate("cmd.short"),
		Long:  translator.Translate("cmd.long"),
		Args:  cobra.MaximumNArgs(1),
		PersistentPreRun: func(cmd *cobra.Command, args []string) {
			// 设置语言
			setLanguage(language)

			// 更新命令说明
			updateCommandDescriptions(cmd)
		},
		RunE: func(cmd *cobra.Command, args []string) error {
			// 如果没有参数，显示帮助信息
			if len(args) == 0 && !cmd.Flags().Changed("help") {
				return cmd.Help()
			}

			// 有参数时正常执行分析
			path := "."
			if len(args) > 0 {
				path = args[0]
			}

			// 设置语言
			var lang i18n.Language
			switch {
			case language == "en-US" || language == "en":
				lang = i18n.EnUS
			case language == "ru-RU" || language == "ru":
				lang = i18n.RuRU
			case language == "zh-CN" || language == "zh":
				lang = i18n.ZhCN
			default:
				lang = i18n.EnUS
			}

			// 运行分析
			runAnalysis(path, lang, verbose, topFiles, maxIssues, summaryOnly, markdownOutput, exclude, skipIndex)
			return nil
		},
	}

	// 禁用自动添加help命令
	rootCmd.DisableAutoGenTag = true

	// 设置cobra框架内部文本的国际化
	localizeCobraTemplates(rootCmd)

	return rootCmd
}

// addSubCommands 添加子命令
func addSubCommands(rootCmd *cobra.Command) {
	// 创建分析子命令
	analyzeCmd := createAnalyzeCommand()

	// 创建completion命令
	completionCmd := createCompletionCommand()

	// 创建help命令
	helpCmd := createHelpCommand(rootCmd)

	// 清空所有命令，然后添加自定义命令
	rootCmd.ResetCommands()

	// 添加自定义命令到根命令
	rootCmd.AddCommand(analyzeCmd, completionCmd, helpCmd)

	// 设置help命令
	rootCmd.SetHelpCommand(helpCmd)

	// 修改help标志的描述
	rootCmd.InitDefaultHelpFlag()
	rootCmd.Flags().Lookup("help").Usage = translator.Translate("cmd.help_flag")
}

// createAnalyzeCommand 创建analyze命令
func createAnalyzeCommand() *cobra.Command {
	analyzeCmd := &cobra.Command{
		Use:   "analyze [path]",
		Short: translator.Translate("cmd.analyze"),
		Long:  translator.Translate("cmd.analyze.long"),
		Args:  cobra.MaximumNArgs(1),
		Run: func(cmd *cobra.Command, args []string) {
			// 获取路径参数
			path := "."
			if len(args) > 0 {
				path = args[0]
			}

			// 获取选项
			langFlag, _ := cmd.Flags().GetString("lang")
			verboseFlag, _ := cmd.Flags().GetBool("verbose")
			topFlag, _ := cmd.Flags().GetInt("top")
			issuesFlag, _ := cmd.Flags().GetInt("issues")
			summaryFlag, _ := cmd.Flags().GetBool("summary")
			markdownFlag, _ := cmd.Flags().GetBool("markdown")
			excludePatterns, _ := cmd.Flags().GetStringArray("exclude")

			// 设置语言
			var lang i18n.Language
			switch {
			case langFlag == "en-US" || langFlag == "en":
				lang = i18n.EnUS
			case langFlag == "ru-RU" || langFlag == "ru":
				lang = i18n.RuRU
			case langFlag == "zh-CN" || langFlag == "zh":
				lang = i18n.ZhCN
			default:
				lang = i18n.EnUS
			}

			// 获取skipindex选项
			skipIndexFlag, _ := cmd.Flags().GetBool("skipindex")

			// 运行分析
			runAnalysis(path, lang, verboseFlag, topFlag, issuesFlag, summaryFlag, markdownFlag, excludePatterns, skipIndexFlag)
		},
	}

	// 添加选项
	analyzeCmd.Flags().StringP("lang", "l", "en-US", translator.Translate("cmd.lang"))
	analyzeCmd.Flags().BoolP("verbose", "v", false, translator.Translate("cmd.verbose"))
	analyzeCmd.Flags().IntP("top", "t", 5, translator.Translate("cmd.top"))
	analyzeCmd.Flags().IntP("issues", "i", 5, translator.Translate("cmd.issues"))
	analyzeCmd.Flags().BoolP("summary", "s", false, translator.Translate("cmd.summary"))
	analyzeCmd.Flags().BoolP("markdown", "m", false, translator.Translate("cmd.markdown"))
	analyzeCmd.Flags().StringArrayP("exclude", "e", nil, translator.Translate("cmd.exclude"))
	analyzeCmd.Flags().BoolP("skipindex", "x", false, translator.Translate("cmd.skipindex"))

	return analyzeCmd
}

// createCompletionCommand 创建completion命令
func createCompletionCommand() *cobra.Command {
	completionCmd := &cobra.Command{
		Use:   "completion",
		Short: translator.Translate("cmd.completion"),
		Long: translator.Translate("cmd.completion.long_prefix") + "\n" +
			translator.Translate("cmd.completion.long_suffix"),
	}

	// 添加completion子命令
	bashCmd := &cobra.Command{
		Use:   "bash",
		Short: translator.Translate("cmd.completion.bash"),
		Long:  translator.Translate("cmd.completion.bash.long"),
		Run: func(cmd *cobra.Command, args []string) {
			rootCmd := cmd.Parent().Parent()
			rootCmd.GenBashCompletion(os.Stdout)
		},
	}

	zshCmd := &cobra.Command{
		Use:   "zsh",
		Short: translator.Translate("cmd.completion.zsh"),
		Long:  translator.Translate("cmd.completion.zsh.long"),
		Run: func(cmd *cobra.Command, args []string) {
			rootCmd := cmd.Parent().Parent()
			rootCmd.GenZshCompletion(os.Stdout)
		},
	}

	fishCmd := &cobra.Command{
		Use:   "fish",
		Short: translator.Translate("cmd.completion.fish"),
		Long:  translator.Translate("cmd.completion.fish.long"),
		Run: func(cmd *cobra.Command, args []string) {
			rootCmd := cmd.Parent().Parent()
			rootCmd.GenFishCompletion(os.Stdout, true)
		},
	}

	powershellCmd := &cobra.Command{
		Use:   "powershell",
		Short: translator.Translate("cmd.completion.powershell"),
		Long:  translator.Translate("cmd.completion.powershell.long"),
		Run: func(cmd *cobra.Command, args []string) {
			rootCmd := cmd.Parent().Parent()
			rootCmd.GenPowerShellCompletion(os.Stdout)
		},
	}

	// 添加no-descriptions标志
	bashCmd.Flags().Bool("no-descriptions", false, translator.Translate("cmd.no_descriptions"))
	zshCmd.Flags().Bool("no-descriptions", false, translator.Translate("cmd.no_descriptions"))

	// 添加子命令到completion命令
	completionCmd.AddCommand(bashCmd, zshCmd, fishCmd, powershellCmd)

	return completionCmd
}

// createHelpCommand 创建help命令
func createHelpCommand(rootCmd *cobra.Command) *cobra.Command {
	return &cobra.Command{
		Use:   "help [command]",
		Short: translator.Translate("cmd.help"),
		Long:  translator.Translate("cmd.help.long"),
		Run: func(cmd *cobra.Command, args []string) {
			if len(args) == 0 {
				rootCmd.Help()
				return
			}

			c, _, e := rootCmd.Find(args)
			if c == nil || e != nil {
				fmt.Printf("Unknown help topic %#q\n", args)
				rootCmd.Help()
				return
			}

			c.Help()
		},
	}
}

// localizeCobraTemplates 本地化Cobra模板
func localizeCobraTemplates(rootCmd *cobra.Command) {
	cobra.AddTemplateFunc("T", func(s string) string {
		return translator.Translate("cobra." + s)
	})

	// 修改cobra模板，使用国际化函数
	rootCmd.SetUsageTemplate(strings.ReplaceAll(rootCmd.UsageTemplate(),
		"Available Commands:", "{{T \"available_commands\"}}:"))
	rootCmd.SetUsageTemplate(strings.ReplaceAll(rootCmd.UsageTemplate(),
		"Flags:", "{{T \"flags\"}}:"))
	rootCmd.SetUsageTemplate(strings.ReplaceAll(rootCmd.UsageTemplate(),
		"Global Flags:", "{{T \"global_flags\"}}:"))
	rootCmd.SetUsageTemplate(strings.ReplaceAll(rootCmd.UsageTemplate(),
		"Additional help topics:", "{{T \"additional_help\"}}:"))
	rootCmd.SetUsageTemplate(strings.ReplaceAll(rootCmd.UsageTemplate(),
		"Use \"{{.CommandPath}} [command] --help\" for more information about a command.",
		"{{T \"use_help_cmd\"}} \"{{.CommandPath}} [command] --help\" {{T \"for_more_info\"}}"))
	rootCmd.SetUsageTemplate(strings.ReplaceAll(rootCmd.UsageTemplate(),
		"Usage:", "{{T \"usage\"}}:"))
}

// detectLanguage 从命令行参数中检测语言设置
func detectLanguage() {
	for i, arg := range os.Args {
		if arg == "--lang" || arg == "-l" {
			if i+1 < len(os.Args) {
				language = os.Args[i+1]
			}
		} else if strings.HasPrefix(arg, "--lang=") {
			language = arg[7:]
		}
	}
}

// addFlags 添加命令行参数
func addFlags(cmd *cobra.Command) {
	cmd.PersistentFlags().StringVarP(&language, "lang", "l", "en-US", translator.Translate("cmd.lang"))
	cmd.Flags().BoolVarP(&verbose, "verbose", "v", false, translator.Translate("cmd.verbose"))
	cmd.Flags().IntVarP(&topFiles, "top", "t", 5, translator.Translate("cmd.top"))
	cmd.Flags().IntVarP(&maxIssues, "issues", "i", 5, translator.Translate("cmd.issues"))
	cmd.Flags().BoolVarP(&summaryOnly, "summary", "s", false, translator.Translate("cmd.summary"))
	cmd.Flags().BoolVarP(&markdownOutput, "markdown", "m", false, translator.Translate("cmd.markdown"))
	cmd.Flags().StringArrayVarP(&exclude, "exclude", "e", nil, translator.Translate("cmd.exclude"))
	cmd.Flags().BoolVarP(&skipIndex, "skipindex", "x", false, translator.Translate("cmd.skipindex"))
}

// setLanguage 设置语言
func setLanguage(lang string) {
	switch lang {
	case "en", "en-US", "english":
		translator = i18n.NewTranslator(i18n.EnUS)
	case "ru", "ru-RU", "russian":
		translator = i18n.NewTranslator(i18n.RuRU)
	case "zh", "zh-CN", "chinese":
		translator = i18n.NewTranslator(i18n.ZhCN)
	default:
		translator = i18n.NewTranslator(i18n.EnUS)
	}
}

// updateCommandDescriptions 更新命令描述
func updateCommandDescriptions(cmd *cobra.Command) {
	// 更新根命令描述
	if cmd.Use == "fuck-u-code [path]" {
		cmd.Short = translator.Translate("cmd.short")
		cmd.Long = translator.Translate("cmd.long")
	}

	// 根据语言更新命令描述
	for _, c := range cmd.Commands() {
		if c.Use == "analyze [path]" {
			c.Short = translator.Translate("cmd.analyze")
			c.Long = translator.Translate("cmd.analyze.long")
		} else if c.Name() == "completion" {
			updateCompletionCommand(c)
		} else if c.Name() == "help" {
			c.Short = translator.Translate("cmd.help")
			c.Long = translator.Translate("cmd.help.long")
		}

		// 递归更新子命令
		updateCommandDescriptions(c)
	}

	// 更新标志描述
	updateFlagDescriptions(cmd)
}

// updateFlagDescriptions 更新标志描述
func updateFlagDescriptions(cmd *cobra.Command) {
	flagDescriptions := map[string]string{
		"lang":            "cmd.lang",
		"verbose":         "cmd.verbose",
		"top":             "cmd.top",
		"issues":          "cmd.issues",
		"summary":         "cmd.summary",
		"markdown":        "cmd.markdown",
		"exclude":         "cmd.exclude",
		"skipindex":       "cmd.skipindex",
		"help":            "cmd.help_flag",
		"no-descriptions": "cmd.no_descriptions",
	}

	// 更新持久标志
	for name, key := range flagDescriptions {
		if flag := cmd.PersistentFlags().Lookup(name); flag != nil {
			flag.Usage = translator.Translate(key)
		}
	}

	// 更新本地标志
	for name, key := range flagDescriptions {
		if flag := cmd.Flags().Lookup(name); flag != nil {
			flag.Usage = translator.Translate(key)
		}
	}
}

// updateCompletionCommand 更新completion命令的描述
func updateCompletionCommand(cmd *cobra.Command) {
	cmd.Short = translator.Translate("cmd.completion")
	cmd.Long = translator.Translate("cmd.completion.long_prefix") + "\n" +
		translator.Translate("cmd.completion.long_suffix")

	// 更新completion子命令
	subCmdDescriptions := map[string]struct {
		short   string
		long    string
		oldText string
	}{
		"bash": {
			short:   "cmd.completion.bash",
			long:    "cmd.completion.bash.long",
			oldText: "Generate the autocompletion script for the bash shell",
		},
		"zsh": {
			short:   "cmd.completion.zsh",
			long:    "cmd.completion.zsh.long",
			oldText: "Generate the autocompletion script for the zsh shell",
		},
		"fish": {
			short:   "cmd.completion.fish",
			long:    "cmd.completion.fish.long",
			oldText: "Generate the autocompletion script for the fish shell",
		},
		"powershell": {
			short:   "cmd.completion.powershell",
			long:    "cmd.completion.powershell.long",
			oldText: "Generate the autocompletion script for powershell",
		},
	}

	for _, subCmd := range cmd.Commands() {
		if desc, ok := subCmdDescriptions[subCmd.Name()]; ok {
			subCmd.Short = translator.Translate(desc.short)

			if strings.Contains(subCmd.Long, desc.oldText) {
				subCmd.Long = strings.ReplaceAll(subCmd.Long,
					desc.oldText,
					translator.Translate(desc.long))
			}
		}

		// 更新标志描述
		updateFlagDescriptions(subCmd)
	}
}

// runAnalysis 运行代码分析
func runAnalysis(path string, lang i18n.Language, verbose bool, topFiles int, maxIssues int, summaryOnly bool, markdownOutput bool, excludePatterns []string, skipIndex bool) {
	// 设置翻译器
	translator := i18n.NewTranslator(lang)

	// 只在非markdown模式下输出分析过程信息
	if !markdownOutput {
		// 输出开始分析信息
		fmt.Printf("🔍 %s\n", translator.Translate("cmd.start_analyzing", path))

		// 如果有排除模式，输出排除模式
		if len(excludePatterns) > 0 {
			fmt.Printf("📂 %s\n", translator.Translate("cmd.exclude_patterns"))
			for _, pattern := range excludePatterns {
				fmt.Printf("  - %s\n", pattern)
			}
			fmt.Println()
		}
	}

	// 添加默认排除模式
	excludePatterns = append(excludePatterns, defaultExcludes...)

	// 如果启用了skipindex选项，添加index文件排除模式
	if skipIndex {
		excludePatterns = append(excludePatterns, "**/index.js", "**/index.ts", "**/index.jsx", "**/index.tsx")
	}

	// 创建分析器
	analyzer := analyzer.NewAnalyzer()
	analyzer.SetLanguage(lang)
	analyzer.SetSilent(markdownOutput) // 在markdown模式下使用静默模式

	// 分析代码
	result, err := analyzer.AnalyzeWithExcludes(path, nil, excludePatterns)
	if err != nil {
		fmt.Fprintf(os.Stderr, translator.Translate("cmd.analysis_failed"), err)
		os.Exit(1)
	}

	// 创建报告
	reportGen := report.NewReport(result)
	reportGen.SetTranslator(translator)

	// 设置报告选项
	options := &report.ReportOptions{
		Verbose:        verbose || topFiles > 10,
		TopFiles:       topFiles,
		MaxIssues:      maxIssues,
		SummaryOnly:    summaryOnly,
		MarkdownOutput: markdownOutput,
	}

	// 生成报告
	reportGen.GenerateConsoleReport(options)
}
