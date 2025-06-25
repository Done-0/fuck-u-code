/**
 * Ollama provider (local models)
 */

import type {
  Provider,
  ProviderContext,
  ChatRequest,
  ChatResponse,
  ChatStreamResponse,
} from '../types.js';
import { fetchWithRetry } from './fetch.js';

export class OllamaProvider implements Provider {
  private ctx: ProviderContext;

  constructor(ctx: ProviderContext) {
    this.ctx = ctx;
  }

  async chat(request: ChatRequest): Promise<ChatResponse> {
    const model = request.model ?? this.ctx.model;

    const response = await fetchWithRetry(this.ctx, `${this.ctx.baseUrl}/api/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model,
        messages: request.messages,
        stream: false,
        options: {
          temperature: request.temperature ?? this.ctx.temperature,
          top_p: this.ctx.topP,
          top_k: this.ctx.topK,
        },
      }),
    });

    const data = (await response.json()) as {
      model?: string;
      message?: { role: string; content: string };
      done_reason?: string;
      prompt_eval_count?: number;
      eval_count?: number;
    };

    return {
      id: `ollama-${Date.now().toString(36)}`,
      model: data.model ?? model,
      choices: [
        {
          index: 0,
          message: {
            role: 'assistant',
            content: data.message?.content ?? '',
          },
          finishReason: data.done_reason ?? 'stop',
        },
      ],
      usage: {
        promptTokens: data.prompt_eval_count ?? 0,
        completionTokens: data.eval_count ?? 0,
        totalTokens: (data.prompt_eval_count ?? 0) + (data.eval_count ?? 0),
      },
      provider: this.ctx.providerName,
    };
  }

  chatStream(_request: ChatRequest): Promise<ReadableStream<ChatStreamResponse>> {
    return Promise.reject(new Error('Streaming not implemented for CLI'));
  }
}
