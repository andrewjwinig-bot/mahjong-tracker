'use client';

import { useState } from 'react';
import { saveAccount, type Account, type Experience } from '../lib/account';
import { isCloudEnabled, cloudSignUp, cloudSignIn, cloudGetProfile } from '../lib/cloudAuth';
import TileStrip from './TileStrip';
import Tile from './Tile';
import OfficialCardCallout from './OfficialCardCallout';
import type { ReactNode } from 'react';
import type { TileFace } from '../lib/tileArt';
import type { TileAvatar } from '../lib/social';
import { IconLeaf, IconTarget, IconCrown } from './uiIcons';

// Pick-your-tile options for sign-up (mirrors the Settings avatar set). 'letter'
// uses the username's initial; the rest carry their suit glyph + color.
const TILE_OPTIONS: { key: string; face: TileFace; char?: string; color: string }[] = [
  { key: 'letter', face: 'letter', color: '#2E86D4' },
  { key: 'crackZ', face: 'crack', char: '萬', color: '#C0392B' },
  { key: 'dot', face: 'dot', color: '#2E86D4' },
  { key: 'bam', face: 'bam', color: '#15803D' },
  { key: 'flower', face: 'flower', color: '#E2568F' },
  { key: 'dragonR', face: 'dragon', char: '中', color: '#C0392B' },
  { key: 'dragonG', face: 'dragon', char: '發', color: '#15803D' },
  { key: 'wind', face: 'wind', char: '東', color: '#1A1410' },
  { key: 'joker', face: 'joker', color: '#6A3FC0' },
  { key: 'crack5', face: 'crack', char: '五', color: '#C9871A' },
];

const LEVELS: { id: Experience; label: string; blurb: string; icon: ReactNode; color: string }[] = [
  { id: 'beginner', label: 'Beginner', blurb: 'New to the tiles — show me the ropes.', icon: <IconLeaf size={20} />, color: '#C0392B' },
  { id: 'intermediate', label: 'Intermediate', blurb: 'I know the basics and want to improve.', icon: <IconTarget size={20} />, color: '#2E86D4' },
  { id: 'expert', label: 'Expert', blurb: 'Seasoned — give me the deep cuts.', icon: <IconCrown size={20} />, color: '#F5A524' },
];

// The 7-tile arc behind the wordmark — exact glyphs, suit colors and tilts from
// design frame 01 (萬 · bamboo · dot · 中 · flower · 東 · star).
const ArcBam = () => (
  <svg width="20" height="20" viewBox="0 0 100 100" aria-hidden>
    <g fill="#15803D">
      <rect x="25" y="14" width="12" height="72" rx="6" />
      <rect x="44" y="14" width="12" height="72" rx="6" />
      <rect x="63" y="14" width="12" height="72" rx="6" />
      <rect x="21" y="46" width="58" height="8" rx="4" />
    </g>
  </svg>
);
const ArcDot = () => (
  <svg width="20" height="20" viewBox="0 0 100 100" aria-hidden>
    <circle cx="50" cy="50" r="30" fill="none" stroke="#2E86D4" strokeWidth="11" />
    <circle cx="50" cy="50" r="12" fill="#2E86D4" />
  </svg>
);
const ArcFlower = () => (
  <svg width="22" height="22" viewBox="0 0 100 100" aria-hidden>
    <g fill="#E2568F">
      {[0, 72, 144, 216, 288].map((a) => (
        <ellipse key={a} cx="50" cy="23" rx="13" ry="23" transform={`rotate(${a} 50 50)`} />
      ))}
    </g>
    <circle cx="50" cy="50" r="11" fill="#F4C84A" />
    <circle cx="50" cy="50" r="5" fill="#C97A1A" />
  </svg>
);
const ArcStar = () => (
  <svg width="22" height="22" viewBox="0 0 100 100" aria-hidden>
    <path d="M50 8 L61 38 L94 39 L68 60 L77 93 L50 74 L23 93 L32 60 L6 39 L39 38 Z" fill="#F5A524" />
    <path d="M50 30 L56 45 L72 46 L59 56 L64 72 L50 63 L36 72 L41 56 L28 46 L44 45 Z" fill="#FFD874" />
    <circle cx="50" cy="52" r="5" fill="#C97A1A" />
  </svg>
);

