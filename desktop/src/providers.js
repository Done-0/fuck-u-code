/** AI providers the analyzer can talk to (see createProvider in src/ai/index.ts). */
export const PROVIDERS = [
  { value: 'openai', label: 'OpenAI / compatible' },
  { value: 'anthropic', label: 'Anthropic' },
  { value: 'deepseek', label: 'DeepSeek' },
  { value: 'gemini', label: 'Google Gemini' },
  { value: 'ollama', label: 'Ollama' },
];

export function providerLabel(value) {
  return PROVIDERS.find((provider) => provider.value === value)?.label ?? value;
}
