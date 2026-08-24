import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

import { PrimaryButton } from '../components/ui';
import { QUESTION_DURATION_SECONDS } from '../config';
import { PUNISHMENT_EMOJI, PUNISHMENT_ORDER } from '../types';

interface TimedStep {
  kind: 'text';
  text: string;
  ms: number;
}

interface PunishmentStep {
  kind: 'punishments';
}

type Step = TimedStep | PunishmentStep;

function CircleButton({
  label,
  disabled,
  onClick,
  children,
}: {
  label: string;
  disabled?: boolean;
  onClick: () => void;
  children: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      className="grid h-11 w-11 place-items-center rounded-full border border-white/15 bg-black/35 text-2xl leading-none text-[#faf1e8] backdrop-blur transition active:scale-95 hover:bg-black/50 disabled:cursor-not-allowed disabled:opacity-35 disabled:active:scale-100"
    >
      <span aria-hidden>{children}</span>
    </button>
  );
}

/**
 * Combined intro + instructions. Pause and back only affect this sequence —
 * never the background music.
 */
export default function Intro() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();

  const steps: Step[] = useMemo(
    () => [
      { kind: 'text', text: t('intro.m1'), ms: 2000 },
      { kind: 'text', text: t('intro.m2'), ms: 2500 },
      { kind: 'text', text: t('intro.m3'), ms: 2000 },
      { kind: 'text', text: t('intro.m4'), ms: 2000 },
      {
        kind: 'text',
        text: t('instructions.m1', { seconds: QUESTION_DURATION_SECONDS }),
        ms: 2000,
      },
      { kind: 'text', text: t('instructions.m2'), ms: 2800 },
      { kind: 'text', text: t('instructions.m3'), ms: 3000 },
      { kind: 'punishments' },
    ],
    [t, i18n.language],
  );

  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);

  const step = steps[index];
  const isLast = step.kind === 'punishments';
  const remainingMs = useRef(0);

  useEffect(() => {
    const current = steps[index];
    remainingMs.current = current.kind === 'text' ? current.ms : 0;
  }, [index, steps]);

  useEffect(() => {
    const current = steps[index];
    if (paused || current.kind !== 'text') return;

    const startedAt = performance.now();
    const timer = window.setTimeout(() => {
      setIndex((currentIndex) => currentIndex + 1);
    }, remainingMs.current);

    return () => {
      window.clearTimeout(timer);
      remainingMs.current = Math.max(0, remainingMs.current - (performance.now() - startedAt));
    };
  }, [index, paused, steps]);

  const goBack = () => {
    if (index === 0) return;
    setIndex((current) => current - 1);
  };

  return (
    <>
      {/* Dead-centred on the viewport rather than inside the page flow. */}
      <div className="pointer-events-none fixed inset-0 z-10 flex flex-col items-center justify-center px-6 text-center">
        {step.kind === 'text' ? (
          <p
            key={index}
            className="animate-rise font-display text-3xl leading-tight font-semibold text-[#faf1e8] italic drop-shadow-[0_3px_14px_rgba(0,0,0,0.7)]"
          >
            {step.text}
          </p>
        ) : (
          <>
            <ul className="animate-rise grid w-full max-w-sm grid-cols-2 gap-3">
              {PUNISHMENT_ORDER.map((key) => (
                <li
                  key={key}
                  className="flex aspect-square flex-col items-center justify-center rounded-2xl border border-white/15 bg-black/40 px-3 text-center backdrop-blur"
                >
                  <span className="text-3xl" aria-hidden>
                    {PUNISHMENT_EMOJI[key]}
                  </span>
                  <span className="mt-2 text-[13px] leading-snug font-semibold text-[#faf1e8]">
                    {t(`punishments.${key}Full`)}
                  </span>
                </li>
              ))}
            </ul>
            <div className="pointer-events-auto mt-6 w-full max-w-sm">
              <PrimaryButton onClick={() => navigate('/menu')}>{t('common.continue')}</PrimaryButton>
            </div>
          </>
        )}
      </div>

      <div className="fixed bottom-14 left-1/2 z-30 flex -translate-x-1/2 gap-3">
        <CircleButton label={t('intro.previous')} disabled={index === 0} onClick={goBack}>
          ‹
        </CircleButton>
        <CircleButton
          label={paused ? t('intro.resume') : t('intro.pause')}
          disabled={isLast}
          onClick={() => setPaused((value) => !value)}
        >
          {paused ? '▶' : '⏸'}
        </CircleButton>
      </div>
    </>
  );
}
