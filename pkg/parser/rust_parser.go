// Package parser 提供多语言代码解析功能
package parser

import (
	"regexp"
	"sort"
	"strings"

	"github.com/Done-0/fuck-u-code/pkg/common"
)

// 预编译的正则表达式，提升性能
var (
	// 结构和函数模式
	rustFunctionPattern = regexp.MustCompile(`(?m)^\s*(?:pub(?:\([^)]*\))?\s+)?(?:async\s+)?fn\s+([a-zA-Z_][a-zA-Z0-9_]*)\s*(?:<[^>]*>)?\s*\(([^)]*)`)

	// 宏定义模式
	macroPattern     = regexp.MustCompile(`(?m)^\s*(?:pub\s+)?macro_rules!\s+([a-zA-Z_][a-zA-Z0-9_]*)\s*\{`)
	macroRulePattern = regexp.MustCompile(`=>\s*\{`)

	// 合并同类宏的正则表达式
	reErrorMacros   = regexp.MustCompile(`\b(?:panic!|unreachable!|unimplemented!|todo!)\b`)
	rePrintMacros   = regexp.MustCompile(`\b(?:println!|eprintln!|print!|eprint!)\b`)
	reAssertMacros  = regexp.MustCompile(`\b(?:assert!|assert_eq!|assert_ne!|debug_assert!|debug_assert_eq!|debug_assert_ne!)\b`)
	reFormatMacros  = regexp.MustCompile(`\b(?:format!|write!|writeln!)\b`)
	reUtilityMacros = regexp.MustCompile(`\b(?:vec!|matches!|cfg!|env!|include_str!|include_bytes!|concat!|stringify!|thread_local!)\b`)

	// 复杂度分析相关的正则表达式
	reIf             = regexp.MustCompile(`\bif\b`)
	reElseIf         = regexp.MustCompile(`\belse\s+if\b`)
	reFor            = regexp.MustCompile(`\bfor\b`)
	reWhile          = regexp.MustCompile(`\bwhile\b`)
	reLoop           = regexp.MustCompile(`\bloop\b`)
	reAnd            = regexp.MustCompile(`&&`)
	reOr             = regexp.MustCompile(`\|\|`)
	reQuestion       = regexp.MustCompile(`\?`)
	reMatchArm       = regexp.MustCompile(`=>`)
	reMatchOrPattern = regexp.MustCompile(`\s*\|\s*[^|=>]+\s*=>`)
	reLetElse        = regexp.MustCompile(`\blet\s+.*\s+else\b`)
	reIfLet          = regexp.MustCompile(`\bif\s+let\b`)
	reWhileLet       = regexp.MustCompile(`\bwhile\s+let\b`)

	// 宏复杂度配置
	macroComplexityWeights = struct {
		printMacros   int
		assertMacros  int
		formatMacros  int
		utilityMacros int
		errorMacros   int
		patternMacros int
	}{
		printMacros:   1,
		assertMacros:  2,
		formatMacros:  1,
		utilityMacros: 1,
		errorMacros:   2,
		patternMacros: 2,
	}
)

// RustParser Rust语言解析器
type RustParser struct {
	*GenericParser
	lineOffsets []int
}

// NewRustParser 创建新的Rust语言解析器
func NewRustParser() Parser {
	return &RustParser{
		GenericParser: &GenericParser{},
	}
}

// Parse 解析Rust代码
func (p *RustParser) Parse(filePath string, content []byte) (ParseResult, error) {
	contentStr := string(content)
	p.precomputeLineOffsets(contentStr)

	result := &BaseParseResult{
		Functions:    p.detectFunctions(contentStr),
		CommentLines: p.countRustCommentLines(contentStr),
		TotalLines:   len(p.lineOffsets),
		Language:     common.Rust,
	}

	return result, nil
}

// precomputeLineOffsets 预计算每行起始位置的偏移量
func (p *RustParser) precomputeLineOffsets(content string) {
	p.lineOffsets = []int{0}
	for i, r := range content {
		if r == '\n' {
			p.lineOffsets = append(p.lineOffsets, i+1)
		}
	}
}

// SupportedLanguages 返回支持的语言类型
func (p *RustParser) SupportedLanguages() []common.LanguageType {
	return []common.LanguageType{common.Rust}
}

// detectFunctions 检测所有 Rust 函数和宏
func (p *RustParser) detectFunctions(content string) []Function {
	uniqueFunctions := make(map[string]Function)

	// 1. 解析所有函数 (不再区分顶层、impl 还是 trait)
	p.parseFunctions(content, uniqueFunctions)

	// 2. 解析宏定义
	p.parseMacros(content, uniqueFunctions)

	functions := make([]Function, 0, len(uniqueFunctions))
	for _, f := range uniqueFunctions {
		functions = append(functions, f)
	}
	return functions
}

