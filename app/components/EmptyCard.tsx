'use client';

import { OFFICIAL_CARD_URL } from '../lib/links';
import { track } from '../lib/analytics';

// Type system per the design: Bricolage display, Hanken body, Space Mono meta.
const F_DISPLAY = "var(--font-display), 'Bricolage Grotesque', sans-serif";
const F_BODY = "var(--font-app), 'Hanken Grotesk', sans-serif";
const F_MONO = "var(--font-mono), 'Space Mono', monospace";

const HATCH = 'repeating-linear-gradient(-45deg,#fff 0,#fff 2px,transparent 2px,transparent 11px)';
const RED = 'rgba(192,57,43,0.55)';
const GREEN = 'rgba(46,125,67,0.55)';

// One trifold panel: a stack of red/green notation bars. `bars` is [width, 'r'|'g'].
function Panel({ radius, bars, shadow }: { radius: string; bars: [string, 'r' | 'g'][]; shadow: string }) {
  return (
    <div
      style={{
        width: 72,
        height: 72,
        borderRadius: radius,
        background: 'linear-gradient(160deg,#FFFFFF,#FCF7EC)',
        boxShadow: shadow,
        padding: '8px 8px',
        display: 'flex',
        flexDirection: 'column',
        gap: 5,
        justifyContent: 'center',
      }}
    >
      {bars.map(([w, c], i) => (
        <span key={i} style={{ height: 3, borderRadius: 2, width: w, background: c === 'r' ? RED : GREEN }} />
      ))}
    </div>
  );
}

