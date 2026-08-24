import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';

import PhotoCollageBackground from './PhotoCollageBackground';
import MuteToggle from './MuteToggle';
import LanguageSwitcher from './LanguageSwitcher';
import { isSupabaseEnabled } from '../lib/supabaseClient';

/**
 * Persistent shell: the collage, the mute toggle and the language switcher are
 * mounted once, outside the router, so they survive every screen transition.
 */
export default function Layout({ children }: { children: ReactNode }) {
  const { t } = useTranslation();

  return (
    <div className="relative flex min-h-dvh flex-col">
      <PhotoCollageBackground />

      <header className="sticky top-0 z-30 flex items-start justify-between p-4">
        <MuteToggle />
        <LanguageSwitcher />
      </header>

      <main className="relative z-10 mx-auto w-full max-w-md flex-1 px-4 pb-10">
        {children}
      </main>

      {!isSupabaseEnabled ? (
        <p className="relative z-10 pb-3 text-center text-[11px] text-white/45">
          {t('common.localMode')}
        </p>
      ) : null}
    </div>
  );
}
