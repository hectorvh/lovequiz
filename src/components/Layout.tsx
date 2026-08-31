import type { ReactNode } from 'react';
import { useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

import PhotoCollageBackground from './PhotoCollageBackground';
import MuteToggle from './MuteToggle';
import HomeButton from './HomeButton';
import InfoButton from './InfoButton';
import SettingsButton from './SettingsButton';
import LanguageSwitcher from './LanguageSwitcher';
import { isSupabaseEnabled } from '../lib/supabaseClient';

/**
 * Persistent shell: the collage and the chrome buttons are mounted once,
 * outside the router, so they survive every screen transition.
 */
export default function Layout({ children }: { children: ReactNode }) {
  const { t } = useTranslation();
  const { pathname } = useLocation();
  const allowScroll = pathname.startsWith('/results');
  const isModel = pathname === '/model';
  const isMenu2 = pathname === '/menu2';
  const showInfo = pathname !== '/intro' && pathname !== '/' && !isModel;
  const showSettings = pathname === '/intro' || pathname === '/menu' || pathname === '/menu2';
  const showHome = !showSettings && pathname !== '/' && !isMenu2;

  return (
    <div className="relative flex h-dvh flex-col overflow-hidden">
      <PhotoCollageBackground />

      <header
        className={`z-30 flex items-start justify-between p-3 ${
          isModel ? 'pointer-events-none absolute inset-x-0 top-0' : 'shrink-0'
        }`}
      >
        <div className="pointer-events-auto flex items-start gap-2">
          {showSettings ? <SettingsButton /> : showHome ? <HomeButton /> : null}
          {showInfo ? <InfoButton /> : null}
        </div>
        {!isModel ? (
          <div className="pointer-events-auto flex items-start gap-2">
            <MuteToggle />
            <LanguageSwitcher />
          </div>
        ) : null}
      </header>

      <main
        className={`relative z-10 mx-auto flex min-h-0 w-full flex-1 flex-col ${
          isModel
            ? 'max-w-none overflow-hidden p-0'
            : allowScroll
              ? 'max-w-md overflow-y-auto px-4 pb-8'
              : 'max-w-md overflow-hidden px-4 pb-8'
        }`}
      >
        {children}
      </main>

      {!isSupabaseEnabled && !isModel ? (
        <p className="pointer-events-none absolute inset-x-0 bottom-1.5 z-10 text-center text-[11px] text-white/45">
          {t('common.localMode')}
        </p>
      ) : null}
    </div>
  );
}
