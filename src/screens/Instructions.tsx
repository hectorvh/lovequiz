import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

import SequencedMessages, { type SequenceStep } from '../components/SequencedMessages';
import { QUESTION_DURATION_SECONDS } from '../config';
import { PUNISHMENT_EMOJI, PUNISHMENT_ORDER } from '../types';

export default function Instructions() {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const steps: SequenceStep[] = [
    { text: t('instructions.m1', { seconds: QUESTION_DURATION_SECONDS }), ms: 2000 },
    { text: t('instructions.m2'), ms: 2000 },
    { text: t('instructions.m3'), ms: 2000 },
    { text: t('instructions.m4'), ms: 2000 },
  ];

  const goNext = () => navigate('/menu');

  return (
    <>
      <SequencedMessages steps={steps} onComplete={goNext} />

      <ul className="mx-auto flex max-w-xs flex-wrap justify-center gap-2">
        {PUNISHMENT_ORDER.map((key) => (
          <li
            key={key}
            className="flex items-center gap-1.5 rounded-full border border-white/15 bg-black/35 px-3 py-1.5 text-xs text-[#faf1e8] backdrop-blur"
          >
            <span aria-hidden>{PUNISHMENT_EMOJI[key]}</span>
            {t(`punishments.${key}Full`)}
          </li>
        ))}
      </ul>

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
