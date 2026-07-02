import { ImageResponse } from 'next/og';

// Branded social-share preview shown when a Club Mahj link is pasted into
// iMessage / WhatsApp / Slack / X. Built around the real app logo (the two-tile
// fan) so shared links look like the app. Generated at the edge; 1200×630 is the
// standard OG/Twitter large-card size.
export const runtime = 'edge';
export const alt = 'Club Mahj — the original mahj social network';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

const FELT = '#2E7D43';
const FELT_DEEP = '#14402A';
const CREAM = '#FBF7EC';
const GOLD = '#C9871A';

export default async function OpengraphImage() {
  // The real logo, colocated so it loads at the edge without a network round-trip.
  const logo = (await fetch(new URL('./og-logo.png', import.meta.url)).then((r) =>
    r.arrayBuffer(),
  )) as ArrayBuffer;

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
          background: `radial-gradient(circle at 50% 34%, ${FELT}, ${FELT_DEEP})`,
          fontFamily: 'system-ui, sans-serif',
          position: 'relative',
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          // next/og accepts an ArrayBuffer here at runtime.
          src={logo as unknown as string}
          width={206}
          height={206}
          alt=""
          style={{ borderRadius: 46, boxShadow: '0 18px 40px rgba(7,24,13,0.45)' }}
        />

        <div
          style={{
            fontSize: 26,
            fontWeight: 800,
            letterSpacing: 13,
            color: 'rgba(255,255,255,0.82)',
            marginTop: 30,
            marginLeft: 13,
          }}
        >
          CLUB
        </div>
        <div style={{ fontSize: 116, fontWeight: 800, color: CREAM, lineHeight: 1, marginTop: 2 }}>
          Mahj
        </div>

        <div
          style={{
            display: 'flex',
            marginTop: 26,
            padding: '12px 28px',
            borderRadius: 999,
            background: 'rgba(0,0,0,0.22)',
            border: '2px solid rgba(255,255,255,0.18)',
            fontSize: 26,
            fontWeight: 700,
            color: CREAM,
          }}
        >
          Track wins · Clear the card · Play with friends
        </div>

        <div
          style={{
            marginTop: 24,
            fontSize: 21,
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
