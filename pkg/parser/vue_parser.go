// Package parser 提供多语言代码解析功能
package parser

import (
	"regexp"
	"strings"

	"github.com/Done-0/fuck-u-code/pkg/common"
)

// VueParser Vue单文件组件解析器
type VueParser struct {
	jsParser Parser
	tsParser Parser
}

// NewVueParser 创建新的Vue解析器
func NewVueParser() Parser {
	return &VueParser{
		jsParser: NewJavaScriptParser(),
		tsParser: NewTypeScriptParser(),
	}
}

// SupportedLanguages 返回支持的语言类型
func (p *VueParser) SupportedLanguages() []common.LanguageType {
	return []common.LanguageType{common.Vue}
}

// Parse 解析Vue单文件组件
// 提取<script>或<script setup>标签中的代码，并使用相应的解析器解析
func (p *VueParser) Parse(filePath string, content []byte) (ParseResult, error) {
	contentStr := string(content)

	// 提取script标签内容
	scriptContent, isTypeScript := extractScriptContent(contentStr)

	// 如果没有script标签，返回空结果
	if scriptContent == "" {
		return &BaseParseResult{
			Language:     common.Vue,
			Functions:    []Function{},
			CommentLines: 0,
			TotalLines:   len(strings.Split(contentStr, "\n")),
		}, nil
	}

	// 根据script标签的lang属性选择解析器
	var result ParseResult
	var err error

	if isTypeScript {
		result, err = p.tsParser.Parse(filePath, []byte(scriptContent))
	} else {
		result, err = p.jsParser.Parse(filePath, []byte(scriptContent))
	}

	if err != nil {
		return nil, err
	}

	// 更新语言类型为Vue
	if baseResult, ok := result.(*BaseParseResult); ok {
		baseResult.Language = common.Vue
		// 调整行号偏移，因为script标签可能不在文件开头
		lineOffset := calculateLineOffset(contentStr, scriptContent)
		adjustLineNumbers(baseResult, lineOffset)
	}

	return result, nil
}

// extractScriptContent 从Vue文件中提取script标签的内容
// 返回脚本内容和是否为TypeScript
func extractScriptContent(content string) (string, bool) {
	// 匹配 <script> 或 <script setup> 标签
	// 支持 lang="ts" 或 lang='ts' 或 lang="typescript"
	scriptRegex := regexp.MustCompile(`(?s)<script\s*([^>]*)>(.*?)</script>`)
	matches := scriptRegex.FindStringSubmatch(content)

	if len(matches) < 3 {
		return "", false
	}

	attrs := matches[1]
	scriptContent := matches[2]

	// 检测是否为TypeScript
	isTypeScript := false
	if strings.Contains(attrs, `lang="ts"`) ||
		strings.Contains(attrs, `lang='ts'`) ||
		strings.Contains(attrs, `lang="typescript"`) ||
		strings.Contains(attrs, `lang='typescript'`) {
		isTypeScript = true
	}

	// 去除首尾空白
	scriptContent = strings.TrimSpace(scriptContent)

	return scriptContent, isTypeScript
}

// calculateLineOffset 计算script标签在文件中的行偏移量
func calculateLineOffset(fullContent, scriptContent string) int {
	scriptIndex := strings.Index(fullContent, scriptContent)
	if scriptIndex == -1 {
		return 0
	}

	// 计算script内容之前有多少行
	beforeScript := fullContent[:scriptIndex]
	return strings.Count(beforeScript, "\n")
}

// adjustLineNumbers 调整解析结果中的行号，加上偏移量
func adjustLineNumbers(result *BaseParseResult, offset int) {
	// 调整函数行号
	for i := range result.Functions {
		result.Functions[i].StartLine += offset
		result.Functions[i].EndLine += offset
	}
}
