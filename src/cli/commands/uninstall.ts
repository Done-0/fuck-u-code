/**
 * Uninstall command
 *
 * Removes fuck-u-code related files from local system:
 * - Global config file (~/.fuckucoderc.json)
 * - MCP server entries from Claude Code and Cursor configs
 * - Global npm package (eff-u-code)
 */

import { Command } from 'commander';
import { join } from 'node:path';
import { homedir } from 'node:os';
import { readFile, writeFile, unlink } from 'node:fs/promises';
import { exists } from '../../utils/fs.js';
import { t } from '../../i18n/index.js';
import chalk from 'chalk';
import inquirer from 'inquirer';
import { exec } from 'node:child_process';
import { promisify } from 'node:util';

const execAsync = promisify(exec);

interface McpConfig {
  mcpServers?: Record<string, unknown>;
  [key: string]: unknown;
}

interface CleanupResult {
  globalConfig: boolean;
  claudeCode: boolean;
  cursor: boolean;
  npmPackage: boolean;
  errors: string[];
}

async function removeGlobalConfig(): Promise<boolean> {
  try {
    const configPath = join(homedir(), '.fuckucoderc.json');
    if (await exists(configPath)) {
      await unlink(configPath);
      return true;
    }
    return false;
  } catch (error) {
    throw new Error(
      `Failed to remove config: ${error instanceof Error ? error.message : String(error)}`
    );
  }
}

async function removeMcpFromConfig(configPath: string): Promise<boolean> {
  try {
    if (!(await exists(configPath))) {
      return false;
    }

    const content = await readFile(configPath, 'utf-8');
    let config: McpConfig;

    try {
      config = JSON.parse(content) as McpConfig;
    } catch {
      throw new Error(`Invalid JSON in ${configPath}`);
    }

    if (config.mcpServers?.['fuck-u-code']) {
      delete config.mcpServers['fuck-u-code'];

      await writeFile(configPath, JSON.stringify(config, null, 2) + '\n', 'utf-8');
      return true;
    }

    return false;
  } catch (error) {
    throw new Error(
      `Failed to update ${configPath}: ${error instanceof Error ? error.message : String(error)}`
    );
  }
}

async function uninstallNpmPackage(): Promise<boolean> {
  try {
    const { stderr } = await execAsync('npm uninstall -g eff-u-code');

    if (stderr.includes('not installed')) {
      return false;
    }

    return true;
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    if (errorMsg.includes('not installed') || errorMsg.includes('ERR! 404')) {
      return false;
    }
    throw new Error(`Failed to uninstall npm package: ${errorMsg}`);
  }
}

async function performCleanup(): Promise<CleanupResult> {
  const result: CleanupResult = {
    globalConfig: false,
    claudeCode: false,
    cursor: false,
    npmPackage: false,
    errors: [],
  };

  // Remove global config
  try {
    result.globalConfig = await removeGlobalConfig();
  } catch (error) {
    result.errors.push(error instanceof Error ? error.message : String(error));
  }

  // Remove MCP from Claude Code
  try {
    const claudePath = join(homedir(), '.claude.json');
    result.claudeCode = await removeMcpFromConfig(claudePath);
  } catch (error) {
    result.errors.push(error instanceof Error ? error.message : String(error));
  }

  // Remove MCP from Cursor (try multiple possible locations)
  try {
    const cursorPaths = [
      join(process.cwd(), '.cursor', 'mcp.json'),
      join(homedir(), '.cursor', 'mcp.json'),
    ];

    for (const cursorPath of cursorPaths) {
      const removed = await removeMcpFromConfig(cursorPath);
      if (removed) {
        result.cursor = true;
        break;
      }
    }
  } catch (error) {
    result.errors.push(error instanceof Error ? error.message : String(error));
  }

  // Uninstall npm package
  try {
    result.npmPackage = await uninstallNpmPackage();
  } catch (error) {
    result.errors.push(error instanceof Error ? error.message : String(error));
  }

  return result;
}

export function createUninstallCommand(): Command {
  const command = new Command('uninstall');

  command
    .description(t('cmd_uninstall_description'))
    .addHelpText(
      'after',
      `
${t('cli_examples')}
  $ fuck-u-code uninstall    # ${t('uninstall_example')}
`
    )
    .action(async () => {
      try {
        console.log(chalk.yellow(t('uninstall_warning')));
        console.log(chalk.gray(t('uninstall_items')));
        console.log(chalk.gray('  - ' + t('uninstall_item_config')));
        console.log(chalk.gray('  - ' + t('uninstall_item_mcp')));
        console.log(chalk.gray('  - ' + t('uninstall_item_npm')));
        console.log();

        const answer = await inquirer.prompt<{ confirm: boolean }>([
          {
            type: 'confirm',
            name: 'confirm',
            message: t('uninstall_confirm'),
            default: false,
          },
        ]);

        if (!answer.confirm) {
          console.log(chalk.yellow(t('uninstall_cancelled')));
          return;
        }

        console.log();
        console.log(chalk.blue(t('uninstall_processing')));

        const result = await performCleanup();

        console.log();
        if (result.globalConfig) {
          console.log(chalk.green('✓ ' + t('uninstall_removed_config')));
        } else {
          console.log(chalk.gray('- ' + t('uninstall_no_config')));
        }

        if (result.claudeCode) {
          console.log(chalk.green('✓ ' + t('uninstall_removed_claude')));
        } else {
          console.log(chalk.gray('- ' + t('uninstall_no_claude')));
        }

        if (result.cursor) {
          console.log(chalk.green('✓ ' + t('uninstall_removed_cursor')));
        } else {
          console.log(chalk.gray('- ' + t('uninstall_no_cursor')));
        }

        if (result.npmPackage) {
          console.log(chalk.green('✓ ' + t('uninstall_removed_npm')));
        } else {
          console.log(chalk.gray('- ' + t('uninstall_no_npm')));
        }

        if (result.errors.length > 0) {
          console.log();
          console.log(chalk.yellow('⚠️  Some operations failed:'));
          for (const error of result.errors) {
            console.log(chalk.yellow('  - ' + error));
          }
        }

        console.log();
        console.log(chalk.green(t('uninstall_complete')));
      } catch (error) {
        console.error(chalk.red(error instanceof Error ? error.message : String(error)));
        process.exit(1);
      }
    });

  return command;
}
