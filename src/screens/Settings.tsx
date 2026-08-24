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
    <div className="pt-2">
      <ScreenTitle title={t('settings.title')} />

      <div className="space-y-3">
        <Card className="!p-4">
          <h2 className="mb-1 text-sm font-semibold text-ink">{t('settings.deleteAnswers')}</h2>
          <p className="mb-3 text-[12px] leading-snug text-ink-soft">
            {t('settings.deleteAnswersDesc')}
          </p>
          <GhostButton
            onClick={() => {
              clearAnswersLocally();
              setToast(t('settings.deleteAnswersDone'));
            }}
          >
            {t('settings.deleteAnswers')}
          </GhostButton>
        </Card>

        <Card className="!p-4">
          <h2 className="mb-1 text-sm font-semibold text-ink">{t('settings.savePhotos')}</h2>
          <p className="mb-3 text-[12px] leading-snug text-ink-soft">
            {t('settings.savePhotosDesc')}
          </p>

          {photos.length === 0 ? (
            <p className="text-[12.5px] text-ink-soft">{t('settings.noPhotos')}</p>
          ) : (
            <ul className="space-y-2">
              {photos.map((photo) => (
                <li
                  key={photo.id}
                  className="flex items-center gap-3 rounded-xl border border-card-line bg-white p-2"
                >
                  {photo.localDataUrl ? (
                    <img
                      src={photo.localDataUrl}
                      alt=""
                      className="h-11 w-11 rounded-lg object-cover"
                    />
                  ) : (
                    <span className="grid h-11 w-11 place-items-center rounded-lg bg-card-line text-lg">
                      🖼️
                    </span>
                  )}
                  <span className="flex-1 text-[11.5px] text-ink-soft">
                    {new Date(photo.createdAt).toLocaleString(i18n.language)}
                  </span>
                  <button
                    type="button"
                    onClick={() => void downloadPhoto(photo)}
                    className="rounded-lg border border-wine px-2.5 py-1.5 text-[11.5px] font-semibold text-wine"
                  >
                    {t('settings.download')}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card className="!p-4">
          <h2 className="mb-1 text-sm font-semibold text-ink">{t('settings.resetPhoto')}</h2>
          <p className="mb-3 text-[12px] leading-snug text-ink-soft">
            {t('settings.resetPhotoDesc')}
          </p>
          <GhostButton
            onClick={() => {
              resetPhotoGate();
              setToast(t('settings.resetPhotoDone'));
            }}
          >
            {t('settings.resetPhoto')}
          </GhostButton>
        </Card>

        <Card className="!p-4">
          <h2 className="mb-1 text-sm font-semibold text-ink">{t('settings.resetAll')}</h2>
          <p className="mb-3 text-[12px] leading-snug text-ink-soft">
            {t('settings.resetAllDesc')}
          </p>

          {confirmingReset ? (
            <div className="space-y-2">
              <p className="text-[12.5px] font-semibold text-bad">{t('settings.confirmTitle')}</p>
              <PrimaryButton
                onClick={() => {
                  resetAllProgress();
                  setConfirmingReset(false);
                  setToast(t('settings.resetAllDone'));
                }}
              >
                {t('settings.confirmReset')}
              </PrimaryButton>
              <GhostButton onClick={() => setConfirmingReset(false)}>
                {t('common.cancel')}
              </GhostButton>
            </div>
          ) : (
            <GhostButton onClick={() => setConfirmingReset(true)}>
              {t('settings.resetAll')}
            </GhostButton>
          )}
        </Card>

        <GhostButton
          className="border-white/40 text-[#faf1e8]"
          onClick={() => navigate('/menu')}
        >
          {t('common.back')}
        </GhostButton>
      </div>

      <Toast message={toast} onDismiss={() => setToast(null)} />
    </div>
  );
}
