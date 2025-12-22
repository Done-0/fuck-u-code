// Package parser 提供多语言代码解析功能
package parser

import (
	"strings"

	"github.com/Done-0/fuck-u-code/pkg/common"
)

// CudaParser CUDA语言解析器
type CudaParser struct{}

// NewCudaParser 创建新的CUDA语言解析器
func NewCudaParser() Parser {
	return &CudaParser{}
}

// Parse 解析CUDA代码
func (p *CudaParser) Parse(filePath string, content []byte) (ParseResult, error) {
	contentStr := string(content)
	lines := strings.Split(contentStr, "\n")

	// 检测语言类型
	detector := common.NewLanguageDetector()
	language := detector.DetectLanguage(filePath)

	result := &BaseParseResult{
		Functions:    make([]Function, 0),
		CommentLines: 0,
		TotalLines:   len(lines),
		Language:     language,
	}

	// 计算注释行数
	result.CommentLines = p.countCommentLines(contentStr)

	result.Functions = p.detectFunctions(contentStr, lines)
	return result, nil
}

// SupportedLanguages 返回支持的语言类型
func (p *CudaParser) SupportedLanguages() []common.LanguageType {
	return []common.LanguageType{common.CUDA}
}

// countCommentLines 计算CUDA代码中的注释行数
func (p *CudaParser) countCommentLines(content string) int {
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

// detectFunctions 基于文本分析的CUDA函数检测
func (p *CudaParser) detectFunctions(_ string, lines []string) []Function {
	functions := make([]Function, 0)

	// 简单的函数定义模式检测
	for i, line := range lines {
		trimmed := strings.TrimSpace(line)
		if strings.HasSuffix(trimmed, "{") && !strings.HasPrefix(trimmed, "{") {
			// 可能是函数定义
			name := p.extractFunctionName(trimmed)
			if name != "" {
				params := p.countParameters(trimmed)

				// 寻找函数结束位置
				endLine := p.findFunctionEnd(lines, i)

				// 计算复杂度
				complexity := p.estimateComplexity(lines, i, endLine-i)

				function := Function{
					Name:       name,
					StartLine:  i + 1,
					EndLine:    endLine,
					Complexity: complexity,
					Parameters: params,
				}

				functions = append(functions, function)
			}
		}
	}

	return functions
}

// extractFunctionName 从函数定义行提取函数名
func (p *CudaParser) extractFunctionName(line string) string {
	// 去掉结尾的 {
	line = strings.TrimSuffix(line, "{")
	line = strings.TrimSpace(line)

	// 去掉参数部分
	if idx := strings.LastIndex(line, "("); idx != -1 {
		line = line[:idx]
		line = strings.TrimSpace(line)

		// 提取最后一个单词，即函数名
		parts := strings.Fields(line)
		if len(parts) > 0 {
			return parts[len(parts)-1]
		}
	}

	return ""
}

// countParameters 计算函数参数数量
func (p *CudaParser) countParameters(line string) int {
	start := strings.LastIndex(line, "(")
	end := strings.LastIndex(line, ")")

	if start != -1 && end != -1 && end > start {
		params := line[start+1 : end]
		params = strings.TrimSpace(params)

		if params == "" || params == "void" {
			return 0
		}

		return strings.Count(params, ",") + 1
	}

	return 0
}

// findFunctionEnd 查找函数结束位置
func (p *CudaParser) findFunctionEnd(lines []string, startLine int) int {
	bracketCount := 1

	for i := startLine + 1; i < len(lines); i++ {
		line := lines[i]

		for _, char := range line {
			switch char {
			case '{':
				bracketCount++
			case '}':
				bracketCount--
				if bracketCount == 0 {
					return i + 1
				}
			}
		}
	}

	return len(lines)
}

// estimateComplexity 估算函数复杂度
func (p *CudaParser) estimateComplexity(lines []string, startLine, lineCount int) int {
	complexity := 1

	// 定义复杂度关键词
	keywords := []string{"if", "else", "for", "while", "do", "switch", "case", "catch", "?", "&&", "||"}

	for i := startLine; i < startLine+lineCount && i < len(lines); i++ {
		line := lines[i]

		for _, keyword := range keywords {
			count := strings.Count(line, keyword)

			for j := 0; j < count; j++ {
				pos := strings.Index(line, keyword)
				if pos != -1 {
					if (pos == 0 || !isAlphaNum(rune(line[pos-1]))) &&
						(pos+len(keyword) >= len(line) || !isAlphaNum(rune(line[pos+len(keyword)]))) {
						complexity++
					}
					line = line[pos+len(keyword):]
				}
			}
		}
	}

	return complexity
}


