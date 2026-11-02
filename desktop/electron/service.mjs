/**
 * Bridge between the desktop shell and the analyzer in ./core.
 * Holds the open analysis in memory so exports and AI reviews can reuse it.
 * File contents are dropped right after analysis: nothing downstream (renderer,
 * exports, AI prompt, on-disk cache) needs them.
 */

import { stat } from 'node:fs/promises';
import { basename, isAbsolute, relative, resolve } from 'node:path';
import { createAnalyzer } from '../core/analyzer/index.js';
import { createRuntimeConfig, loadAIConfig, loadConfig } from '../core/config/index.js';
import { setLocale, t } from '../core/i18n/index.js';
import { createAIManager } from '../core/ai/index.js';
import { HtmlOutput } from '../core/cli/output/html.js';
import { MarkdownOutput } from '../core/cli/output/markdown.js';
import { JsonOutput } from '../core/cli/output/json.js';
import { renderAIReviewHtml, renderAIReviewMarkdown } from '../core/cli/output/ai-review-output.js';
import { aggregateProjectStats, collectWorstFunctions } from '../core/cli/output/stats.js';
import { VERSION } from '../core/version.js';
import { DEFAULT_BASE_URLS } from './models.mjs';

export { VERSION as CORE_VERSION };

const PROGRESS_INTERVAL_MS = 60;

let current = null; // { result, runtimeConfig, analyzedAt }
let reviews = [];
let busy = false;

function stripContents(result) {
  return {
    ...result,
    fileResults: result.fileResults.map((file) => {
      const { content: _content, ...parseResult } = file.parseResult;
      return { ...file, parseResult };
    }),
  };
}

/** The open analysis plus what the renderer derives its summary views from. */
function toRendererResult({ result, analyzedAt }) {
  return {
    ...result,
    projectName: basename(result.projectPath),
    analyzedAt,
    stats: aggregateProjectStats(result),
    worstFunctions: collectWorstFunctions(result, 30),
  };
}

async function buildRuntimeConfig(root, { exclude, concurrency }) {
  const config = await loadConfig(root);
  return createRuntimeConfig(root, config, {
    concurrency,
    exclude: [...config.exclude, ...exclude],
    output: { format: 'html', top: 20, maxIssues: 5, showDetails: true },
  });
}

async function exclusive(task) {
  if (busy) throw new Error('Another task is still running');
  busy = true;
  try {
    return await task();
  } finally {
    busy = false;
  }
}

export function runAnalysis({ projectPath, exclude, concurrency, locale }, onProgress) {
  return exclusive(async () => {
    setLocale(locale);
    const root = resolve(projectPath);
    const info = await stat(root).catch(() => null);
    if (!info) throw new Error(t('error_path_not_found', { path: root }));
    if (!info.isDirectory()) throw new Error(t('error_not_a_directory', { path: root }));

    const runtimeConfig = await buildRuntimeConfig(root, { exclude, concurrency });

    let lastEmit = 0;
    const analyzer = createAnalyzer(runtimeConfig, {
      onDiscoveryStart: () => onProgress({ phase: 'discovering', current: 0, total: 0 }),
      onDiscoveryComplete: (total) => onProgress({ phase: 'analyzing', current: 0, total }),
      onAnalysisProgress: (done, total) => {
        const now = Date.now();
        if (done === total || now - lastEmit >= PROGRESS_INTERVAL_MS) {
          lastEmit = now;
          onProgress({ phase: 'analyzing', current: done, total });
        }
      },
    });

    const result = stripContents(await analyzer.analyze());
    current = { result, runtimeConfig, analyzedAt: new Date().toISOString() };
    reviews = [];
    return toRendererResult(current);
  });
}

/** Serializable form of the open analysis, for the on-disk report cache. */
export function currentSnapshot() {
  const { result, analyzedAt } = requireAnalysis();
  return { coreVersion: VERSION, projectPath: result.projectPath, analyzedAt, result };
}

/** Reopen a cached analysis without re-running it. */
export function restoreAnalysis(snapshot, { exclude, concurrency }) {
  return exclusive(async () => {
    const runtimeConfig = await buildRuntimeConfig(snapshot.projectPath, { exclude, concurrency });
    current = { result: snapshot.result, runtimeConfig, analyzedAt: snapshot.analyzedAt };
    reviews = [];
    return toRendererResult(current);
  });
}

