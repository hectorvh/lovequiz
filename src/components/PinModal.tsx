import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { GAME_PIN } from '../config';
import { Card, GhostButton, PrimaryButton, introTypeClass } from './ui';

/**
 * Soft lock only. The PIN is compared client-side by design — it gates Play
 * and Settings on this shared device, nothing more.
 */
export default function PinModal({
  onSuccess,
  onClose,
}: {
  onSuccess: () => void;
  onClose: () => void;
}) {
  const { t } = useTranslation();
  const [value, setValue] = useState('');
  const [error, setError] = useState(false);

  const submit = () => {
    if (value === GAME_PIN) {
      onSuccess();
      return;
    }
    setError(true);
    setValue('');
  };

  const pinButtonClass = '!w-full !px-3 !py-2 !text-sm';

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/65 p-5 backdrop-blur-sm">
      <div className="animate-pop w-full max-w-xs">
        <Card>
          <h2 className={`${introTypeClass} mb-4 text-center text-xl text-ink`}>
            {t('pin.title')}
          </h2>

          <input
            autoFocus
            type="password"
            inputMode="numeric"
            pattern="[0-9]*"
            maxLength={4}
            value={value}
            onChange={(event) => {
              setValue(event.target.value.replace(/\D/g, ''));
              setError(false);
            }}
            onKeyDown={(event) => {
              if (event.key === 'Enter') submit();
            }}
            className="w-full rounded-xl border-[1.5px] border-card-line bg-white py-3 text-center font-display text-2xl tracking-[0.5em] text-ink outline-none focus:border-wine"
          />

          {error ? (
            <p className="mt-2 text-center text-xs text-bad">{t('pin.wrong')}</p>
          ) : null}

          <div className="mt-4 grid grid-cols-2 gap-2">
            <PrimaryButton className={pinButtonClass} onClick={submit} disabled={value.length !== 4}>
              {t('pin.enter')}
            </PrimaryButton>
            <GhostButton className={pinButtonClass} onClick={onClose}>
              {t('common.cancel')}
            </GhostButton>
          </div>
        </Card>
      </div>
    </div>
  );
}
