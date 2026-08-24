import type { ButtonHTMLAttributes, ReactNode } from 'react';

export function Card({
  children,
  className = '',
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`rounded-3xl border border-white/10 bg-card/97 p-6 shadow-[0_20px_50px_rgba(20,4,14,0.45)] backdrop-blur-sm ${className}`}
    >
      {children}
    </div>
  );
}

export function ScreenTitle({ eyebrow, title }: { eyebrow?: string; title: string }) {
  return (
    <div className="mb-3 text-center">
      {eyebrow ? (
        <p className="mb-2 text-[11px] font-semibold tracking-[0.18em] text-gold uppercase">
          {eyebrow}
        </p>
      ) : null}
      <h1 className="font-display text-2xl leading-tight font-semibold text-[#faf1e8] italic">
        {title}
      </h1>
    </div>
  );
}

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & { className?: string };

export function PrimaryButton({ className = '', ...props }: ButtonProps) {
  return (
    <button
      {...props}
      className={`w-full rounded-xl bg-wine px-4 py-3.5 text-[15px] font-semibold text-[#fbe9ee] transition active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-45 disabled:active:scale-100 not-disabled:hover:bg-wine-deep ${className}`}
    />
  );
}

export function GhostButton({ className = '', ...props }: ButtonProps) {
  return (
    <button
      {...props}
      className={`w-full rounded-xl border-[1.5px] border-wine bg-transparent px-4 py-3 text-sm font-semibold text-wine transition active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-45 ${className}`}
    />
  );
}

/** Display face used on intro copy and on the matching action labels. */
export const introTypeClass = 'font-display font-semibold italic';

/** Shared chrome for mute / settings / language — 70% opaque circular buttons. */
export const chromeButtonClass =
  'grid h-11 w-11 place-items-center rounded-full border border-white/15 bg-black/35 text-[#faf1e8] opacity-70 backdrop-blur transition active:scale-95 hover:bg-black/50 disabled:cursor-not-allowed disabled:opacity-35 disabled:active:scale-100';

export function Tag({ children }: { children: ReactNode }) {
  return (
    <span className="inline-block rounded-full bg-[#f3e3c8] px-2.5 py-1 text-[11px] font-semibold tracking-wide text-gold-deep uppercase">
      {children}
    </span>
  );
}
