import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

import { PrimaryButton } from '../components/ui';

/** First screen: collage only, no music, no intro sequence until Play. */
export default function Start() {
  const { t } = useTranslation();
  const navigate = useNavigate();

  return (
    <div className="grid min-h-[70dvh] place-items-center">
      <div className="w-full max-w-sm">
        <PrimaryButton onClick={() => navigate('/intro')}>{t('start.play')}</PrimaryButton>
      </div>
    </div>
  );
}
