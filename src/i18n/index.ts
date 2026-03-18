/**
 * Internationalization module
 */

import en from './locales/en.json' with { type: 'json' };
import zh from './locales/zh.json' with { type: 'json' };
import ru from './locales/ru.json' with { type: 'json' };
import zhTW from './locales/zh_TW.json' with { type: 'json' };

export type Locale = 'en' | 'zh' | 'ru' | 'zh_TW';

type TranslationKey = keyof typeof en;
type Translations = Record<TranslationKey, string>;

function assertTranslations<T extends Translations>(translations: T): T {
  return translations;
}

const translations: Record<Locale, Translations> = {
  en: assertTranslations(en),
  zh: assertTranslations(zh),
  ru: assertTranslations(ru),
  zh_TW: assertTranslations(zhTW),
};

let currentLocale: Locale = 'en';

/**
 * Set the current locale
 */
export function setLocale(locale: Locale): void {
  currentLocale = locale;
}

/**
 * Get the current locale
 */
export function getLocale(): Locale {
  return currentLocale;
}

/**
 * Translation function
 * @param key - Translation key
 * @param params - Replacement parameters
 */
export function t(key: string, params?: Record<string, string | number>): string {
  const translation = translations[currentLocale][key as TranslationKey];
  if (!translation) {
    return key;
  }

  if (!params) {
    return translation;
  }

  return translation.replace(/\{(\w+)\}/g, (_, paramKey: string) => {
    const value = params[paramKey];
    return value !== undefined ? String(value) : `{${paramKey}}`;
  });
}
