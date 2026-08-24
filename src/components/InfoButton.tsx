import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

import { chromeButtonClass } from './ui';

/** Opens the intro sequence from the menu. Same chrome as mute / power / settings. */
export default function InfoButton() {
  const { t } = useTranslation();
  const navigate = useNavigate();

  return (
    <button
      type="button"
      onClick={() => navigate('/intro')}
      aria-label={t('common.info')}
      className={chromeButtonClass}
    >
      <span
        aria-hidden
        className="font-display text-[1.35rem] leading-none font-semibold italic"
      >
        i
      </span>
    </button>
  );
}
