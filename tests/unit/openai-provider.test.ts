import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

import { OpenAIProvider, resetLearnedParamStyles } from '../../src/ai/providers/openai.js';
import type { ProviderContext } from '../../src/ai/types.js';

const ctx: ProviderContext = {
  providerName: 'openai',
  instanceName: 'test',
  baseUrl: 'https://api.example.test/v1',
  apiKey: 'test-key',
  model: 'o4-mini',
  maxTokens: 4096,
  temperature: 0.7,
  topP: 1,
  timeout: 5,
  maxRetries: 0,
};

const OK_BODY = {
  id: 'chatcmpl-1',
  model: 'o4-mini',
  choices: [{ index: 0, message: { role: 'assistant', content: 'review' }, finish_reason: 'stop' }],
  usage: { prompt_tokens: 1, completion_tokens: 1, total_tokens: 2 },
};

function jsonResponse(status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

function apiError(message: string): Response {
  return jsonResponse(400, { error: { message } });
}

const MAX_TOKENS_ERROR =
  "Unsupported parameter: 'max_tokens' is not supported with this model. Use 'max_completion_tokens' instead.";
const TEMPERATURE_ERROR =
  "Unsupported value: 'temperature' does not support 0.7 with this model. Only the default (1) value is supported.";

describe('OpenAIProvider parameter adaptation', () => {
  const fetchMock = vi.fn<typeof fetch>();
  const sentBodies = () =>
    fetchMock.mock.calls.map(
      ([, init]) => JSON.parse(String(init?.body)) as Record<string, unknown>
    );

  beforeEach(() => {
    resetLearnedParamStyles();
    fetchMock.mockReset();
    vi.stubGlobal('fetch', fetchMock);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('sends the classic parameters when the model accepts them', async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse(200, OK_BODY));

    const result = await new OpenAIProvider(ctx).chat({
      messages: [{ role: 'user', content: 'hi' }],
    });

    expect(result.choices[0]?.message.content).toBe('review');
    expect(sentBodies()).toEqual([
      expect.objectContaining({ max_tokens: 4096, temperature: 0.7, top_p: 1 }),
    ]);
  });

  it('switches to max_completion_tokens and default sampling for reasoning models', async () => {
    fetchMock
      .mockResolvedValueOnce(apiError(MAX_TOKENS_ERROR))
      .mockResolvedValueOnce(apiError(TEMPERATURE_ERROR))
      .mockResolvedValueOnce(jsonResponse(200, OK_BODY));

    const result = await new OpenAIProvider(ctx).chat({
      messages: [{ role: 'user', content: 'hi' }],
    });

    expect(result.choices[0]?.message.content).toBe('review');
    const last = sentBodies().at(-1);
    expect(last).not.toHaveProperty('max_tokens');
    expect(last).not.toHaveProperty('temperature');
    expect(last).not.toHaveProperty('top_p');
    expect(last?.max_completion_tokens).toBeGreaterThanOrEqual(4096);
  });

  it('remembers the adaptation for later requests to the same model', async () => {
    fetchMock
      .mockResolvedValueOnce(apiError(MAX_TOKENS_ERROR))
      .mockResolvedValueOnce(jsonResponse(200, OK_BODY))
      .mockResolvedValueOnce(jsonResponse(200, OK_BODY));

    await new OpenAIProvider(ctx).chat({ messages: [{ role: 'user', content: 'a' }] });
    await new OpenAIProvider(ctx).chat({ messages: [{ role: 'user', content: 'b' }] });

    expect(fetchMock).toHaveBeenCalledTimes(3);
    expect(sentBodies()[2]).toHaveProperty('max_completion_tokens');
  });

  it('does not retry errors that are not about parameters', async () => {
    fetchMock.mockResolvedValueOnce(apiError('Invalid API key'));

    await expect(
      new OpenAIProvider(ctx).chat({ messages: [{ role: 'user', content: 'hi' }] })
    ).rejects.toThrow('HTTP 400: Invalid API key');
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('explains an empty answer cut off by the token limit', async () => {
    fetchMock.mockResolvedValueOnce(
      jsonResponse(200, {
        ...OK_BODY,
        choices: [
          { index: 0, message: { role: 'assistant', content: null }, finish_reason: 'length' },
        ],
      })
    );

    await expect(
      new OpenAIProvider(ctx).chat({ messages: [{ role: 'user', content: 'hi' }] })
    ).rejects.toThrow('token budget');
  });
});
