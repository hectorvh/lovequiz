import { useEffect, useState, type ReactNode } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

import CelebrationBurst from '../components/CelebrationBurst';
import Toast from '../components/Toast';
import { Card, PrimaryButton, chromeButtonClass, introTypeClass, unavailableButtonClass } from '../components/ui';
import { CREATE_QUIZ_STICKER, groupStickerSrc } from '../data/groupStickers';
import {
  computeTally,
  selectAllGroupsComplete,
  selectHectorQuizComplete,
  useGameStore,
} from '../state/gameStore';
import { FERNANDA_GROUPS, GROUP_LETTERS, PUNISHMENT_EMOJI } from '../types';

/** 40% larger than text-3xl, forced to two lines. */
const introLabelClass = `${introTypeClass} whitespace-pre-line text-center text-[2.625rem] leading-[1.05] text-[#faf1e8] drop-shadow-[0_3px_14px_rgba(0,0,0,0.7)]`;

/** Previous 140px tiles reduced 20%. */
const TILE_SIZE_CLASS = 'h-28 w-28';

function CameraGlyph() {
  return (
    <svg
      aria-hidden
      viewBox="3 6.5 18 13.5"
      className="block h-[35.7px] w-[47.6px]"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.6}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M4.5 8.5h3l1.2-2h6.6l1.2 2H19.5A1.5 1.5 0 0121 10v8.5a1.5 1.5 0 01-1.5 1.5h-15A1.5 1.5 0 013 18.5V10a1.5 1.5 0 011.5-1.5z" />
      <circle cx="12" cy="14.2" r="3.2" />
    </svg>
  );
}

/** Hearts sit on the top rim of a finished sticker circle. */
function TopHearts({ count }: { count: number }) {
  if (count <= 0) return null;

  const radius = 58;
  const step = 24;
  const start = -((count - 1) * step) / 2;

  return (
    <div className="pointer-events-none absolute inset-0 z-10">
      {Array.from({ length: count }, (_, i) => {
        const angleRad = ((start + i * step) * Math.PI) / 180;
        const x = Math.sin(angleRad) * radius;
        const y = -Math.cos(angleRad) * radius;
        return (
          <span
            key={i}
            className="absolute top-1/2 left-1/2 text-[1.575rem] leading-none drop-shadow-[0_1px_2px_rgba(0,0,0,0.55)]"
            style={{ transform: `translate(-50%, -50%) translate(${x}px, ${y}px)` }}
            aria-hidden
          >
            ❤️
          </span>
        );
      })}
    </div>
  );
}

function MenuTile({
  variant,
  faded,
  label,
  stickerSrc,
  hearts,
  onClick,
  children,
}: {
  variant: 'pending' | 'boxSticker' | 'circle';
  faded?: boolean;
  label: string;
  stickerSrc?: string;
  hearts?: number;
  onClick: () => void;
  children: ReactNode;
}) {
  const { t } = useTranslation();
  const isCircle = variant === 'circle';
  const showSticker =
    (variant === 'circle' || variant === 'boxSticker') && Boolean(stickerSrc);
  const heartCount = hearts ?? 0;

  return (
    <div className="relative">
      <button
        type="button"
        onClick={onClick}
        aria-label={
          faded
            ? t('menu.lockedCreate')
            : isCircle
              ? `${label} — ${t('play.hearts')}: ${heartCount}`
              : label
        }
        aria-disabled={faded}
        className={`grid ${TILE_SIZE_CLASS} place-items-center border-[3px] shadow-md transition active:scale-95 ${
          isCircle
            ? 'overflow-hidden rounded-full border-[#355c38] bg-good text-white'
            : 'overflow-hidden rounded-3xl border-wine bg-wine text-[#fbe9ee]'
        } ${faded ? unavailableButtonClass : isCircle ? '' : 'hover:bg-wine-deep'}`}
      >
        {showSticker ? (
          <img
            src={stickerSrc}
            alt=""
            className="pointer-events-none h-full w-full object-cover"
          />
        ) : (
          <span className={`${introTypeClass} text-[2.72rem] leading-none`}>{children}</span>
        )}
      </button>
      {isCircle ? <TopHearts count={heartCount} /> : null}
    </div>
  );
}

