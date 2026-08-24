import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

import Toast from '../components/Toast';
import { chromeButtonClass, introTypeClass } from '../components/ui';
import {
  selectAllGroupsComplete,
  selectAnyGroupComplete,
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
      className="h-5 w-5"
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
  const reciprocalQuizSaved = useGameStore((s) => s.reciprocalQuizSaved);
  const photoTaken = useGameStore((s) => s.photoTaken);
  const allGroupsComplete = useGameStore(selectAllGroupsComplete);
  const anyGroupComplete = useGameStore(selectAnyGroupComplete);

  const [toast, setToast] = useState<string | null>(null);

  const onCreateQuiz = () => {
    if (!allGroupsComplete) {
      setToast(t('menu.lockedCreate'));
      return;
    }
    navigate('/create-quiz');
  };

  const onResults = () => {
    if (!anyGroupComplete) {
      setToast(t('menu.lockedResults'));
      return;
    }
    navigate('/results');
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
            return (
              <button
                key={groupId}
                type="button"
                onClick={() => {
                  if (done) {
                    setToast(t('menu.groupLocked'));
                    return;
                  }
                  navigate(`/play/${groupId}`);
                }}
                aria-disabled={done}
                aria-label={done ? `${label} — ${t('menu.groupDone')}` : label}
                className={`grid h-20 w-20 place-items-center border-2 shadow-md transition active:scale-95 ${
                  done
                    ? 'rounded-full border-good bg-good text-[#eaf3e7]'
                    : 'rounded-2xl border-wine bg-wine text-[#fbe9ee] hover:bg-wine-deep'
                }`}
              >
                {done ? (
                  <svg
                    aria-hidden
                    viewBox="0 0 24 24"
                    className="h-8 w-8"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={2.4}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M5 12.5l4.5 4.5L19 7" />
                  </svg>
                ) : (
                  <span className={`${introTypeClass} text-[1.95rem] leading-none`}>
                    {GROUP_LETTERS[groupId]}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {reciprocalQuizSaved ? (
        <button
          type="button"
          onClick={() => navigate('/play/hector')}
          className={`${menuActionClass} mb-2.5 bg-wine text-[#fbe9ee] hover:bg-wine-deep`}
        >
          {t('menu.startHector')}
        </button>
      ) : null}

      <div className="relative mb-2 w-full">
        <div className="grid grid-cols-2 items-center gap-14">
          <button
            type="button"
            onClick={onResults}
            aria-disabled={!anyGroupComplete}
            className={`${menuActionClass} w-full border-[1.5px] border-[#fbe9ee]/70 bg-transparent text-[#fbe9ee] ${
              anyGroupComplete ? 'hover:bg-white/10' : 'opacity-45'
            }`}
          >
            {t('menu.results')}
          </button>

          <button
            type="button"
            onClick={onCreateQuiz}
            aria-disabled={!allGroupsComplete}
            className={`${menuActionClass} w-full bg-wine text-[#fbe9ee] ${
              allGroupsComplete ? 'hover:bg-wine-deep' : 'opacity-45'
            }`}
          >
            {t('menu.createQuiz')}
          </button>
        </div>

        <button
          type="button"
          onClick={onPhoto}
          aria-label={t('menu.photo')}
          aria-disabled={!allGroupsComplete}
          className={`absolute top-1/2 left-1/2 z-10 -translate-x-1/2 -translate-y-1/2 ${chromeButtonClass} ${
            allGroupsComplete ? '' : 'opacity-45'
          }`}
        >
          <CameraGlyph />
        </button>
      </div>

      <Toast message={toast} onDismiss={() => setToast(null)} />
    </div>
  );
}
