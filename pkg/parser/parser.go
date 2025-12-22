// Package parser 提供多语言代码解析功能
// 创建者：Done-0
package parser

import (
	"github.com/Done-0/fuck-u-code/pkg/common"
)

// Parser 代码解析器接口
type Parser interface {
	// Parse 解析代码内容
	// 参数：
	//   - filePath: 文件路径
	//   - content: 文件内容
	// 返回值：
	//   - ParseResult: 解析结果
	//   - error: 可能的错误
	Parse(filePath string, content []byte) (ParseResult, error)

	// SupportedLanguages 返回支持的语言类型
	SupportedLanguages() []common.LanguageType
}

// ParseResult 解析结果接口
type ParseResult interface {
	// GetFunctions 获取解析出的所有函数
	GetFunctions() []Function

	// GetCommentLines 获取注释行数
	GetCommentLines() int

	// GetTotalLines 获取总行数
	GetTotalLines() int

	// GetLanguage 获取语言类型
	GetLanguage() common.LanguageType

	// GetASTRoot 获取AST根节点(如果支持)
	GetASTRoot() interface{}
}

// Function 函数信息
type Function struct {
	Name       string      // 函数名
	StartLine  int         // 开始行
	EndLine    int         // 结束行
	Complexity int         // 复杂度
	Parameters int         // 参数数量
	Node       interface{} // AST节点(可选)
}

// BaseParseResult 基础解析结果实现
type BaseParseResult struct {
	Functions    []Function          // 函数列表
	CommentLines int                 // 注释行数
	TotalLines   int                 // 总行数
	Language     common.LanguageType // 语言类型
	ASTRoot      interface{}         // AST根节点
}

// GetFunctions 获取解析出的所有函数
func (r *BaseParseResult) GetFunctions() []Function {
	return r.Functions
}

// GetCommentLines 获取注释行数
func (r *BaseParseResult) GetCommentLines() int {
	return r.CommentLines
}

// GetTotalLines 获取总行数
func (r *BaseParseResult) GetTotalLines() int {
	return r.TotalLines
}

// GetLanguage 获取语言类型
func (r *BaseParseResult) GetLanguage() common.LanguageType {
	return r.Language
}

// GetASTRoot 获取AST根节点
func (r *BaseParseResult) GetASTRoot() interface{} {
	return r.ASTRoot
}

// CreateParser 根据语言类型创建解析器
func CreateParser(language common.LanguageType) Parser {
	switch language {
	case common.Go:
		return NewGoParser()
	case common.JavaScript:
		return NewJavaScriptParser()
	case common.TypeScript:
		return NewTypeScriptParser()
	case common.Python:
		return NewPythonParser()
	case common.Java:
		return NewJavaParser()
	case common.CPlusPlus, common.C:
		return NewCParser()
	case common.CUDA:
		return NewCudaParser()
	case common.Rust:
		return NewRustParser()
	case common.Lua:
		return NewLuaParser()
	default:
		return NewGenericParser()
	}
}

// CreateParserForFile 根据文件路径创建解析器
func CreateParserForFile(filePath string) Parser {
	detector := common.NewLanguageDetector()
	language := detector.DetectLanguage(filePath)
	return CreateParser(language)
}
