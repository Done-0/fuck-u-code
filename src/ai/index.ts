/**
 * AI module entry point
 */

import { OpenAIProvider } from './providers/openai.js';
import { AnthropicProvider } from './providers/anthropic.js';
import { OllamaProvider } from './providers/ollama.js';
import { GeminiProvider } from './providers/gemini.js';
import { getCodeReviewPrompt } from './prompts/code-review.js';
import { t } from '../i18n/index.js';

import type { AIConfig, Provider, ProviderContext, ChatRequest, ChatResponse } from './types.js';
import type { FileAnalysisResult, MetricResult } from '../metrics/types.js';

/**
 * AI Manager for code review
 */
export class AIManager {
  private config: AIConfig;

  constructor(config: AIConfig) {
    this.config = config;
  }

  /**
   * Review code and provide suggestions
   * Includes local analysis results for more accurate AI feedback
   */
  async reviewCode(fileResult: FileAnalysisResult): Promise<string> {
    const providerName = this.config.defaultProvider;
    if (!providerName) {
      throw new Error(t('ai_no_provider'));
    }

    const providerConfig = this.config.providers[providerName];
    if (!providerConfig?.enabled || !providerConfig.instances.length) {
      throw new Error(t('ai_no_provider'));
    }

    const instance = providerConfig.instances[0];
    if (!instance?.enabled) {
      throw new Error(t('ai_no_provider'));
    }

    const ctx: ProviderContext = {
      providerName,
      instanceName: instance.name,
      baseUrl: instance.baseUrl,
      apiKey: instance.apiKey,
      model: instance.models[0] || '',
      maxTokens: instance.maxTokens,
      temperature: instance.temperature,
      topP: instance.topP,
      topK: instance.topK,
      timeout: instance.timeout,
      maxRetries: instance.maxRetries,
    };

    const provider = this.createProvider(ctx);
    const prompt = this.buildReviewPrompt(fileResult);
    const systemPrompt = getCodeReviewPrompt();

    const response = await provider.chat({
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: prompt },
      ],
    });

    return response.choices[0]?.message.content ?? '';
  }

  /**
   * Chat with AI
   */
  async chat(request: ChatRequest): Promise<ChatResponse> {
    const providerName = this.config.defaultProvider;
    if (!providerName) {
      throw new Error(t('ai_no_provider'));
    }

    const providerConfig = this.config.providers[providerName];
    if (!providerConfig?.enabled || !providerConfig.instances.length) {
      throw new Error(t('ai_no_provider'));
    }

    const instance = providerConfig.instances[0];
    if (!instance?.enabled) {
      throw new Error(t('ai_no_provider'));
    }

    const ctx: ProviderContext = {
      providerName,
      instanceName: instance.name,
      baseUrl: instance.baseUrl,
      apiKey: instance.apiKey,
      model: request.model || instance.models[0] || '',
      maxTokens: instance.maxTokens,
      temperature: instance.temperature,
      topP: instance.topP,
      topK: instance.topK,
      timeout: instance.timeout,
      maxRetries: instance.maxRetries,
    };

    const provider = this.createProvider(ctx);
    return provider.chat(request);
  }

  private createProvider(ctx: ProviderContext): Provider {
    switch (ctx.providerName) {
      case 'openai':
      case 'deepseek':
        return new OpenAIProvider(ctx);
      case 'anthropic':
        return new AnthropicProvider(ctx);
      case 'gemini':
        return new GeminiProvider(ctx);
      case 'ollama':
        return new OllamaProvider(ctx);
      default:
        return new OpenAIProvider(ctx);
    }
  }

  /**
   * Build comprehensive review prompt with local analysis results
   * This provides AI with concrete metrics data for more accurate suggestions
   */
  private buildReviewPrompt(fileResult: FileAnalysisResult): string {
    const { filePath, score, metrics, parseResult } = fileResult;

    const metricsByCategory = this.groupMetricsByCategory(metrics);
    const metricsSection = this.buildMetricsSection(metricsByCategory);

    const issues = metrics
      .filter((m) => m.severity !== 'info')
      .sort((a, b) => this.severityPriority(b.severity) - this.severityPriority(a.severity));

    const issuesSection =
      issues.length > 0
        ? issues
            .map(
              (m) =>
                `- [${m.severity.toUpperCase()}] ${m.name}: ${m.details || t('score') + ': ' + m.normalizedScore.toFixed(1)}`
            )
            .join('\n')
        : t('ai_no_issues_detected');

    const functionsSection =
      parseResult.functions.length > 0
        ? parseResult.functions
            .sort((a, b) => b.complexity - a.complexity)
            .slice(0, 10)
            .map((f) => {
              const warnings: string[] = [];
              if (f.complexity > 10) warnings.push(t('ai_high_complexity'));
              if (f.lineCount > 300) warnings.push(t('ai_long_function'));
              if (f.nestingDepth > 4) warnings.push(t('ai_deep_nesting'));
              if (f.parameterCount > 5) warnings.push(t('ai_many_parameters'));
              const warningStr = warnings.length > 0 ? ` [${warnings.join(', ')}]` : '';
              return `- ${f.name}: ${f.lineCount} lines, complexity ${f.complexity}, nesting ${f.nestingDepth}, params ${f.parameterCount}${warningStr}`;
            })
            .join('\n')
        : t('ai_no_functions_detected');

    const commentRatio =
      parseResult.codeLines > 0
        ? ((parseResult.commentLines / parseResult.codeLines) * 100).toFixed(1)
        : '0';

    const statsSection = `
- ${t('ai_total_lines')}: ${parseResult.totalLines}
- ${t('ai_code_lines')}: ${parseResult.codeLines}
- ${t('ai_comment_lines')}: ${parseResult.commentLines}
- ${t('ai_blank_lines')}: ${parseResult.blankLines}
- ${t('ai_comment_ratio')}: ${commentRatio}%
- ${t('ai_functions')}: ${parseResult.functions.length}
- ${t('ai_classes')}: ${parseResult.classes.length}`;

    return `
## ${t('ai_file_analysis_report')}

**${t('file')}:** ${filePath}
**Language:** ${parseResult.language}
**${t('overallScore')}:** ${score.toFixed(1)}/100 (${this.getScoreLabel(score)})

### ${t('ai_code_statistics')}
${statsSection}

### ${t('ai_metrics_analysis')}
${metricsSection}

### ${t('ai_detected_issues')}
${issuesSection}

### ${t('ai_function_analysis')}
${functionsSection}

---

${t('ai_review_request')}
1. ${t('ai_review_request_1')}
2. ${t('ai_review_request_2')}
3. ${t('ai_review_request_3')}
4. ${t('ai_review_request_4')}

${t('ai_review_focus')}
`;
  }

  private groupMetricsByCategory(metrics: MetricResult[]): Map<string, MetricResult[]> {
    const grouped = new Map<string, MetricResult[]>();
    for (const metric of metrics) {
      const existing = grouped.get(metric.category) || [];
      existing.push(metric);
      grouped.set(metric.category, existing);
    }
    return grouped;
  }

  private buildMetricsSection(metricsByCategory: Map<string, MetricResult[]>): string {
    const sections: string[] = [];
    for (const [category, metrics] of metricsByCategory) {
      const avgScore = metrics.reduce((sum, m) => sum + m.normalizedScore, 0) / metrics.length;
      const categoryName = t(category) || category.charAt(0).toUpperCase() + category.slice(1);
      const details = metrics
        .map((m) => `  - ${m.name}: ${m.normalizedScore.toFixed(1)}/100`)
        .join('\n');
      sections.push(`**${categoryName}** (avg: ${avgScore.toFixed(1)}/100)\n${details}`);
    }
    return sections.join('\n\n');
  }

  private severityPriority(severity: string): number {
    const priorities: Record<string, number> = {
      critical: 4,
      error: 3,
      warning: 2,
      info: 1,
    };
    return priorities[severity] || 0;
  }

  private getScoreLabel(score: number): string {
    if (score >= 90) return t('ai_score_excellent');
    if (score >= 75) return t('ai_score_good');
    if (score >= 60) return t('ai_score_acceptable');
    if (score >= 40) return t('ai_score_poor');
    return t('ai_score_critical');
  }
}

export function createAIManager(config: AIConfig): AIManager {
  return new AIManager(config);
}

export type { AIConfig, Provider, ChatRequest, ChatResponse } from './types.js';