// parseFunctions 解析文件中的所有函数
func (p *RustParser) parseFunctions(content string, uniqueFunctions map[string]Function) {
	matches := rustFunctionPattern.FindAllStringSubmatchIndex(content, -1)
	for _, match := range matches {
		startPos := match[0]
		if p.isInComment(content, startPos) {
			continue
		}

		submatches := rustFunctionPattern.FindStringSubmatch(content[startPos:match[1]])
		funcName := submatches[1]
		paramStr := submatches[2]

		endPos := p.findBlockEnd(content, startPos)
		if endPos == startPos { // 函数可能没有函数体 (e.g., in a trait)
			endPos = p.findStatementEnd(content, startPos)
		}

		startLine := p.getLineNumber(startPos)
		endLine := p.getLineNumber(endPos)
		params := p.countRustParameters(paramStr)
		complexity := p.estimateComplexity(content, startPos, endPos)

		// 使用起始行作为唯一标识符的一部分，防止同名函数冲突
		key := funcName + "@" + string(rune(startLine))
		if _, exists := uniqueFunctions[key]; !exists {
			uniqueFunctions[key] = Function{
				Name:       funcName,
				StartLine:  startLine,
				EndLine:    endLine,
				Complexity: complexity,
				Parameters: params,
			}
		}
	}
}

// parseMacros 解析宏定义
func (p *RustParser) parseMacros(content string, uniqueFunctions map[string]Function) {
	macroMatches := macroPattern.FindAllStringSubmatchIndex(content, -1)
	for _, macroMatch := range macroMatches {
		startPos := macroMatch[0]
		submatches := macroPattern.FindStringSubmatch(content[startPos:macroMatch[1]])
		macroName := submatches[1]

		endPos := p.findBlockEnd(content, startPos)
		startLine := p.getLineNumber(startPos)
		endLine := p.getLineNumber(endPos)
		complexity := p.calculateMacroDefinitionComplexity(content, startPos, endPos)
		params := p.calculateMacroParameters(content, startPos, endPos)

		key := macroName + "!@" + string(rune(startLine))
		if _, exists := uniqueFunctions[key]; !exists {
			uniqueFunctions[key] = Function{
				Name:       macroName + "!",
				StartLine:  startLine,
				EndLine:    endLine,
				Complexity: complexity,
				Parameters: params,
			}
		}
	}
}

// findStatementEnd 查找语句结束位置（分号或行尾）
func (p *RustParser) findStatementEnd(content string, startPos int) int {
	for i := startPos; i < len(content); i++ {
		if content[i] == ';' || content[i] == '\n' {
			return i
		}
	}
	return len(content) - 1
}

// countRustParameters 函数参数计数
func (p *RustParser) countRustParameters(paramStr string) int {
	paramStr = strings.TrimSpace(paramStr)
	if paramStr == "" {
		return 0
	}
	if !strings.Contains(paramStr, ",") {
		return 1
	}
	paramCount := 0
	angleDepth := 0
	params := strings.FieldsFunc(paramStr, func(r rune) bool {
		switch r {
		case '<':
			angleDepth++
		case '>':
			if angleDepth > 0 {
				angleDepth--
			}
		}
		return r == ',' && angleDepth == 0
	})
	for _, param := range params {
		if strings.TrimSpace(param) != "" {
			paramCount++
		}
	}
	return paramCount
}

// estimateComplexity 估算Rust函数的圈复杂度
func (p *RustParser) estimateComplexity(content string, startPos int, endPos int) int {
	if endPos <= startPos {
		return 1
	}
	methodContent := content[startPos:endPos]
	complexity := 1

	ifMatches := reIf.FindAllStringIndex(methodContent, -1)
	elseIfMatches := reElseIf.FindAllStringIndex(methodContent, -1)
	complexity += len(ifMatches) - len(elseIfMatches)

	complexity += len(reFor.FindAllStringIndex(methodContent, -1))
	complexity += len(reWhile.FindAllStringIndex(methodContent, -1))
	complexity += len(reLoop.FindAllStringIndex(methodContent, -1))
	complexity += len(reAnd.FindAllStringIndex(methodContent, -1))
	complexity += len(reOr.FindAllStringIndex(methodContent, -1))
	complexity += len(reQuestion.FindAllStringIndex(methodContent, -1))

	matchArms := reMatchArm.FindAllStringIndex(methodContent, -1)
	orPatterns := reMatchOrPattern.FindAllStringIndex(methodContent, -1)
	complexity += len(matchArms) + len(orPatterns)

	complexity += len(reLetElse.FindAllStringIndex(methodContent, -1))
	complexity += len(reIfLet.FindAllStringIndex(methodContent, -1))
	complexity += len(reWhileLet.FindAllStringIndex(methodContent, -1))

	complexity += p.calculateMacroCallComplexity(methodContent)
	return complexity
}

