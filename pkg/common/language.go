// Package common 提供项目通用功能
// 创建者：Done-0
package common

import (
	"path/filepath"
	"strings"
)

// LanguageType 表示编程语言类型
type LanguageType string

// 支持的编程语言常量定义
const (
	Go          LanguageType = "go"
	JavaScript  LanguageType = "javascript"
	TypeScript  LanguageType = "typescript"
	Python      LanguageType = "python"
	Java        LanguageType = "java"
	CPlusPlus   LanguageType = "cpp"
	C           LanguageType = "c"
	CSharp      LanguageType = "csharp"
	Rust        LanguageType = "rust"
	Lua         LanguageType = "lua"
	CUDA        LanguageType = "cuda"
	Unsupported LanguageType = "unsupported"
)

// supportedLanguages 用于快速查找支持的语言
var supportedLanguages = map[LanguageType]bool{
	Go:         true,
	JavaScript: true,
	TypeScript: true,
	Python:     true,
	Java:       true,
	CPlusPlus:  true,
	C:          true,
	CSharp:     true,
	Rust:       true,
	Lua:        true,
	CUDA:       true,
}

// LanguageDetector 语言检测器接口
type LanguageDetector interface {
	// DetectLanguage 根据文件路径检测语言类型
	DetectLanguage(filePath string) LanguageType
	// IsSupportedFile 判断文件是否为支持的类型
	IsSupportedFile(filePath string) bool
}

// DefaultDetector 默认语言检测器
type DefaultDetector struct{}

// NewLanguageDetector 创建新的语言检测器
func NewLanguageDetector() LanguageDetector {
	return &DefaultDetector{}
}

// DetectLanguage 根据文件扩展名检测语言类型
func (d *DefaultDetector) DetectLanguage(filePath string) LanguageType {
	ext := strings.ToLower(filepath.Ext(filePath))

	switch ext {
	case ".go":
		return Go
	case ".js":
		return JavaScript
	case ".ts", ".tsx":
		return TypeScript
	case ".py":
		return Python
	case ".java":
		return Java
	case ".cpp", ".cc", ".cxx", ".hpp":
		return CPlusPlus
	case ".c", ".h":
		return C
	case ".cs", ".razor": // CSharp及Blazor/Razor支持
		return CSharp
	case ".rs":
		return Rust
	case ".lua":
		return Lua
	case ".cu", ".cuh":
		return CUDA
	default:
		return Unsupported
	}
}

// IsSupportedFile 判断文件是否为支持的类型
func (d *DefaultDetector) IsSupportedFile(filePath string) bool {
	return supportedLanguages[d.DetectLanguage(filePath)]
}
