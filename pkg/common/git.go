// Package common 提供项目通用功能
// 创建者：SwimmingLiu
package common

import (
	"fmt"
	"os"
	"os/exec"
	"path/filepath"
	"regexp"
	"strings"
)

// IsGitURL 判断给定的路径是否为 git 仓库链接
// 参数:
//   - path: 待检测的路径
//
// 返回值:
//   - bool: 是否为 git 仓库链接
func IsGitURL(path string) bool {
	// 常见的 git URL 格式:
	// - https://github.com/user/repo.git
	// - http://github.com/user/repo
	// - git@github.com:user/repo.git
	// - ssh://git@github.com/user/repo.git
	gitURLPatterns := []string{
		`^https?://.*\.git$`,                      // https://xxx.git
		`^https?://[^/]+/[^/]+/[^/]+/?$`,          // https://domain/user/repo
		`^git@[^:]+:[^/]+/.+\.git$`,               // git@domain:user/repo.git
		`^ssh://git@[^/]+/[^/]+/[^/]+\.git$`,      // ssh://git@domain/user/repo.git
		`^https?://github\.com/[^/]+/[^/]+/?$`,    // github.com URL
		`^https?://gitlab\.com/[^/]+/[^/]+/?$`,    // gitlab.com URL
		`^https?://gitee\.com/[^/]+/[^/]+/?$`,     // gitee.com URL
		`^https?://bitbucket\.org/[^/]+/[^/]+/?$`, // bitbucket.org URL
	}

	for _, pattern := range gitURLPatterns {
		matched, _ := regexp.MatchString(pattern, path)
		if matched {
			return true
		}
	}

	return false
}

// IsGitInstalled 检查系统是否安装了 git
// 返回值:
//   - bool: 是否安装了 git
func IsGitInstalled() bool {
	_, err := exec.LookPath("git")
	return err == nil
}

// CloneGitRepo 克隆 git 仓库到指定目录
// 参数:
//   - gitURL: git 仓库链接
//   - targetDir: 目标目录（git clone 会将仓库内容直接克隆到此目录）
//
// 返回值:
//   - error: 可能的错误
func CloneGitRepo(gitURL, targetDir string) error {
	// 获取父目录
	parentDir := filepath.Dir(targetDir)

	// 确保父目录存在（但不创建目标目录本身，让 git clone 来创建）
	if err := os.MkdirAll(parentDir, 0755); err != nil {
		return fmt.Errorf("创建父目录失败: %v", err)
	}

	// 执行 git clone 命令，直接克隆到目标目录
	cmd := exec.Command("git", "clone", gitURL, targetDir)
	cmd.Stdout = os.Stdout
	cmd.Stderr = os.Stderr

	if err := cmd.Run(); err != nil {
		return fmt.Errorf("克隆仓库失败: %v", err)
	}

	return nil
}

// RemoveTempDir 删除临时目录
// 参数:
//   - dirPath: 要删除的目录路径
//
// 返回值:
//   - error: 可能的错误
func RemoveTempDir(dirPath string) error {
	// 确保只删除 tmp_proj 开头的目录，避免误删
	dirName := filepath.Base(dirPath)
	if !strings.HasPrefix(dirName, "tmp_proj") {
		return fmt.Errorf("安全检查失败: 只能删除 tmp_proj 开头的目录")
	}

	if err := os.RemoveAll(dirPath); err != nil {
		return fmt.Errorf("删除临时目录失败: %v", err)
	}

	return nil
}

// GetTempDir 获取临时目录路径
// 参数:
//   - baseDir: 基础目录
//
// 返回值:
//   - string: 临时目录的绝对路径
//   - error: 可能的错误
func GetTempDir(baseDir string) (string, error) {
	// 创建 tmp_proj 目录路径
	tmpDir := filepath.Join(baseDir, "tmp_proj")

	// 获取绝对路径
	absPath, err := filepath.Abs(tmpDir)
	if err != nil {
		return "", fmt.Errorf("获取绝对路径失败: %v", err)
	}

	// 如果已存在临时目录，则删除
	if _, err := os.Stat(absPath); err == nil {
		os.RemoveAll(absPath)
	}

	return absPath, nil
}
