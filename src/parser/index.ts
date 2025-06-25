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

/**
 * Create a parser for the specified language.
 * Attempts tree-sitter AST parsing first, falls back to regex-based parsing on failure.
 */
export function createParser(language: Language): Parser {
  const cached = parserCache.get(language);
  if (cached) return cached;

  const config = getLanguageConfig(language);
  if (config) {
    try {
      const parser = new TreeSitterParser(language, config);
      parserCache.set(language, parser);
      return parser;
    } catch (err) {
      logger.warn(`Tree-sitter init failed for ${language}, falling back to regex parser: ${err}`);
    }

    const fallback = new RegexParser(language);
    parserCache.set(language, fallback);
    return fallback;
  }

  const genericParser = new GenericParser();
  parserCache.set(language, genericParser);
  return genericParser;
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
