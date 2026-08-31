import { useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

import { selectGameComplete, useGameStore } from '../state/gameStore';
import { chromeButtonClass } from './ui';

export default function HomeButton() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const gameComplete = useGameStore(selectGameComplete);

  return (
    <button
      type="button"
      onClick={() => {
        if (pathname === '/model') navigate('/menu2');
        else if (pathname === '/menu2') navigate('/menu');
        else if (gameComplete) navigate('/menu2');
        else navigate('/menu');
      }}
      aria-label={pathname === '/menu2' ? t('intro.toMenu') : t('common.home')}
      className={chromeButtonClass}
    >
      <svg
        aria-hidden
        viewBox="0 0 24 24"
        className="h-6 w-6"
        fill="none"
        stroke="currentColor"
        strokeWidth={1.6}
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <rect x="4" y="4" width="7" height="7" rx="1.6" />
        <rect x="13" y="4" width="7" height="7" rx="1.6" />
        <rect x="4" y="13" width="7" height="7" rx="1.6" />
        <rect x="13" y="13" width="7" height="7" rx="1.6" />
      </svg>
    </button>
  );
}
