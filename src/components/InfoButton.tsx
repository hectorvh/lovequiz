import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

import { chromeButtonClass } from './ui';

/** Opens the intro sequence. Hidden on the intro screen itself. */
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
        className="font-display text-[1.62rem] leading-none font-semibold italic"
      >
        i
      </span>
    </button>
  );
}
