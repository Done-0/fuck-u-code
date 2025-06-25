/**
 * Config command
 */

import { Command } from 'commander';
import { resolve, join } from 'node:path';
import { homedir } from 'node:os';
import { readFile, writeFile } from 'node:fs/promises';
import { loadConfig, DEFAULT_CONFIG } from '../../config/index.js';
import { exists } from '../../utils/fs.js';
import { t } from '../../i18n/index.js';
import chalk from 'chalk';

/** Supported dot-notation keys for `config set` */
const SETTABLE_KEYS: Record<string, (config: Record<string, unknown>, value: string) => void> = {
  'i18n.locale': (config, value) => {
    if (!['en', 'zh', 'ru'].includes(value)) {
      throw new Error(`Invalid locale: ${value}. Must be one of: en, zh, ru`);
    }
    ensureObject(config, 'i18n');
    (config.i18n as Record<string, unknown>).locale = value;
  },
  'ai.provider': (config, value) => {
    const valid = ['openai', 'anthropic', 'deepseek', 'gemini', 'ollama'];
    if (!valid.includes(value)) {
      throw new Error(`Invalid provider: ${value}. Must be one of: ${valid.join(', ')}`);
    }
    ensureObject(config, 'ai');
    (config.ai as Record<string, unknown>).provider = value;
    (config.ai as Record<string, unknown>).enabled = true;
  },
  'ai.model': (config, value) => {
    ensureObject(config, 'ai');
    (config.ai as Record<string, unknown>).model = value;
    (config.ai as Record<string, unknown>).enabled = true;
  },
  'ai.apiKey': (config, value) => {
    ensureObject(config, 'ai');
    (config.ai as Record<string, unknown>).apiKey = value;
    (config.ai as Record<string, unknown>).enabled = true;
  },
  'ai.baseUrl': (config, value) => {
    ensureObject(config, 'ai');
    (config.ai as Record<string, unknown>).baseUrl = value;
  },
};

function ensureObject(obj: Record<string, unknown>, key: string): void {
  if (!obj[key] || typeof obj[key] !== 'object') {
    obj[key] = {};
  }
}

export function createConfigCommand(): Command {
  const command = new Command('config');

  command
    .description(t('cmd_config_description'))
    .argument('[action]', 'Action: show, init, set', 'show')
    .argument('[args...]', 'Arguments for the action')
    .addHelpText(
      'after',
      `
${t('cli_examples')}
  $ fuck-u-code config show                          # ${t('cmd_config_example_show')}
  $ fuck-u-code config init                          # ${t('cmd_config_example_init')}
  $ fuck-u-code config show ./my-project             # ${t('cmd_config_example_show_project')}
  $ fuck-u-code config set i18n.locale zh            # ${t('cmd_config_example_set_locale')}
  $ fuck-u-code config set ai.apiKey sk-xxx          # ${t('cmd_config_example_set_api_key')}
  $ fuck-u-code config set ai.baseUrl https://...    # ${t('cmd_config_example_set_base_url')}
  $ fuck-u-code config set ai.model gpt-4o           # ${t('cmd_config_example_set_model')}
  $ fuck-u-code config set ai.provider openai        # ${t('cmd_config_example_set_provider')}
`
    )
    .action(async (action: string, args: string[]) => {
      switch (action) {
        case 'show': {
          const projectPath = resolve(args[0] ?? '.');
          await showConfig(projectPath);
          break;
        }
        case 'init': {
          const projectPath = resolve(args[0] ?? '.');
          await initConfig(projectPath);
          break;
        }
        case 'set': {
          const key = args[0];
          const value = args[1];
          if (!key) {
            console.error(chalk.red(t('config_set_key_required')));
            process.exit(1);
          }
          if (value === undefined) {
            console.error(chalk.red(t('config_set_value_required')));
            process.exit(1);
          }
          await setConfig(key, value);
          break;
        }
        default:
          console.error(chalk.red(t('config_unknown_action', { action })));
          process.exit(1);
      }
    });

  return command;
}

async function showConfig(projectPath: string): Promise<void> {
  const config = await loadConfig(projectPath);
  console.log(chalk.bold.cyan(`\n${t('config_current')}\n`));
  console.log(chalk.gray(JSON.stringify(config, null, 2)));
}

async function initConfig(projectPath: string): Promise<void> {
  const configPath = join(projectPath, '.fuckucoderc.json');

  if (await exists(configPath)) {
    console.log(chalk.yellow(t('config_already_exists', { path: configPath })));
    return;
  }

  await writeFile(configPath, JSON.stringify(DEFAULT_CONFIG, null, 2) + '\n', 'utf-8');
  console.log(chalk.green(t('config_created', { path: configPath })));
}

/**
 * Set a config value in the global config file (~/.fuckucoderc.json).
 * Creates the file if it doesn't exist.
 */
async function setConfig(key: string, value: string): Promise<void> {
  const setter = SETTABLE_KEYS[key];
  if (!setter) {
    console.error(chalk.red(t('config_set_invalid_key', { key })));
    console.error(chalk.gray(`Valid keys: ${Object.keys(SETTABLE_KEYS).join(', ')}`));
    process.exit(1);
  }

  const configPath = join(homedir(), '.fuckucoderc.json');
  let config: Record<string, unknown> = {};

  if (await exists(configPath)) {
    try {
      const content = await readFile(configPath, 'utf-8');
      config = JSON.parse(content) as Record<string, unknown>;
    } catch (error) {
      console.error(chalk.red(t('warn_config_load_failed', { error: String(error) })));
      process.exit(1);
    }
  }

  try {
    setter(config, value);
  } catch (error) {
    console.error(chalk.red(error instanceof Error ? error.message : String(error)));
    process.exit(1);
  }

  await writeFile(configPath, JSON.stringify(config, null, 2) + '\n', 'utf-8');
  console.log(chalk.green(t('config_set_success', { key, value })));
}
