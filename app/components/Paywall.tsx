'use client';

const PERKS: { emoji: string; text: string }[] = [
  { emoji: '🎨', text: 'All premium themes — Dragon, Joker & Midnight' },
  { emoji: '🀄', text: 'Custom tile wallpapers & avatar packs' },
  { emoji: '👯', text: 'Unlimited tables & friends' },
  { emoji: '☁️', text: 'Cloud sync across devices (with accounts)' },
  { emoji: '🔔', text: 'Push notifications for likes, comments & games' },
  { emoji: '💛', text: 'Supporter badge — and you keep the lights on' },
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
        <h2>Mahjong Tracker Pro 👑</h2>
        <p className="sheet-sub">Unlock the full table.</p>

        <div className="perks">
          {PERKS.map((p) => (
            <div className="perk" key={p.text}>
              <span className="perk-emoji">{p.emoji}</span>
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
