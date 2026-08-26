import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

import Toast from '../components/Toast';
import { Card, GhostButton, PrimaryButton, ScreenTitle, introTypeClass } from '../components/ui';
import {
  MAX_QUESTION_DURATION_SECONDS,
  MIN_QUESTION_DURATION_SECONDS,
} from '../config';
import { getPhotoUrl, listPhotos } from '../lib/db';
import { readLocalPhotos } from '../state/persistence';
import { useGameStore } from '../state/gameStore';
import type { StoredPhoto } from '../types';

export default function Settings() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();

  const resetAllProgress = useGameStore((s) => s.resetAllProgress);
  const questionDurationSeconds = useGameStore((s) => s.questionDurationSeconds);
  const setQuestionDurationSeconds = useGameStore((s) => s.setQuestionDurationSeconds);

  const [photos, setPhotos] = useState<StoredPhoto[]>([]);
  const [toast, setToast] = useState<string | null>(null);
  const [confirmingReset, setConfirmingReset] = useState(false);
  const [timerDraft, setTimerDraft] = useState(String(questionDurationSeconds));

  useEffect(() => {
    setTimerDraft(String(questionDurationSeconds));
  }, [questionDurationSeconds]);

  useEffect(() => {
    if (questionDurationSeconds > MAX_QUESTION_DURATION_SECONDS) {
      setQuestionDurationSeconds(MAX_QUESTION_DURATION_SECONDS);
    }
  }, [questionDurationSeconds, setQuestionDurationSeconds]);

  const commitTimer = (raw: string) => {
    const parsed = Number.parseInt(raw, 10);
    if (Number.isNaN(parsed)) {
      setTimerDraft(String(questionDurationSeconds));
      return;
    }
    setQuestionDurationSeconds(parsed);
  };

  const leaveSettings = () => {
    commitTimer(timerDraft);
    const from = (location.state as { from?: string } | null)?.from;
    if (from && from !== '/settings') {
      navigate(from);
      return;
    }
    navigate('/menu');
  };

  useEffect(() => {
    const load = async () => {
      const remote = await listPhotos();
      setPhotos([...(remote.data ?? []), ...readLocalPhotos()]);
    };
    void load();
  }, []);

  const downloadPhoto = async (photo: StoredPhoto) => {
    const href = photo.localDataUrl ?? (await getPhotoUrl(photo.storagePath));
    if (!href) return;
    const link = document.createElement('a');
    link.href = href;
    link.download = `fer-quiz-${photo.id}.jpg`;
    link.target = '_blank';
    link.click();
  };

  const pinButtonClass = '!w-full !px-3 !py-2 !text-sm';

  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden pt-1">
      <ScreenTitle title={t('settings.title')} />

      <Card className="flex flex-col !p-3.5">
        <div className="space-y-3">
          <section>
            <h2 className="mb-0.5 text-sm font-semibold text-ink">{t('settings.timer')}</h2>
            <p className="mb-2 text-[11.5px] leading-snug text-ink-soft">
              {t('settings.timerDesc')}
            </p>
            <div className="flex items-center gap-2">
              <button
                type="button"
                aria-label={t('settings.timerMinus')}
                disabled={questionDurationSeconds <= MIN_QUESTION_DURATION_SECONDS}
                onClick={() => setQuestionDurationSeconds(questionDurationSeconds - 1)}
                className="grid h-10 w-10 shrink-0 place-items-center rounded-xl border-[1.5px] border-wine text-lg font-semibold text-wine transition active:scale-95 disabled:opacity-45"
              >
                −
              </button>
              <input
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                value={timerDraft}
                onChange={(event) => setTimerDraft(event.target.value.replace(/\D/g, ''))}
                onBlur={() => commitTimer(timerDraft)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter') {
                    event.currentTarget.blur();
                  }
                }}
                className="w-full rounded-xl border-[1.5px] border-card-line bg-white py-2 text-center font-display text-xl text-ink outline-none focus:border-wine"
              />
              <button
                type="button"
                aria-label={t('settings.timerPlus')}
                disabled={questionDurationSeconds >= MAX_QUESTION_DURATION_SECONDS}
                onClick={() => setQuestionDurationSeconds(questionDurationSeconds + 1)}
                className="grid h-10 w-10 shrink-0 place-items-center rounded-xl border-[1.5px] border-wine text-lg font-semibold text-wine transition active:scale-95 disabled:opacity-45"
              >
                +
              </button>
            </div>
          </section>

          <section>
            <h2 className="mb-0.5 text-sm font-semibold text-ink">{t('settings.savePhotos')}</h2>
            <p className="mb-2 text-[11.5px] leading-snug text-ink-soft">
              {t('settings.savePhotosDesc')}
            </p>

            {photos.length === 0 ? (
              <p className="text-[12px] text-ink-soft">{t('settings.noPhotos')}</p>
            ) : (
              <ul className={`space-y-1.5 ${photos.length > 3 ? 'max-h-36 overflow-y-auto' : ''}`}>
                {photos.map((photo) => (
                  <li
                    key={photo.id}
                    className="flex items-center gap-2 rounded-xl border border-card-line bg-white p-1.5"
                  >
                    {photo.localDataUrl ? (
                      <img
                        src={photo.localDataUrl}
                        alt=""
                        className="h-8 w-8 rounded-lg object-cover"
                      />
                    ) : (
                      <span className="grid h-8 w-8 place-items-center rounded-lg bg-card-line text-sm">
                        🖼️
                      </span>
                    )}
                    <span className="flex-1 truncate text-[11px] text-ink-soft">
                      {new Date(photo.createdAt).toLocaleString(i18n.language)}
                    </span>
                    <button
                      type="button"
                      onClick={() => void downloadPhoto(photo)}
                      className="rounded-lg border border-wine px-2 py-1 text-[11px] font-semibold text-wine"
                    >
                      {t('settings.download')}
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section>
            <GhostButton className="!py-2.5" onClick={() => navigate('/')}>
              {t('settings.restartGame')}
            </GhostButton>
          </section>

          <section>
            <GhostButton className="!py-2.5" onClick={() => setConfirmingReset(true)}>
              {t('settings.resetAll')}
            </GhostButton>
          </section>
        </div>

        <GhostButton className="mt-3 shrink-0 !py-2.5" onClick={leaveSettings}>
          {t('common.save')}
        </GhostButton>
      </Card>

      {confirmingReset ? (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/65 p-5 backdrop-blur-sm">
          <div className="animate-pop w-full max-w-xs">
            <Card>
              <h2 className={`${introTypeClass} mb-4 text-center text-xl text-ink`}>
                {t('settings.confirmErase')}
              </h2>
              <div className="grid grid-cols-2 gap-2">
                <GhostButton className={pinButtonClass} onClick={() => setConfirmingReset(false)}>
                  {t('common.cancel')}
                </GhostButton>
                <PrimaryButton
                  className={pinButtonClass}
                  onClick={() => {
                    resetAllProgress();
                    setConfirmingReset(false);
                    setToast(t('settings.resetAllDone'));
                  }}
                >
                  {t('settings.confirmReset')}
                </PrimaryButton>
              </div>
            </Card>
          </div>
        </div>
      ) : null}

      <Toast message={toast} onDismiss={() => setToast(null)} />
    </div>
  );
}
