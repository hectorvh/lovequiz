import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

import { Card, GhostButton, PrimaryButton, ScreenTitle } from '../components/ui';
import { generateCaricature } from '../lib/caricatureApi';
import { uploadPhoto } from '../lib/db';
import { appendLocalPhoto } from '../state/persistence';
import { useGameStore } from '../state/gameStore';

type Facing = 'user' | 'environment';

interface Captured {
  dataUrl: string;
  blob: Blob;
}

function download(dataUrl: string, filename: string) {
  const link = document.createElement('a');
  link.href = dataUrl;
  link.download = filename;
  link.click();
}

export default function TakePhoto() {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const photoTaken = useGameStore((s) => s.photoTaken);
  const setPhotoTaken = useGameStore((s) => s.setPhotoTaken);

  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const [facing, setFacing] = useState<Facing>('user');
  const [cameraError, setCameraError] = useState(false);
  const [captured, setCaptured] = useState<Captured | null>(null);
  const [caricatureUrl, setCaricatureUrl] = useState<string | null>(null);
  const [caricatureFailed, setCaricatureFailed] = useState(false);
  const [busy, setBusy] = useState(false);

  const stopStream = useCallback(() => {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
  }, []);

  useEffect(() => {
    if (photoTaken || captured) return;

    let cancelled = false;

    const open = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: facing },
          audio: false,
        });
        if (cancelled) {
          stream.getTracks().forEach((track) => track.stop());
          return;
        }
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play().catch(() => undefined);
        }
        setCameraError(false);
      } catch {
        if (!cancelled) setCameraError(true);
      }
    };

    void open();

    return () => {
      cancelled = true;
      stopStream();
    };
  }, [facing, photoTaken, captured, stopStream]);

  useEffect(() => stopStream, [stopStream]);

  const capture = async () => {
    const video = videoRef.current;
    if (!video || busy) return;

    setBusy(true);
    try {
      const canvas = document.createElement('canvas');
      canvas.width = video.videoWidth || 720;
      canvas.height = video.videoHeight || 960;

      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('Canvas 2D context unavailable');
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

      const dataUrl = canvas.toDataURL('image/jpeg', 0.92);
      const blob = await new Promise<Blob | null>((resolve) =>
        canvas.toBlob(resolve, 'image/jpeg', 0.92),
      );
      if (!blob) throw new Error('Could not encode the photo');

      setCaptured({ dataUrl, blob });
      stopStream();

      // A caricature failure must never cost us the original photo.
      let caricatureBlob: Blob | null = null;
      let caricatureDataUrl: string | null = null;
      try {
        const caricature = await generateCaricature(dataUrl);
        caricatureBlob = caricature.blob;
        caricatureDataUrl = caricature.dataUrl;
        setCaricatureUrl(caricature.dataUrl);
      } catch {
        setCaricatureFailed(true);
      }

      const uploaded = await uploadPhoto(blob, caricatureBlob);
      if (!uploaded.ok) {
        appendLocalPhoto({
          id: `local-${Date.now()}`,
          storagePath: 'local',
          caricatureStoragePath: caricatureBlob ? 'local' : null,
          createdAt: new Date().toISOString(),
          localDataUrl: dataUrl,
          localCaricatureDataUrl: caricatureDataUrl ?? undefined,
        });
      }

      setPhotoTaken(true);
    } catch {
      setCameraError(true);
    } finally {
      setBusy(false);
    }
  };

  if (photoTaken && !captured) {
    return (
      <div className="flex h-full min-h-0 flex-col overflow-hidden pt-1">
        <ScreenTitle title={t('photo.title')} />
        <Card>
          <p className="mb-5 text-sm leading-relaxed text-ink-soft">{t('photo.alreadyTaken')}</p>
          <div className="space-y-2.5">
            <PrimaryButton onClick={() => navigate('/summary')}>
              {t('photo.finish')}
            </PrimaryButton>
            <GhostButton onClick={() => navigate('/menu')}>{t('common.back')}</GhostButton>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden pt-1">
      <ScreenTitle eyebrow={t('photo.subtitle')} title={t('photo.title')} />

      <Card className="flex min-h-0 flex-1 flex-col overflow-hidden !p-3.5">
        {captured ? (
          <div className="flex min-h-0 flex-1 flex-col space-y-2 overflow-hidden">
            <figure className="min-h-0 flex-1 overflow-hidden">
              <img
                src={captured.dataUrl}
                alt={t('photo.original')}
                className="h-full max-h-40 w-full rounded-2xl border border-card-line object-cover"
              />
              <figcaption className="mt-1 text-center text-[11px] text-ink-soft">
                {t('photo.original')}
              </figcaption>
            </figure>

            {caricatureUrl ? (
              <figure>
                <img
                  src={caricatureUrl}
                  alt={t('photo.caricature')}
                  className="h-full max-h-32 w-full rounded-2xl border border-gold object-cover"
                />
                <figcaption className="mt-1 text-center text-[11px] text-ink-soft">
                  {t('photo.caricature')}
                </figcaption>
              </figure>
            ) : null}

            {caricatureFailed ? (
              <p className="rounded-xl bg-bad-bg px-3.5 py-2.5 text-[12.5px] leading-snug text-[#5c1416]">
                {t('photo.caricatureFailed')}
              </p>
            ) : null}

            <div className="space-y-2.5 pt-1">
              <GhostButton
                onClick={() => {
                  download(captured.dataUrl, 'fer-quiz-foto.jpg');
                  if (caricatureUrl) download(caricatureUrl, 'fer-quiz-caricatura.jpg');
                }}
              >
                {t('photo.saveLocal')}
              </GhostButton>
              <PrimaryButton onClick={() => navigate('/summary')} disabled={busy}>
                {busy ? t('photo.uploading') : t('photo.finish')}
              </PrimaryButton>
            </div>
          </div>
        ) : (
          <div className="flex min-h-0 flex-1 flex-col space-y-3">
            <div className="relative min-h-0 flex-1 overflow-hidden rounded-2xl border border-card-line bg-night">
              <video
                ref={videoRef}
                playsInline
                muted
                className="h-full w-full object-cover"
                style={{ transform: facing === 'user' ? 'scaleX(-1)' : undefined }}
              />
            </div>

            {cameraError ? (
              <p className="rounded-xl bg-bad-bg px-3.5 py-2.5 text-[12.5px] leading-snug text-[#5c1416]">
                {t('photo.permissionDenied')}
              </p>
            ) : null}

            <div className="space-y-2.5">
              <PrimaryButton onClick={() => void capture()} disabled={cameraError || busy}>
                {busy ? t('photo.generating') : t('photo.capture')}
              </PrimaryButton>
              <GhostButton
                onClick={() => setFacing((f) => (f === 'user' ? 'environment' : 'user'))}
                disabled={busy}
              >
                {t('photo.switchCamera')}
              </GhostButton>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}
