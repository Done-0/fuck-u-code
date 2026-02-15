/**
 * Configuration loader
 */

import { cosmiconfig } from 'cosmiconfig';
import { homedir } from 'node:os';
import { configSchema, DEFAULT_CONFIG, type Config, type RuntimeConfig } from './schema.js';
import { t } from '../i18n/index.js';
import type { Locale } from '../i18n/index.js';
import { logger } from '../utils/logger.js';
import type { AIConfig } from '../ai/types.js';

const MODULE_NAME = 'fuckucode';

const CONFIG_SEARCH_PLACES = [
  'package.json',
  `.${MODULE_NAME}rc`,
  `.${MODULE_NAME}rc.json`,
  `.${MODULE_NAME}rc.yaml`,
  `.${MODULE_NAME}rc.yml`,
  `.${MODULE_NAME}rc.js`,
  `.${MODULE_NAME}rc.cjs`,
  `${MODULE_NAME}.config.js`,
  `${MODULE_NAME}.config.cjs`,
  `${MODULE_NAME}.config.mjs`,
];

/**
 * Load configuration file
 * Search order: project path upward -> global ~/.fuckucoderc.json
 */
export async function loadConfig(projectPath: string): Promise<Config> {
  const explorer = cosmiconfig(MODULE_NAME, { searchPlaces: CONFIG_SEARCH_PLACES });

  try {
    // Search from project path upward
    const result = await explorer.search(projectPath);
    if (result?.config) {
      const parsed = configSchema.safeParse(result.config);
      if (parsed.success) {
        return mergeConfig(DEFAULT_CONFIG, parsed.data);
      }
      logger.warn(t('warn_config_validation_failed', { error: parsed.error.message }));
    }

    // Fall back to global config in home directory
    const globalResult = await explorer.search(homedir());
    if (globalResult?.config) {
      const parsed = configSchema.safeParse(globalResult.config);
      if (parsed.success) {
        return mergeConfig(DEFAULT_CONFIG, parsed.data);
      }
    }
  } catch (error) {
    logger.warn(t('warn_config_load_failed', { error: String(error) }));
  }

  return DEFAULT_CONFIG;
}

/**
 * Load locale from configuration file (lightweight, for CLI pre-parsing)
 * Search order: cwd upward -> global ~/.fuckucoderc.json
 */
export async function loadLocaleFromConfig(): Promise<Locale | undefined> {
  const explorer = cosmiconfig(MODULE_NAME, { searchPlaces: CONFIG_SEARCH_PLACES });
  try {
    const result = await explorer.search();
    const configObj = result?.config as Record<string, unknown> | undefined;
    let locale = (configObj?.i18n as Record<string, unknown> | undefined)?.locale as
      | string
      | undefined;

    // Fall back to global config
    if (!locale) {
      const globalResult = await explorer.search(homedir());
      const globalConfig = globalResult?.config as Record<string, unknown> | undefined;
      locale = (globalConfig?.i18n as Record<string, unknown> | undefined)?.locale as
        | string
        | undefined;
    }

    if (locale && ['en', 'zh', 'ru'].includes(locale)) {
      return locale as Locale;
    }
  } catch (error) {
    logger.warn(t('warn_config_load_failed', { error: String(error) }));
  }
  return undefined;
}

/**
 * Load AI configuration
 * Priority: CLI flag > environment variable > config file
 */
