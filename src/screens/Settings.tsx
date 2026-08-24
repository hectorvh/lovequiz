import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

import Toast from '../components/Toast';
import { Card, GhostButton, PrimaryButton, ScreenTitle } from '../components/ui';
import { getPhotoUrl, listPhotos } from '../lib/db';
import { readLocalPhotos } from '../state/persistence';
import { useGameStore } from '../state/gameStore';
import type { StoredPhoto } from '../types';

export default function Settings() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();

  const clearAnswersLocally = useGameStore((s) => s.clearAnswersLocally);
  const resetPhotoGate = useGameStore((s) => s.resetPhotoGate);
  const resetAllProgress = useGameStore((s) => s.resetAllProgress);

  const [photos, setPhotos] = useState<StoredPhoto[]>([]);
  const [toast, setToast] = useState<string | null>(null);
  const [confirmingReset, setConfirmingReset] = useState(false);

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

  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden pt-1">
      <ScreenTitle title={t('settings.title')} />

      <Card className="flex min-h-0 flex-1 flex-col overflow-hidden !p-3.5">
        <div className="min-h-0 flex-1 space-y-3 overflow-hidden">
          <section>
            <h2 className="mb-0.5 text-sm font-semibold text-ink">{t('settings.deleteAnswers')}</h2>
            <p className="mb-2 text-[11.5px] leading-snug text-ink-soft">
              {t('settings.deleteAnswersDesc')}
            </p>
            <GhostButton
              className="!py-2.5"
              onClick={() => {
                clearAnswersLocally();
                setToast(t('settings.deleteAnswersDone'));
              }}
            >
              {t('settings.deleteAnswers')}
            </GhostButton>
          </section>

          <section className="min-h-0">
            <h2 className="mb-0.5 text-sm font-semibold text-ink">{t('settings.savePhotos')}</h2>
            <p className="mb-2 text-[11.5px] leading-snug text-ink-soft">
              {t('settings.savePhotosDesc')}
            </p>

            {photos.length === 0 ? (
              <p className="text-[12px] text-ink-soft">{t('settings.noPhotos')}</p>
            ) : (
              <ul className="max-h-24 space-y-1.5 overflow-hidden">
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
            <h2 className="mb-0.5 text-sm font-semibold text-ink">{t('settings.resetPhoto')}</h2>
            <p className="mb-2 text-[11.5px] leading-snug text-ink-soft">
              {t('settings.resetPhotoDesc')}
            </p>
            <GhostButton
              className="!py-2.5"
              onClick={() => {
                resetPhotoGate();
                setToast(t('settings.resetPhotoDone'));
              }}
            >
              {t('settings.resetPhoto')}
            </GhostButton>
          </section>

          <section>
            <h2 className="mb-0.5 text-sm font-semibold text-ink">{t('settings.resetAll')}</h2>
            <p className="mb-2 text-[11.5px] leading-snug text-ink-soft">
              {t('settings.resetAllDesc')}
            </p>

            {confirmingReset ? (
              <div className="space-y-2">
                <p className="text-[12px] font-semibold text-bad">{t('settings.confirmTitle')}</p>
                <PrimaryButton
                  className="!py-2.5"
                  onClick={() => {
                    resetAllProgress();
                    setConfirmingReset(false);
                    setToast(t('settings.resetAllDone'));
                  }}
                >
                  {t('settings.confirmReset')}
                </PrimaryButton>
                <GhostButton className="!py-2.5" onClick={() => setConfirmingReset(false)}>
                  {t('common.cancel')}
                </GhostButton>
              </div>
            ) : (
              <GhostButton className="!py-2.5" onClick={() => setConfirmingReset(true)}>
                {t('settings.resetAll')}
              </GhostButton>
            )}
          </section>
        </div>

        <GhostButton className="mt-3 shrink-0 !py-2.5" onClick={() => navigate('/menu')}>
          {t('common.back')}
        </GhostButton>
      </Card>

      <Toast message={toast} onDismiss={() => setToast(null)} />
    </div>
  );
}
