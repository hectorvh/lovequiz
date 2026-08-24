import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

import PinModal from '../components/PinModal';
import { introTypeClass } from '../components/ui';

/** First screen: collage only, no music, no intro sequence until Play. */
export default function Start() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [pinOpen, setPinOpen] = useState(false);

  return (
    <div className="grid h-full min-h-0 place-items-center overflow-hidden">
      <button
        type="button"
        onClick={() => setPinOpen(true)}
        className={`${introTypeClass} rounded-xl bg-wine px-12 py-[1.3rem] text-[2.25rem] leading-none text-[#fbe9ee] shadow-md transition active:scale-[0.98] hover:bg-wine-deep`}
      >
        {t('start.play')}
      </button>

      {pinOpen ? (
        <PinModal
          onSuccess={() => {
            setPinOpen(false);
            navigate('/intro');
          }}
          onClose={() => setPinOpen(false)}
        />
      ) : null}
    </div>
  );
}
