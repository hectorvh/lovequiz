import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

import SequencedMessages, { type SequenceStep } from '../components/SequencedMessages';

export default function Intro() {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const steps: SequenceStep[] = [
    { text: t('intro.m1'), ms: 2000 },
    { text: t('intro.m2'), ms: 2000 },
    { text: t('intro.m3'), ms: 1500 },
    { text: t('intro.m4'), ms: 1500 },
  ];

  const goNext = () => navigate('/instructions');

  return (
    <>
      <SequencedMessages steps={steps} onComplete={goNext} />

      <button
        type="button"
        onClick={goNext}
        className="fixed right-5 bottom-6 z-30 rounded-full border border-white/20 bg-black/40 px-5 py-2.5 text-sm font-semibold text-[#faf1e8] backdrop-blur transition active:scale-95 hover:bg-black/60"
      >
        {t('common.skip')}
      </button>
    </>
  );
}
