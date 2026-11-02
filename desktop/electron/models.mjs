/**
 * List the models a provider offers, using the same base-URL conventions as the
 * analyzer's providers in src/ai/providers.
 */

export const DEFAULT_BASE_URLS = {
  openai: 'https://api.openai.com/v1',
  anthropic: 'https://api.anthropic.com',
  deepseek: 'https://api.deepseek.com/v1',
  gemini: 'https://generativelanguage.googleapis.com',
  ollama: 'http://localhost:11434',
};

const TIMEOUT_MS = 15_000;

function endpointFor(provider, baseUrl, apiKey) {
  switch (provider) {
    case 'anthropic':
      return {
        url: `${baseUrl}/v1/models?limit=1000`,
        headers: { 'x-api-key': apiKey, 'anthropic-version': '2023-06-01' },
        pick: (body) => body.data?.map((m) => m.id),
      };
    case 'gemini':
      return {
        url: `${baseUrl}/v1beta/models?pageSize=1000`,
        headers: { 'x-goog-api-key': apiKey },
        pick: (body) =>
          body.models
            ?.filter((m) => m.supportedGenerationMethods?.includes('generateContent'))
            .map((m) => m.name.replace(/^models\//, '')),
      };
    case 'ollama':
      return {
        url: `${baseUrl}/api/tags`,
        headers: {},
        pick: (body) => body.models?.map((m) => m.name),
      };
    default:
      // OpenAI and every OpenAI-compatible service (DeepSeek, proxies, local servers).
      return {
        url: `${baseUrl}/models`,
        headers: apiKey ? { Authorization: `Bearer ${apiKey}` } : {},
        pick: (body) => body.data?.map((m) => m.id),
      };
  }
}

export async function listModels({ provider, baseUrl, apiKey }) {
  const root = (baseUrl || DEFAULT_BASE_URLS[provider] || DEFAULT_BASE_URLS.openai).replace(
    /\/+$/,
    ''
  );
  const { url, headers, pick } = endpointFor(provider, root, apiKey);

  let response;
  try {
    response = await fetch(url, { headers, signal: AbortSignal.timeout(TIMEOUT_MS) });
  } catch (error) {
    const reason = error.cause?.code || error.cause?.message || error.message;
    throw new Error(`${url}: ${reason}`);
  }
  if (!response.ok) {
    const text = await response.text().catch(() => '');
    let detail = text;
    try {
      const body = JSON.parse(text);
      detail = body.error?.message ?? body.message ?? text;
    } catch {
      // Not JSON: keep the raw text.
    }
    throw new Error(`HTTP ${response.status}: ${String(detail).slice(0, 300)}`);
  }

  const models = pick(await response.json());
  if (!Array.isArray(models)) throw new Error('Unexpected response from the model list endpoint');
  return [...new Set(models.filter(Boolean))].sort((a, b) => a.localeCompare(b));
}
