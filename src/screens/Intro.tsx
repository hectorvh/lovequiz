import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

import { chromeButtonClass, introTypeClass, unavailableButtonClass } from '../components/ui';
import { useGameStore } from '../state/gameStore';
import {
  PUNISHMENT_EMOJI,
  PUNISHMENT_ORDER,
  type PunishmentKey,
} from '../types';

const EMPHASIS_PATTERN = /(Fernanda|Hector|PREGUNTAS|QUESTIONS|FRAGEN)/g;
const EMPHASIS_TOKEN = /^(Fernanda|Hector|PREGUNTAS|QUESTIONS|FRAGEN)$/;

/** Names and the QUESTIONS word sit 50% larger than the surrounding intro type. */
function emphasizeIntroWords(text: string): ReactNode {
  return text.split(EMPHASIS_PATTERN).map((part, index) =>
    EMPHASIS_TOKEN.test(part) ? (
      <span key={index} className="inline-block text-[1.5em] leading-none">
        {part}
      </span>
    ) : (
      part
    ),
  );
}

interface TimedStep {
  kind: 'text';
  text: string;
  ms: number;
}

interface PunishmentStep {
  kind: 'punishments';
}

type Step = TimedStep | PunishmentStep;

const CASTIGO_FLIP_MS = 550;
const CASTIGO_AUTO_START_MS = 950;
const CASTIGO_AUTO_STAGGER_MS = 750;
const CASTIGO_HOLD_TEXT_MS = 1000;

function emptyFlipState(): Record<PunishmentKey, boolean> {
  return {
    beso: false,
    baile: false,
    masaje: false,
    secreto: false,
  };
}

function PunishmentFlipCard({
  punishmentKey,
  flipped,
  interactive,
  onToggle,
}: {
  punishmentKey: PunishmentKey;
  flipped: boolean;
  interactive: boolean;
  onToggle: () => void;
}) {
  const { t } = useTranslation();
  const label = t(`punishments.${punishmentKey}Full`);
  const spoken = label.replace(/\n/g, ' ');

  return (
    <button
      type="button"
      onClick={onToggle}
      disabled={!interactive}
      aria-label={spoken}
      aria-pressed={flipped}
      className="castigo-scene pointer-events-auto h-[8.1rem] w-full disabled:opacity-100"
    >
      <span className={`castigo-card ${flipped ? 'is-flipped' : ''}`}>
        <span className="castigo-face rounded-2xl border border-white/15 bg-black/40 backdrop-blur">
          <span className="text-5xl" aria-hidden>
            {PUNISHMENT_EMOJI[punishmentKey]}
          </span>
        </span>
        <span className="castigo-face castigo-face-back rounded-2xl border border-white/15 bg-black/40 px-2 text-center backdrop-blur">
          <span className="font-display whitespace-pre-line text-[clamp(1.7rem,6.3vw,2.6rem)] leading-[1.05] font-semibold text-[#faf1e8]">
            {label}
          </span>
        </span>
      </span>
    </button>
  );
}

/** Auto-flips icon → text once each, in order, then leaves the cards free to tap. */
function PunishmentBoard() {
  const [flipped, setFlipped] = useState(emptyFlipState);
  const [autoDone, setAutoDone] = useState(false);

  useEffect(() => {
    const timers: number[] = [];
    const lastIndex = PUNISHMENT_ORDER.length - 1;
    const lastFlipAt = CASTIGO_AUTO_START_MS + lastIndex * CASTIGO_AUTO_STAGGER_MS;
    const flipBackAt = lastFlipAt + CASTIGO_FLIP_MS + CASTIGO_HOLD_TEXT_MS;

    PUNISHMENT_ORDER.forEach((key, index) => {
      timers.push(
        window.setTimeout(() => {
          setFlipped((current) => ({ ...current, [key]: true }));
        }, CASTIGO_AUTO_START_MS + index * CASTIGO_AUTO_STAGGER_MS),
      );
    });

    timers.push(
      window.setTimeout(() => {
        setFlipped(emptyFlipState());
      }, flipBackAt),
    );

    timers.push(
      window.setTimeout(() => setAutoDone(true), flipBackAt + CASTIGO_FLIP_MS),
    );

    return () => {
      for (const timer of timers) window.clearTimeout(timer);
    };
  }, []);

  return (
    <ul className="animate-scroll-up grid w-full max-w-[21.6rem] grid-cols-2 gap-3">
      {PUNISHMENT_ORDER.map((key) => (
        <li key={key}>
          <PunishmentFlipCard
            punishmentKey={key}
            flipped={flipped[key]}
            interactive={autoDone}
            onToggle={() =>
              setFlipped((current) => ({ ...current, [key]: !current[key] }))
            }
          />
        </li>
      ))}
    </ul>
  );
}