export function loadAIConfig(configAI?: Config['ai'], cliModel?: string): AIConfig {
  const providers: AIConfig['providers'] = {};
  const configApiKey = configAI?.apiKey;
  const configBaseUrl = configAI?.baseUrl;
  const configProvider = configAI?.provider;

  // OpenAI-compatible - model specified by user via OPENAI_MODEL or CLI --model
  const openaiKey =
    process.env.OPENAI_API_KEY ||
    (!configProvider || configProvider === 'openai' ? configApiKey : undefined);
  if (openaiKey) {
    const model =
      cliModel ||
      process.env.OPENAI_MODEL ||
      (configProvider === 'openai' ? configAI?.model : undefined);
    if (!model) {
      logger.warn(t('warn_no_model_specified', { provider: 'OPENAI' }));
    }
    providers.openai = {
      enabled: true,
      instances: [
        {
          name: 'default',
          enabled: true,
          baseUrl:
            process.env.OPENAI_BASE_URL ||
            (configProvider === 'openai' ? configBaseUrl : undefined) ||
            'https://api.openai.com/v1',
          apiKey: openaiKey,
          models: model ? [model] : [],
          maxTokens: parseInt(process.env.OPENAI_MAX_TOKENS || '4096', 10),
          temperature: parseFloat(process.env.OPENAI_TEMPERATURE || '0.7'),
          topP: 1,
          timeout: parseInt(process.env.OPENAI_TIMEOUT || '60', 10),
          maxRetries: 3,
        },
      ],
    };
  }

  // Anthropic - model specified by user via ANTHROPIC_MODEL or CLI --model
  const anthropicKey =
    process.env.ANTHROPIC_API_KEY || (configProvider === 'anthropic' ? configApiKey : undefined);
  if (anthropicKey) {
    const model =
      cliModel ||
      process.env.ANTHROPIC_MODEL ||
      (configProvider === 'anthropic' ? configAI?.model : undefined);
    if (!model) {
      logger.warn(t('warn_no_model_specified', { provider: 'ANTHROPIC' }));
    }
    providers.anthropic = {
      enabled: true,
      instances: [
        {
          name: 'default',
          enabled: true,
          baseUrl:
            process.env.ANTHROPIC_BASE_URL ||
            (configProvider === 'anthropic' ? configBaseUrl : undefined) ||
            'https://api.anthropic.com',
          apiKey: anthropicKey,
          models: model ? [model] : [],
          maxTokens: parseInt(process.env.ANTHROPIC_MAX_TOKENS || '4096', 10),
          temperature: parseFloat(process.env.ANTHROPIC_TEMPERATURE || '0.7'),
          topP: 1,
          timeout: parseInt(process.env.ANTHROPIC_TIMEOUT || '60', 10),
          maxRetries: 3,
        },
      ],
    };
  }

  // DeepSeek - model specified by user via DEEPSEEK_MODEL or CLI --model
  const deepseekKey =
    process.env.DEEPSEEK_API_KEY || (configProvider === 'deepseek' ? configApiKey : undefined);
  if (deepseekKey) {
    const model =
      cliModel ||
      process.env.DEEPSEEK_MODEL ||
      (configProvider === 'deepseek' ? configAI?.model : undefined);
    if (!model) {
      logger.warn(t('warn_no_model_specified', { provider: 'DEEPSEEK' }));
    }
    providers.deepseek = {
      enabled: true,
      instances: [
        {
          name: 'default',
          enabled: true,
          baseUrl:
            process.env.DEEPSEEK_BASE_URL ||
            (configProvider === 'deepseek' ? configBaseUrl : undefined) ||
            'https://api.deepseek.com/v1',
          apiKey: deepseekKey,
          models: model ? [model] : [],
          maxTokens: parseInt(process.env.DEEPSEEK_MAX_TOKENS || '4096', 10),
          temperature: parseFloat(process.env.DEEPSEEK_TEMPERATURE || '0.7'),
          topP: 1,
          timeout: parseInt(process.env.DEEPSEEK_TIMEOUT || '60', 10),
          maxRetries: 3,
        },
      ],
    };
  }

  // Ollama (local) - model specified by user via OLLAMA_MODEL or CLI --model
  const ollamaModel =
    cliModel ||
    process.env.OLLAMA_MODEL ||
    (configProvider === 'ollama' ? configAI?.model : undefined);

  if (ollamaModel) {
    const defaultOllamaHost = 'http://localhost:11434';
    const ollamaHost =
      process.env.OLLAMA_HOST ||
      (configProvider === 'ollama' ? configBaseUrl : undefined) ||
      defaultOllamaHost;

    providers.ollama = {
      enabled: true,
      instances: [
        {
          name: 'local',
          enabled: true,
          baseUrl: ollamaHost,
          apiKey: '',
          models: [ollamaModel],
          maxTokens: parseInt(process.env.OLLAMA_MAX_TOKENS || '4096', 10),
          temperature: parseFloat(process.env.OLLAMA_TEMPERATURE || '0.7'),
          topP: 1,
          timeout: parseInt(process.env.OLLAMA_TIMEOUT || '120', 10),
          maxRetries: 2,
        },
      ],
    };
  }

  // Gemini - model specified by user via GEMINI_MODEL or CLI --model
  const geminiKey =
    process.env.GEMINI_API_KEY || (configProvider === 'gemini' ? configApiKey : undefined);
  if (geminiKey) {
    const model =
      cliModel ||
      process.env.GEMINI_MODEL ||
      (configProvider === 'gemini' ? configAI?.model : undefined);
    if (!model) {
      logger.warn(t('warn_no_model_specified', { provider: 'GEMINI' }));
    }
    providers.gemini = {
      enabled: true,
      instances: [
        {
          name: 'default',
          enabled: true,
          baseUrl:
            process.env.GEMINI_BASE_URL ||
            (configProvider === 'gemini' ? configBaseUrl : undefined) ||
            'https://generativelanguage.googleapis.com',
          apiKey: geminiKey,
          models: model ? [model] : [],
          maxTokens: parseInt(process.env.GEMINI_MAX_TOKENS || '4096', 10),
          temperature: parseFloat(process.env.GEMINI_TEMPERATURE || '0.7'),
          topP: 1,
          topK: 40,
          timeout: parseInt(process.env.GEMINI_TIMEOUT || '60', 10),
          maxRetries: 3,
        },
      ],
    };
  }

  return {
    providers,
    defaultProvider: Object.keys(providers)[0],
  };
}

/**
 * Create runtime configuration
 */
export function createRuntimeConfig(
  projectPath: string,
  config: Config,
  cliOptions: Partial<Config> = {}
): RuntimeConfig {
  const merged = mergeConfig(config, cliOptions);
  const aiConfig = merged.ai.enabled ? loadAIConfig(merged.ai, merged.ai.model) : undefined;

  return {
    ...merged,
    projectPath,
    aiConfig,
  };
}

/**
 * Merge configurations
 */
function mergeConfig(base: Config, override: Partial<Config>): Config {
  return {
    ...base,
    ...override,
    exclude: override.exclude ?? base.exclude,
    include: override.include ?? base.include,
    output: { ...base.output, ...override.output },
    metrics: {
      ...base.metrics,
      ...override.metrics,
      weights: { ...base.metrics.weights, ...override.metrics?.weights },
    },
    ai: { ...base.ai, ...override.ai },
    i18n: { ...base.i18n, ...override.i18n },
  };
}

export { DEFAULT_CONFIG, configSchema, type Config, type RuntimeConfig };
