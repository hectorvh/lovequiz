import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

import { chromeButtonClass } from './ui';

/** Back to the very first screen, the one holding the Play button. */
export default function PowerButton() {
  const { t } = useTranslation();
  const navigate = useNavigate();

  return (
    <button
      type="button"
      onClick={() => navigate('/')}
      aria-label={t('common.power')}
      className={chromeButtonClass}
    >
      <svg
        aria-hidden
        viewBox="0 0 24 24"
        className="h-5 w-5"
        fill="none"
        stroke="currentColor"
        strokeWidth={1.6}
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M12 3.5v8" />
        <path d="M7.05 6.6a7 7 0 1 0 9.9 0" />
      </svg>
    </button>
  );
}
