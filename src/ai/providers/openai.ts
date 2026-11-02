/**
 * OpenAI provider (also used for OpenAI-compatible APIs like DeepSeek)
 */

import type {
  Provider,
  ProviderContext,
  ChatRequest,
  ChatResponse,
  ChatStreamResponse,
} from '../types.js';
import { fetchWithRetry } from './fetch.js';

/**
 * Which request parameter names a model accepts. OpenAI's reasoning models
 * (o-series, gpt-5) reject `max_tokens` in favor of `max_completion_tokens` and
 * only allow the default temperature/top_p, while many OpenAI-compatible services
 * still expect the classic names. Requests start classic and adapt when a 400
 * names the offending parameter.
 */
interface ParamStyle {
  completionTokens: boolean;
  defaultSampling: boolean;
}

const CLASSIC_STYLE: ParamStyle = { completionTokens: false, defaultSampling: false };

/** Adaptations that worked, per endpoint and model, so later requests skip the failing call. */
const learnedStyles = new Map<string, ParamStyle>();

/** Reasoning tokens count against max_completion_tokens; keep room for the actual answer. */
const MIN_COMPLETION_TOKENS = 16384;

/** The style to retry with after a 400, or null when the error is not about parameters. */
function adaptStyle(style: ParamStyle, message: string): ParamStyle | null {
  if (!message.startsWith('HTTP 400')) return null;
  if (!style.completionTokens && message.includes('max_completion_tokens')) {
    return { ...style, completionTokens: true };
  }
  if (!style.defaultSampling && /\b(temperature|top_p)\b/.test(message)) {
    return { ...style, defaultSampling: true };
  }
  return null;
}

/** Visible for tests. */
export function resetLearnedParamStyles(): void {
  learnedStyles.clear();
}

export class OpenAIProvider implements Provider {
  private ctx: ProviderContext;

  constructor(ctx: ProviderContext) {
    this.ctx = ctx;
  }

  private buildBody(request: ChatRequest, model: string, style: ParamStyle): string {
    const maxTokens = request.maxTokens ?? this.ctx.maxTokens;
    return JSON.stringify({
      model,
      messages: request.messages,
      ...(style.completionTokens
        ? { max_completion_tokens: Math.max(maxTokens, MIN_COMPLETION_TOKENS) }
        : { max_tokens: maxTokens }),
      ...(style.defaultSampling
        ? {}
        : { temperature: request.temperature ?? this.ctx.temperature, top_p: this.ctx.topP }),
    });
  }

  /** POST the chat request, adapting parameter names at most once per kind. */
  private async post(request: ChatRequest, model: string): Promise<Response> {
    const key = `${this.ctx.baseUrl}|${model}`;
    let style = learnedStyles.get(key) ?? CLASSIC_STYLE;

    for (;;) {
      try {
        const response = await fetchWithRetry(this.ctx, `${this.ctx.baseUrl}/chat/completions`, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${this.ctx.apiKey}`,
            'Content-Type': 'application/json',
          },
          body: this.buildBody(request, model, style),
        });
        learnedStyles.set(key, style);
        return response;
      } catch (error) {
        const next = error instanceof Error ? adaptStyle(style, error.message) : null;
        if (!next) throw error;
        style = next;
      }
    }
  }

  async chat(request: ChatRequest): Promise<ChatResponse> {
    const model = request.model ?? this.ctx.model;
    const response = await this.post(request, model);

    const data = (await response.json()) as {
      id?: string;
      model?: string;
      choices?: {
        index: number;
        message: { role: string; content: string | null };
        finish_reason: string;
      }[];
      usage?: {
        prompt_tokens: number;
        completion_tokens: number;
        total_tokens: number;
      };
    };

    const first = data.choices?.[0];
    if (first && !first.message.content && first.finish_reason === 'length') {
      throw new Error('The model used its whole token budget before writing an answer');
    }

    return {
      id: data.id ?? `chatcmpl-${Date.now().toString(36)}`,
      model: data.model ?? model,
      choices: (data.choices ?? []).map((choice) => ({
        index: choice.index,
        message: {
          role: choice.message.role as 'system' | 'user' | 'assistant',
          content: choice.message.content ?? '',
        },
        finishReason: choice.finish_reason,
      })),
      usage: {
        promptTokens: data.usage?.prompt_tokens ?? 0,
        completionTokens: data.usage?.completion_tokens ?? 0,
        totalTokens: data.usage?.total_tokens ?? 0,
      },
      provider: this.ctx.providerName,
    };
  }

  chatStream(_request: ChatRequest): Promise<ReadableStream<ChatStreamResponse>> {
    return Promise.reject(new Error('Streaming not implemented for CLI'));
  }
}
