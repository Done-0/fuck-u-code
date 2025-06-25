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

export class OpenAIProvider implements Provider {
  private ctx: ProviderContext;

  constructor(ctx: ProviderContext) {
    this.ctx = ctx;
  }

  async chat(request: ChatRequest): Promise<ChatResponse> {
    const model = request.model ?? this.ctx.model;
    const maxTokens = request.maxTokens ?? this.ctx.maxTokens;
    const temperature = request.temperature ?? this.ctx.temperature;

    const response = await fetchWithRetry(this.ctx, `${this.ctx.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${this.ctx.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model,
        messages: request.messages,
        max_tokens: maxTokens,
        temperature,
        top_p: this.ctx.topP,
      }),
    });

    const data = (await response.json()) as {
      id?: string;
      model?: string;
      choices?: {
        index: number;
        message: { role: string; content: string };
        finish_reason: string;
      }[];
      usage?: {
        prompt_tokens: number;
        completion_tokens: number;
        total_tokens: number;
      };
    };

    return {
      id: data.id ?? `chatcmpl-${Date.now().toString(36)}`,
      model: data.model ?? model,
      choices: (data.choices ?? []).map((choice) => ({
        index: choice.index,
        message: {
          role: choice.message.role as 'system' | 'user' | 'assistant',
          content: choice.message.content,
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
