/**
 * Google Gemini provider
 * Uses the Gemini REST API (generativelanguage.googleapis.com)
 */

import type {
  Provider,
  ProviderContext,
  ChatRequest,
  ChatResponse,
  ChatStreamResponse,
} from '../types.js';
import { fetchWithRetry } from './fetch.js';

export class GeminiProvider implements Provider {
  private ctx: ProviderContext;

  constructor(ctx: ProviderContext) {
    this.ctx = ctx;
  }

  async chat(request: ChatRequest): Promise<ChatResponse> {
    const model = request.model ?? this.ctx.model;
    const temperature = request.temperature ?? this.ctx.temperature;

    // Convert messages to Gemini format
    const systemMessage = request.messages.find((m) => m.role === 'system');
    const otherMessages = request.messages.filter((m) => m.role !== 'system');

    const contents = otherMessages.map((m) => ({
      role: m.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: m.content }],
    }));

    const body: Record<string, unknown> = {
      contents,
      generationConfig: {
        temperature,
        topP: this.ctx.topP,
        topK: this.ctx.topK ?? 40,
        maxOutputTokens: request.maxTokens ?? this.ctx.maxTokens,
      },
    };

    if (systemMessage) {
      body.systemInstruction = {
        parts: [{ text: systemMessage.content }],
      };
    }

    const url = `${this.ctx.baseUrl}/v1beta/models/${model}:generateContent?key=${this.ctx.apiKey}`;

    const response = await fetchWithRetry(this.ctx, url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    const data = (await response.json()) as {
      candidates?: {
        content?: { parts?: { text?: string }[]; role?: string };
        finishReason?: string;
      }[];
      usageMetadata?: {
        promptTokenCount?: number;
        candidatesTokenCount?: number;
        totalTokenCount?: number;
      };
    };

    const candidate = data.candidates?.[0];
    const content = candidate?.content?.parts?.map((p) => p.text ?? '').join('') ?? '';

    return {
      id: `gemini-${Date.now().toString(36)}`,
      model,
      choices: [
        {
          index: 0,
          message: { role: 'assistant', content },
          finishReason: candidate?.finishReason ?? 'STOP',
        },
      ],
      usage: {
        promptTokens: data.usageMetadata?.promptTokenCount ?? 0,
        completionTokens: data.usageMetadata?.candidatesTokenCount ?? 0,
        totalTokens: data.usageMetadata?.totalTokenCount ?? 0,
      },
      provider: this.ctx.providerName,
    };
  }

  chatStream(_request: ChatRequest): Promise<ReadableStream<ChatStreamResponse>> {
    return Promise.reject(new Error('Streaming not implemented for CLI'));
  }
}
