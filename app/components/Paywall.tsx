'use client';

import { useRef, useState, type ReactNode } from 'react';
import { IconPalette, IconCard, IconUsers, IconCloud, IconBell, IconHeart } from './uiIcons';
import { PLANS, planPriceLabel, restorePurchases, type Plan } from '../lib/pro';
import { useEscape } from '../lib/useEscape';
import { ProCrown } from './ProUpsell';

const FEATURES: { icon: ReactNode; text: string; sub?: string }[] = [
  { icon: <IconPalette size={18} />, text: 'All premium themes — Dragon, Joker & Midnight' },
  { icon: <IconCard size={18} />, text: 'Custom tile wallpapers & avatar packs' },
  { icon: <IconUsers size={18} />, text: 'Unlimited tables & friends' },
  { icon: <IconCloud size={18} />, text: 'Cloud sync across devices', sub: 'Your games & profile, on every device you sign in.' },
  { icon: <IconBell size={18} />, text: 'Push notifications for likes, comments & games' },
  { icon: <IconHeart size={18} fill />, text: 'Supporter badge — and you keep the lights on' },
];

// Gold tiles that rain on the celebration.
const RAIN_GLYPHS = ['中', '發', '東', '南', '西', '北', '花'];

export default function Paywall({
  onUnlock,
  onClose,
}: {
  onUnlock: () => void;
  onClose: () => void;
}) {
  useEscape(onClose);
  const [planId, setPlanId] = useState<Plan['id']>(PLANS.find((p) => p.highlight)?.id ?? PLANS[0].id);
  const [restoreMsg, setRestoreMsg] = useState<string | null>(null);
  const [celebrating, setCelebrating] = useState(false);
  const firedRef = useRef(false);

  const plan = PLANS.find((p) => p.id === planId) ?? PLANS[0];

  async function restore() {
    setRestoreMsg('Checking…');
    const ok = await restorePurchases();
    if (ok) onUnlock();
    else setRestoreMsg('No previous purchase found on this device.');
  }

  // CTA → the success moment doubles as the close: celebrate, then (in the real
  // app, on IAP success) set the Pro entitlement and dismiss the modal.
  function goPro() {
    if (firedRef.current) return;
    firedRef.current = true;
    setCelebrating(true);
    setTimeout(() => onUnlock(), 2300);
  }

  return (
    <div className="pro-scrim" onClick={onClose}>
      <div className="pro-sheet" onClick={(e) => e.stopPropagation()} role="dialog" aria-label="Club Mahj Pro">
        <div className="pro-grab" />

        <div className="pro-head">
          <span className="pro-tile" aria-hidden>
            <ProCrown size={34} />
          </span>
          <div className="pro-eyebrow">UNLOCK EVERYTHING</div>
          <h2 className="pro-title">Club Mahj Pro</h2>
          <p className="pro-sub">One membership. Every table, theme &amp; tile — yours.</p>
        </div>

        <div className="pro-features">
          {FEATURES.map((f) => (
            <div className="pro-feat" key={f.text}>
              <span className="pro-feat-ic" aria-hidden>
                {f.icon}
              </span>
              <span className="pro-feat-text">
                {f.text}
                {f.sub && <span className="pro-feat-sub">{f.sub}</span>}
              </span>
            </div>
          ))}
        </div>

        <div className="pro-plans">
          {PLANS.map((p) => (
            <button
              key={p.id}
              className="pro-plan"
              data-active={planId === p.id}
              onClick={() => setPlanId(p.id)}
            >
              <span className="pro-radio" aria-hidden />
              <span className="pro-plan-main">
                <span className="pro-plan-name">
                  {p.name}
                  {p.highlight && <span className="pro-plan-chip">BEST VALUE</span>}
                </span>
                {p.note && <span className="pro-plan-note">{p.note}</span>}
              </span>
              <span className="pro-plan-price">{planPriceLabel(p)}</span>
            </button>
          ))}
        </div>

        <button className="pro-cta" onClick={goPro}>
          <span className="probanner-shine" aria-hidden />
          Unlock Pro — {planPriceLabel(plan)}
        </button>
        <button className="pro-restore" onClick={restore}>
          RESTORE PURCHASES
        </button>
        {restoreMsg && <p className="pro-restore-msg">{restoreMsg}</p>}
        <p className="pro-legal">
          Billed through the App Store · auto-renews until cancelled.
          <br />
          Prices are placeholders — manage anytime in Settings.
        </p>
      </div>

      {celebrating && (
        <div className="pro-celebrate" onClick={(e) => e.stopPropagation()}>
          <div className="pro-rain" aria-hidden>
            {Array.from({ length: 30 }).map((_, i) => (
              <span
                key={i}
                className="pro-rain-tile"
                style={{
                  left: `${(i * 17 + 5) % 100}%`,
                  animationDelay: `${(i % 12) * 0.11}s`,
                  animationDuration: `${1.7 + (i % 5) * 0.28}s`,
                }}
              >
                {RAIN_GLYPHS[i % RAIN_GLYPHS.length]}
              </span>
            ))}
          </div>
          <div className="pro-cele-card">
            <span className="pro-tile pro-cele-tile" aria-hidden>
              <ProCrown size={48} />
            </span>
            <div className="pro-eyebrow">YOU’RE IN</div>
            <h2 className="pro-cele-title">Welcome to Pro</h2>
            <p className="pro-sub">Every table, theme &amp; tile is yours. Pull up a good seat.</p>
          </div>
        </div>
      )}
    </div>
  );
}
