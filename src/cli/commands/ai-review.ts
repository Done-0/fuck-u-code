/**
 * AI review command implementation
 */

import { Command } from 'commander';
import { resolve } from 'node:path';
import { loadConfig, createRuntimeConfig, loadAIConfig } from '../../config/index.js';
import { createAnalyzer } from '../../analyzer/index.js';
import { createAIManager } from '../../ai/index.js';
import { createSpinner } from '../../utils/progress.js';
import { exists, isDirectory } from '../../utils/fs.js';
import { t } from '../../i18n/index.js';
import { renderMarkdownToTerminal } from '../../utils/markdown.js';
import {
  renderAIReviewMarkdown,
  renderAIReviewHtml,
  type AIReviewData,
} from '../output/ai-review-output.js';
import { getTerminalWidth } from '../../utils/terminal.js';
import chalk from 'chalk';

interface AIReviewOptions {
  provider?: string;
  model?: string;
  baseUrl?: string;
  apiKey?: string;
  verbose?: boolean;
  locale?: 'en' | 'zh' | 'ru';
  top?: number;
  format?: 'console' | 'markdown' | 'html';
  output?: string;
}

export function createAIReviewCommand(): Command {
  const command = new Command('ai-review');

  command
    .description(t('cmd_ai_review_description'))
    .argument('[path]', 'Project path to review', '.')
    .option('-p, --provider <provider>', 'AI provider: openai, anthropic, deepseek, gemini, ollama')
    .option('-m, --model <model>', 'Model to use (required)')
    .option('-b, --base-url <url>', 'Custom API base URL (for OpenAI-compatible APIs)')
    .option('-k, --api-key <key>', 'API key (can also use environment variables)')
    .option('-t, --top <number>', 'Number of worst files to review (default: 5)', parseInt)
    .option('-v, --verbose', 'Show verbose output')
    .option('-l, --locale <locale>', 'Language: en, zh, ru')
    .option('-f, --format <format>', t('cmd_ai_review_format_help'))
    .option('-o, --output <file>', 'Write output to file instead of stdout')
    .addHelpText(
      'after',
      `
${t('cli_examples')}
  $ fuck-u-code ai-review . --model gpt-4o --api-key sk-xxx
  $ fuck-u-code ai-review . --model claude-3-opus --provider anthropic
  $ fuck-u-code ai-review . --model deepseek-chat --provider deepseek
  $ fuck-u-code ai-review . --model gemini-2.5-flash --provider gemini
  $ fuck-u-code ai-review . --model llama3 --provider ollama
  $ fuck-u-code ai-review . --model gpt-4o --top 3

${t('cmd_ai_review_env_header')}
  OPENAI_API_KEY      OpenAI-compatible API key
  OPENAI_MODEL        Default model for OpenAI-compatible provider
  OPENAI_BASE_URL     Custom API endpoint (for any OpenAI-compatible service)
  ANTHROPIC_API_KEY   Anthropic API key
  DEEPSEEK_API_KEY    DeepSeek API key
  GEMINI_API_KEY      Google Gemini API key
  OLLAMA_HOST         Ollama server URL (e.g., http://localhost:11434)
`
    )
    .action(async (path: string, options: AIReviewOptions) => {
      await runAIReview(path, options);
    });

  return command;
}

