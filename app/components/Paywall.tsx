'use client';

import type { ReactNode } from 'react';
import {
  IconPalette,
  IconCard,
  IconUsers,
  IconCloud,
  IconBell,
  IconHeart,
  IconCrown,
} from './uiIcons';

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

        <button className="btn" style={{ marginTop: 16 }} onClick={onUnlock}>
          Unlock Pro
        </button>
        <p className="paywall-fine">
          Preview unlock — real subscriptions &amp; one-time purchases arrive via the App Store at
          launch. Pricing TBD.
        </p>
        <button className="btn ghost" style={{ marginTop: 10 }} onClick={onClose}>
          Maybe later
        </button>
      </div>
    </div>
  );
}