function ChromeControl({
  label,
  disabled,
  onClick,
  boxClass,
  children,
}: {
  label: string;
  disabled?: boolean;
  onClick: () => void;
  boxClass: string;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      className={`${chromeButtonClass} ${boxClass} ${disabled ? unavailableButtonClass : ''}`}
    >
      <span aria-hidden className="grid place-items-center">
        {children}
      </span>
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
  const durationSeconds = useGameStore((s) => s.questionDurationSeconds);

  const steps: Step[] = useMemo(
    () => [
      { kind: 'text', text: t('intro.m1'), ms: 2000 },
      { kind: 'text', text: t('intro.m2'), ms: 2500 },
      { kind: 'text', text: t('intro.m3'), ms: 2000 },
      { kind: 'text', text: t('intro.m4'), ms: 2000 },
      {
        kind: 'text',
        text: t('instructions.m1', { seconds: durationSeconds }),
        ms: 2000,
      },
      { kind: 'text', text: t('instructions.m2'), ms: 2800 },
      { kind: 'text', text: t('instructions.m3'), ms: 3000 },
      { kind: 'punishments' },
    ],
    [t, i18n.language, durationSeconds],
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
            className={`animate-scroll-up ${introTypeClass} text-3xl leading-tight text-[#faf1e8] drop-shadow-[0_3px_14px_rgba(0,0,0,0.7)]`}
          >
            {emphasizeIntroWords(step.text)}
          </p>
        ) : (
          <>
            <PunishmentBoard />
            <div className="pointer-events-auto mt-6 flex justify-center">
              <button
                type="button"
                onClick={() => navigate('/menu')}
                className={`${introTypeClass} rounded-xl bg-wine px-9 py-4.5 text-[1.6875rem] leading-none text-[#fbe9ee] transition active:scale-[0.98] hover:bg-wine-deep`}
              >
                {t('common.continue')}
              </button>
            </div>
          </>
        )}
      </div>

      <div className="fixed bottom-14 left-0 right-0 z-30 grid grid-cols-3 items-center px-4">
        <div className="flex justify-end pr-4">
          <ChromeControl
            label={t('intro.previous')}
            disabled={index === 0}
            onClick={goBack}
            boxClass="!h-[69.3px] !w-[69.3px] !rounded-2xl"
          >
            <span className="text-[3.24rem] leading-none">‹</span>
          </ChromeControl>
        </div>

        <div className="flex justify-center">
          <ChromeControl
            label={paused ? t('intro.resume') : t('intro.pause')}
            disabled={isLast}
            onClick={() => setPaused((value) => !value)}
            boxClass="!h-[83.16px] !w-[83.16px]"
          >
            {paused ? (
              <svg viewBox="0 0 24 24" className="h-[53.55px] w-[53.55px]" fill="currentColor" aria-hidden>
                <path d="M8 5.14v13.72c0 .7.76 1.13 1.35.76l10.4-6.86a.9.9 0 000-1.52L9.35 4.38A.9.9 0 008 5.14z" />
              </svg>
            ) : (
              <svg viewBox="0 0 24 24" className="h-[53.55px] w-[53.55px]" fill="currentColor" aria-hidden>
                <rect x="6.5" y="5" width="3.5" height="14" rx="1" />
                <rect x="14" y="5" width="3.5" height="14" rx="1" />
              </svg>
            )}
          </ChromeControl>
        </div>

        <div className="flex justify-start pl-4">
          <ChromeControl
            label={t('intro.toMenu')}
            onClick={() => navigate('/menu')}
            boxClass="!h-[69.3px] !w-[69.3px] !rounded-2xl"
          >
            <svg
              viewBox="0 0 24 24"
              className="h-[32.4px] w-[32.4px]"
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
          </ChromeControl>
        </div>
      </div>
    </>
  );
}
