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
}

async function removeGlobalConfig(): Promise<boolean> {
  const configPath = join(homedir(), '.fuckucoderc.json');
  if (await exists(configPath)) {
    await unlink(configPath);
    return true;
  }
  return false;
}

async function removeMcpFromConfig(configPath: string): Promise<boolean> {
  if (!(await exists(configPath))) {
    return false;
  }

  const content = await readFile(configPath, 'utf-8');
  const config = JSON.parse(content) as McpConfig;

  if (config.mcpServers?.['fuck-u-code']) {
    delete config.mcpServers['fuck-u-code'];
    await writeFile(configPath, JSON.stringify(config, null, 2) + '\n', 'utf-8');
    return true;
  }

  return false;
}

async function uninstallNpmPackage(): Promise<boolean> {
  try {
    await execAsync('npm uninstall -g eff-u-code');
    return true;
  } catch {
    return false;
  }
}

async function performCleanup(): Promise<CleanupResult> {
  const result: CleanupResult = {
    globalConfig: false,
    claudeCode: false,
    cursor: false,
    npmPackage: false,
  };

  // Remove global config
  result.globalConfig = await removeGlobalConfig();

  // Remove MCP from Claude Code
  const claudePath = join(homedir(), '.claude.json');
  result.claudeCode = await removeMcpFromConfig(claudePath);

  // Remove MCP from Cursor
  const cursorPath = join(process.cwd(), '.cursor', 'mcp.json');
  result.cursor = await removeMcpFromConfig(cursorPath);

  // Uninstall npm package
  result.npmPackage = await uninstallNpmPackage();

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

        console.log();
        console.log(chalk.green(t('uninstall_complete')));
      } catch (error) {
        console.error(chalk.red(error instanceof Error ? error.message : String(error)));
        process.exit(1);
      }
    });

  return command;
}
