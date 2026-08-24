import type { ReactNode } from 'react';
import { useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

import PhotoCollageBackground from './PhotoCollageBackground';
import MuteToggle from './MuteToggle';
import HomeButton from './HomeButton';
import PowerButton from './PowerButton';
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

  return (
    <div className="relative flex h-dvh flex-col overflow-hidden">
      <PhotoCollageBackground />

      <header className="z-30 flex shrink-0 items-start justify-between p-3">
        <div className="flex items-start gap-2">
          <MuteToggle />
          {/* Menu already is home, so it offers a way out to the start screen instead. */}
          {pathname === '/menu' ? (
            <PowerButton />
          ) : pathname === '/' || pathname === '/intro' ? null : (
            <HomeButton />
          )}
        </div>
        <div className="flex items-start gap-2">
          {pathname === '/menu' ? <InfoButton /> : null}
          <SettingsButton />
          <LanguageSwitcher />
        </div>
      </header>

      <main
        className={`relative z-10 mx-auto flex min-h-0 w-full max-w-md flex-1 flex-col px-4 ${
          allowScroll ? 'overflow-y-auto pb-8' : 'overflow-hidden pb-8'
        }`}
      >
        {children}
      </main>

      {!isSupabaseEnabled ? (
        <p className="pointer-events-none absolute inset-x-0 bottom-1.5 z-10 text-center text-[11px] text-white/45">
          {t('common.localMode')}
        </p>
      ) : null}
    </div>
  );
}
