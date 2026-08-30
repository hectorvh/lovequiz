import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { Card, PrimaryButton, Tag } from '../components/ui';

/** Untimed and unscored: it touches neither hearts nor punishments. */
export default function BonusGiftQuestion({
  onContinue,
}: {
  onContinue: (text: string) => void;
}) {
  const { t } = useTranslation();
  const [draft, setDraft] = useState('');
  const answer = draft.trim();

  return (
    <div className="flex h-full min-h-0 flex-1 flex-col">
      <Card className="flex h-full min-h-0 flex-1 flex-col overflow-hidden !p-3.5">
        <div className="mb-2 flex shrink-0 justify-center">
          <Tag className="px-3 py-1.5 text-[15.4px] tracking-normal">{t('bonus.tag')}</Tag>
        </div>

        <p className="font-display mb-3 shrink-0 text-[clamp(0.95rem,2.5vh,1.15rem)] leading-snug text-ink">
          {t('bonus.giftPrompt')}
        </p>

        <textarea
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          placeholder={t('bonus.giftPlaceholder')}
          className="min-h-0 w-full flex-1 resize-none rounded-2xl border-[1.5px] border-card-line bg-white px-3 py-3 text-[0.95rem] leading-snug text-ink outline-none focus:border-wine"
        />

        <div className="mt-2 flex shrink-0 flex-col">
          <p className="mb-2 text-center text-[11.5px] text-ink-soft">{t('bonus.giftHint')}</p>
          <PrimaryButton onClick={() => onContinue(answer)} disabled={answer.length === 0}>
            {t('common.continue')}
          </PrimaryButton>
        </div>
      </Card>
    </div>
  );
}
