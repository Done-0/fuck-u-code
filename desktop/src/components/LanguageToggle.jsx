import { useT } from '../i18n.js';

// Quick switch between the two main languages; Settings lists every language.
const OPTIONS = [
  { value: 'en', label: 'EN', title: 'English', matches: ['en'] },
  { value: 'zh', label: '中文', title: '简体中文', matches: ['zh', 'zh_TW'] },
];

export function LanguageToggle({ locale, onChange }) {
  const t = useT();
  return (
    <div className="lang-toggle" role="group" aria-label={t('settings_language')}>
      {OPTIONS.map((option) => {
        const isActive = option.matches.includes(locale);
        return (
          <button
            key={option.value}
            type="button"
            className={`lang-toggle-option${isActive ? ' is-active' : ''}`}
            aria-pressed={isActive}
            title={option.title}
            onClick={() => !isActive && onChange(option.value)}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
