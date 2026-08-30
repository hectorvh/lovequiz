import { useTranslation } from 'react-i18next';

import { Card, GhostButton, PrimaryButton, introTypeClass } from './ui';

export default function ConfirmCreateQuizModal({
  onConfirm,
  onClose,
}: {
  onConfirm: () => void;
  onClose: () => void;
}) {
  const { t } = useTranslation();

  return (
    <div className="fixed inset-0 z-[90] grid place-items-center bg-black/65 p-5 backdrop-blur-sm">
      <div className="animate-pop w-full max-w-sm">
        <Card>
          <p className={`${introTypeClass} text-center text-2xl leading-snug text-wine`}>
            {t('create.overwriteConfirm')}
          </p>
          <div className="mt-5 grid grid-cols-2 gap-2">
            <GhostButton onClick={onClose}>{t('common.cancel')}</GhostButton>
            <PrimaryButton onClick={onConfirm}>{t('common.continue')}</PrimaryButton>
          </div>
        </Card>
      </div>
    </div>
  );
}
