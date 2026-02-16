/**
 * Parser factory
 */

import { TreeSitterParser, getLanguageConfig } from './tree-sitter-parser.js';
import { RegexParser } from './regex-parser.js';
import { GenericParser } from './generic-parser.js';
import { logger } from '../utils/logger.js';
import { LANGUAGE_DISPLAY_NAMES, type Parser, type Language } from './types.js';

/** Cache for created parsers */
const parserCache = new Map<Language, Parser>();

/** Initialization promise cache to prevent concurrent WASM loading */
const initPromises = new Map<Language, Promise<Parser>>();

export function createParser(language: Language): Promise<Parser> {
  const cached = parserCache.get(language);
  if (cached) {
    return Promise.resolve(cached);
  }

  const existingInit = initPromises.get(language);
  if (existingInit) {
    return existingInit;
  }

  const initPromise = (async (): Promise<Parser> => {
    const config = getLanguageConfig(language);
    if (config) {
      try {
        const parser = new TreeSitterParser(language, config);
        await parser.initialize();
        parserCache.set(language, parser);
        return parser;
      } catch (err: unknown) {
        logger.warn(
          `Tree-sitter init failed for ${language}, falling back to regex parser: ${err}`
        );
      }

      const fallback = new RegexParser(language);
      parserCache.set(language, fallback);
      return fallback;
    }

    const genericParser = new GenericParser();
    parserCache.set(language, genericParser);
    return genericParser;
  })();

  initPromises.set(language, initPromise);

  return initPromise
    .then((parser) => {
      initPromises.delete(language);
      return parser;
    })
    .catch((err: unknown) => {
      initPromises.delete(language);
      throw err;
    });
}

/**
 * Get all supported languages
 */
export function getSupportedLanguages(): Language[] {
  return Object.keys(LANGUAGE_DISPLAY_NAMES).filter((k) => k !== 'unknown') as Language[];
}

/**
 * Get display names of all supported languages as a comma-separated string
 */
export function getSupportedLanguageNames(): string {
  return getSupportedLanguages()
    .map((lang) => LANGUAGE_DISPLAY_NAMES[lang as Exclude<Language, 'unknown'>])
    .join(', ');
}

export { LANGUAGE_DISPLAY_NAMES, type Parser, type ParseResult, type Language } from './types.js';
