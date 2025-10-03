// Package parser 提供多语言代码解析功能
package parser

import (
	"regexp"
	"strings"

	"github.com/Done-0/fuck-u-code/pkg/common"
)

// LuaParser Lua语言解析器
type LuaParser struct{}

// NewLuaParser 创建新的Lua语言解析器
func NewLuaParser() Parser {
	return &LuaParser{}
}

// Parse 解析Lua代码
func (p *LuaParser) Parse(filePath string, content []byte) (ParseResult, error) {
	contentStr := string(content)
	lines := strings.Split(contentStr, "\n")

	result := &BaseParseResult{
		Functions:    make([]Function, 0),
		CommentLines: 0,
		TotalLines:   len(lines),
		Language:     common.Lua,
	}

	// 计算注释行数
	result.CommentLines = p.countCommentLines(contentStr)

	// 解析函数
	functions := p.detectFunctions(contentStr, lines)
	result.Functions = functions

	return result, nil
}

// SupportedLanguages 返回支持的语言类型
func (p *LuaParser) SupportedLanguages() []common.LanguageType {
	return []common.LanguageType{common.Lua}
}

// countCommentLines 计算Lua代码中的注释行数
func (p *LuaParser) countCommentLines(content string) int {
	commentCount := 0
	lines := strings.Split(content, "\n")

	// 处理 -- 单行注释和 --[[ ]] 多行注释
	inMultiLineComment := false

	for _, line := range lines {
		trimmedLine := strings.TrimSpace(line)

		if inMultiLineComment {
			commentCount++
			// 检查多行注释是否结束
			if strings.Contains(trimmedLine, "]]") {
				inMultiLineComment = false
			}
			continue
		}

		// 检查单行注释
		if strings.HasPrefix(trimmedLine, "--") {
			commentCount++
			// 检查是否是多行注释开始
			if strings.Contains(trimmedLine, "--[[") {
				inMultiLineComment = true
				// 检查单行多行注释（在同一行结束）
				if strings.Contains(trimmedLine, "]]") {
					inMultiLineComment = false
				}
			}
			continue
		}

		// 检查行中的多行注释开始
		if strings.Contains(trimmedLine, "--[[") {
			commentCount++
			inMultiLineComment = true
			// 检查单行多行注释
			if strings.Contains(trimmedLine, "]]") {
				inMultiLineComment = false
			}
			continue
		}
	}

	return commentCount
}

// detectFunctions 检测Lua函数
func (p *LuaParser) detectFunctions(content string, lines []string) []Function {
	functions := make([]Function, 0)

	// 匹配函数定义的正则表达式
	// 支持 function name(...) 和 local function name(...) 格式
	funcRegex := regexp.MustCompile(`(?m)^\s*(local\s+)?function\s+([a-zA-Z_][a-zA-Z0-9_.:]*)\s*\(([^)]*)\)`)

	matches := funcRegex.FindAllStringSubmatch(content, -1)
	matchIndices := funcRegex.FindAllStringIndex(content, -1)

	for i, match := range matches {
		if len(match) >= 4 {
			funcName := match[2]
			paramStr := strings.TrimSpace(match[3])

			// 计算参数数量
			params := 0
			if len(paramStr) > 0 {
				// 简单的参数计数，按逗号分割
				params = strings.Count(paramStr, ",") + 1
			}

			// 找到函数在哪一行
			startPos := matchIndices[i][0]
			startLine := strings.Count(content[:startPos], "\n") + 1

			// 计算函数结束行
			endLine := p.findFunctionEnd(lines, startLine-1)

			// 计算复杂度
			complexity := p.estimateComplexity(content, startLine-1, endLine-startLine+1)

			function := Function{
				Name:       funcName,
				StartLine:  startLine,
				EndLine:    endLine,
				Complexity: complexity,
				Parameters: params,
			}

			functions = append(functions, function)
		}
	}

	return functions
}

// findFunctionEnd 查找Lua函数结束位置
func (p *LuaParser) findFunctionEnd(lines []string, startLine int) int {
	if startLine >= len(lines) {
		return len(lines)
	}

	endKeywords := []string{"end"}
	blockKeywords := []string{"function", "if", "for", "while", "repeat", "do"}

	depth := 1 // 从function开始，深度为1
	
	for i := startLine + 1; i < len(lines); i++ {
		line := strings.TrimSpace(lines[i])
		
		// 跳过空行和注释行
		if line == "" || strings.HasPrefix(line, "--") {
			continue
		}

		// 检查是否有新的块开始
		for _, keyword := range blockKeywords {
			if strings.Contains(line, keyword) {
				depth++
				break
			}
		}

		// 检查是否有块结束
		for _, keyword := range endKeywords {
			if strings.Contains(line, keyword) {
				depth--
				if depth == 0 {
					return i + 1
				}
				break
			}
		}
	}

	return len(lines)
}

// estimateComplexity 估算Lua函数的循环复杂度
func (p *LuaParser) estimateComplexity(content string, startLine, lineCount int) int {
	complexity := 1

	lines := strings.Split(content, "\n")
	endLine := startLine + lineCount
	if endLine > len(lines) {
		endLine = len(lines)
	}

	for i := startLine; i < endLine; i++ {
		if i >= len(lines) {
			break
		}
		
		line := strings.TrimSpace(lines[i])
		
		// 跳过注释行
		if strings.HasPrefix(line, "--") {
			continue
		}

		// 检查控制流语句
		if strings.Contains(line, "if ") || strings.Contains(line, "elseif ") {
			complexity++
		}
		if strings.Contains(line, "for ") || strings.Contains(line, "while ") {
			complexity++
		}
		if strings.Contains(line, "repeat") {
			complexity++
		}
		// 检查逻辑运算符
		if strings.Contains(line, " and ") || strings.Contains(line, " or ") {
			complexity++
		}
	}

	return complexity
}