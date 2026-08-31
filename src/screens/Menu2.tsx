import { useEffect, useState, type ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

import Toast from '../components/Toast';
import { Card, PrimaryButton, chromeButtonClass, introTypeClass, unavailableButtonClass } from '../components/ui';
import { selectGameComplete, useGameStore } from '../state/gameStore';

const TILE_SIZE_CLASS = 'h-28 w-28';
const MODEL_BUTTON_ICON = '/3d_models/icons/Hector_lego02-removebg-preview.png';

function ActionTile({
  label,
  faded,
  done,
  onClick,
  children,
}: {
  label: string;
  faded?: boolean;
  done?: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      aria-disabled={faded}
      className={`grid ${TILE_SIZE_CLASS} place-items-center border-[3px] shadow-md transition active:scale-95 ${
        done
          ? 'overflow-hidden rounded-full border-[#355c38] bg-good text-white'
          : 'overflow-hidden rounded-3xl border-wine bg-wine text-[#fbe9ee] hover:bg-wine-deep'
      } ${faded ? unavailableButtonClass : ''}`}
    >
      {children}
    </button>
  );
}

export default function Menu2() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const gameComplete = useGameStore(selectGameComplete);
  const menu2Unlock = useGameStore((s) => s.menu2Unlock);
  const advanceMenu2Unlock = useGameStore((s) => s.advanceMenu2Unlock);
  const [hintOpen, setHintOpen] = useState(false);
  const [pizzaOpen, setPizzaOpen] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const modelOpen = menu2Unlock >= 1;
  const giftOpen = menu2Unlock >= 2;
  const pizzaOpenable = menu2Unlock >= 3;
  const summaryDone = menu2Unlock >= 1;
  const modelDone = menu2Unlock >= 2;
  const giftDone = menu2Unlock >= 3;
  const pizzaDone = menu2Unlock >= 4;

  useEffect(() => {
    if (!gameComplete) navigate('/menu', { replace: true });
  }, [gameComplete, navigate]);

  const rejectIfLocked = (available: boolean) => {
    if (available) return false;
    setToast(t('menu.lockedPrize'));
    return true;
  };

  return (
    <div className="flex h-full min-h-0 flex-col items-center overflow-hidden px-2 text-center">
      <div className="flex min-h-0 w-full flex-1 flex-col items-center justify-center">
        <p
          className={`${introTypeClass} mb-11 whitespace-pre-line text-center text-[2.625rem] leading-[1.05] text-[#faf1e8] drop-shadow-[0_3px_14px_rgba(0,0,0,0.7)]`}
        >
          {t('menu.prizes')}
        </p>
        <div className="grid grid-cols-2 gap-x-4 gap-y-8">
          <ActionTile
            label={t('menu.summary')}
            done={summaryDone}
            onClick={() => {
              advanceMenu2Unlock(1);
              navigate('/summary');
            }}
          >
            <span className="grid h-full w-full place-items-center text-[2.72rem] leading-none" aria-hidden>
              💋
            </span>
          </ActionTile>
          <ActionTile
            label={t('menu.model')}
            faded={!modelOpen}
            done={modelDone}
            onClick={() => {
              if (rejectIfLocked(modelOpen)) return;
              advanceMenu2Unlock(2);
              navigate('/model');
            }}
          >
            <img
              src={MODEL_BUTTON_ICON}
              alt=""
              draggable={false}
              className="pointer-events-none h-[72%] w-[72%] object-contain"
            />
          </ActionTile>
          <ActionTile
            label={t('menu.lego')}
            faded={!giftOpen}
            done={giftDone}
            onClick={() => {
              if (rejectIfLocked(giftOpen)) return;
              advanceMenu2Unlock(3);
              setHintOpen(true);
            }}
          >
            <span className="grid h-full w-full place-items-center text-[2.72rem] leading-none" aria-hidden>
              🎁
            </span>
          </ActionTile>
          <ActionTile
            label={t('menu.pizza')}
            faded={!pizzaOpenable}
            done={pizzaDone}
            onClick={() => {
              if (rejectIfLocked(pizzaOpenable)) return;
              advanceMenu2Unlock(4);
              setPizzaOpen(true);
            }}
          >
            <span className="grid h-full w-full place-items-center text-[2.72rem] leading-none" aria-hidden>
              🍕
            </span>
          </ActionTile>
        </div>
      </div>

      <div className="mb-2 flex w-full justify-center">
        <button
          type="button"
          onClick={() => navigate('/menu')}
          aria-label={t('intro.toMenu')}
          className={`${chromeButtonClass} !h-[83.16px] !w-[83.16px] !opacity-100`}
        >
          <svg
            aria-hidden
            viewBox="0 0 24 24"
            className="h-8 w-8"
            fill="none"
            stroke="currentColor"
            strokeWidth={1.6}
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <rect x="4" y="4" width="7" height="7" rx="1.6" />
            <rect x="13" y="4" width="7" height="7" rx="1.6" />
            <rect x="4" y="13" width="7" height="7" rx="1.6" />
            <rect x="13" y="13" width="7" height="7" rx="1.6" />
          </svg>
        </button>
      </div>

      <Toast message={toast} onDismiss={() => setToast(null)} />

      {hintOpen ? (
        <div className="fixed inset-0 z-[90] grid place-items-center bg-black/65 p-5 backdrop-blur-sm">
          <div className="animate-pop w-full max-w-sm">
            <Card>
              <p className={`${introTypeClass} text-center text-2xl leading-snug text-wine`}>
                {t('celebrate.hint')}
              </p>
              <p className={`${introTypeClass} mt-3 text-center text-[2.75rem] leading-tight text-wine`}>
                {t('celebrate.love')}
              </p>
              <div className="mt-5">
                <PrimaryButton onClick={() => setHintOpen(false)}>{t('common.continue')}</PrimaryButton>
              </div>
            </Card>
          </div>
        </div>
      ) : null}

      {pizzaOpen ? (
        <div className="fixed inset-0 z-[90] grid place-items-center bg-black/65 p-5 backdrop-blur-sm">
          <div className="animate-pop w-full max-w-sm">
            <Card>
              <p className={`${introTypeClass} text-center text-2xl leading-snug text-wine`}>
                {t('celebrate.pizzaHint')}
              </p>
              <p className={`${introTypeClass} mt-3 text-center text-[2.75rem] leading-tight text-wine`}>
                {t('celebrate.pizzaLove')}
              </p>
              <div className="mt-5">
                <PrimaryButton onClick={() => setPizzaOpen(false)}>{t('common.continue')}</PrimaryButton>
              </div>
            </Card>
          </div>
        </div>
      ) : null}
    </div>
  );
}
