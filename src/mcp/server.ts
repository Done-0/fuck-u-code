/**
 * MCP (Model Context Protocol) Server for fuck-u-code
 *
 * Exposes analyze and ai-review tools via stdio transport,
 * allowing AI tools (Claude Code, Cursor, etc.) to invoke
 * code quality analysis and AI-powered code review directly.
 */

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { z } from 'zod';
import { resolve } from 'node:path';
import { createAnalyzer } from '../analyzer/index.js';
import { loadConfig, createRuntimeConfig, loadAIConfig } from '../config/index.js';
import { createAIManager } from '../ai/index.js';
import { MarkdownOutput } from '../cli/output/markdown.js';
import { JsonOutput } from '../cli/output/json.js';
import { setLocale, type Locale } from '../i18n/index.js';
import type { RuntimeConfig } from '../config/schema.js';
import { VERSION } from '../version.js';

const server = new McpServer({
  name: 'fuck-u-code',
  version: VERSION,
});

/**
 * Build a RuntimeConfig from MCP tool parameters.
 * Reuses the same config loading pipeline as the CLI.
 */
async function buildRuntimeConfig(
  projectPath: string,
  options: { verbose?: boolean; locale?: string; top?: number }
): Promise<RuntimeConfig> {
  if (options.locale) {
    setLocale(options.locale as Locale);
  }

  const config = await loadConfig(projectPath);
  // mergeConfig spreads nested objects, so partial output fields are safe at runtime
  const overrides: Partial<import('../config/schema.js').Config> = { verbose: options.verbose };
  if (options.top !== undefined) {
    overrides.output = { top: options.top } as import('../config/schema.js').Config['output'];
  }
  return createRuntimeConfig(projectPath, config, overrides);
}

const DEFAULT_BASE_URLS: Record<string, string> = {
  openai: 'https://api.openai.com/v1',
  anthropic: 'https://api.anthropic.com',
  deepseek: 'https://api.deepseek.com/v1',
  gemini: 'https://generativelanguage.googleapis.com',
  ollama: 'http://localhost:11434',
};

server.registerTool(
  'analyze',
  {
    title: 'Code Quality Analysis',
    description:
      'Analyze code quality of a project and generate a "shit mountain index" score (0-100)',
    inputSchema: {
      path: z.string().describe('Absolute or relative path to the project directory'),
      verbose: z
        .boolean()
        .optional()
        .default(false)
        .describe('Include detailed metrics and function-level analysis'),
      format: z
        .enum(['console', 'markdown', 'json'])
        .optional()
        .default('json')
        .describe('Output format (json for full data, markdown for summary)'),
      top: z.number().optional().default(10).describe('Number of worst files to show'),
      locale: z.enum(['en', 'zh', 'ru']).optional().default('en').describe('Output language'),
    },
  },
  async ({ path: projectPath, verbose, format, top, locale }) => {
    const resolvedPath = resolve(projectPath);
    const runtimeConfig = await buildRuntimeConfig(resolvedPath, { verbose, locale, top });

    const analyzer = createAnalyzer(runtimeConfig);
    const result = await analyzer.analyze();

    let text: string;
    switch (format) {
      case 'json':
        text = new JsonOutput().render(result);
        break;
      case 'markdown':
      case 'console':
      default:
        text = new MarkdownOutput(runtimeConfig).render(result);
        break;
    }

    return { content: [{ type: 'text' as const, text }] };
  }
);

server.registerTool(
  'ai-review',
  {
    title: 'AI Code Review',
    description: 'Run AI-powered code review on the worst-scoring files in a project',
    inputSchema: {
      path: z.string().describe('Absolute or relative path to the project directory'),
      model: z
        .string()
        .describe('AI model name (e.g. gpt-4o, claude-3-opus, deepseek-chat, llama3)'),
      provider: z
        .enum(['openai', 'anthropic', 'deepseek', 'gemini', 'ollama'])
        .optional()
        .default('openai')
        .describe('AI provider'),
      baseUrl: z.string().optional().describe('Custom API base URL'),
      apiKey: z.string().optional().describe('API key (can also use environment variables)'),
      top: z.number().optional().default(5).describe('Number of worst files to review'),
      locale: z.enum(['en', 'zh', 'ru']).optional().default('en').describe('Output language'),
      verbose: z
        .boolean()
        .optional()
        .default(false)
        .describe('Include detailed metrics in analysis'),
    },
  },
  async ({ path: projectPath, model, provider, baseUrl, apiKey, top, locale, verbose }) => {
    const resolvedPath = resolve(projectPath);
    setLocale(locale as Locale);

    const config = await loadConfig(resolvedPath);
    const runtimeConfig = createRuntimeConfig(resolvedPath, config, {
      verbose,
      ai: { enabled: true, provider, model },
    });

    const analyzer = createAnalyzer(runtimeConfig);
    const analysisResult = await analyzer.analyze();

    const worstFiles = analysisResult.fileResults.sort((a, b) => a.score - b.score).slice(0, top);

    if (worstFiles.length === 0) {
      return {
        content: [{ type: 'text' as const, text: 'No files to review — all scores are clean.' }],
      };
    }

    const resolvedApiKey = apiKey || process.env[`${provider.toUpperCase()}_API_KEY`] || '';
    const aiConfig = loadAIConfig(
      {
        enabled: true,
        provider,
        model,
        baseUrl: baseUrl || DEFAULT_BASE_URLS[provider],
        apiKey: resolvedApiKey,
      },
      model
    );

    if (Object.keys(aiConfig.providers).length === 0) {
      return {
        content: [
          {
            type: 'text' as const,
            text: 'Error: No AI provider configured. Provide an API key or set environment variables.',
          },
        ],
      };
    }

    const aiManager = createAIManager(aiConfig);
    const reviewParts: string[] = [];

    for (const [i, file] of worstFiles.entries()) {
      const score = 100 - file.score;
      const review = await aiManager.reviewCode(file);
      reviewParts.push(
        `## ${i + 1}. ${file.filePath}\n\n**Score: ${score.toFixed(1)}/100**\n\n${review}`
      );
    }

    const text = `# AI Code Review\n\n${reviewParts.join('\n\n---\n\n')}`;
    return { content: [{ type: 'text' as const, text }] };
  }
);

async function main(): Promise<void> {
  const transport = new StdioServerTransport();
  await server.connect(transport);
}

main().catch((error: unknown) => {
  console.error('MCP server failed to start:', error);
  process.exit(1);
});
