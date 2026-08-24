import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

import PinModal from '../components/PinModal';
import Toast from '../components/Toast';
import { Card } from '../components/ui';
import {
  selectAllGroupsComplete,
  selectAnyGroupComplete,
  selectHectorQuizComplete,
  useGameStore,
} from '../state/gameStore';
import { FERNANDA_GROUPS } from '../types';

export default function MainMenu() {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const completedGroups = useGameStore((s) => s.completedGroups);
  const reciprocalQuizSaved = useGameStore((s) => s.reciprocalQuizSaved);
  const photoTaken = useGameStore((s) => s.photoTaken);
  const allGroupsComplete = useGameStore(selectAllGroupsComplete);
  const anyGroupComplete = useGameStore(selectAnyGroupComplete);
  const hectorQuizComplete = useGameStore(selectHectorQuizComplete);

  const [toast, setToast] = useState<string | null>(null);
  const [pinOpen, setPinOpen] = useState(false);

  const photoUnlocked = allGroupsComplete && hectorQuizComplete;

  const onCreateQuiz = () => {
    if (!allGroupsComplete) {
      setToast(t('menu.lockedCreate'));
      return;
    }
    navigate(reciprocalQuizSaved ? '/play/hector' : '/create-quiz');
  };

  const onResults = () => {
    if (!anyGroupComplete) {
      setToast(t('menu.lockedResults'));
      return;
    }
    navigate('/results');
  };

  return (
    <div className="pt-2">
      <Card>
        <p className="mb-6 text-center font-display text-lg leading-snug font-semibold text-ink">
          {t('menu.prompt')}
        </p>

        <div className="mb-7 flex justify-center gap-4">
          {FERNANDA_GROUPS.map((groupId) => {
            const done = completedGroups.includes(groupId);
            return (
              <button
                key={groupId}
                type="button"
                onClick={() => navigate(`/play/${groupId}`)}
                aria-label={t('menu.group', { n: groupId })}
                className={`grid h-20 w-20 place-items-center rounded-full border-2 font-display text-2xl font-semibold shadow-md transition active:scale-95 ${
                  done
                    ? 'border-gold bg-gold/15 text-gold-deep'
                    : 'border-wine bg-wine text-[#fbe9ee] hover:bg-wine-deep'
                }`}
              >
                <span>{groupId}</span>
                {done ? (
                  <span className="-mt-1 text-[9px] tracking-wide uppercase">
                    {t('menu.groupDone')}
                  </span>
                ) : null}
              </button>
            );
          })}
        </div>

        <div className="space-y-2.5">
          {/* aria-disabled rather than disabled: a tap still has to surface the reason. */}
          <button
            type="button"
            onClick={onCreateQuiz}
            aria-disabled={!allGroupsComplete}
            className={`w-full rounded-xl bg-wine px-4 py-3.5 text-[14.5px] leading-snug font-semibold text-[#fbe9ee] transition active:scale-[0.98] ${
              allGroupsComplete ? 'hover:bg-wine-deep' : 'opacity-45'
            }`}
          >
            {reciprocalQuizSaved ? t('menu.startHector') : t('menu.createQuiz')}
          </button>

          <button
            type="button"
            onClick={onResults}
            aria-disabled={!anyGroupComplete}
            className={`w-full rounded-xl border-[1.5px] border-wine px-4 py-3 text-sm font-semibold text-wine transition active:scale-[0.98] ${
              anyGroupComplete ? '' : 'opacity-45'
            }`}
          >
            {t('menu.results')}
          </button>
        </div>

        <div className="mt-6 flex items-center justify-center gap-3 border-t border-card-line pt-4">
          <button
            type="button"
            onClick={() => setPinOpen(true)}
            aria-label={t('menu.settings')}
            className="grid h-11 w-11 place-items-center rounded-full border border-card-line bg-white text-lg transition active:scale-95 hover:bg-card-line/40"
          >
            <span aria-hidden>⚙️</span>
          </button>

          {photoUnlocked ? (
            <button
              type="button"
              onClick={() => navigate(photoTaken ? '/summary' : '/photo')}
              aria-label={t('menu.photo')}
              className="animate-pop grid h-11 w-11 place-items-center rounded-full border border-gold bg-gold/20 text-lg transition active:scale-95 hover:bg-gold/35"
            >
              <span aria-hidden>📷</span>
            </button>
          ) : null}
        </div>
      </Card>

      {pinOpen ? (
        <PinModal onSuccess={() => navigate('/settings')} onClose={() => setPinOpen(false)} />
      ) : null}

      <Toast message={toast} onDismiss={() => setToast(null)} />
    </div>
  );
}
