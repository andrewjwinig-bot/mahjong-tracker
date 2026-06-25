'use client';

import { useState } from 'react';
import { usePro } from '../lib/usePro';
import { setPro } from '../lib/pro';
import Paywall from './Paywall';

/** The gold crown glyph used throughout the Pro flow (24/28/48px). */
export function ProCrown({ size = 24 }: { size?: number }) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} aria-hidden>
      <path d="M2.6 7.3l4.3 3.7L12 3.8l5.1 7.2 4.3-3.7-1.7 11.2H4.3L2.6 7.3z" fill="#5A3D08" />
      <rect x="4.3" y="18.4" width="15.4" height="2.5" rx="1.1" fill="#5A3D08" />
    </svg>
  );
}

/**
 * The dark + gold "Club Mahj Pro" upsell banner — one presentational component
 * reused on Feed · Tables · Profile. The Pro flow always uses its own fixed
 * dark/gold palette (it does not follow the active theme's --brand).
 */
export function ProBanner({ onClick, sub }: { onClick: () => void; sub?: string }) {
  return (
    <button className="probanner" onClick={onClick}>
      <span className="probanner-stripe" aria-hidden />
      <span className="probanner-glow" aria-hidden />
      <span className="probanner-shine" aria-hidden />
      <span className="probanner-tile" aria-hidden>
        <ProCrown size={24} />
      </span>
      <span className="probanner-text">
        <span className="probanner-title">
          Club Mahj<span className="probanner-pro"> Pro</span>
        </span>
        <span className="probanner-sub">{sub ?? 'Unlimited tables, every theme & cloud sync.'}</span>
      </span>
      <span className="probanner-cta">GO PRO</span>
    </button>
  );
}

// House "Go Pro" banner — our own upgrade prompt, never a third-party ad.
// Renders nothing once the user is Pro; tapping it opens the paywall.
export default function ProUpsell({ copy }: { copy?: string }) {
  const pro = usePro();
  const [open, setOpen] = useState(false);
  if (pro) return null;

  return (
    <>
      <ProBanner onClick={() => setOpen(true)} sub={copy} />
      {open && (
        <Paywall
          onUnlock={() => {
            setPro(true);
            setOpen(false);
          }}
          onClose={() => setOpen(false)}
        />
      )}
    </>
  );
}
