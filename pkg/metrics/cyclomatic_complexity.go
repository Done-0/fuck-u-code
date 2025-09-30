package metrics

import (
	"fmt"
	"go/ast"
	"go/token"
	"strings"

	"github.com/Done-0/fuck-u-code/pkg/i18n"
	"github.com/Done-0/fuck-u-code/pkg/parser"
)

// CyclomaticComplexityMetric 计算代码的循环复杂度
type CyclomaticComplexityMetric struct {
	*BaseMetric
	translator i18n.Translator
}

// NewCyclomaticComplexityMetric 创建循环复杂度指标
func NewCyclomaticComplexityMetric() Metric {
	translator := i18n.NewTranslator(i18n.EnUS) // 默认使用中文
	return &CyclomaticComplexityMetric{
		BaseMetric: NewBaseMetric(
			i18n.FormatKey("metric", "cyclomatic_complexity"),
			translator.Translate("metric.cyclomatic_complexity.description"),
			0.3,
			nil, // 支持所有语言
		),
		translator: translator,
	}
}

// SetTranslator 设置翻译器
func (m *CyclomaticComplexityMetric) SetTranslator(translator i18n.Translator) {
	m.translator = translator
	m.name = translator.Translate(i18n.FormatKey("metric", "cyclomatic_complexity"))
}

// Analyze 实现指标接口分析方法
func (m *CyclomaticComplexityMetric) Analyze(parseResult parser.ParseResult) MetricResult {
	file, _, content := ExtractGoAST(parseResult)

	// 如果content为空，使用解析结果获取
	if len(content) == 0 {
		contentStr := ""
		for i := 0; i < parseResult.GetTotalLines(); i++ {
			contentStr += "\n"
		}
		content = []byte(contentStr)
	}

	score, issues := m.analyzeComplexity(file, content, parseResult)

	return MetricResult{
		Score:       score,
		Issues:      issues,
		Description: m.Description(),
		Weight:      m.Weight(),
	}
}

// analyzeComplexity 分析代码的循环复杂度
func (m *CyclomaticComplexityMetric) analyzeComplexity(file *ast.File, content []byte, parseResult parser.ParseResult) (float64, []string) {
	var issues []string
	funcCount := 0
	totalComplexity := 0

	// 对于Go语言使用AST分析
	if file != nil {
		ast.Inspect(file, func(n ast.Node) bool {
			funcDecl, ok := n.(*ast.FuncDecl)
			if !ok {
				return true
			}

			funcName := funcDecl.Name.Name
			complexity := m.calculateComplexity(funcDecl)
			funcCount++
			totalComplexity += complexity

			if complexity > 15 {
				issues = append(issues, fmt.Sprintf(m.translator.Translate("issue.high_complexity"), funcName, complexity))
			} else if complexity > 10 {
				issues = append(issues, fmt.Sprintf(m.translator.Translate("issue.medium_complexity"), funcName, complexity))
			}
			return true
		})
	} else {
		// 使用解析结果中的函数信息
		functions := parseResult.GetFunctions()
		for _, function := range functions {
			funcCount++
			totalComplexity += function.Complexity

			if function.Complexity > 15 {
				issues = append(issues, fmt.Sprintf(m.translator.Translate("issue.high_complexity"), function.Name, function.Complexity))
			} else if function.Complexity > 10 {
				issues = append(issues, fmt.Sprintf(m.translator.Translate("issue.medium_complexity"), function.Name, function.Complexity))
			}
		}

		// 如果没有函数信息，则使用基于文本的分析
		if funcCount == 0 {
			complexity := m.calculateTextBasedComplexity(string(content))
			funcCount = 1
			totalComplexity = complexity

			if complexity > 100 {
				issues = append(issues, fmt.Sprintf(m.translator.Translate("issue.file_high_complexity"), complexity))
			} else if complexity > 50 {
				issues = append(issues, fmt.Sprintf(m.translator.Translate("issue.file_medium_complexity"), complexity))
			}
		}
	}

	if funcCount == 0 {
		return 0.0, issues
	}

	avgComplexity := float64(totalComplexity) / float64(funcCount)
	return m.calculateScore(avgComplexity), issues
}

// calculateComplexity 计算Go函数的复杂度
func (m *CyclomaticComplexityMetric) calculateComplexity(funcDecl *ast.FuncDecl) int {
	complexity := 1

	ast.Inspect(funcDecl, func(n ast.Node) bool {
		switch node := n.(type) {
		case *ast.IfStmt:
			complexity++
		case *ast.ForStmt, *ast.RangeStmt:
			complexity++
		case *ast.CaseClause:
			complexity++
		case *ast.BinaryExpr:
			if node.Op == token.LAND || node.Op == token.LOR {
				complexity++
			}
		}
		return true
	})

	return complexity
}

// calculateTextBasedComplexity 基于文本内容简单估算复杂度
func (m *CyclomaticComplexityMetric) calculateTextBasedComplexity(content string) int {
	complexity := 1

	// 常见控制结构关键字
	controlKeywords := []string{
		"if", "for", "while", "switch", "case",
		"catch", "&&", "||", "?", "foreach",
		"elif", "except", "try", "else if",
	}

	// 简单统计关键字出现次数
	for _, keyword := range controlKeywords {
		count := strings.Count(content, keyword)
		complexity += count
	}

	return complexity
}

// calculateScore 根据平均复杂度计算得分
func (m *CyclomaticComplexityMetric) calculateScore(avgComplexity float64) float64 {
	// 基础分0.4，每点复杂度增加0.1分
	baseScore := 0.4
	increasePerLevel := 0.1

	score := baseScore + (avgComplexity * increasePerLevel)

	// 限制范围
	if score > 1.0 {
		return 1.0
	}

	return score
}
