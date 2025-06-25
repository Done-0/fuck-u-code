#!/usr/bin/env node

/**
 * Postinstall script: generates global config file (~/.fuckucoderc.json) if it doesn't exist.
 * Cross-platform: Mac, Windows, Linux via os.homedir().
 */

import { existsSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { homedir } from 'node:os';

const CONFIG_FILE = '.fuckucoderc.json';
const configPath = join(homedir(), CONFIG_FILE);

if (!existsSync(configPath)) {
  const defaultConfig = {
    exclude: [],
    include: ['**/*'],
    concurrency: 8,
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

  try {
    writeFileSync(configPath, JSON.stringify(defaultConfig, null, 2) + '\n', 'utf-8');
    console.log(`[fuck-u-code] Global config created: ${configPath}`);
  } catch (error) {
    console.warn(`[fuck-u-code] Failed to create global config at ${configPath}: ${error.message}`);
    console.warn('[fuck-u-code] You can create it manually or run: fuck-u-code config init');
  }
}
