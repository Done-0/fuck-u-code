// Package metrics 提供代码质量分析指标
// 创建者：Done-0
package metrics

import (
	"fmt"
	"go/ast"

	"github.com/Done-0/fuck-u-code/pkg/common"
	"github.com/Done-0/fuck-u-code/pkg/i18n"
	"github.com/Done-0/fuck-u-code/pkg/parser"
)

// CommentRatioMetric 检测代码注释覆盖率
type CommentRatioMetric struct {
	*BaseMetric
	translator i18n.Translator
}

// NewCommentRatioMetric 创建注释覆盖率指标
func NewCommentRatioMetric() *CommentRatioMetric {
	translator := i18n.NewTranslator(i18n.EnUS)
	return &CommentRatioMetric{
		BaseMetric: NewBaseMetric(
			i18n.FormatKey("metric", "comment_ratio"),
			"检测代码的注释覆盖率，良好的注释能提高代码可读性和可维护性",
			0.15,
			nil,
		),
		translator: translator,
	}
}

// SetTranslator 设置翻译器
func (m *CommentRatioMetric) SetTranslator(translator i18n.Translator) {
	m.translator = translator
	m.name = translator.Translate(i18n.FormatKey("metric", "comment_ratio"))
}

// Analyze 实现指标接口分析方法
func (m *CommentRatioMetric) Analyze(parseResult parser.ParseResult) MetricResult {
	// 直接从解析结果获取注释信息
	totalLines := parseResult.GetTotalLines()
	commentLines := parseResult.GetCommentLines()

	// 计算注释覆盖率
	commentRatio := 0.0
	if totalLines > 0 {
		commentRatio = float64(commentLines) / float64(totalLines)
	}

	// 计算得分
	score := m.calculateScore(commentRatio)

	// 生成问题报告
	issues := m.generateIssues(parseResult, commentRatio)

	return MetricResult{
		Score:       score,
		Issues:      issues,
		Description: m.Description(),
		Weight:      m.Weight(),
	}
}

// generateIssues 生成注释问题报告
func (m *CommentRatioMetric) generateIssues(parseResult parser.ParseResult, commentRatio float64) []string {
	var issues []string

	// 基于注释率生成基本问题
	if commentRatio < 0.05 {
		issues = append(issues, fmt.Sprintf(m.translator.Translate("issue.comment_very_low"), commentRatio*100))
	} else if commentRatio < 0.1 {
		issues = append(issues, fmt.Sprintf(m.translator.Translate("issue.comment_low"), commentRatio*100))
	}

	// 对于Go语言，检查导出函数/类型是否有注释
	if parseResult.GetLanguage() == common.Go {
		file, _, _ := ExtractGoAST(parseResult)
		if file != nil {
			m.checkGoExportedComments(file, &issues)
		}
	}

	return issues
}

// checkGoExportedComments 检查Go源码中导出的函数和类型是否有注释
func (m *CommentRatioMetric) checkGoExportedComments(file *ast.File, issues *[]string) {
	ast.Inspect(file, func(n ast.Node) bool {
		switch node := n.(type) {
		case *ast.FuncDecl:
			if node.Name.IsExported() && !m.hasDocComment(node.Doc) {
				*issues = append(*issues, fmt.Sprintf(
					m.translator.Translate("issue.exported_func_no_comment"),
					node.Name.Name,
				))
			}
		case *ast.GenDecl:
			for _, spec := range node.Specs {
				if typeSpec, ok := spec.(*ast.TypeSpec); ok &&
					typeSpec.Name.IsExported() &&
					!m.hasDocComment(node.Doc) {
					*issues = append(*issues, fmt.Sprintf(
						m.translator.Translate("issue.exported_type_no_comment"),
						typeSpec.Name.Name,
					))
				}
			}
		}
		return true
	})
}

// hasDocComment 检查是否有文档注释
func (m *CommentRatioMetric) hasDocComment(commentGroup *ast.CommentGroup) bool {
	return commentGroup != nil && len(commentGroup.List) > 0
}

// calculateScore 根据注释覆盖率计算得分
func (m *CommentRatioMetric) calculateScore(ratio float64) float64 {
	// 基础分0.9，每1%注释减少0.05分
	baseScore := 0.9
	reducePerPercent := 0.05
	percentageComment := ratio * 100

	score := baseScore - (percentageComment * reducePerPercent)

	// 限制范围
	if score < 0.0 {
		return 0.0
	}

	return score
}
