/**
 * Persistent desktop settings, stored as JSON in the user data directory.
 * The AI API key is encrypted with the OS keychain (safeStorage) when available
 * and never sent to the renderer.
 */

import { app, safeStorage } from 'electron';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';

const LOCALES = ['zh', 'zh_TW', 'en', 'ru'];
const THEMES = ['system', 'light', 'dark'];
const MAX_RECENT = 12;

let cache = null;

function settingsPath() {
  return join(app.getPath('userData'), 'settings.json');
}

function systemLocale() {
  const locale = app.getLocale().toLowerCase();
  if (locale === 'zh-tw' || locale === 'zh-hk') return 'zh_TW';
  if (locale.startsWith('zh')) return 'zh';
  if (locale.startsWith('ru')) return 'ru';
  return 'en';
}

function clampConcurrency(value) {
  const n = Number(value);
  return Number.isInteger(n) ? Math.min(32, Math.max(1, n)) : 8;
}

function cleanStrings(list) {
  return Array.isArray(list) ? list.map((s) => String(s).trim()).filter(Boolean) : [];
}

async function load() {
  if (cache) return cache;

  let stored = {};
  try {
    stored = JSON.parse(await readFile(settingsPath(), 'utf8'));
  } catch {
    // First launch or unreadable file: start from defaults.
  }

  cache = {
    locale: LOCALES.includes(stored.locale) ? stored.locale : systemLocale(),
    theme: THEMES.includes(stored.theme) ? stored.theme : 'system',
    concurrency: clampConcurrency(stored.concurrency ?? 8),
    exclude: cleanStrings(stored.exclude),
    recentProjects: Array.isArray(stored.recentProjects) ? stored.recentProjects : [],
    ai: {
      provider: 'openai',
      model: '',
      baseUrl: '',
      apiKeyEnc: '',
      ...(stored.ai ?? {}),
    },
  };
  return cache;
}

async function save() {
  await mkdir(dirname(settingsPath()), { recursive: true });
  await writeFile(settingsPath(), JSON.stringify(cache, null, 2), 'utf8');
}

// The async safeStorage API replaces the deprecated sync one and reads keys the sync one wrote.
async function encrypt(text) {
  if (await safeStorage.isAsyncEncryptionAvailable()) {
    return `enc:${(await safeStorage.encryptStringAsync(text)).toString('base64')}`;
  }
  return `raw:${Buffer.from(text, 'utf8').toString('base64')}`;
}

async function decrypt(value) {
  try {
    if (value?.startsWith('enc:')) {
      const { result } = await safeStorage.decryptStringAsync(
        Buffer.from(value.slice(4), 'base64')
      );
      return result;
    }
    if (value?.startsWith('raw:')) {
      return Buffer.from(value.slice(4), 'base64').toString('utf8');
    }
  } catch {
    // Keychain changed or data corrupted: treat as no key.
  }
  return '';
}

/** Settings as the renderer sees them: the API key is reduced to a flag. */
export async function getPublicSettings() {
  const settings = await load();
  const { apiKeyEnc, ...ai } = settings.ai;
  return { ...settings, ai: { ...ai, hasApiKey: Boolean(apiKeyEnc) } };
}

export async function getLocale() {
  return (await load()).locale;
}

export async function getAISettings() {
  const { ai } = await load();
  return {
    provider: ai.provider,
    model: ai.model,
    baseUrl: ai.baseUrl,
    apiKey: await decrypt(ai.apiKeyEnc),
  };
}

export async function updateSettings(patch = {}) {
  const settings = await load();

  if (LOCALES.includes(patch.locale)) settings.locale = patch.locale;
  if (THEMES.includes(patch.theme)) settings.theme = patch.theme;
  if (patch.concurrency !== undefined) settings.concurrency = clampConcurrency(patch.concurrency);
  if (patch.exclude !== undefined) settings.exclude = cleanStrings(patch.exclude);

  if (patch.ai) {
    const { apiKey, clearApiKey, provider, model, baseUrl } = patch.ai;
    if (provider !== undefined) settings.ai.provider = String(provider).trim() || 'openai';
    if (model !== undefined) settings.ai.model = String(model).trim();
    if (baseUrl !== undefined) settings.ai.baseUrl = String(baseUrl).trim();
    if (clearApiKey) {
      settings.ai.apiKeyEnc = '';
    } else if (typeof apiKey === 'string' && apiKey.trim()) {
      settings.ai.apiKeyEnc = await encrypt(apiKey.trim());
    }
  }

  await save();
  return getPublicSettings();
}

export async function rememberProject(entry) {
  const settings = await load();
  settings.recentProjects = [
    entry,
    ...settings.recentProjects.filter((p) => p.path !== entry.path),
  ].slice(0, MAX_RECENT);
  await save();
  return settings.recentProjects;
}

export async function forgetProject(path) {
  const settings = await load();
  settings.recentProjects = settings.recentProjects.filter((p) => p.path !== path);
  await save();
  return settings.recentProjects;
}
