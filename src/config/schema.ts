/**
 * Configuration module type definitions
 */

import { z } from 'zod';
import type { AIConfig } from '../ai/types.js';

/** Configuration schema */
export const configSchema = z.object({
  exclude: z.array(z.string()).optional().default([]),
  include: z.array(z.string()).optional().default(['**/*']),
  concurrency: z.number().min(1).max(32).optional().default(2),
  verbose: z.boolean().optional().default(false),
  output: z
    .object({
      format: z.enum(['console', 'markdown', 'json', 'html']).optional().default('console'),
      file: z.string().optional(),
      top: z.number().min(1).optional().default(10),
      maxIssues: z.number().min(1).optional().default(5),
      showDetails: z.boolean().optional().default(true),
    })
    .optional()
    .default({}),
  metrics: z
    .object({
      weights: z
        .object({
          complexity: z.number().min(0).max(1).optional().default(0.32),
          duplication: z.number().min(0).max(1).optional().default(0.2),
          size: z.number().min(0).max(1).optional().default(0.18),
          structure: z.number().min(0).max(1).optional().default(0.12),
          error: z.number().min(0).max(1).optional().default(0.08),
          documentation: z.number().min(0).max(1).optional().default(0.05),
          naming: z.number().min(0).max(1).optional().default(0.05),
        })
        .optional()
        .default({}),
    })
    .optional()
    .default({}),
  ai: z
    .object({
      enabled: z.boolean().optional().default(false),
      provider: z.string().optional(),
      model: z.string().optional(),
      baseUrl: z.string().optional(),
      apiKey: z.string().optional(),
    })
    .optional()
    .default({}),
  i18n: z
    .object({
      locale: z.enum(['en', 'zh', 'ru']).optional().default('en'),
    })
    .optional()
    .default({}),
});

export type Config = z.infer<typeof configSchema>;

/** Full runtime configuration */
export interface RuntimeConfig extends Config {
  projectPath: string;
  aiConfig?: AIConfig;
}

/** Default configuration */
export const DEFAULT_CONFIG: Config = {
  exclude: [],
  include: ['**/*'],
  concurrency: 2,
  verbose: false,
  output: {
    format: 'console',
    top: 10,
    maxIssues: 5,
    showDetails: true,
  },
  metrics: {
    weights: {
      complexity: 0.32,
      duplication: 0.2,
      size: 0.18,
      structure: 0.12,
      error: 0.08,
      documentation: 0.05,
      naming: 0.05,
    },
  },
  ai: {
    enabled: false,
  },
  i18n: {
    locale: 'en',
  },
};
