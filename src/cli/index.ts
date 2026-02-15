/**
 * CLI main entry point
 */

import { Command } from 'commander';
import { createAnalyzeCommand } from './commands/analyze.js';
import { createAIReviewCommand } from './commands/ai-review.js';
import { createConfigCommand } from './commands/config.js';
import { createMcpInstallCommand } from './commands/mcp-install.js';
import { createUninstallCommand } from './commands/uninstall.js';
import { t, setLocale, type Locale } from '../i18n/index.js';
import { loadLocaleFromConfig } from '../config/index.js';
import { getSupportedLanguageNames } from '../parser/index.js';

const VERSION = '2.0.1';
const VALID_LOCALES = ['en', 'zh', 'ru'];

export function createCLI(): Command {
  const program = new Command();

  program
    .name('fuck-u-code')
    .description(t('cli_description'))
    .version(VERSION)
    .addHelpText(
      'after',
      `
${t('cli_examples')}
  $ fuck-u-code analyze .                    # ${t('cli_example_analyze_cwd')}
  $ fuck-u-code analyze ./src --top 10       # ${t('cli_example_analyze_top')}
  $ fuck-u-code analyze . --format markdown  # ${t('cli_example_analyze_markdown')}
  $ fuck-u-code analyze . --locale zh        # ${t('cli_example_analyze_locale')}
  $ fuck-u-code ai-review . --model gpt-4o   # ${t('cli_example_ai_review')}
  $ fuck-u-code mcp-install claude           # ${t('cli_example_mcp_install')}

${t('cli_supported_languages')}
  ${getSupportedLanguageNames()}
`
    );

  program.addCommand(createAnalyzeCommand());
  program.addCommand(createAIReviewCommand());
  program.addCommand(createConfigCommand());
  program.addCommand(createMcpInstallCommand());
  program.addCommand(createUninstallCommand());

  return program;
}

export async function runCLI(args: string[] = process.argv): Promise<void> {
  // Priority: --locale (argv) > config i18n.locale > default 'en'
  let locale: Locale | undefined;

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (!arg) continue;

    if (arg.startsWith('--locale=')) {
      const value = arg.slice('--locale='.length);
      if (VALID_LOCALES.includes(value)) {
        locale = value as Locale;
        break;
      }
    }

    if (arg === '--locale' || arg === '-l') {
      const next = args[i + 1];
      if (next && VALID_LOCALES.includes(next)) {
        locale = next as Locale;
        break;
      }
    }
  }

  if (!locale) {
    locale = await loadLocaleFromConfig();
  }

  if (locale) {
    setLocale(locale);
  }

  const program = createCLI();
  await program.parseAsync(args);
}