async function runAIReview(projectPath: string, options: AIReviewOptions): Promise<void> {
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

  const config = await loadConfig(resolvedPath);
  let aiConfig = loadAIConfig(config.ai, options.model);

  if (options.baseUrl || options.apiKey || options.provider) {
    const provider = options.provider || 'openai';
    const apiKey = options.apiKey || process.env[`${provider.toUpperCase()}_API_KEY`];

    if (!apiKey && provider !== 'ollama') {
      console.error(chalk.red(t('ai_api_key_required')));
      process.exit(1);
    }

    if (!options.model) {
      console.error(chalk.red(t('ai_model_required')));
      process.exit(1);
    }

    // When user explicitly specifies provider, use only that provider
    aiConfig = {
      providers: {
        [provider]: {
          enabled: true,
          instances: [
            {
              name: 'cli',
              enabled: true,
              baseUrl: options.baseUrl || getDefaultBaseUrl(provider),
              apiKey: apiKey || '',
              models: [options.model],
              maxTokens: 4096,
              temperature: 0.7,
              topP: 1,
              timeout: 60,
              maxRetries: 3,
            },
          ],
        },
      },
      defaultProvider: provider,
    };
  }

  if (Object.keys(aiConfig.providers).length === 0) {
    console.error(chalk.red(t('noAIProvider')));
    console.log(chalk.yellow(t('aiProviderHint')));
    console.log(chalk.gray(`\n${t('ai_example_usage')}`));
    console.log(chalk.gray('  fuck-u-code ai-review . --model gpt-4o --api-key sk-xxx'));
    console.log(
      chalk.gray(
        '  fuck-u-code ai-review . --model gemini-2.5-flash --provider gemini --api-key xxx'
      )
    );
    console.log(chalk.gray(`\n${t('ai_or_set_env')}`));
    console.log(chalk.gray('  export OPENAI_API_KEY=sk-xxx'));
    console.log(chalk.gray('  export OPENAI_MODEL=gpt-4o'));
    process.exit(1);
  }

  const spinner = createSpinner(t('analyzing'));
  spinner.start();

  try {
    const runtimeConfig = createRuntimeConfig(resolvedPath, config, {
      verbose: options.verbose,
      ai: {
        enabled: true,
        provider: options.provider,
        model: options.model,
      },
    });

    const analyzer = createAnalyzer(runtimeConfig);
    const analysisResult = await analyzer.analyze();

    const topCount = options.top ?? 5;
    const worstFiles = analysisResult.fileResults
      .sort((a, b) => a.score - b.score)
      .slice(0, topCount);

    if (worstFiles.length === 0) {
      spinner.succeed(t('report_no_issues'));
      return;
    }

    spinner.text = t('aiReviewing');
    const aiManager = createAIManager(aiConfig);

    const reviews: AIReviewData[] = [];

    for (const [i, file] of worstFiles.entries()) {
      spinner.text = `${t('reviewingFile', { file: file.filePath })} [${i + 1}/${worstFiles.length}]`;
      const review = await aiManager.reviewCode(file);
      reviews.push({
        filePath: file.filePath,
        score: 100 - file.score,
        review,
      });
    }

    spinner.succeed(t('aiReviewComplete'));

    const format = options.format ?? 'console';
    const outputFile = options.output;

    switch (format) {
      case 'markdown': {
        const markdown = renderAIReviewMarkdown(reviews);
        if (outputFile) {
          const { writeFile } = await import('node:fs/promises');
          await writeFile(outputFile, markdown, 'utf-8');
          console.log(t('outputWritten', { file: outputFile }));
        } else {
          console.log(renderMarkdownToTerminal(markdown));
        }
        break;
      }
      case 'html': {
        const html = renderAIReviewHtml(reviews);
        if (outputFile) {
          const { writeFile } = await import('node:fs/promises');
          await writeFile(outputFile, html, 'utf-8');
          console.log(t('outputWritten', { file: outputFile }));
        } else {
          console.log(chalk.yellow(t('output_html_requires_file')));
          renderConsoleReviews(reviews);
        }
        break;
      }
      default: {
        renderConsoleReviews(reviews);
      }
    }
  } catch (error) {
    spinner.fail(t('aiReviewFailed'));
    console.error(chalk.red(error instanceof Error ? error.message : String(error)));
    process.exit(1);
  }
}

/** Render AI review results to the terminal with chalk styling */
function renderConsoleReviews(reviews: AIReviewData[]): void {
  const termWidth = getTerminalWidth();
  const reviewIndent = 3;
  const contentWidth = termWidth - reviewIndent;
  const indentStr = ' '.repeat(reviewIndent);

  console.log('\n' + chalk.bold.yellow(`🌸 ${t('ai_review_title')} 🌸`));
  console.log(indentStr + chalk.gray('─'.repeat(contentWidth)));

  for (const [i, { filePath, score, review }] of reviews.entries()) {
    console.log();
    console.log(chalk.bold.magenta(`${i + 1}. ${filePath}`));
    console.log(chalk.cyan(`   ${t('report_file_score', { score: score.toFixed(1) })}`));
    console.log();
    console.log(renderMarkdownToTerminal(review, reviewIndent));
    console.log(indentStr + chalk.gray('─'.repeat(contentWidth)));
  }
}

/** Get default base URL for a provider */
function getDefaultBaseUrl(provider: string): string {
  const urls: Record<string, string> = {
    openai: 'https://api.openai.com/v1',
    anthropic: 'https://api.anthropic.com',
    deepseek: 'https://api.deepseek.com/v1',
    gemini: 'https://generativelanguage.googleapis.com',
    ollama: 'http://localhost:11434',
  };
  return urls[provider] ?? `https://api.${provider}.com/v1`;
}