export default function MainMenu() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();

  const completedGroups = useGameStore((s) => s.completedGroups);
  const groupStickers = useGameStore((s) => s.groupStickers);
  const answers = useGameStore((s) => s.answers);
  const ensureGroupStickers = useGameStore((s) => s.ensureGroupStickers);
  const reciprocalQuizSaved = useGameStore((s) => s.reciprocalQuizSaved);
  const allGroupsComplete = useGameStore(selectAllGroupsComplete);
  const hectorQuizComplete = useGameStore(selectHectorQuizComplete);

  const [toast, setToast] = useState<string | null>(null);
  const menuNav = location.state as { celebrate?: boolean } | null;
  const [burst, setBurst] = useState(() => Boolean(menuNav?.celebrate));
  const [hintOpen, setHintOpen] = useState(false);

  useEffect(() => {
    if (!menuNav?.celebrate) return;
    navigate('/menu', { replace: true, state: {} });
  }, [menuNav?.celebrate, navigate]);

  useEffect(() => {
    ensureGroupStickers();
  }, [ensureGroupStickers, completedGroups]);

  const onCreateTile = () => {
    if (!allGroupsComplete) {
      setToast(t('menu.lockedCreate'));
      return;
    }
    if (hectorQuizComplete) {
      navigate('/results/hector');
      return;
    }
    if (reciprocalQuizSaved) {
      navigate('/play/hector');
      return;
    }
    navigate('/create-quiz');
  };

  const onPhoto = () => {
    if (!allGroupsComplete) {
      setToast(t('menu.lockedPhoto'));
      return;
    }
    navigate('/photo');
  };

  const onGift = () => {
    if (!allGroupsComplete) {
      setToast(t('menu.lockedGift'));
      return;
    }
    setHintOpen(true);
  };

  const onSummary = () => {
    if (!allGroupsComplete) {
      setToast(t('menu.lockedResults'));
      return;
    }
    navigate('/summary');
  };

  const createStickerSrc = groupStickerSrc(CREATE_QUIZ_STICKER);

  const createVariant: 'pending' | 'boxSticker' | 'circle' = hectorQuizComplete
    ? 'circle'
    : reciprocalQuizSaved
      ? 'boxSticker'
      : 'pending';

  const createLabel = hectorQuizComplete
    ? t('menu.hectorCycle')
    : reciprocalQuizSaved
      ? t('menu.startHector')
      : t('menu.createQuiz');

  return (
    <div className="flex h-full min-h-0 flex-col items-center overflow-hidden px-2 text-center">
      {burst ? <CelebrationBurst onDone={() => setBurst(false)} /> : null}
      <div className="flex min-h-0 w-full flex-1 flex-col items-center justify-center">
        <p className={`${introLabelClass} mb-11`}>{t('menu.prompt')}</p>
        <div className="grid grid-cols-2 gap-x-4 gap-y-8">
            {FERNANDA_GROUPS.map((groupId) => {
              const done = completedGroups.includes(groupId);
              const label = t('menu.group', { n: GROUP_LETTERS[groupId] });
              const stickerSrc = groupStickerSrc(groupStickers[groupId]);
              const hearts = computeTally(answers[groupId] ?? []).hearts;
              return (
                <MenuTile
                  key={groupId}
                  variant={done ? 'circle' : 'pending'}
                  label={done ? `${label} — ${t('menu.groupDone')}` : label}
                  stickerSrc={stickerSrc}
                  hearts={done ? hearts : undefined}
                  onClick={() => {
                    if (done) {
                      navigate(`/results/${groupId}`);
                      return;
                    }
                    navigate(`/play/${groupId}`);
                  }}
                >
                  {GROUP_LETTERS[groupId]}
                </MenuTile>
              );
            })}

            <MenuTile
              variant={createVariant}
              faded={!allGroupsComplete}
              label={createLabel}
              stickerSrc={createStickerSrc}
              hearts={
                createVariant === 'circle'
                  ? computeTally(answers.hector ?? []).hearts
                  : undefined
              }
              onClick={onCreateTile}
            >
              ?
            </MenuTile>
        </div>
      </div>

      <div className="mb-2 grid w-full grid-cols-3 items-center">
        <div className="flex justify-end pr-4">
          <button
            type="button"
            onClick={onSummary}
            aria-label={t('menu.summary')}
            aria-disabled={!allGroupsComplete}
            className={`${chromeButtonClass} !h-[69.3px] !w-[69.3px] !rounded-2xl ${
              allGroupsComplete ? '!opacity-100' : unavailableButtonClass
            }`}
          >
            <span className="text-[1.8rem] leading-none" aria-hidden>
              {PUNISHMENT_EMOJI.beso}
            </span>
          </button>
        </div>

        <div className="flex justify-center">
          <button
            type="button"
            onClick={onPhoto}
            aria-label={t('menu.photo')}
            aria-disabled={!allGroupsComplete}
            className={`${chromeButtonClass} !h-[83.16px] !w-[83.16px] overflow-hidden ${
              allGroupsComplete ? '' : unavailableButtonClass
            }`}
          >
            <CameraGlyph />
          </button>
        </div>

        <div className="flex justify-start pl-4">
          <button
            type="button"
            onClick={onGift}
            aria-label={t('menu.lego')}
            aria-disabled={!allGroupsComplete}
            className={`${chromeButtonClass} !h-[69.3px] !w-[69.3px] !rounded-2xl ${
              allGroupsComplete ? '!opacity-100' : unavailableButtonClass
            }`}
          >
            <span className="text-[1.8rem] leading-none" aria-hidden>
              🎁
            </span>
          </button>
        </div>
      </div>

      <Toast message={toast} onDismiss={() => setToast(null)} />

      {hintOpen ? (
        <div className="fixed inset-0 z-[90] grid place-items-center bg-black/65 p-5 backdrop-blur-sm">
          <div className="animate-pop w-full max-w-sm">
            <Card>
              <p className={`${introTypeClass} text-center text-2xl leading-snug text-wine`}>
                {t('celebrate.hint')}
              </p>
              <p className={`${introTypeClass} mt-3 text-center text-[2.75rem] leading-tight text-wine`}>
                {t('celebrate.love')}
              </p>
              <div className="mt-5">
                <PrimaryButton onClick={() => setHintOpen(false)}>
                  {t('common.continue')}
                </PrimaryButton>
              </div>
            </Card>
          </div>
        </div>
      ) : null}
    </div>
  );
}
