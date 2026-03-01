/**
 * Clone and Analyze command
 * Clone git repository and analyze code quality
 */

import { Command } from 'commander';
import { resolve } from 'node:path';
import { loadConfig, createRuntimeConfig } from '../../config/index.js';
import { createAnalyzer } from '../../analyzer/index.js';
import { ConsoleOutput } from '../output/console.js';
import { MarkdownOutput } from '../output/markdown.js';
import { JsonOutput } from '../output/json.js';
import { HtmlOutput } from '../output/html.js';
import { createSpinner, ProgressBar } from '../../utils/progress.js';
import { exists, isDirectory } from '../../utils/fs.js';
import { t } from '../../i18n/index.js';
import { renderMarkdownToTerminal } from '../../utils/markdown.js';
import chalk from 'chalk';
import {
  gitClone,
  removeTempDir,
  isValidGitUrl,
  type GitCloneResult,
} from '../../utils/git.js';

interface CloneAnalyzeOptions {
  verbose?: boolean;
  top?: number;
  format?: 'console' | 'markdown' | 'json' | 'html';
  output?: string;
  exclude?: string[];
  concurrency?: number;
  locale?: 'en' | 'zh' | 'ru';
  keepTemp?: boolean;
}

export function createCloneAnalyzeCommand(): Command {
  const command = new Command('clone-and-analyze');

  command
    .description(t('cmd_clone_analyze_description'))
    .argument('<git-url>', 'Git repository URL to clone and analyze')
    .option('-v, --verbose', 'Show verbose output')
    .option('-t, --top <number>', 'Show top N worst files (default: 10)', parseInt)
    .option(
      '-f, --format <format>',
      'Output format: console, markdown, json, html (default: console)'
    )
    .option('-o, --output <file>', 'Write output to file instead of stdout')
    .option('-e, --exclude <patterns...>', 'Additional glob patterns to exclude')
    .option('-c, --concurrency <number>', 'Number of concurrent workers (default: 8)', parseInt)
    .option('-l, --locale <locale>', 'Language: en, zh, ru (default: en)')
    .option('--keep-temp', 'Keep the temporary directory after analysis')
    .addHelpText(
      'after',
      `
${t('cli_examples')}
  $ fuck-u-code clone-and-analyze https://github.com/user/repo.git        # ${t('cmd_clone_analyze_example')}
  $ fuck-u-code clone-and-analyze git@github.com:user/repo.git            # ${t('cmd_clone_analyze_example_url')}
  $ fuck-u-code clone-and-analyze https://github.com/user/repo.git -f markdown -o report.md  # ${t('cmd_clone_analyze_example_output')}
  $ fuck-u-code clone-and-analyze https://github.com/user/repo.git --keep-temp  # ${t('cmd_clone_analyze_example_keep')}
`
    )
    .action(async (gitUrl: string, options: CloneAnalyzeOptions) => {
      await runCloneAnalyze(gitUrl, options);
    });

  return command;
}

async function runCloneAnalyze(gitUrl: string, options: CloneAnalyzeOptions): Promise<void> {
  // Validate git URL
  if (!isValidGitUrl(gitUrl)) {
    console.error(chalk.red(t('error_invalid_git_url', { url: gitUrl })));
    process.exit(1);
  }

  const cloneSpinner = createSpinner(t('progress_cloning'));
  const discoverySpinner = createSpinner(t('progress_discovering'));
  const state: { progressBar: ProgressBar | null } = { progressBar: null };
  let tempDir: string | undefined;
  let shouldCleanup = true;

  try {
    // Clone repository
    cloneSpinner.start();
    const cloneResult: GitCloneResult = await gitClone(gitUrl, {
      verbose: options.verbose,
    });

    if (!cloneResult.success) {
      cloneSpinner.fail(t('progress_clone_failed'));
      console.error(chalk.red(cloneResult.error));
      process.exit(1);
    }

    tempDir = cloneResult.targetDir;
    cloneSpinner.succeed(t('progress_clone_success'));

    if (options.verbose && tempDir) {
      console.log(chalk.green(t('info_temp_dir_created', { path: tempDir })));
    }

    // If the user specifies to keep the temporary directory, do not clean up
    if (options.keepTemp) {
      shouldCleanup = false;
      if (tempDir) {
        console.log(chalk.yellow(t('info_temp_dir_kept', { path: tempDir })));
      }
    }

    const resolvedPath = resolve(tempDir!);

    // Validate path
    if (!(await exists(resolvedPath))) {
      console.error(chalk.red(t('error_path_not_found', { path: resolvedPath })));
      if (shouldCleanup && tempDir) {
        await removeTempDir(tempDir);
      }
      process.exit(1);
    }

    if (!(await isDirectory(resolvedPath))) {
      console.error(chalk.red(t('error_not_a_directory', { path: resolvedPath })));
      if (shouldCleanup && tempDir) {
        await removeTempDir(tempDir);
      }
      process.exit(1);
    }

    // Load configuration and analyze
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

    // Output results
    const outputFormat = runtimeConfig.output.format;
    const outputFile = runtimeConfig.output.file;

    switch (outputFormat) {
      case 'markdown': {
        const mdOutput = new MarkdownOutput(runtimeConfig);
        const markdown = mdOutput.render(result);
        if (outputFile) {
          const { writeFile } = await import('node:fs/promises');
          await writeFile(outputFile, markdown, 'utf-8');
          console.log(t('outputWritten', { file: outputFile }));
        } else {
          console.log(renderMarkdownToTerminal(markdown));
        }
        break;
      }
      case 'json': {
        const jsonOutput = new JsonOutput();
        const json = jsonOutput.render(result);
        if (outputFile) {
          const { writeFile } = await import('node:fs/promises');
          await writeFile(outputFile, json, 'utf-8');
          console.log(t('outputWritten', { file: outputFile }));
        } else {
          console.log(json);
        }
        break;
      }
      case 'html': {
        const htmlOutput = new HtmlOutput(runtimeConfig);
        const html = htmlOutput.render(result);
        if (outputFile) {
          const { writeFile } = await import('node:fs/promises');
          await writeFile(outputFile, html, 'utf-8');
          console.log(t('outputWritten', { file: outputFile }));
        } else {
          console.log(chalk.yellow(t('output_html_requires_file')));
          const consoleOutputFallback = new ConsoleOutput(runtimeConfig);
          consoleOutputFallback.render(result);
        }
        break;
      }
      default: {
        const consoleOutput = new ConsoleOutput(runtimeConfig);
        consoleOutput.render(result);
      }
    }

    // Clean up temporary directory
    if (shouldCleanup && tempDir) {
      const cleanSpinner = createSpinner(t('progress_cleaning'));
      cleanSpinner.start();
      const removed = await removeTempDir(tempDir);
      if (removed) {
        cleanSpinner.succeed(t('progress_clean_complete'));
        if (options.verbose) {
          console.log(t('info_temp_dir_removed', { path: tempDir }));
        }
      } else {
        cleanSpinner.fail(t('progress_clean_failed'));
      }
    }

    process.exit(0);
  } catch (error) {
    cloneSpinner.fail(t('progress_clone_failed'));
    discoverySpinner.fail(t('analysisFailed'));
    state.progressBar?.fail(t('analysisFailed'));
    console.error(chalk.red(error instanceof Error ? error.message : String(error)));

    // Clean up temporary directory even if an error occurs
    if (shouldCleanup && tempDir) {
      await removeTempDir(tempDir);
    }

    process.exit(1);
  }
}
