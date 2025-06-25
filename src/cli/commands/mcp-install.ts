/**
 * MCP install command
 *
 * Automatically configures fuck-u-code MCP Server
 * into Claude Code or Cursor configuration files.
 */

import { Command } from 'commander';
import { join } from 'node:path';
import { homedir } from 'node:os';
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { exists } from '../../utils/fs.js';
import { t } from '../../i18n/index.js';
import chalk from 'chalk';
import inquirer from 'inquirer';

const MCP_SERVER_ENTRY = {
  command: 'fuck-u-code-mcp',
};

interface McpConfig {
  mcpServers?: Record<string, unknown>;
  [key: string]: unknown;
}

interface TargetConfig {
  configPath: string;
  displayName: string;
}

function getTargetConfig(target: string): TargetConfig {
  switch (target) {
    case 'claude':
      return {
        configPath: join(homedir(), '.claude.json'),
        displayName: 'Claude Code',
      };
    case 'cursor':
      return {
        configPath: join(process.cwd(), '.cursor', 'mcp.json'),
        displayName: 'Cursor',
      };
    default:
      throw new Error(t('mcp_unknown_target', { target }));
  }
}

async function readJsonFile(filePath: string): Promise<McpConfig> {
  if (!(await exists(filePath))) {
    return {};
  }
  const content = await readFile(filePath, 'utf-8');
  return JSON.parse(content) as McpConfig;
}

async function installMcpConfig(target: string): Promise<void> {
  const { configPath, displayName } = getTargetConfig(target);

  const config = await readJsonFile(configPath);

  if (!config.mcpServers) {
    config.mcpServers = {};
  }

  const servers = config.mcpServers;
  const alreadyExists = !!servers['fuck-u-code'];
  servers['fuck-u-code'] = MCP_SERVER_ENTRY;

  await ensureParentDir(configPath);
  await writeFile(configPath, JSON.stringify(config, null, 2) + '\n', 'utf-8');

  if (alreadyExists) {
    console.log(chalk.yellow(t('mcp_config_exists', { path: configPath })));
    console.log(chalk.green(t('mcp_config_updated', { path: configPath })));
  } else {
    console.log(chalk.green(t('mcp_installed', { target: displayName })));
    console.log(chalk.gray(t('mcp_config_written', { path: configPath })));
  }
}

async function ensureParentDir(filePath: string): Promise<void> {
  const dir = join(filePath, '..');
  if (!(await exists(dir))) {
    await mkdir(dir, { recursive: true });
  }
}

export function createMcpInstallCommand(): Command {
  const command = new Command('mcp-install');

  command
    .description(t('cmd_mcp_install_description'))
    .argument('[target]', 'Target AI tool: claude, cursor')
    .addHelpText(
      'after',
      `
${t('cli_examples')}
  $ fuck-u-code mcp-install claude    # ${t('mcp_install_example_claude')}
  $ fuck-u-code mcp-install cursor    # ${t('mcp_install_example_cursor')}
`
    )
    .action(async (target?: string) => {
      try {
        if (!target) {
          const answer = await inquirer.prompt<{ target: string }>([
            {
              type: 'list',
              name: 'target',
              message: t('mcp_install_target_prompt'),
              choices: [
                { name: 'Claude Code', value: 'claude' },
                { name: 'Cursor', value: 'cursor' },
              ],
            },
          ]);
          target = answer.target;
        }

        await installMcpConfig(target);
      } catch (error) {
        console.error(chalk.red(error instanceof Error ? error.message : String(error)));
        process.exit(1);
      }
    });

  return command;
}