const ARC: { node: ReactNode; rot: number; color?: string }[] = [
  { node: '萬', rot: -9, color: '#C0392B' },
  { node: <ArcBam />, rot: 5 },
  { node: <ArcDot />, rot: -4 },
  { node: '中', rot: 6, color: '#C0392B' },
  { node: <ArcFlower />, rot: -5 },
  { node: '東', rot: 4, color: '#1A1410' },
  { node: <ArcStar />, rot: -7 },
];

function SignupArc() {
  return (
    <div className="su-arc" aria-hidden>
      {ARC.map((t, i) => (
        <span key={i} className="su-tile" style={{ transform: `rotate(${t.rot}deg)`, color: t.color }}>
          {t.node}
        </span>
      ))}
    </div>
  );
}

const emailOk = (e: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e);
const cloud = isCloudEnabled();

export default function Onboarding({ onDone }: { onDone: (a: Account, avatar?: TileAvatar) => void }) {
  const [step, setStep] = useState<'form' | 'card'>('form');
  const [account, setAccount] = useState<Account | null>(null);
  const [mode, setMode] = useState<'signup' | 'signin'>('signup');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [experience, setExperience] = useState<Experience>('beginner');
  const [avatarIdx, setAvatarIdx] = useState(0);

  // The tile chosen at sign-up → a TileAvatar (letter face uses the initial).
  const chosenAvatar = (): TileAvatar => {
    const opt = TILE_OPTIONS[avatarIdx];
    const initial = username.trim().charAt(0).toUpperCase() || 'Y';
    return { face: opt.face, char: opt.face === 'letter' ? initial : opt.char, color: opt.color };
  };
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const signingIn = cloud && mode === 'signin';

  async function submit() {
    if (!signingIn && !username.trim()) return setError('Pick a username.');
    if (!emailOk(email)) return setError('Enter a valid email.');
    if (password.length < 6) return setError('Password must be at least 6 characters.');
    setError(null);

    // Local-only mode (no cloud configured): keep the on-device account.
    if (!cloud) {
      finish({ username: username.trim(), email, experience });
      return;
    }

    // Cloud mode: real sign-up / sign-in via Supabase.
    setBusy(true);
    try {
      if (mode === 'signup') {
        await cloudSignUp(email.trim(), password, username.trim(), experience);
        finish({ username: username.trim(), email, experience });
      } else {
        await cloudSignIn(email.trim(), password);
        const profile = await cloudGetProfile();
        finish({
          username: profile?.username || email.split('@')[0],
          email,
          experience: profile?.experience || experience,
        });
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Something went wrong. Try again.');
    } finally {
      setBusy(false);
    }
  }

  function finish(p: { username: string; email: string; experience: Experience }) {
    const acc: Account = {
      username: p.username || 'You',
      email: p.email.trim().toLowerCase(),
      experience: p.experience,
      createdAt: Date.now(),
    };
    saveAccount(acc); // password is never stored on-device
    setAccount(acc);
    setStep('card'); // one-time "get the official card" prompt before entering
  }

  // Step 2: encourage buying the official card on first launch.
  if (step === 'card' && account) {
    return (
      <div className="onboard">
        <div className="onboard-card">
          <div className="onboard-head">
            <h1>You’re in, {account.username}!</h1>
            <p className="sub">One thing before you play…</p>
            <TileStrip count={7} />
          </div>
          <OfficialCardCallout />
          <button className="btn" style={{ marginTop: 16 }} onClick={() => onDone(account, chosenAvatar())}>
            Start playing
          </button>
          <button className="btn ghost" style={{ marginTop: 10 }} onClick={() => onDone(account, chosenAvatar())}>
            I already have my card
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="onboard">
      <div className="onboard-card">
        <div className="onboard-head">
          <div className="logo onboard-logo">
            <div className="logo-kicker">LET’S</div>
            <div className="logo-word">Mahj</div>
          </div>
          <p className="sub">The Original Mahjong Social Network</p>
          <SignupArc />
        </div>

        {!signingIn && (
          <>
            <label className="lbl">Username</label>
            <input
              className="field"
              value={username}
              maxLength={24}
              placeholder="tilequeen"
              onChange={(e) => setUsername(e.target.value)}
            />
          </>
        )}

        <label className="lbl" style={{ marginTop: 12 }}>
          Email
        </label>
        <input
          className="field"
          type="email"
          autoCapitalize="off"
          value={email}
          placeholder="you@email.com"
          onChange={(e) => setEmail(e.target.value)}
        />

        <label className="lbl" style={{ marginTop: 12 }}>
          Password
        </label>
        <input
          className="field"
          type="password"
          value={password}
          placeholder={signingIn ? 'Your password' : 'At least 6 characters'}
          onChange={(e) => setPassword(e.target.value)}
        />

        {!signingIn && (
          <>
            <label className="lbl" style={{ marginTop: 16 }}>
              Experience level
            </label>
            <div className="level-list">
              {LEVELS.map((l) => (
                <button
                  key={l.id}
                  className="level-opt"
                  data-active={experience === l.id}
                  onClick={() => setExperience(l.id)}
                >
                  <span className="level-tile" style={{ color: l.color }} aria-hidden>
                    {l.icon}
                  </span>
                  <span style={{ flex: 1, textAlign: 'left' }}>
                    <span className="level-name">{l.label}</span>
                    <span className="level-blurb">{l.blurb}</span>
                  </span>
                  <span className="level-check" aria-hidden />
                </button>
              ))}
            </div>
            <p className="onboard-note">We’ll tailor the rules &amp; tips to your level.</p>

            <label className="lbl" style={{ marginTop: 16 }}>
              Your tile
            </label>
            <div className="avatar-grid">
              {TILE_OPTIONS.map((opt, i) => (
                <button
                  key={opt.key}
                  className="avatar-opt"
                  data-active={avatarIdx === i}
                  onClick={() => setAvatarIdx(i)}
                  aria-label={`Tile ${i + 1}`}
                >
                  <Tile
                    face={opt.face}
                    char={opt.face === 'letter' ? username.trim().charAt(0).toUpperCase() || 'Y' : opt.char}
                    color={opt.color}
                    size={34}
                  />
                  {avatarIdx === i && <span className="avatar-check">✓</span>}
                </button>
              ))}
            </div>
            <p className="onboard-note">This is your tile across the feed &amp; tables.</p>
          </>
        )}

        {error && <p className="onboard-error">{error}</p>}

        <button className="btn" style={{ marginTop: 14 }} onClick={submit} disabled={busy}>
          {busy ? 'Just a sec…' : signingIn ? 'Sign In' : 'Create Account'}
        </button>

        {cloud && (
          <button
            className="btn ghost"
            style={{ marginTop: 10 }}
            onClick={() => {
              setError(null);
              setMode((m) => (m === 'signup' ? 'signin' : 'signup'));
            }}
          >
            {mode === 'signup' ? 'Already have an account? Sign in' : 'New here? Create account'}
          </button>
        )}

        <p className="onboard-fine">
          {cloud
            ? 'Your account syncs securely to the cloud.'
            : 'On-device demo account — your data stays on this phone. Cloud accounts & sync arrive with the App Store release.'}{' '}
          Not affiliated with the National Mah Jongg League; sample hands are original and illustrative.
        </p>
      </div>
    </div>
  );
}
