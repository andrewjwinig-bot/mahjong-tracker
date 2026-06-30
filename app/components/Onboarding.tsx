'use client';

import { useState } from 'react';
import { saveAccount, type Account, type Experience } from '../lib/account';
import { isCloudEnabled, cloudSignUp, cloudSignIn, cloudGetProfile } from '../lib/cloudAuth';
import TileStrip from './TileStrip';
import Tile from './Tile';
import OfficialCardCallout from './OfficialCardCallout';
import { TileFan } from './BrandMark';
import type { TileFace } from '../lib/tileArt';
import type { TileAvatar } from '../lib/social';

// Pick-your-tile options for sign-up (mirrors the Settings avatar set). Tile 0
// is the bamboo monogram of the username's initial; the rest are hand-drawn
// mahjong motifs shown in their original colors. VIP-only tiles (joker, star,
// plum) are not offered at sign-up.
const TILE_OPTIONS: { key: string; face: TileFace; char?: string; color: string }[] = [
  { key: 'letter', face: 'letter', color: '#15803D' },
  { key: 'crane', face: 'motif', char: 'crane', color: 'multi' },
  { key: 'dragon', face: 'motif', char: 'dragon', color: 'multi' },
  { key: 'peony', face: 'motif', char: 'peony', color: 'multi' },
  { key: 'wheel_flower', face: 'motif', char: 'wheel_flower', color: 'multi' },
  { key: 'bamboo_stalk', face: 'motif', char: 'bamboo_stalk', color: 'multi' },
  { key: 'chung_red', face: 'motif', char: 'chung_red', color: 'multi' },
  { key: 'wan', face: 'motif', char: 'wan', color: 'multi' },
];

const LEVELS: { id: Experience; label: string; blurb: string; detail: string; dots: number; color: string }[] = [
  {
    id: 'beginner',
    label: 'New to the game',
    blurb: 'I’ve never played. Start me from the very basics.',
    detail: 'We’ll open with the Learn Mahjong lessons.',
    dots: 1,
    color: '#C0392B',
  },
  {
    id: 'intermediate',
    label: 'Played a few times',
    blurb: 'I’ve sat at a table but I’m still learning the card.',
    detail: 'Rules stay one tap away; tips get tactical.',
    dots: 2,
    color: '#2E86D4',
  },
  {
    id: 'expert',
    label: 'Regular player',
    blurb: 'I play often and know the rules cold.',
    detail: 'Skip the basics — strategy & defense up front.',
    dots: 3,
    color: '#F5A524',
  },
];

