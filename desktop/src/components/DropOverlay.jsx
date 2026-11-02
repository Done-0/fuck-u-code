import { useT } from '../i18n.js';
import { Emoji } from './Emoji.jsx';

export function DropOverlay() {
  const t = useT();
  return (
    <div className="drop-overlay" aria-hidden="true">
      <div className="drop-overlay-inner">
        <Emoji name="open-folder" size={72} />
        <span>{t('home_drop_active')}</span>
      </div>
    </div>
  );
}
