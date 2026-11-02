import { useEffect, useRef } from 'react';
import { Emoji } from './Emoji.jsx';
import { LanguageToggle } from './LanguageToggle.jsx';

function toHex(color) {
  const parts = color.match(/\d+(\.\d+)?/g);
  if (!parts || parts.length < 3) return null;
  return `#${parts
    .slice(0, 3)
    .map((n) => Math.round(Number(n)).toString(16).padStart(2, '0'))
    .join('')}`;
}

/**
 * Draggable title bar. The window has no native frame, so this strip carries
 * the drag region and keeps the OS window controls in the same colors.
 */
export function TitleBar({ title, theme, locale, onLocaleChange }) {
  const ref = useRef(null);
  const platform = window.fuc.platform;

  useEffect(() => {
    const sync = () =>
      requestAnimationFrame(() => {
        if (!ref.current) return;
        const style = getComputedStyle(ref.current);
        const color = toHex(style.backgroundColor);
        const symbolColor = toHex(style.color);
        if (color && symbolColor) window.fuc.setTitleBarColors({ color, symbolColor });
      });
    sync();
    const media = matchMedia('(prefers-color-scheme: dark)');
    media.addEventListener('change', sync);
    return () => media.removeEventListener('change', sync);
  }, [theme]);

  return (
    <header ref={ref} className={`titlebar titlebar-${platform}`}>
      <Emoji name="cherry-blossom" size={16} />
      <span className="titlebar-brand">fuck-u-code</span>
      {title && (
        <>
          <span className="titlebar-sep" aria-hidden="true">
            /
          </span>
          <span className="titlebar-title">{title}</span>
        </>
      )}
      <span className="titlebar-spacer" />
      <LanguageToggle locale={locale} onChange={onLocaleChange} />
    </header>
  );
}
