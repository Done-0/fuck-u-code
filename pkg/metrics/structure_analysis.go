package metrics

import (
	"fmt"
	"go/ast"
	"strings"
)

// StructureAnalysisMetric 分析代码结构，检测乱嵌套乱引用
type StructureAnalysisMetric struct {
	*BaseMetric
}

// Analyze 分析代码结构
func (m *StructureAnalysisMetric) Analyze(file *ast.File) (float64, []string) {
	var issues []string

	// 分析嵌套深度
	maxNestingDepth := 0
	nestingIssues := m.analyzeNestingDepth(file, &maxNestingDepth)
	issues = append(issues, nestingIssues...)

	// 分析循环引用
	circularIssues := m.analyzeCircularDependencies(file)
	issues = append(issues, circularIssues...)

	// 分析导入复杂度
	importIssues := m.analyzeImportComplexity(file)
	issues = append(issues, importIssues...)

	// 计算结构得分
	score := m.calculateScore(maxNestingDepth, len(circularIssues), len(importIssues))
	return score, issues
}

// analyzeNestingDepth 分析代码嵌套深度
func (m *StructureAnalysisMetric) analyzeNestingDepth(file *ast.File, maxDepth *int) []string {
	var issues []string

	ast.Inspect(file, func(n ast.Node) bool {
		switch node := n.(type) {
		case *ast.FuncDecl:
			depth := m.calculateNestingDepth(node.Body)
			if depth > *maxDepth {
				*maxDepth = depth
			}

			if depth > 5 {
				issues = append(issues, fmt.Sprintf(m.translator.Translate("issue.high_complexity"), node.Name.Name, depth))
			} else if depth > 3 {
				issues = append(issues, fmt.Sprintf(m.translator.Translate("issue.medium_complexity"), node.Name.Name, depth))
			}
		}
		return true
	})

	return issues
}

// calculateNestingDepth 计算代码块的嵌套深度
func (m *StructureAnalysisMetric) calculateNestingDepth(block *ast.BlockStmt) int {
	if block == nil {
		return 0
	}

	maxDepth := 0

	var inspectBlock func(block *ast.BlockStmt, currentDepth int)
	inspectBlock = func(block *ast.BlockStmt, currentDepth int) {
		if block == nil {
			return
		}

		for _, stmt := range block.List {
			switch s := stmt.(type) {
			case *ast.IfStmt:
				inspectBlock(s.Body, currentDepth+1)
				if s.Else != nil {
					if elseBlock, ok := s.Else.(*ast.BlockStmt); ok {
						inspectBlock(elseBlock, currentDepth+1)
					} else if elseIf, ok := s.Else.(*ast.IfStmt); ok {
						// 递归处理else if
						if elseIf.Body != nil {
							inspectBlock(elseIf.Body, currentDepth+1)
						}
					}
				}
			case *ast.ForStmt:
				inspectBlock(s.Body, currentDepth+1)
			case *ast.RangeStmt:
				inspectBlock(s.Body, currentDepth+1)
			case *ast.SwitchStmt:
				for _, c := range s.Body.List {
					if caseClause, ok := c.(*ast.CaseClause); ok {
						for _, caseStmt := range caseClause.Body {
							if blockStmt, ok := caseStmt.(*ast.BlockStmt); ok {
								inspectBlock(blockStmt, currentDepth+1)
							}
						}
					}
				}
			case *ast.SelectStmt:
				for _, c := range s.Body.List {
					if commClause, ok := c.(*ast.CommClause); ok {
						for _, commStmt := range commClause.Body {
							if blockStmt, ok := commStmt.(*ast.BlockStmt); ok {
								inspectBlock(blockStmt, currentDepth+1)
							}
						}
					}
				}
			case *ast.BlockStmt:
				inspectBlock(s, currentDepth+1)
			}
		}

		if currentDepth > maxDepth {
			maxDepth = currentDepth
		}
	}

	inspectBlock(block, 1)
	return maxDepth
}

// analyzeCircularDependencies 分析循环依赖
func (m *StructureAnalysisMetric) analyzeCircularDependencies(file *ast.File) []string {
	// 简化版本：检查是否有自引用
	var issues []string
	pkgName := file.Name.Name

	for _, imp := range file.Imports {
		if imp.Path != nil {
			path := strings.Trim(imp.Path.Value, "\"")
			if strings.Contains(path, pkgName) {
				issues = append(issues, fmt.Sprintf(m.translator.Translate("issue.possible_circular_import"), pkgName, path))
			}
		}
	}

	return issues
}

// analyzeImportComplexity 分析导入复杂度
func (m *StructureAnalysisMetric) analyzeImportComplexity(file *ast.File) []string {
	var issues []string
	importCount := len(file.Imports)

	if importCount > 20 {
		issues = append(issues, fmt.Sprintf(m.translator.Translate("issue.imports.too_many"), importCount))
	} else if importCount > 15 {
		issues = append(issues, fmt.Sprintf(m.translator.Translate("issue.imports.many"), importCount))
	}

	return issues
}

// calculateScore 计算结构得分
func (m *StructureAnalysisMetric) calculateScore(nestingDepth, circularCount, importIssueCount int) float64 {
	// 嵌套深度分数
	nestingScore := 0.4
	if nestingDepth > 1 {
		nestingScore += float64(nestingDepth-1) * 0.15
	}
	if nestingScore > 1.0 {
		nestingScore = 1.0
	}

	// 循环引用分数
	circularScore := 0.5
	if circularCount > 0 {
		circularScore = 1.0
	}

	// 导入问题分数
	importScore := 0.4
	if importIssueCount > 0 {
		importScore += float64(importIssueCount) * 0.3
	}
	if importScore > 1.0 {
		importScore = 1.0
	}

	return nestingScore*0.6 + circularScore*0.25 + importScore*0.15
}
