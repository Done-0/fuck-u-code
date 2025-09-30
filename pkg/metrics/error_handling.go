package metrics

import (
	"fmt"
	"go/ast"
	"go/token"
	"strings"
)

// ErrorHandlingMetric 检测错误处理情况
type ErrorHandlingMetric struct {
	*BaseMetric
}

// Analyze 分析错误处理
func (m *ErrorHandlingMetric) Analyze(file *ast.File, fileSet *token.FileSet) (float64, []string) {
	var issues []string

	// 错误处理统计
	errorReturns := 0
	ignoredErrors := 0

	// 遍历所有函数
	ast.Inspect(file, func(n ast.Node) bool {
		switch node := n.(type) {
		case *ast.FuncType:
			// 检查函数是否返回error
			if m.returnsError(node) {
				errorReturns++
			}

		case *ast.AssignStmt:
			// 检查是否忽略了错误
			if m.isIgnoringError(node) {
				pos := fileSet.Position(node.Pos())
				issues = append(issues, fmt.Sprintf(m.translator.Translate("issue.ignored_possible_error"), pos.Line))
				ignoredErrors++
			}

		case *ast.ExprStmt:
			// 检查是否直接调用了可能返回错误的函数但未处理错误
			if m.isUnhandledErrorCall(node) {
				pos := fileSet.Position(node.Pos())
				issues = append(issues, fmt.Sprintf(m.translator.Translate("issue.unhandled_possible_error"), pos.Line))
				ignoredErrors++
			}
		}
		return true
	})

	// 如果没有函数返回错误，则不评分
	if errorReturns == 0 {
		return 0.0, issues
	}

	// 计算错误处理得分
	score := m.calculateScore(ignoredErrors, errorReturns)
	return score, issues
}

// returnsError 检查函数是否返回error
func (m *ErrorHandlingMetric) returnsError(funcType *ast.FuncType) bool {
	if funcType.Results == nil {
		return false
	}

	for _, field := range funcType.Results.List {
		if m.isErrorType(field.Type) {
			return true
		}
	}
	return false
}

// isErrorType 检查类型是否为error
func (m *ErrorHandlingMetric) isErrorType(expr ast.Expr) bool {
	switch t := expr.(type) {
	case *ast.Ident:
		return t.Name == "error"
	case *ast.SelectorExpr:
		if ident, ok := t.X.(*ast.Ident); ok {
			return ident.Name == "errors" || ident.Name == "fmt" || ident.Name == "io"
		}
	}
	return false
}

// isIgnoringError 检查是否忽略了错误
func (m *ErrorHandlingMetric) isIgnoringError(assign *ast.AssignStmt) bool {
	// 查找 _ 变量
	for i, lhs := range assign.Lhs {
		if ident, ok := lhs.(*ast.Ident); ok && ident.Name == "_" {
			// 检查对应的右值是否可能是错误
			if i < len(assign.Rhs) {
				if callExpr, ok := assign.Rhs[0].(*ast.CallExpr); ok {
					return m.callMayReturnError(callExpr)
				}
			}
			return true
		}
	}
	return false
}

// isUnhandledErrorCall 检查是否有未处理的错误调用
func (m *ErrorHandlingMetric) isUnhandledErrorCall(stmt *ast.ExprStmt) bool {
	callExpr, ok := stmt.X.(*ast.CallExpr)
	if !ok {
		return false
	}

	// 检查一些常见可能返回错误但经常被忽略的函数
	return m.callMayReturnError(callExpr)
}

// callMayReturnError 检查调用是否可能返回错误
func (m *ErrorHandlingMetric) callMayReturnError(callExpr *ast.CallExpr) bool {
	if selExpr, ok := callExpr.Fun.(*ast.SelectorExpr); ok {
		if ident, ok := selExpr.X.(*ast.Ident); ok {
			// 检查一些常见可能返回错误的包和方法
			pkgMethod := fmt.Sprintf("%s.%s", ident.Name, selExpr.Sel.Name)
			errorProneMethods := []string{
				"os.Create", "os.Open", "os.Remove", "os.Rename", "os.Mkdir", "os.MkdirAll",
				"io.Write", "io.Read", "io.Copy",
				"json.Marshal", "json.Unmarshal",
				"ioutil.ReadFile", "ioutil.WriteFile",
				"http.Get", "http.Post", "http.Do",
				"sql.Open", "sql.Exec", "sql.Query",
			}

			for _, method := range errorProneMethods {
				if strings.HasSuffix(pkgMethod, method) {
					return true
				}
			}
		}
	}
	return false
}

// calculateScore 计算错误处理得分
func (m *ErrorHandlingMetric) calculateScore(ignoredErrors, totalErrorReturns int) float64 {
	if totalErrorReturns == 0 {
		return 0.4
	}

	// 计算忽略错误的比例
	ignoredRatio := float64(ignoredErrors) / float64(totalErrorReturns)

	// 基础分0.4，每1%忽略错误增加0.1分
	baseScore := 0.4
	increasePerPercent := 10.0

	score := baseScore + (ignoredRatio * increasePerPercent)

	// 限制范围
	if score > 1.0 {
		return 1.0
	}

	return score
}
