'use client';

import { useState } from 'react';
import { saveAccount, type Account, type Experience } from '../lib/account';
import { isCloudEnabled, cloudSignUp, cloudSignIn, cloudGetProfile } from '../lib/cloudAuth';
import TileStrip from './TileStrip';

const LEVELS: { id: Experience; label: string; blurb: string; emoji: string }[] = [
  { id: 'beginner', label: 'Beginner', blurb: 'New to the tiles — show me the ropes.', emoji: '🌱' },
  { id: 'intermediate', label: 'Intermediate', blurb: 'I know the basics and want to improve.', emoji: '🀄' },
  { id: 'expert', label: 'Expert', blurb: 'Seasoned — give me the deep cuts.', emoji: '🐉' },
];

const emailOk = (e: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e);
const cloud = isCloudEnabled();

export default function Onboarding({ onDone }: { onDone: (a: Account) => void }) {
  const [mode, setMode] = useState<'signup' | 'signin'>('signup');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [experience, setExperience] = useState<Experience>('beginner');
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
    const account: Account = {
      username: p.username || 'You',
      email: p.email.trim().toLowerCase(),
      experience: p.experience,
      createdAt: Date.now(),
    };
    saveAccount(account); // password is never stored on-device
    onDone(account);
  }

  return (
    <div className="onboard">
      <div className="onboard-card">
        <div className="onboard-head">
          <h1>Mahjong Tracker</h1>
          <p className="sub">Clear all 70 hands. Brag to your table.</p>
          <TileStrip count={7} />
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
                  <span className="level-emoji">{l.emoji}</span>
                  <span style={{ flex: 1, textAlign: 'left' }}>
                    <span className="level-name">{l.label}</span>
                    <span className="level-blurb">{l.blurb}</span>
                  </span>
                  <span className="level-check">{experience === l.id ? '●' : '○'}</span>
                </button>
              ))}
            </div>
            <p className="onboard-note">We’ll tailor the rules &amp; tips to your level.</p>
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