// Shown on the Card tab before the user has set up a card. The rest of the app
// (scorer, tables, feed, rules) works without one — this only gates the hand
// tracker. SCAN MY CARD opens the guided 3-panel capture; "enter card manually"
// is the no-camera fallback into the same editor.
export default function EmptyCard({
  scanEnabled,
  onScan,
  onManual,
}: {
  scanEnabled: boolean;
  /** Jump straight into the photo/upload capture. */
  onScan: () => void;
  /** Open the editor to type the card in by hand. */
  onManual: () => void;
}) {
  return (
    <div
      style={{
        position: 'relative',
        marginTop: 6,
        background: '#FFFFFF',
        borderRadius: 22,
        boxShadow: '0 10px 28px rgba(20,40,24,0.10)',
        padding: '26px 22px 22px',
        textAlign: 'center',
      }}
    >
      {/* scan illustration: the trifold card being read — teal scan line + pulsing red brackets */}
      <div style={{ position: 'relative', height: 140, marginBottom: 18, display: 'flex', alignItems: 'center', justifyContent: 'center', perspective: 760 }}>
        <div style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', transform: 'rotate(-2deg)' }}>
          {/* green vinyl sleeve */}
          <div style={{ position: 'absolute', left: '50%', top: '50%', transform: 'translate(-50%,-50%)', width: 238, height: 84, borderRadius: 8, background: 'linear-gradient(180deg,#7CB877,#5C9D5A)', boxShadow: 'inset 0 1px 2px rgba(255,255,255,0.4),0 8px 16px rgba(40,80,38,0.26)', zIndex: 0 }} />
          {/* 3 panels */}
          <div style={{ position: 'relative', zIndex: 2, display: 'flex', gap: 4 }}>
            <Panel radius="6px 2px 2px 6px" shadow="-2px 3px 8px rgba(20,22,42,0.14)" bars={[['62%', 'r'], ['80%', 'g'], ['48%', 'r'], ['70%', 'g']]} />
            <Panel radius="0" shadow="0 3px 8px rgba(20,22,42,0.12)" bars={[['74%', 'g'], ['54%', 'r'], ['82%', 'g'], ['46%', 'r']]} />
            <Panel radius="2px 6px 6px 2px" shadow="2px 3px 8px rgba(20,22,42,0.14)" bars={[['56%', 'r'], ['76%', 'g'], ['50%', 'r'], ['68%', 'g']]} />
          </div>
          {/* scan line */}
          <div style={{ position: 'absolute', left: -4, right: -4, top: '14%', height: 3, zIndex: 4, background: 'linear-gradient(90deg,transparent,#3FC6B0,transparent)', boxShadow: '0 0 12px 2px rgba(63,198,176,0.65)', animation: 'cpScan 2.8s ease-in-out infinite' }} />
          {/* corner brackets */}
          <div style={{ position: 'absolute', left: -7, top: -7, width: 16, height: 16, borderLeft: '2.5px solid #C0392B', borderTop: '2.5px solid #C0392B', borderRadius: '3px 0 0 0', zIndex: 4, animation: 'cpBracket 2.8s ease-in-out infinite' }} />
          <div style={{ position: 'absolute', right: -7, top: -7, width: 16, height: 16, borderRight: '2.5px solid #C0392B', borderTop: '2.5px solid #C0392B', borderRadius: '0 3px 0 0', zIndex: 4, animation: 'cpBracket 2.8s ease-in-out infinite .3s' }} />
          <div style={{ position: 'absolute', left: -7, bottom: -7, width: 16, height: 16, borderLeft: '2.5px solid #C0392B', borderBottom: '2.5px solid #C0392B', borderRadius: '0 0 0 3px', zIndex: 4, animation: 'cpBracket 2.8s ease-in-out infinite .15s' }} />
          <div style={{ position: 'absolute', right: -7, bottom: -7, width: 16, height: 16, borderRight: '2.5px solid #C0392B', borderBottom: '2.5px solid #C0392B', borderRadius: '0 0 3px 0', zIndex: 4, animation: 'cpBracket 2.8s ease-in-out infinite .45s' }} />
        </div>
      </div>

      <h2 style={{ margin: '0 0 9px', fontFamily: F_DISPLAY, fontWeight: 800, fontSize: 25, letterSpacing: -0.5, color: '#14402A' }}>Add your card to start tracking</h2>

      <p style={{ margin: '0 auto 14px', maxWidth: 300, fontFamily: F_BODY, fontWeight: 500, fontSize: 14.5, lineHeight: 1.5, color: '#5E7466' }}>
        Scan your National Mah Jongg League card once and every hand becomes tappable. Everything else in the app works without it.
      </p>

      {/* reassurance pill */}
      {scanEnabled && (
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 18 }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: '#FBF1E4', border: '1.5px solid rgba(201,135,26,0.30)', borderRadius: 999, padding: '6px 13px' }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#E0A21B', boxShadow: '0 0 0 3px rgba(224,162,27,0.2)' }} />
            <span style={{ fontFamily: F_BODY, fontWeight: 800, fontSize: 10, letterSpacing: 1.2, color: '#A9740E' }}>ABOUT 60 SECONDS · ONCE A SEASON</span>
          </div>
        </div>
      )}

      {/* primary CTA */}
      {scanEnabled ? (
        <>
          <button
            className="scy-btn"
            onClick={onScan}
            style={{ position: 'relative', overflow: 'hidden', width: '100%', background: '#C0392B', border: '2.5px solid rgba(20,22,42,0.10)', borderRadius: 15, padding: 18, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, boxShadow: '0 6px 16px rgba(192,57,43,0.30)', cursor: 'pointer' }}
          >
            <div style={{ position: 'absolute', inset: 0, opacity: 0.14, background: HATCH }} />
            <div style={{ position: 'absolute', top: 0, bottom: 0, left: 0, width: '38%', background: 'linear-gradient(100deg,transparent,rgba(255,255,255,.5),transparent)', transform: 'translateX(-130%)', animation: 'cpShine 4.5s ease-in-out infinite 1.2s' }} />
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round" style={{ position: 'relative' }}>
              <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
              <circle cx="12" cy="13" r="4" />
            </svg>
            <span style={{ position: 'relative', fontFamily: F_DISPLAY, fontWeight: 800, fontSize: 17, letterSpacing: 0.6, color: '#fff', textShadow: '1.5px 1.5px 0 rgba(20,22,42,0.22)' }}>SCAN MY CARD</span>
          </button>

          <button onClick={onManual} style={{ display: 'block', margin: '15px auto 0', background: 'none', border: 0, cursor: 'pointer' }}>
            <span style={{ fontFamily: F_BODY, fontWeight: 700, fontSize: 13.5, color: '#3C6B47', borderBottom: '1.5px solid rgba(60,107,71,0.35)', paddingBottom: 1 }}>or enter card manually</span>
          </button>
        </>
      ) : (
        <button
          className="scy-btn"
          onClick={onManual}
          style={{ position: 'relative', overflow: 'hidden', width: '100%', background: '#C0392B', border: '2.5px solid rgba(20,22,42,0.10)', borderRadius: 15, padding: 18, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 6px 16px rgba(192,57,43,0.30)', cursor: 'pointer' }}
        >
          <div style={{ position: 'absolute', inset: 0, opacity: 0.14, background: HATCH }} />
          <span style={{ position: 'relative', fontFamily: F_DISPLAY, fontWeight: 800, fontSize: 17, letterSpacing: 0.6, color: '#fff', textShadow: '1.5px 1.5px 0 rgba(20,22,42,0.22)' }}>ADD MY CARD</span>
        </button>
      )}

      {/* disclaimer + demoted official-card link. The link is an Amazon Associates
          link, so the "As an Amazon Associate…" disclosure stays for compliance. */}
      <div style={{ fontFamily: F_MONO, fontSize: 10, lineHeight: 1.6, color: '#A6B3A9', marginTop: 18 }}>
        Unofficial — not affiliated with or endorsed by the National Mah Jongg League.
        <br />
        Need a card?{' '}
        <a
          href={OFFICIAL_CARD_URL}
          target="_blank"
          rel="noopener noreferrer"
          onClick={() => void track('official_card_clicked')}
          style={{ color: '#9A6B54', borderBottom: '1px solid rgba(154,107,84,0.4)', textDecoration: 'none' }}
        >
          Get the official NMJL card
        </a>{' '}
        · affiliate
        <br />
        <span style={{ color: '#B7C2BA' }}>As an Amazon Associate we earn from qualifying purchases.</span>
      </div>
    </div>
  );
}
