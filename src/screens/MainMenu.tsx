import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

import Toast from '../components/Toast';
import { chromeButtonClass, introTypeClass } from '../components/ui';
import { groupStickerSrc } from '../data/groupStickers';
import {
  selectAllGroupsComplete,
  selectHectorQuizComplete,
  useGameStore,
} from '../state/gameStore';
import { FERNANDA_GROUPS, GROUP_LETTERS } from '../types';

const introLabelClass = `${introTypeClass} text-center text-3xl leading-tight text-[#faf1e8] drop-shadow-[0_3px_14px_rgba(0,0,0,0.7)]`;

const menuActionClass = `${introTypeClass} rounded-xl px-5 py-3 text-lg leading-snug whitespace-nowrap transition active:scale-[0.98]`;

function CameraGlyph() {
  return (
    <svg
      aria-hidden
      viewBox="0 0 24 24"
      className="h-[35px] w-[35px]"
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

export default function MainMenu() {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const completedGroups = useGameStore((s) => s.completedGroups);
  const groupStickers = useGameStore((s) => s.groupStickers);
  const ensureGroupStickers = useGameStore((s) => s.ensureGroupStickers);
  const reciprocalQuizSaved = useGameStore((s) => s.reciprocalQuizSaved);
  const photoTaken = useGameStore((s) => s.photoTaken);
  const allGroupsComplete = useGameStore(selectAllGroupsComplete);
  const hectorQuizComplete = useGameStore(selectHectorQuizComplete);

  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    ensureGroupStickers();
  }, [ensureGroupStickers, completedGroups]);

  const onCreateQuiz = () => {
    if (!allGroupsComplete) {
      setToast(t('menu.lockedCreate'));
      return;
    }
    navigate('/create-quiz');
  };

  const onPhoto = () => {
    if (!allGroupsComplete) {
      setToast(t('menu.lockedPhoto'));
      return;
    }
    navigate(photoTaken ? '/summary' : '/photo');
  };

  return (
    <div className="flex h-full min-h-0 flex-col items-center overflow-hidden px-2 text-center">
      <div className="flex min-h-0 flex-1 flex-col items-center justify-center">
        <p className={`${introLabelClass} mb-8`}>{t('menu.prompt')}</p>

        <div className="flex justify-center gap-4">
          {FERNANDA_GROUPS.map((groupId) => {
            const done = completedGroups.includes(groupId);
            const label = t('menu.group', { n: GROUP_LETTERS[groupId] });
            const stickerSrc = groupStickerSrc(groupStickers[groupId]);
            return (
              <button
                key={groupId}
                type="button"
                onClick={() => {
                  if (done) {
                    navigate(`/results/${groupId}`);
                    return;
                  }
                  navigate(`/play/${groupId}`);
                }}
                aria-label={done ? `${label} — ${t('menu.groupDone')}` : label}
                className={`grid h-20 w-20 place-items-center border-2 shadow-md transition active:scale-95 ${
                  done
                    ? 'overflow-hidden rounded-full border-[#355c38] bg-good text-white'
                    : 'rounded-2xl border-wine bg-wine text-[#fbe9ee] hover:bg-wine-deep'
                }`}
              >
                {done && stickerSrc ? (
                  <img
                    src={stickerSrc}
                    alt=""
                    className="pointer-events-none h-full w-full object-cover"
                  />
                ) : done ? null : (
                  <span className={`${introTypeClass} text-[1.95rem] leading-none`}>
                    {GROUP_LETTERS[groupId]}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {hectorQuizComplete ? (
          <button
            type="button"
            onClick={() => navigate('/summary')}
            className={`${menuActionClass} mt-6 bg-wine text-[#fbe9ee] hover:bg-wine-deep`}
          >
            {t('menu.summary')}
          </button>
        ) : reciprocalQuizSaved ? (
          <button
            type="button"
            onClick={() => navigate('/play/hector')}
            className={`${menuActionClass} mt-6 bg-wine text-[#fbe9ee] hover:bg-wine-deep`}
          >
            {t('menu.startHector')}
          </button>
        ) : (
          <button
            type="button"
            onClick={onCreateQuiz}
            aria-disabled={!allGroupsComplete}
            className={`${menuActionClass} mt-6 bg-wine text-[#fbe9ee] ${
              allGroupsComplete ? 'hover:bg-wine-deep' : 'opacity-45'
            }`}
          >
            {t('menu.createQuiz')}
          </button>
        )}
      </div>

      <button
        type="button"
        onClick={onPhoto}
        aria-label={t('menu.photo')}
        aria-disabled={!allGroupsComplete}
        className={`mb-2 ${chromeButtonClass} !h-[77px] !w-[77px] ${
          allGroupsComplete ? '' : 'opacity-45'
        }`}
      >
        <CameraGlyph />
      </button>

      <Toast message={toast} onDismiss={() => setToast(null)} />
    </div>
  );
}
