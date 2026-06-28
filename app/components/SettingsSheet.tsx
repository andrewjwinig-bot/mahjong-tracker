'use client';

import { useState, type CSSProperties } from 'react';
import { themeArt, CARD_TOKENS, SCRIM } from '../lib/themeArt';
import Tile from './Tile';
import type { Profile, TileAvatar } from '../lib/social';
import { initialOf } from '../lib/social';
import type { TileFace } from '../lib/tileArt';
import { THEMES, type ThemeId } from '../lib/themePrefs';
import { fxOn, setFx } from '../lib/sound';
import { getPref, setPref } from '../lib/prefs';
import { isDemoMode, setDemoData } from '../lib/demo';
import AboutSheet from './AboutSheet';
import Paywall from './Paywall';
import { ProBanner, ProCrown } from './ProUpsell';
import { setPro } from '../lib/pro';
import { usePro } from '../lib/usePro';
import { useEscape } from '../lib/useEscape';
import { useSwipeDismiss } from '../lib/useSwipeDismiss';

interface Props {
  profile: Profile;
  theme: ThemeId;
  onSaveProfile: (p: Profile) => void;
  onTheme: (id: ThemeId) => void;
  scanEnabled: boolean;
  onScanEnabled: (on: boolean) => void;
  onSignOut?: () => void;
  onClose: () => void;
}

// Small inline marks matching the design.
const CameraMark = () => (
  <svg width="14" height="13" viewBox="0 0 20 18" aria-hidden>
    <rect x="1.3" y="3.5" width="17.4" height="13" rx="2.6" fill="none" stroke="#fff" strokeWidth="2" />
    <circle cx="10" cy="10.2" r="3.6" fill="none" stroke="#fff" strokeWidth="2" />
    <path d="M6.5 3.5 L7.7 1.4 H12.3 L13.5 3.5" fill="none" stroke="#fff" strokeWidth="2" strokeLinejoin="round" />
  </svg>
);

// The "YOUR TILE" face set (design: a 5-col grid of single-color tiles).
// `pro` marks VIP-only flair (Flower + the Star/Joker) — the monogram and the
// plain suits stay free so everyone has a strong default.
const FACE_OPTIONS: { key: string; face: TileFace; char?: string; fixedColor?: string; pro?: boolean }[] = [
  { key: 'letter', face: 'letter' },
  { key: 'dot', face: 'dot' },
  { key: 'bam', face: 'bam' },
  { key: 'crack', face: 'crack' },
  { key: 'flower', face: 'flower', pro: true },
  { key: 'wind', face: 'wind', char: '風' },
  { key: 'dragonR', face: 'dragon', char: '中', fixedColor: '#C0392B' },
  { key: 'dragonG', face: 'dragon', char: '發', fixedColor: '#1F8A5B' },
  { key: 'joker', face: 'joker', pro: true },
  { key: 'crackZ', face: 'crack', char: '萬' },
];

// Design tile-color swatches.
const COLOR_SWATCHES = ['#15803D', '#C0392B', '#3B6FE0', '#6A3FC0', '#E0A21B', '#2E7D5B', '#14162A'];

// Deterministic, seeded scatter of decorative tiles on the right side of the
// profile tile (kept clear of the avatar/name on the left). Computed once.
interface ScatterTile {
  right: number; top: number; w: number; h: number; fs: number;
  flip: boolean; rot: number; dur: number; delay: number;
}
function makeScatter(): ScatterTile[] {
  let s = 730421;
  const rnd = () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; };
  const sizes = [
    { w: 27, h: 34, fs: 15 },
    { w: 23, h: 29, fs: 13 },
    { w: 20, h: 26, fs: 12 },
    { w: 18, h: 23, fs: 11 },
  ];
  const out: (ScatterTile & { cx: number; cy: number; rad: number })[] = [];
  let attempts = 0;
  while (out.length < 17 && attempts < 1400) {
    attempts++;
    const sz = sizes[Math.floor(rnd() * sizes.length)];
    const cx = rnd() * 152;
    const cy = 1 + rnd() * 82;
    const rad = Math.hypot(sz.w, sz.h) / 2;
    let ok = true;
    for (const p of out) {
      if (Math.hypot(cx - p.cx, cy - p.cy) < rad + p.rad + 2) { ok = false; break; }
    }
    if (!ok) continue;
    out.push({
      cx, cy, rad, w: sz.w, h: sz.h, fs: sz.fs,
      right: +(cx - sz.w / 2).toFixed(1),
      top: +(cy - sz.h / 2).toFixed(1),
      flip: rnd() < 0.32,
      rot: +(rnd() * 320 - 160).toFixed(1),
      dur: +(3.1 + rnd() * 1.6).toFixed(2),
      delay: +(rnd() * 1.1).toFixed(2),
    });
  }
  return out;
}
const SCATTER = makeScatter();

