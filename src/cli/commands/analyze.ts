/**
 * Analyze command implementation
 */

import { Command } from 'commander';
import { resolve } from 'node:path';
import { loadConfig, createRuntimeConfig } from '../../config/index.js';
import { createAnalyzer } from '../../analyzer/index.js';
import { renderAnalysisResult } from '../output/render-analysis.js';
import { createSpinner, ProgressBar } from '../../utils/progress.js';
import { exists, isDirectory } from '../../utils/fs.js';
import { t } from '../../i18n/index.js';
import { getFallbackLanguages } from '../../parser/index.js';
import chalk from 'chalk';

interface AnalyzeOptions {
  verbose?: boolean;
  top?: number;
  format?: 'console' | 'markdown' | 'json' | 'html';
  output?: string;
  exclude?: string[];
  concurrency?: number;
  locale?: 'en' | 'zh' | 'ru' | 'zh_TW';
}

export function createAnalyzeCommand(): Command {
  const command = new Command('analyze');

  command
    .description(t('cmd_analyze_description'))
    .argument('[path]', 'Project path to analyze', '.')
    .option('-v, --verbose', 'Show verbose output')
    .option('-t, --top <number>', 'Show top N worst files (default: 10)', parseInt)
    .option(
      '-f, --format <format>',
      'Output format: console, markdown, json, html (default: console)'
    )
    .option('-o, --output <file>', 'Write output to file instead of stdout')
    .option('-e, --exclude <patterns...>', 'Additional glob patterns to exclude')
    .option('-c, --concurrency <number>', 'Number of concurrent workers (default: 8)', parseInt)
    .option('-l, --locale <locale>', 'Language: en, zh, ru, zh_TW (default: en)')
    .addHelpText(
      'after',
      `
${t('cli_examples')}
  $ fuck-u-code analyze                      # ${t('cmd_analyze_example_cwd')}
  $ fuck-u-code analyze ./src                # ${t('cmd_analyze_example_dir')}
  $ fuck-u-code analyze . --top 5            # ${t('cmd_analyze_example_top')}
  $ fuck-u-code analyze . -f markdown -o report.md  # ${t('cmd_analyze_example_markdown')}
  $ fuck-u-code analyze . -f html -o report.html    # ${t('cmd_analyze_example_html')}
  $ fuck-u-code analyze . --exclude "**/*.test.ts"  # ${t('cmd_analyze_example_exclude')}
  $ fuck-u-code analyze . --locale zh        # ${t('cmd_analyze_example_locale')}
`
    )
    .action(async (path: string, options: AnalyzeOptions) => {
      await runAnalyze(path, options);
    });

  return command;
}

async function runAnalyze(projectPath: string, options: AnalyzeOptions): Promise<void> {
  const resolvedPath = resolve(projectPath);

  // Validate path
  if (!(await exists(resolvedPath))) {
    console.error(chalk.red(t('error_path_not_found', { path: resolvedPath })));
    process.exit(1);
  }

  if (!(await isDirectory(resolvedPath))) {
    console.error(chalk.red(t('error_not_a_directory', { path: resolvedPath })));
    process.exit(1);
  }

  const discoverySpinner = createSpinner(t('progress_discovering'));
  const state: { progressBar: ProgressBar | null } = { progressBar: null };

  try {
    const config = await loadConfig(resolvedPath);
    const runtimeConfig = createRuntimeConfig(resolvedPath, config, {
      verbose: options.verbose,
      concurrency: options.concurrency,
      exclude: options.exclude,
      output: {
        format: options.format ?? 'console',
        file: options.output,
        top: options.top ?? 10,
        maxIssues: 5,
        showDetails: true,
      },
    });

    const analyzer = createAnalyzer(runtimeConfig, {
      onDiscoveryStart: () => {
        discoverySpinner.start();
      },
      onDiscoveryComplete: (fileCount) => {
        discoverySpinner.succeed(t('progress_discovered', { count: fileCount }));
        if (fileCount > 0) {
          state.progressBar = new ProgressBar(fileCount, t('progress_analyzing'));
          state.progressBar.start();
        }
      },
      onAnalysisProgress: (current) => {
        state.progressBar?.update(current);
      },
    });

    const result = await analyzer.analyze();

    state.progressBar?.succeed(t('analysisComplete'));

    await renderAnalysisResult(result, runtimeConfig);

    const fallbackLanguages = getFallbackLanguages();
    if (fallbackLanguages.length > 0) {
      console.error(
        chalk.yellow(t('warn_parser_fallback', { languages: fallbackLanguages.join(', ') }))
      );
    }

    process.exit(0);
  } catch (error) {
    discoverySpinner.fail(t('analysisFailed'));
    state.progressBar?.fail(t('analysisFailed'));
    console.error(error instanceof Error ? error.message : String(error));
    process.exit(1);
  }
}
