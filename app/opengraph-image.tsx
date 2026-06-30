import { ImageResponse } from 'next/og';

// Branded social-share preview shown when a Club Mahj link is pasted into
// iMessage / WhatsApp / Slack / X. Generated at the edge; no external fonts so
// it renders reliably. 1200×630 is the standard OG/Twitter large-card size.
export const runtime = 'edge';
export const alt = 'Club Mahj — the original mahj social network';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

const FELT = '#2E7D43';
const FELT_DEEP = '#14402A';
const CREAM = '#FBF7EC';
const RED = '#C0392B';
const GOLD = '#C9871A';

function Tile({ char, color, rot }: { char: string; color: string; rot: number }) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: 86,
        height: 112,
        borderRadius: 16,
        background: 'linear-gradient(180deg,#FFFEFB,#F1EBDD)',
        boxShadow: '0 10px 22px rgba(7,24,13,0.4)',
        transform: `rotate(${rot}deg)`,
        fontSize: 56,
        fontWeight: 800,
        color,
      }}
    >
      {char}
    </div>
  );
}

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          background: `radial-gradient(circle at 50% 36%, ${FELT}, ${FELT_DEEP})`,
          fontFamily: 'system-ui, sans-serif',
          position: 'relative',
        }}
      >
        <div style={{ display: 'flex', gap: 22, marginBottom: 44 }}>
          <Tile char="萬" color={RED} rot={-8} />
          <Tile char="發" color="#15803D" rot={4} />
          <Tile char="東" color="#2F80ED" rot={-3} />
          <Tile char="中" color={RED} rot={7} />
        </div>

        <div
          style={{
            fontSize: 30,
            fontWeight: 800,
            letterSpacing: 14,
            color: 'rgba(255,255,255,0.82)',
            marginLeft: 14,
          }}
        >
          CLUB
        </div>
        <div style={{ fontSize: 168, fontWeight: 800, color: CREAM, lineHeight: 1, marginTop: 2 }}>
          Mahj
        </div>

        <div
          style={{
            display: 'flex',
            marginTop: 38,
            padding: '14px 30px',
            borderRadius: 999,
            background: 'rgba(0,0,0,0.22)',
            border: '2px solid rgba(255,255,255,0.18)',
            fontSize: 30,
            fontWeight: 700,
            color: CREAM,
          }}
        >
          Track wins · Clear the card · Play with friends
        </div>

        <div
          style={{
            position: 'absolute',
            bottom: 40,
            fontSize: 24,
            fontWeight: 700,
            letterSpacing: 3,
            color: GOLD,
          }}
        >
          THE ORIGINAL MAHJ SOCIAL NETWORK
        </div>
      </div>
    ),
    { ...size },
  );
}