// Tap-to-select tile "wobble" (design frame 01 — the level icon shimmies).
function wobbleTile(el: Element | null) {
  if (!el || typeof (el as HTMLElement).animate !== 'function') return;
  if (typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return;
  (el as HTMLElement).animate(
    [
      { transform: 'translateX(0) rotate(0deg)' },
      { transform: 'translateX(-3px) rotate(-7deg)', offset: 0.15 },
      { transform: 'translateX(3px) rotate(7deg)', offset: 0.38 },
      { transform: 'translateX(-2px) rotate(-5deg)', offset: 0.6 },
      { transform: 'translateX(2px) rotate(4deg)', offset: 0.8 },
      { transform: 'translateX(0) rotate(0deg)' },
    ],
    { duration: 520, easing: 'ease-in-out' },
  );
}

const emailOk = (e: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e);
const cloud = isCloudEnabled();

export default function Onboarding({
  onDone,
}: {
  onDone: (a: Account, avatar?: TileAvatar, opts?: { isNewUser?: boolean }) => void;
}) {
  const [step, setStep] = useState<'form' | 'card'>('form');
  // Sign-up is a 3-step wizard: 0 = account, 1 = experience, 2 = tile avatar.
  const [wstep, setWstep] = useState(0);
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

  // Validate just the account fields (wizard step 0) before advancing.
  function accountError(): string | null {
    if (!username.trim()) return 'Pick a username.';
    if (!emailOk(email)) return 'Enter a valid email.';
    if (password.length < 6) return 'Password must be at least 6 characters.';
    return null;
  }

  function nextStep() {
    if (wstep === 0) {
      const err = accountError();
      if (err) return setError(err);
      setError(null);
      setWstep(1);
    } else if (wstep === 1) {
      setWstep(2);
    } else {
      void submit();
    }
  }

  function backStep() {
    setError(null);
    setWstep((w) => Math.max(0, w - 1));
  }

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
        // Returning sign-in: skip the first-launch "get the card" prompt.
        finish(
          {
            username: profile?.username || email.split('@')[0],
            email,
            experience: profile?.experience || experience,
          },
          { showCard: false },
        );
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Something went wrong. Try again.');
    } finally {
      setBusy(false);
    }
  }

  function finish(
    p: { username: string; email: string; experience: Experience },
    opts?: { showCard?: boolean },
  ) {
    const acc: Account = {
      username: p.username || 'You',
      email: p.email.trim().toLowerCase(),
      experience: p.experience,
      createdAt: Date.now(),
    };
    saveAccount(acc); // password is never stored on-device
    setAccount(acc);
    if (opts?.showCard === false) {
      // Returning sign-in → straight into the app, no first-run tour.
      onDone(acc, undefined, { isNewUser: false });
    } else {
      setStep('card'); // first sign-up: one-time "get the official card" prompt
    }
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
          <button
            className="btn"
            style={{ marginTop: 16 }}
            onClick={() => onDone(account, chosenAvatar(), { isNewUser: true })}
          >
            Start playing
          </button>
          <button
            className="btn ghost"
            style={{ marginTop: 10 }}
            onClick={() => onDone(account, chosenAvatar(), { isNewUser: true })}
          >
            I already have my card
          </button>
        </div>
      </div>
    );
  }

  // Returning user (cloud) — a single compact sign-in form.
  if (signingIn) {
    return (
      <div className="onboard">
        <div className="onboard-card">
          <div className="onboard-head">
            <TileFan size={108} className="onboard-fan" />
            <div className="logo onboard-logo">
              <div className="logo-kicker">CLUB</div>
              <div className="logo-word">Mahj</div>
            </div>
            <p className="sub">Welcome back</p>
          </div>

          <label className="lbl">Email</label>
          <input
            className="field"
            type="email"
            autoCapitalize="off"
            value={email}
            placeholder="you@email.com"
            onChange={(e) => setEmail(e.target.value)}
          />
          <label className="lbl" style={{ marginTop: 12 }}>Password</label>
          <input
            className="field"
            type="password"
            value={password}
            placeholder="Your password"
            onChange={(e) => setPassword(e.target.value)}
          />

          {error && <p className="onboard-error">{error}</p>}

          <button className="btn" style={{ marginTop: 14 }} onClick={() => void submit()} disabled={busy}>
            {busy ? 'Just a sec…' : 'Sign In'}
          </button>
          <button
            className="btn ghost"
            style={{ marginTop: 10 }}
            onClick={() => {
              setError(null);
              setMode('signup');
            }}
          >
            New here? Create account
          </button>
          <p className="onboard-fine">
            Your account syncs securely to the cloud. Not affiliated with the National Mah Jongg League;
            sample hands are original and illustrative.
          </p>
        </div>
      </div>
    );
  }

  // New user — a short 3-step wizard: account → experience → tile.
  return (
    <div className="onboard">
      <div className="onboard-card">
        <div className="onboard-steps">
          <button className="onboard-back" onClick={wstep === 0 ? undefined : backStep} disabled={wstep === 0} aria-label="Back">‹</button>
          <div className="onboard-dots" aria-hidden>
            {[0, 1, 2].map((n) => (
              <span key={n} className="onboard-dot" data-on={n <= wstep} data-cur={n === wstep} />
            ))}
          </div>
          <span className="onboard-step-tag">{wstep + 1}/3</span>
        </div>

        <div className="onboard-step" key={wstep}>
          {wstep === 0 && (
            <>
              <div className="onboard-head onboard-head-tight">
                <TileFan size={104} className="onboard-fan" />
                <div className="logo onboard-logo">
                  <div className="logo-kicker">CLUB</div>
                  <div className="logo-word">Mahj</div>
                </div>
                <p className="sub">The Original Mahjong Social Network</p>
              </div>

              <label className="lbl">Username</label>
              <input className="field" value={username} maxLength={24} placeholder="tilequeen" onChange={(e) => setUsername(e.target.value)} />
              <label className="lbl" style={{ marginTop: 12 }}>Email</label>
              <input className="field" type="email" autoCapitalize="off" value={email} placeholder="you@email.com" onChange={(e) => setEmail(e.target.value)} />
              <label className="lbl" style={{ marginTop: 12 }}>Password</label>
              <input className="field" type="password" value={password} placeholder="At least 6 characters" onChange={(e) => setPassword(e.target.value)} />
            </>
          )}

          {wstep === 1 && (
            <>
              <h2 className="onboard-step-title">How well do you know the game?</h2>
              <p className="onboard-step-sub">We’ll tailor your rules &amp; tips — change it anytime in Settings.</p>
              <div className="level-list">
                {LEVELS.map((l) => (
                  <button
                    key={l.id}
                    className="level-opt"
                    data-active={experience === l.id}
                    style={{ ['--lv' as string]: l.color } as React.CSSProperties}
                    onClick={(e) => {
                      setExperience(l.id);
                      wobbleTile(e.currentTarget.querySelector('.level-tile'));
                    }}
                  >
                    <span className="level-tile" aria-hidden>
                      <Tile face="dot" count={l.dots} size={32} />
                    </span>
                    <span style={{ flex: 1, textAlign: 'left' }}>
                      <span className="level-name">{l.label}</span>
                      <span className="level-blurb">{l.blurb}</span>
                      <span className="level-detail">{l.detail}</span>
                    </span>
                    <span className="level-check" aria-hidden />
                  </button>
                ))}
              </div>
            </>
          )}

          {wstep === 2 && (
            <>
              <h2 className="onboard-step-title">Pick your tile</h2>
              <p className="onboard-step-sub">This is you across the feed &amp; tables.</p>
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
                      size={36}
                    />
                    {avatarIdx === i && <span className="avatar-check">✓</span>}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>

        {error && <p className="onboard-error">{error}</p>}

        <button className="btn" style={{ marginTop: 16 }} onClick={nextStep} disabled={busy}>
          {wstep < 2 ? 'Continue' : busy ? 'Just a sec…' : 'Create Account'}
        </button>

        {wstep === 0 && cloud && (
          <button
            className="btn ghost"
            style={{ marginTop: 10 }}
            onClick={() => {
              setError(null);
              setMode('signin');
            }}
          >
            Already have an account? Sign in
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
