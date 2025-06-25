/**
 * Anthropic provider
 */

import type {
  Provider,
  ProviderContext,
  ChatRequest,
  ChatResponse,
  ChatStreamResponse,
} from '../types.js';
import { fetchWithRetry } from './fetch.js';

export class AnthropicProvider implements Provider {
  private ctx: ProviderContext;

  constructor(ctx: ProviderContext) {
    this.ctx = ctx;
  }

  async chat(request: ChatRequest): Promise<ChatResponse> {
    const model = request.model ?? this.ctx.model;
    const maxTokens = request.maxTokens ?? this.ctx.maxTokens;
    const temperature = request.temperature ?? this.ctx.temperature;

    // Anthropic API requires system message as separate field
    const systemMessage = request.messages.find((m) => m.role === 'system');
    const otherMessages = request.messages.filter((m) => m.role !== 'system');

    const response = await fetchWithRetry(this.ctx, `${this.ctx.baseUrl}/v1/messages`, {
      method: 'POST',
      headers: {
        'x-api-key': this.ctx.apiKey,
        'Content-Type': 'application/json',
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model,
        max_tokens: maxTokens,
        temperature,
        top_p: this.ctx.topP,
        system: systemMessage?.content,
        messages: otherMessages.map((m) => ({
          role: m.role,
          content: m.content,
        })),
      }),
    });

    const data = (await response.json()) as {
      id?: string;
      model?: string;
      content?: { type: string; text: string }[];
      stop_reason?: string;
      usage?: {
        input_tokens: number;
        output_tokens: number;
      };
    };

    const content = data.content?.find((c) => c.type === 'text')?.text ?? '';

    return {
      id: data.id ?? `msg-${Date.now().toString(36)}`,
      model: data.model ?? model,
      choices: [
        {
          index: 0,
          message: { role: 'assistant', content },
          finishReason: data.stop_reason ?? 'stop',
        },
      ],
      usage: {
        promptTokens: data.usage?.input_tokens ?? 0,
        completionTokens: data.usage?.output_tokens ?? 0,
        totalTokens: (data.usage?.input_tokens ?? 0) + (data.usage?.output_tokens ?? 0),
      },
      provider: this.ctx.providerName,
    };
  }

  chatStream(_request: ChatRequest): Promise<ReadableStream<ChatStreamResponse>> {
    return Promise.reject(new Error('Streaming not implemented for CLI'));
  }
}
