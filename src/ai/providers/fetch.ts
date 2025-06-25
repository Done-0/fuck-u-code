/**
 * Shared HTTP fetch with retry and exponential backoff
 */

import type { ProviderContext } from '../types.js';

/**
 * Fetch with retry, timeout, and exponential backoff
 * Reads error response body for detailed error messages
 */
export async function fetchWithRetry(
  ctx: Pick<ProviderContext, 'timeout' | 'maxRetries'>,
  url: string,
  options: RequestInit
): Promise<Response> {
  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= ctx.maxRetries; attempt++) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), ctx.timeout * 1000);

      const response = await fetch(url, {
        ...options,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (response.ok) {
        return response;
      }

      // Read error body for detailed error message
      let errorDetail = '';
      try {
        const body = await response.text();
        const parsed = JSON.parse(body) as { error?: { message?: string }; message?: string };
        errorDetail = parsed.error?.message || parsed.message || body.slice(0, 200);
      } catch {
        errorDetail = response.statusText;
      }

      lastError = new Error(`HTTP ${response.status}: ${errorDetail}`);

      // Don't retry on client errors (4xx) except 429 (rate limit)
      if (response.status >= 400 && response.status < 500 && response.status !== 429) {
        throw lastError;
      }
    } catch (error) {
      if (error instanceof Error && error.message.startsWith('HTTP 4')) {
        throw error;
      }
      lastError = error as Error;
    }

    if (attempt < ctx.maxRetries) {
      await new Promise((resolve) => setTimeout(resolve, (attempt + 1) * 1000));
    }
  }

  throw lastError ?? new Error('Request failed');
}
