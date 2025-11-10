// Package parser 提供多语言代码解析功能
package parser

import (
	"regexp"
	"strings"

	"github.com/Done-0/fuck-u-code/pkg/common"
)

// KotlinParser Kotlin语言解析器
type KotlinParser struct{}

// NewKotlinParser 创建新的Kotlin语言解析器
func NewKotlinParser() Parser {
	return &KotlinParser{}
}

// Parse 解析Kotlin代码
func (p *KotlinParser) Parse(filePath string, content []byte) (ParseResult, error) {
	contentStr := string(content)
	lines := strings.Split(contentStr, "\n")

	result := &BaseParseResult{
		Functions:    make([]Function, 0),
		CommentLines: 0,
		TotalLines:   len(lines),
		Language:     common.Kotlin,
	}

	// 计算注释行数
	result.CommentLines = p.countCommentLines(contentStr)

	// 检测Kotlin函数
	result.Functions = p.detectKotlinFunctions(lines)

	return result, nil
}

// SupportedLanguages 返回支持的语言类型
func (p *KotlinParser) SupportedLanguages() []common.LanguageType {
	return []common.LanguageType{common.Kotlin}
}

// countCommentLines 计算Kotlin代码中的注释行数
func (p *KotlinParser) countCommentLines(content string) int {
	commentCount := 0
	lines := strings.Split(content, "\n")

	// 处理 // 和 /* */ 注释
	inBlockComment := false

	for _, line := range lines {
		trimmedLine := strings.TrimSpace(line)

		if inBlockComment {
			commentCount++
			if strings.Contains(trimmedLine, "*/") {
				inBlockComment = false
			}
			continue
		}

		if strings.HasPrefix(trimmedLine, "//") {
			commentCount++
			continue
		}

		if strings.HasPrefix(trimmedLine, "/*") {
			commentCount++
			inBlockComment = true
			if strings.Contains(trimmedLine, "*/") {
				inBlockComment = false
			}
			continue
		}
	}

	return commentCount
}

// detectKotlinFunctions 基于文本分析检测Kotlin函数
func (p *KotlinParser) detectKotlinFunctions(lines []string) []Function {
	functions := make([]Function, 0)

	// Kotlin函数模式
	// fun functionName(params): ReturnType
	// fun Type.extensionFunction(params): ReturnType
	functionPattern := regexp.MustCompile(`^\s*(private|public|internal|protected)?\s*(suspend)?\s*fun\s+([A-Za-z_][A-Za-z0-9_]*\.)?([A-Za-z_][A-Za-z0-9_]*)\s*\(([^)]*)\)`)

	inComment := false

	for i, line := range lines {
		trimmedLine := strings.TrimSpace(line)

		// 跳过注释行
		if strings.HasPrefix(trimmedLine, "//") {
			continue
		}

		if strings.HasPrefix(trimmedLine, "/*") {
			inComment = true
			continue
		}

		if inComment {
			if strings.Contains(trimmedLine, "*/") {
				inComment = false
			}
			continue
		}

		// 检测函数定义
		if matches := functionPattern.FindStringSubmatch(trimmedLine); matches != nil {
			functionName := matches[4] // 函数名
			paramsStr := matches[5]    // 参数字符串

			// 计算参数数量
			paramCount := p.countParameters(paramsStr)

			// 计算函数长度和复杂度
			startLine := i + 1
			endLine, complexity := p.calculateFunctionMetrics(lines, i)

			function := Function{
				Name:       functionName,
				StartLine:  startLine,
				EndLine:    endLine,
				Parameters: paramCount,
				Complexity: complexity,
			}

			functions = append(functions, function)
		}
	}

	return functions
}

// countParameters 计算Kotlin函数参数数量
func (p *KotlinParser) countParameters(paramsStr string) int {
	if strings.TrimSpace(paramsStr) == "" {
		return 0
	}

	// 简单的参数计数，按逗号分割
	// 这里可能需要更复杂的解析来处理泛型和lambda参数
	params := strings.Split(paramsStr, ",")
	count := 0

	for _, param := range params {
		if strings.TrimSpace(param) != "" {
			count++
		}
	}

	return count
}

// calculateFunctionMetrics 计算函数长度和圈复杂度
func (p *KotlinParser) calculateFunctionMetrics(lines []string, startIndex int) (int, int) {
	braceLevel := 0
	complexity := 1 // 基础复杂度为1
	endLine := startIndex

	// Kotlin复杂度关键字
	complexityKeywords := []string{
		"if", "else", "when", "for", "while", "do", "try", "catch",
		"&&", "||", "?:", "?.", "!!", "break", "continue", "return",
	}

	for i := startIndex; i < len(lines); i++ {
		line := lines[i]
		trimmedLine := strings.TrimSpace(line)

		// 跳过注释
		if strings.HasPrefix(trimmedLine, "//") {
			continue
		}

		// 计算大括号层级
		openBraces := strings.Count(line, "{")
		closeBraces := strings.Count(line, "}")
		braceLevel += openBraces - closeBraces

		// 计算复杂度
		for _, keyword := range complexityKeywords {
			if strings.Contains(line, keyword) {
				// 简单的关键字匹配，实际应该更精确
				complexity++
			}
		}

		// 如果是函数开始行且包含大括号，或者大括号层级回到0
		if i == startIndex {
			if openBraces > 0 {
				// 函数有大括号开始
				endLine = i
			} else {
				// 可能是单表达式函数
				endLine = i
				break
			}
		} else if braceLevel <= 0 && i > startIndex {
			endLine = i
			break
		} else {
			endLine = i
		}
	}

	return endLine + 1, complexity
}