function requireAnalysis() {
  if (!current) throw new Error('No analysis result yet');
  return current;
}

export function renderReport(format, locale) {
  const { result, runtimeConfig } = requireAnalysis();
  setLocale(locale);
  // Exports always carry the full per-function detail.
  const config = { ...runtimeConfig, verbose: true };
  switch (format) {
    case 'html':
      return new HtmlOutput(config).render(result);
    case 'markdown':
      return new MarkdownOutput(config).render(result);
    case 'json':
      return new JsonOutput().render(result);
    default:
      throw new Error(`Unknown format: ${format}`);
  }
}

/** The open project's path, for keying saved AI reviews. */
export function currentProjectPath() {
  return requireAnalysis().result.projectPath;
}

/** Load saved review entries so exports include them after a reopen. */
export function restoreReviews(items) {
  const { result } = requireAnalysis();
  const scores = new Map(result.fileResults.map((file) => [file.filePath, 100 - file.score]));
  reviews = items
    .filter((item) => item.status === 'done')
    .map(({ filePath, review }) => ({ filePath, score: scores.get(filePath) ?? 0, review }));
}

export function renderReviews(format, locale) {
  if (reviews.length === 0) throw new Error('No AI review yet');
  setLocale(locale);
  return format === 'html' ? renderAIReviewHtml(reviews) : renderAIReviewMarkdown(reviews);
}

/**
 * Settings from the desktop form win; with no model configured there, fall back
 * to the CLI's own sources (environment variables and .fuckucoderc).
 */
function buildAIConfig(ai, runtimeConfig) {
  if (ai.model) {
    const provider = ai.provider || 'openai';
    const apiKey = ai.apiKey || process.env[`${provider.toUpperCase()}_API_KEY`] || '';
    if (!apiKey && provider !== 'ollama') throw new Error(t('ai_api_key_required'));
    return {
      providers: {
        [provider]: {
          enabled: true,
          instances: [
            {
              name: 'desktop',
              enabled: true,
              baseUrl: ai.baseUrl || DEFAULT_BASE_URLS[provider] || DEFAULT_BASE_URLS.openai,
              apiKey,
              models: [ai.model],
              maxTokens: 4096,
              temperature: 0.7,
              topP: 1,
              timeout: 120,
              maxRetries: 2,
            },
          ],
        },
      },
      defaultProvider: provider,
    };
  }

  const aiConfig = loadAIConfig(runtimeConfig.ai);
  if (Object.keys(aiConfig.providers).length === 0) {
    throw new Error(`${t('noAIProvider')}. ${t('aiProviderHint')}`);
  }
  return aiConfig;
}

export function reviewFiles({ filePaths, ai, locale }, onProgress) {
  return exclusive(async () => {
    const { result, runtimeConfig } = requireAnalysis();
    setLocale(locale);
    const manager = createAIManager(buildAIConfig(ai, runtimeConfig));
    const byPath = new Map(result.fileResults.map((file) => [file.filePath, file]));
    const targets = filePaths.map((p) => byPath.get(p)).filter(Boolean);

    reviews = [];
    for (const [index, file] of targets.entries()) {
      const base = { index, total: targets.length, filePath: file.filePath };
      onProgress({ ...base, status: 'running' });
      try {
        const review = await manager.reviewCode(file);
        reviews.push({ filePath: file.filePath, score: 100 - file.score, review });
        onProgress({ ...base, status: 'done', review });
      } catch (error) {
        onProgress({
          ...base,
          status: 'error',
          error: error instanceof Error ? error.message : String(error),
        });
      }
    }
    return reviews.length;
  });
}

/** Resolve a path reported by the analyzer, refusing anything outside the project. */
export function resolveProjectPath(filePath) {
  const { runtimeConfig } = requireAnalysis();
  const root = runtimeConfig.projectPath;
  const target = resolve(root, filePath);
  const rel = relative(root, target);
  if (rel.startsWith('..') || isAbsolute(rel)) throw new Error('Path is outside the project');
  return target;
}
