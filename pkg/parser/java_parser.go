// Package parser 提供多语言代码解析功能
package parser

import (
	"strings"

	"github.com/Done-0/fuck-u-code/pkg/common"
)

// JavaParser Java语言解析器
type JavaParser struct{}

// NewJavaParser 创建新的Java语言解析器
func NewJavaParser() Parser {
	return &JavaParser{}
}

// Parse 解析Java代码
func (p *JavaParser) Parse(filePath string, content []byte) (ParseResult, error) {
	contentStr := string(content)
	lines := strings.Split(contentStr, "\n")

	result := &BaseParseResult{
		Functions:    make([]Function, 0),
		CommentLines: 0,
		TotalLines:   len(lines),
		Language:     common.Java,
	}

	// 计算注释行数
	result.CommentLines = p.countCommentLines(contentStr)

	// 由于ANTLR解析器的复杂性，这里使用基于文本的简化分析
	// 对于实际应用中的完整功能，需要使用完整的ANTLR生成的解析器
	result.Functions = p.detectJavaFunctions(contentStr, lines)

	return result, nil
}

// SupportedLanguages 返回支持的语言类型
func (p *JavaParser) SupportedLanguages() []common.LanguageType {
	return []common.LanguageType{common.Java}
}

// countCommentLines 计算Java代码中的注释行数
func (p *JavaParser) countCommentLines(content string) int {
	commentCount := 0
	lines := strings.Split(content, "\n")

	// 处理 // 和 /* */ 注释
	inBlockComment := false
	inJavadoc := false

	for _, line := range lines {
		trimmedLine := strings.TrimSpace(line)

		if inBlockComment || inJavadoc {
			commentCount++
			if strings.Contains(trimmedLine, "*/") {
				inBlockComment = false
				inJavadoc = false
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

		if strings.HasPrefix(trimmedLine, "/**") {
			commentCount++
			inJavadoc = true
			if strings.Contains(trimmedLine, "*/") {
				inJavadoc = false
			}
			continue
		}
	}

	return commentCount
}

// detectJavaFunctions 基于文本分析检测Java方法
func (p *JavaParser) detectJavaFunctions(content string, lines []string) []Function {
	functions := make([]Function, 0)

	// 简化的Java方法检测
	bracketLevel := 0
	currentFunc := ""
	startLine := 0
	inMethod := false

	for i, line := range lines {
		trimmedLine := strings.TrimSpace(line)

		// 检测方法开始
		if !inMethod && (strings.Contains(trimmedLine, "public ") ||
			strings.Contains(trimmedLine, "private ") ||
			strings.Contains(trimmedLine, "protected ") ||
			strings.Contains(trimmedLine, "static ")) &&
			strings.Contains(trimmedLine, "(") &&
			!strings.HasPrefix(trimmedLine, "//") {

			// 简单提取方法名
			parts := strings.Split(trimmedLine, "(")
			if len(parts) > 0 {
				nameSegments := strings.Fields(parts[0])
				if len(nameSegments) > 0 {
					currentFunc = nameSegments[len(nameSegments)-1]
					startLine = i + 1
					inMethod = true
				}
			}
		}

		// 括号计数
		if inMethod {
			bracketLevel += strings.Count(line, "{")
			bracketLevel -= strings.Count(line, "}")

			// 方法结束
			if bracketLevel <= 0 && strings.Contains(line, "}") {
				// 计算参数数量
				paramCount := 0
				if len(strings.Split(lines[startLine-1], "(")) > 1 {
					paramStr := strings.Split(strings.Split(lines[startLine-1], "(")[1], ")")[0]
					if paramStr != "" {
						paramCount = strings.Count(paramStr, ",") + 1
					}
				}

				// 重新计算当前函数的代码
				functionContent := strings.Join(lines[startLine-1:i+1], "\n")

				// 估算复杂度
				complexity := 1 + strings.Count(functionContent, "if ") + strings.Count(functionContent, "for ") +
					strings.Count(functionContent, "while ") + strings.Count(functionContent, "catch ") +
					strings.Count(functionContent, "case ")

				functions = append(functions, Function{
					Name:       currentFunc,
					StartLine:  startLine,
					EndLine:    i + 1,
					Complexity: complexity,
					Parameters: paramCount,
				})

				inMethod = false
				bracketLevel = 0
			}
		}
	}

	return functions
}
