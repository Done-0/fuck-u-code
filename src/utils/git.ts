/**
 * Git 工具函数
 * 支持克隆远程仓库到本地临时目录
 */

import { exec } from 'node:child_process';
import { promisify } from 'node:util';
import { rm } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { randomUUID } from 'node:crypto';
import { exists } from './fs.js';
import { t } from '../i18n/index.js';

const execAsync = promisify(exec);

/**
 * Git clone 选项
 */
export interface GitCloneOptions {
  /** 克隆的目标目录路径，如果不指定则创建临时目录 */
  targetDir?: string;
  /** git clone 附加参数 */
  extraArgs?: string[];
  /** 是否显示详细输出 */
  verbose?: boolean;
  /** 超时时间（毫秒） */
  timeout?: number;
}

/**
 * Git clone 结果
 */
export interface GitCloneResult {
  /** 克隆成功或失败 */
  success: boolean;
  /** 克隆到的本地目录路径 */
  targetDir?: string;
  /** 错误信息（如果失败） */
  error?: string;
  /** 是否是临时目录 */
  isTempDir: boolean;
}

/**
 * 从 git URL 克隆仓库
 * @param gitUrl git 仓库地址（如：https://github.com/user/repo.git）
 * @param options 克隆选项
 * @returns GitCloneResult
 */
export async function gitClone(
  gitUrl: string,
  options: GitCloneOptions = {}
): Promise<GitCloneResult> {
  const { targetDir, extraArgs = [], verbose = false, timeout = 120000 } = options;

  // 确定目标目录
  let cloneTarget: string;
  let isTempDir: boolean;

  if (targetDir) {
    cloneTarget = targetDir;
    isTempDir = false;
  } else {
    // 创建临时目录
    const tempBase = tmpdir();
    const uniqueId = randomUUID().slice(0, 8);
    cloneTarget = join(tempBase, `tmp_proj_${uniqueId}`);
    isTempDir = true;
  }

  // 构建 git clone 命令
  const args = ['clone', gitUrl, cloneTarget, ...extraArgs];
  const command = `git ${args.join(' ')}`;

  try {
    // 检查 git 是否可用
    await execAsync('git --version', { timeout: 5000 });

    // 执行 git clone
    const { stdout, stderr } = await execAsync(command, {
      timeout,
      encoding: 'utf-8',
    });

    if (verbose && stdout) {
      console.log(stdout);
    }
    if (verbose && stderr) {
      console.error(stderr);
    }

    // 验证克隆结果
    const cloned = await exists(cloneTarget);
    if (!cloned) {
      return {
        success: false,
        error: t('error_git_clone_failed', { url: gitUrl, reason: t('error_target_dir_not_created') }),
        isTempDir,
      };
    }

    return {
      success: true,
      targetDir: cloneTarget,
      isTempDir,
    };
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    return {
      success: false,
      targetDir: isTempDir ? cloneTarget : undefined,
      error: t('error_git_clone_failed', { url: gitUrl, reason: errorMsg }),
      isTempDir,
    };
  }
}

/**
 * 删除临时目录
 * @param dirPath 要删除的目录路径
 * @param force 是否强制删除（忽略错误）
 * @returns 删除是否成功
 */
export async function removeTempDir(dirPath: string, force = true): Promise<boolean> {
  try {
    const dirExists = await exists(dirPath);
    if (!dirExists) {
      return true;
    }

    await rm(dirPath, {
      recursive: true,
      force,
      maxRetries: 3,
      retryDelay: 200,
    });

    return true;
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    console.error(t('error_remove_temp_dir_failed', { path: dirPath, error: errorMsg }));
    return false;
  }
}

/**
 * 解析 git URL，提取仓库名称
 * @param gitUrl git 仓库地址
 * @returns 仓库名称（不含 .git 后缀）
 */
export function parseRepoName(gitUrl: string): string {
  // 移除末尾的 .git
  let url = gitUrl.replace(/\.git$/, '');

  // 处理 SSH 格式：git@github.com:user/repo
  if (url.startsWith('git@')) {
    const match = url.match(/git@[^:]+:(.+)/);
    if (match && match[1]) {
      url = match[1];
    }
  }

  // 获取最后一段路径
  const parts = url.split('/');
  const repoName = parts[parts.length - 1];
  return repoName || 'unknown-repo';
}

/**
 * 验证 git URL 格式
 * @param gitUrl 待验证的 URL
 * @returns 是否是有效的 git URL
 */
export function isValidGitUrl(gitUrl: string): boolean {
  // HTTPS 格式
  if (/^https?:\/\/.+/.test(gitUrl)) {
    return true;
  }

  // SSH 格式
  if (/^git@[^:]+:.+/.test(gitUrl)) {
    return true;
  }

  // 本地路径（也允许）
  if (/^[./~]/.test(gitUrl)) {
    return true;
  }

  return false;
}