// calculateMacroDefinitionComplexity 计算宏定义的复杂度
func (p *RustParser) calculateMacroDefinitionComplexity(content string, startPos int, endPos int) int {
	macroContent := content[startPos:endPos]
	complexity := 1
	rules := macroRulePattern.FindAllStringIndex(macroContent, -1)
	complexity += len(rules)
	complexity += len(reIf.FindAllStringIndex(macroContent, -1))
	complexity += len(reMatchArm.FindAllStringIndex(macroContent, -1))
	complexity += p.calculateMacroCallComplexity(macroContent)
	return complexity
}

// calculateMacroCallComplexity 计算宏调用的复杂度
func (p *RustParser) calculateMacroCallComplexity(content string) int {
	complexity := 0
	complexity += len(rePrintMacros.FindAllStringIndex(content, -1)) * macroComplexityWeights.printMacros
	complexity += len(reAssertMacros.FindAllStringIndex(content, -1)) * macroComplexityWeights.assertMacros
	complexity += len(reFormatMacros.FindAllStringIndex(content, -1)) * macroComplexityWeights.formatMacros
	complexity += len(reUtilityMacros.FindAllStringIndex(content, -1)) * macroComplexityWeights.utilityMacros
	complexity += len(reErrorMacros.FindAllStringIndex(content, -1)) * macroComplexityWeights.errorMacros
	return complexity
}

// calculateMacroParameters 宏参数计数
func (p *RustParser) calculateMacroParameters(content string, startPos int, endPos int) int {
	macroContent := content[startPos:endPos]
	ruleMatches := regexp.MustCompile(`\(\s*([^)]*)\s*\)\s*=>`).FindStringSubmatch(macroContent)
	if len(ruleMatches) < 2 {
		return 0
	}
	paramPattern := ruleMatches[1]
	macroParamRegex := regexp.MustCompile(`\$[a-zA-Z_][a-zA-Z0-9_]*\s*:\s*[a-zA-Z_][a-zA-Z0-9_]*`)
	params := macroParamRegex.FindAllString(paramPattern, -1)
	return len(params)
}

// findBlockEnd 查找代码块结束位置（大括号匹配），能正确处理字符串和注释
func (p *RustParser) findBlockEnd(content string, startPos int) int {
	openBracePos := strings.Index(content[startPos:], "{")
	if openBracePos == -1 {
		return startPos
	}
	openBracePos += startPos

	bracketCount := 1
	i := openBracePos + 1
	for i < len(content) {
		switch content[i] {
		case '{':
			bracketCount++
		case '}':
			bracketCount--
			if bracketCount == 0 {
				return i
			}
		case '/':
			if i+1 < len(content) {
				if content[i+1] == '/' { // 行注释
					if next_line := strings.Index(content[i:], "\n"); next_line != -1 {
						i += next_line
					} else {
						return len(content) - 1
					}
				} else if content[i+1] == '*' { // 块注释
					if end_comment := strings.Index(content[i+2:], "*/"); end_comment != -1 {
						i += end_comment + 3
						continue
					} else {
						return len(content) - 1
					}
				}
			}
		case '"': // 普通字符串
			i++
			for i < len(content) {
				if content[i] == '\\' {
					i += 2
					continue
				}
				if content[i] == '"' {
					break
				}
				i++
			}
		case 'r': // 原始字符串
			if i+1 < len(content) && content[i+1] == '#' {
				hashCount := 0
				start := i + 1
				for start < len(content) && content[start] == '#' {
					hashCount++
					start++
				}
				if start < len(content) && content[start] == '"' {
					closer := "\"" + strings.Repeat("#", hashCount)
					if end_raw_str := strings.Index(content[start+1:], closer); end_raw_str != -1 {
						i = start + 1 + end_raw_str + len(closer) - 1
					}
				}
			}
		}
		i++
	}
	return len(content) - 1
}

// getLineNumber 使用预计算的缓存高效获取行号
func (p *RustParser) getLineNumber(pos int) int {
	line := sort.Search(len(p.lineOffsets), func(i int) bool {
		return p.lineOffsets[i] > pos
	})
	return line
}

// countRustCommentLines 计算Rust代码中的注释行数
func (p *RustParser) countRustCommentLines(content string) int {
	commentCount := 0
	lines := strings.Split(content, "\n")
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
			if !strings.Contains(trimmedLine, "*/") {
				inBlockComment = true
			}
		}
	}
	return commentCount
}

// isInComment 检查给定位置是否在注释内
func (p *RustParser) isInComment(content string, pos int) bool {
	lineStart := strings.LastIndex(content[:pos], "\n") + 1
	line := content[lineStart:pos]
	if strings.Contains(line, "//") {
		return true
	}
	lastBlockOpen := strings.LastIndex(content[:pos], "/*")
	lastBlockClose := strings.LastIndex(content[:pos], "*/")
	return lastBlockOpen != -1 && lastBlockOpen > lastBlockClose
}
