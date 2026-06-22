'use client';

import { useState } from 'react';
import { usePro } from '../lib/usePro';
import { setPro } from '../lib/pro';
import Paywall from './Paywall';
import { IconCrown } from './uiIcons';

// A house "Go Pro" banner — our own upgrade prompt, never a third-party ad.
// Renders nothing once the user is Pro.
export default function ProUpsell({ copy }: { copy?: string }) {
  const pro = usePro();
  const [open, setOpen] = useState(false);
  if (pro) return null;

  return (
    <>
      <button className="pro-banner" onClick={() => setOpen(true)}>
        <span className="pro-banner-ic" aria-hidden>
          <IconCrown size={20} />
        </span>
        <span className="pro-banner-text">
          <span className="pro-banner-title">Go Pro</span>
          <span className="pro-banner-sub">
            {copy ?? 'Premium themes, unlimited tables, cloud sync & more.'}
          </span>
        </span>
        <span className="pro-banner-cta">Unlock</span>
      </button>

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
