import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { LOCALE_LABELS } from '../i18n';
import { LOCALES, type Locale } from '../types';
import { useGameStore } from '../state/gameStore';

export default function LanguageSwitcher() {
  const { t } = useTranslation();
  const locale = useGameStore((s) => s.locale);
  const setLocale = useGameStore((s) => s.setLocale);
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (event: PointerEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener('pointerdown', onPointerDown);
    return () => document.removeEventListener('pointerdown', onPointerDown);
  }, [open]);

  const pick = (next: Locale) => {
    setLocale(next);
    setOpen(false);
  };

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label={t('common.language')}
        aria-expanded={open}
        className="grid h-11 w-11 place-items-center rounded-full border border-white/15 bg-black/35 text-lg opacity-60 backdrop-blur transition active:scale-95 hover:bg-black/50"
      >
        <span aria-hidden>{LOCALE_LABELS[locale].flag}</span>
      </button>

      {open ? (
        <ul className="animate-pop absolute right-0 mt-2 w-40 overflow-hidden rounded-2xl border border-white/10 bg-card shadow-xl">
          {LOCALES.map((code) => (
            <li key={code}>
              <button
                type="button"
                onClick={() => pick(code)}
                className={`flex w-full items-center gap-2.5 px-3.5 py-2.5 text-left text-sm transition hover:bg-card-line/50 ${
                  code === locale ? 'font-semibold text-wine' : 'text-ink-soft'
                }`}
              >
                <span aria-hidden>{LOCALE_LABELS[code].flag}</span>
                {LOCALE_LABELS[code].name}
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
