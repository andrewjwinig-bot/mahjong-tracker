'use client';

import { useState, type ReactNode } from 'react';
import {
  IconPalette,
  IconCard,
  IconUsers,
  IconCloud,
  IconBell,
  IconHeart,
  IconCrown,
  IconCheck,
} from './uiIcons';
import { PLANS, restorePurchases } from '../lib/pro';
import { useEscape } from '../lib/useEscape';

const PERKS: { icon: ReactNode; text: string }[] = [
  { icon: <IconPalette size={20} />, text: 'All premium themes — Dragon, Joker & Midnight' },
  { icon: <IconCard size={20} />, text: 'Custom tile wallpapers & avatar packs' },
  { icon: <IconUsers size={20} />, text: 'Unlimited tables & friends' },
  { icon: <IconCloud size={20} />, text: 'Cloud sync across devices (with accounts)' },
  { icon: <IconBell size={20} />, text: 'Push notifications for likes, comments & games' },
  { icon: <IconHeart size={20} fill />, text: 'Supporter badge — and you keep the lights on' },
];

export default function Paywall({
  onUnlock,
  onClose,
}: {
  onUnlock: () => void;
  onClose: () => void;
}) {
  useEscape(onClose);
  const [plan, setPlan] = useState(PLANS.find((p) => p.highlight)?.id ?? PLANS[0].id);
  const [restoreMsg, setRestoreMsg] = useState<string | null>(null);

  async function restore() {
    setRestoreMsg('Checking…');
    const ok = await restorePurchases();
    if (ok) onUnlock();
    else setRestoreMsg('No previous purchase found on this device.');
  }

  return (
    <div className="modal-scrim" onClick={onClose}>
      <div className="sheet" onClick={(e) => e.stopPropagation()}>
        <div className="grab" />
        <h2 style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
          Mahjong Tracker Pro <IconCrown size={20} />
        </h2>
        <p className="sheet-sub">Unlock the full table.</p>

        <div className="perks">
          {PERKS.map((p) => (
            <div className="perk" key={p.text}>
              <span className="perk-emoji">{p.icon}</span>
              <span>{p.text}</span>
            </div>
          ))}
        </div>

        {/* Plan picker */}
        <div className="plan-list">
          {PLANS.map((p) => (
            <button
              key={p.id}
              className="plan"
              data-active={plan === p.id}
              onClick={() => setPlan(p.id)}
            >
              <span className="plan-check" aria-hidden>
                {plan === p.id && <IconCheck size={15} />}
              </span>
              <span style={{ flex: 1, textAlign: 'left' }}>
                <span className="plan-name">
                  {p.name}
                  {p.highlight && <span className="plan-badge">Popular</span>}
                </span>
                {p.note && <span className="plan-note">{p.note}</span>}
              </span>
              <span className="plan-price">
                {p.price}
                <span className="plan-cadence">{p.cadence}</span>
              </span>
            </button>
          ))}
        </div>

        <button className="btn" style={{ marginTop: 14 }} onClick={onUnlock}>
          Unlock Pro
        </button>
        <button className="btn ghost" style={{ marginTop: 10 }} onClick={restore}>
          Restore purchases
        </button>
        {restoreMsg && (
          <p style={{ margin: '8px 2px 0', textAlign: 'center', fontSize: 12, fontWeight: 700, color: 'var(--muted)' }}>
            {restoreMsg}
          </p>
        )}

        <p className="paywall-fine">
          Preview unlock — real subscriptions &amp; one-time purchases are billed through the App Store
          at launch. Prices shown are placeholders and may change. Subscriptions auto-renew until
          cancelled; manage them in your App Store settings.
        </p>
        <button className="btn ghost" style={{ marginTop: 10 }} onClick={onClose}>
          Maybe later
        </button>
      </div>
    </div>
  );
}