export default function SettingsSheet({
  profile,
  theme,
  onSaveProfile,
  onTheme,
  scanEnabled,
  onScanEnabled,
  onSignOut,
  onClose,
}: Props) {
  useEscape(onClose);
  const swipe = useSwipeDismiss(onClose);
  const [view, setView] = useState<'settings' | 'edit'>('settings');
  const [name, setName] = useState(profile.name);
  const [handle] = useState(profile.handle);
  const [bio, setBio] = useState(profile.bio);
  const [avatar, setAvatar] = useState<TileAvatar>(profile.avatar);
  const [fx, setFxState] = useState(fxOn());
  const [shareDefault, setShareDefault] = useState(() => getPref('shareDefault', true));
  const [push, setPush] = useState(() => getPref('push', true));
  const [showOnBoards, setShowOnBoards] = useState(() => getPref('leaderboards', true));
  const [demoOn, setDemoOn] = useState(() => isDemoMode());
  const [aboutOpen, setAboutOpen] = useState(false);
  const pro = usePro();
  const [paywall, setPaywall] = useState(false);

  const letter = initialOf(name);
  const previewChar = avatar.face === 'letter' ? letter : avatar.char;

  function pickFace(opt: (typeof FACE_OPTIONS)[number]) {
    setAvatar({
      face: opt.face,
      char: opt.face === 'letter' ? letter : opt.char,
      color: opt.fixedColor ?? avatar.color,
    });
  }
  function isActiveFace(opt: (typeof FACE_OPTIONS)[number]) {
    return (
      avatar.face === opt.face &&
      (opt.face === 'letter' ? true : (opt.char ?? undefined) === avatar.char)
    );
  }

  function saveProfile() {
    onSaveProfile({
      name: name.trim() || 'You',
      handle: (handle.trim().replace(/^@+/, '') || 'you').toLowerCase(),
      bio: bio.trim(),
      avatar: { ...avatar, char: avatar.face === 'letter' ? letter : avatar.char },
    });
    setView('settings');
  }

  function toggleSound() {
    const next = !fx;
    setFxState(next);
    setFx(next);
  }

  // A theme chip — banner thumbnail + accent dot (check when active) + name.
  // Full-bleed generated art + centered name; selected = brand-colored border
  // (no check). Pro themes show a gold lock and open the paywall instead.
  function ThemeChip({ t }: { t: (typeof THEMES)[number] }) {
    const active = theme === t.id;
    const locked = !!t.pro && !pro;
    const tok = CARD_TOKENS[t.id];
    return (
      <button
        className="tcard"
        data-selected={active || undefined}
        data-locked={locked || undefined}
        onClick={() => (locked ? setPaywall(true) : onTheme(t.id))}
        style={
          {
            '--art': themeArt(t.id),
            '--ground': tok.ground,
            '--name-color': tok.name,
            '--name-shadow': tok.shadow,
            '--scrim': SCRIM[tok.scrim],
          } as CSSProperties
        }
      >
        <span className="tcard-art" aria-hidden />
        <span className="tcard-scrim" aria-hidden />
        <span className="tcard-name">{t.name}</span>
        {locked && <span className="tcard-pro" aria-label="Pro theme">🔒 PRO</span>}
      </button>
    );
  }

  /* ---- Settings view ----------------------------------------------------- */
  const settingsView = (
    <>
      {/* Drag-to-dismiss lives on this handle only, so taps on the toggles,
          theme chips, and rows below are never intercepted by the gesture. */}
      <div
        className="grab grab-drag"
        onTouchStart={swipe.onTouchStart}
        onTouchMove={swipe.onTouchMove}
        onTouchEnd={swipe.onTouchEnd}
      />
      <div className="set-head-main">
        <h1 className="set-title-main">Settings</h1>
        <button className="set-close" onClick={onClose} aria-label="Close settings">✕</button>
      </div>

      {/* Profile tile → Edit Profile. Deep themed hero with a bobbing tile
          scatter (right side), corner glow, and the user's avatar. */}
      <button className="prof-tile" onClick={() => setView('edit')}>
        <span className="pt-scatter" aria-hidden>
          {SCATTER.map((p, i) => (
            <span
              key={i}
              className={`pt-tile${p.flip ? ' flip' : ''}`}
              style={
                {
                  right: p.right,
                  top: p.top,
                  width: p.w,
                  height: p.h,
                  fontSize: p.fs,
                  color: avatar.color,
                  '--r': `${p.rot}deg`,
                  animationDuration: `${p.dur}s`,
                  animationDelay: `${p.delay}s`,
                } as CSSProperties
              }
            >
              {p.flip ? '' : previewChar || letter}
            </span>
          ))}
        </span>
        <span className="pt-glow" aria-hidden />
        <span className="pt-avatar">
          <Tile face={avatar.face} char={previewChar} color={avatar.color} size={50} />
        </span>
        <span className="pt-text">
          <span className="pt-name">{name || 'You'}</span>
          <span className="pt-handle">@{handle || 'you'}</span>
        </span>
      </button>

      {/* Theme picker — kept right at the top so switching is one tap away. */}
      <div className="set-label">APP THEME</div>
      <div className="theme-grid2">
        {[...THEMES]
          .sort((a, b) => Number(!!a.pro) - Number(!!b.pro))
          .map((t) => (
            <ThemeChip key={t.id} t={t} />
          ))}
      </div>

      {/* Pro upsell */}
      {pro ? (
        <div className="pro-active">
          <span className="pro-active-tile" aria-hidden>
            <ProCrown size={22} />
          </span>
          <span className="probanner-text">
            <span className="probanner-title">
              You’re<span className="probanner-pro"> VIP</span>
            </span>
            <span className="probanner-sub">Thanks for joining the club — everything’s unlocked.</span>
          </span>
          <span className="pro-active-badge">VIP ✓</span>
        </div>
      ) : (
        <ProBanner onClick={() => setPaywall(true)} sub="Unlimited tables, full stats & every theme." />
      )}

      <div className="set-label">PREFERENCES</div>
      <div className="set-list">
        <PrefRow label="Share mahjs by default" on={shareDefault} onToggle={() => { const n = !shareDefault; setShareDefault(n); setPref('shareDefault', n); }} />
        <PrefRow label="Push notifications" on={push} onToggle={() => { const n = !push; setPush(n); setPref('push', n); }} />
        <PrefRow label="Show me on leaderboards" on={showOnBoards} onToggle={() => { const n = !showOnBoards; setShowOnBoards(n); setPref('leaderboards', n); }} />
        <PrefRow label="Sound & haptics" on={fx} onToggle={toggleSound} last />
      </div>

      <div className="set-label">GAME</div>
      <div className="set-list">
        <PrefRow
          label="Card scanning (beta)"
          on={scanEnabled}
          onToggle={() => onScanEnabled(!scanEnabled)}
          last
        />
      </div>

      <div className="set-label">DEMO DATA</div>
      <div className="set-list">
        <PrefRow
          label="Sample card, friends &amp; feed"
          on={demoOn}
          onToggle={() => {
            const n = !demoOn;
            setDemoOn(n);
            setDemoData(n);
            // Re-seed/clear by reloading into the chosen mode.
            window.location.reload();
          }}
          last
        />
      </div>
      <p className="set-hint">
        On = the app is filled with sample content to preview. Off = the real,
        empty app. Turn this off before launch.
      </p>

      <div className="set-label">ACCOUNT</div>
      <div className="set-list">
        <ValueRow label="Change password" value="Soon" />
        <ValueRow label="Help & rules" onClick={() => setAboutOpen(true)} />
        <ValueRow label="Privacy & terms" onClick={() => setAboutOpen(true)} last />
      </div>

      {onSignOut && (
        <button
          className="signout"
          onClick={() => {
            if (confirm('Sign out of Club Mahj? Your saved games stay on this device.')) onSignOut();
          }}
        >
          SIGN OUT
        </button>
      )}
      <div className="set-version">Club Mahj · v1.0</div>
    </>
  );

  /* ---- Edit Profile view ------------------------------------------------- */
  const editView = (
    <div className="edit-screen">
      {/* Header band — grab handle implies swipe-down; tapping it returns to Settings */}
      <div className="edit-band" onClick={() => setView('settings')}>
        <span className="edit-band-hatch" aria-hidden />
        <span className="grab edit-band-grab" aria-hidden />
        <span className="edit-band-tiles" aria-hidden>
          <Tile face="dragon" char="中" color="#C0392B" size={30} />
          <Tile face="dragon" char="發" color="#1F8A5B" size={26} />
          <Tile face="dot" size={24} />
        </span>
        <h1 className="edit-band-title">Edit profile</h1>
      </div>

      {/* Pinned identity header — overlaps the band, live-previews the profile */}
      <div className="id-header">
        <span className="id-glow" aria-hidden />
        <div className="id-stack">
          <span className="id-back" aria-hidden />
          <span className="id-front">
            <Tile face={avatar.face} char={previewChar} color={avatar.color} size={82} />
          </span>
          <span className="id-cam" aria-hidden>
            <CameraMark />
          </span>
        </div>
        <div className="id-name">{name || 'You'}</div>
        <div className="id-handle">@{handle || 'you'}</div>
      </div>

      {/* Form */}
      <div className="edit-form">
        <div className="set-label">YOUR TILE</div>
        <div className="face-grid">
          {FACE_OPTIONS.map((opt) => {
            const locked = !!opt.pro && !pro;
            return (
              <button
                key={opt.key}
                className="face-cell"
                data-active={isActiveFace(opt)}
                data-locked={locked || undefined}
                onClick={() => (locked ? setPaywall(true) : pickFace(opt))}
              >
                <Tile
                  face={opt.face}
                  char={opt.face === 'letter' ? letter : opt.char}
                  color={opt.fixedColor ?? avatar.color}
                  size={36}
                />
                {locked && <span className="face-lock" aria-label="VIP tile">🔒</span>}
              </button>
            );
          })}
        </div>

        <div className="set-label">TILE COLOR</div>
        <div className="swatch-row2">
          {COLOR_SWATCHES.map((c) => (
            <button
              key={c}
              className="swatch2"
              data-active={avatar.color.toLowerCase() === c.toLowerCase()}
              style={{ background: c, color: c }}
              onClick={() => setAvatar((a) => ({ ...a, color: c }))}
              aria-label={`Use ${c}`}
            />
          ))}
        </div>

        <div className="set-label">NAME</div>
        <input className="field2" value={name} maxLength={24} placeholder="Your name" onChange={(e) => setName(e.target.value)} />

        <div className="set-label">BIO</div>
        <textarea className="field2 bio" rows={2} maxLength={120} placeholder="Mahjong addict. Chasing all 70." value={bio} onChange={(e) => setBio(e.target.value)} />
      </div>

      {/* Save bar */}
      <div className="edit-savebar">
        <button className="edit-cancel" onClick={() => setView('settings')}>CANCEL</button>
        <button className="save-changes edit-save" onClick={saveProfile}>SAVE CHANGES</button>
      </div>
    </div>
  );

  return (
    <div className="modal-scrim" onClick={onClose}>
      <div
        className="sheet set-sheet"
        onClick={(e) => e.stopPropagation()}
        style={swipe.style}
      >
        {view === 'settings' ? settingsView : editView}
      </div>

      {aboutOpen && <AboutSheet onClose={() => setAboutOpen(false)} />}
      {paywall && (
        <Paywall
          onUnlock={() => {
            setPro(true);
            setPaywall(false);
          }}
          onClose={() => setPaywall(false)}
        />
      )}
    </div>
  );
}

function PrefRow({ label, on, onToggle, last }: { label: string; on: boolean; onToggle: () => void; last?: boolean }) {
  return (
    <button className="set-row" data-last={!!last} onClick={onToggle}>
      <span className="sr-label">{label}</span>
      <span className="ios-toggle" data-on={on} aria-hidden><span className="ios-knob" /></span>
    </button>
  );
}

function ValueRow({ label, value, onClick, last }: { label: string; value?: string; onClick?: () => void; last?: boolean }) {
  return (
    <button className="set-row" data-last={!!last} onClick={onClick} disabled={!onClick}>
      <span className="sr-label">{label}</span>
      {value && <span className="sr-value">{value}</span>}
      {onClick && <span className="sr-chev">›</span>}
    </button>
  );
}
