'use client';

import { useState } from 'react';
import Tile from './Tile';
import type { Profile, TileAvatar } from '../lib/social';
import { initialOf } from '../lib/social';
import type { TileFace } from '../lib/tileArt';
import { THEMES, type ThemeId } from '../lib/themePrefs';
import { EXPERIENCE_LABEL, type Experience } from '../lib/account';
import { fxOn, setFx } from '../lib/sound';
import { getPref, setPref } from '../lib/prefs';
import AboutSheet from './AboutSheet';
import Paywall from './Paywall';
import { IconCard } from './uiIcons';
import { setPro } from '../lib/pro';
import { usePro } from '../lib/usePro';
import { useEscape } from '../lib/useEscape';

interface Props {
  profile: Profile;
  theme: ThemeId;
  experience: Experience;
  email?: string;
  groupName?: string;
  onSaveProfile: (p: Profile) => void;
  onTheme: (id: ThemeId) => void;
  onExperience: (e: Experience) => void;
  onTrophies: () => void;
  onEditCard: () => void;
  onSignOut?: () => void;
  onClose: () => void;
}

const LEVELS: Experience[] = ['beginner', 'intermediate', 'expert'];

// Small inline marks matching the design.
const BackChevron = () => (
  <svg width="11" height="13" viewBox="0 0 11 13" aria-hidden>
    <path d="M8 1L2 6.5 8 12" stroke="currentColor" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);
const CameraMark = () => (
  <svg width="14" height="13" viewBox="0 0 20 18" aria-hidden>
    <rect x="1.3" y="3.5" width="17.4" height="13" rx="2.6" fill="none" stroke="#fff" strokeWidth="2" />
    <circle cx="10" cy="10.2" r="3.6" fill="none" stroke="#fff" strokeWidth="2" />
    <path d="M6.5 3.5 L7.7 1.4 H12.3 L13.5 3.5" fill="none" stroke="#fff" strokeWidth="2" strokeLinejoin="round" />
  </svg>
);

// The "YOUR TILE" face set (design: a 5-col grid of single-color tiles).
const FACE_OPTIONS: { key: string; face: TileFace; char?: string; fixedColor?: string }[] = [
  { key: 'letter', face: 'letter' },
  { key: 'dot', face: 'dot' },
  { key: 'bam', face: 'bam' },
  { key: 'crack', face: 'crack' },
  { key: 'flower', face: 'flower' },
  { key: 'wind', face: 'wind', char: '風' },
  { key: 'dragonR', face: 'dragon', char: '中', fixedColor: '#C0392B' },
  { key: 'dragonG', face: 'dragon', char: '發', fixedColor: '#1F8A5B' },
  { key: 'joker', face: 'joker' },
  { key: 'crackZ', face: 'crack', char: '萬' },
];

// Design tile-color swatches.
const COLOR_SWATCHES = ['#10B39A', '#C0392B', '#2E86D4', '#6A3FC0', '#F5A524', '#1F8A5B', '#14162A'];

export default function SettingsSheet({
  profile,
  theme,
  experience,
  email,
  groupName = 'Tuesday Game',
  onSaveProfile,
  onTheme,
  onExperience,
  onTrophies,
  onEditCard,
  onSignOut,
  onClose,
}: Props) {
  useEscape(onClose);
  const [view, setView] = useState<'settings' | 'edit'>('settings');
  const [name, setName] = useState(profile.name);
  const [handle, setHandle] = useState(profile.handle);
  const [bio, setBio] = useState(profile.bio);
  const [avatar, setAvatar] = useState<TileAvatar>(profile.avatar);
  const [fx, setFxState] = useState(fxOn());
  const [shareDefault, setShareDefault] = useState(() => getPref('shareDefault', true));
  const [push, setPush] = useState(() => getPref('push', true));
  const [showOnBoards, setShowOnBoards] = useState(() => getPref('leaderboards', true));
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
  // Shared between the Settings grid and the Edit-Profile grid (thumb height
  // differs slightly per the design).
  function ThemeChip({ t, thumb }: { t: (typeof THEMES)[number]; thumb: number }) {
    const active = theme === t.id;
    const locked = !!t.pro && !pro;
    return (
      <button
        className="theme-chip"
        data-active={active}
        onClick={() => (locked ? setPaywall(true) : onTheme(t.id))}
      >
        <span
          className="tc-thumb"
          style={{
            height: thumb,
            backgroundColor: t.swatch.page,
            backgroundImage: `url("${t.wallpaper}")`,
          }}
        />
        <span className="tc-dot" style={{ background: t.swatch.brand }}>
          {active ? '✓' : locked ? '★' : ''}
        </span>
        <span className="tc-foot">
          <span className="tc-sq" style={{ background: t.swatch.brand }} />
          <span className="tc-name">{t.name}</span>
        </span>
      </button>
    );
  }

  /* ---- Settings view ----------------------------------------------------- */
  const settingsView = (
    <>
      <div className="set-head">
        <button className="set-back" onClick={onClose} aria-label="Close">
          <BackChevron />
        </button>
        <h1 className="set-title">Settings</h1>
      </div>

      {/* Profile card → Edit Profile */}
      <button className="prof-card" onClick={() => setView('edit')}>
        <Tile face={avatar.face} char={previewChar} color={avatar.color} size={48} />
        <span className="pc-body">
          <span className="pc-name">{name || 'You'}</span>
          <span className="pc-meta">
            @{handle || 'you'}
            {email ? ` · ${email}` : ''}
          </span>
          <span className="pc-level">★ {EXPERIENCE_LABEL[experience].toUpperCase()}</span>
        </span>
        <span className="pc-chev">›</span>
      </button>

      {/* Pro upsell */}
      <button className="pro-upsell" data-pro={pro} onClick={() => (pro ? undefined : setPaywall(true))}>
        <span className="pu-stripe" aria-hidden />
        <span className="pu-tile" aria-hidden>★</span>
        <span className="pu-body">
          <span className="pu-title">Let’s Mahj Pro</span>
          <span className="pu-sub">
            {pro ? 'Thanks for going Pro — everything’s unlocked.' : 'Unlimited tables, full stats & every theme.'}
          </span>
        </span>
        <span className="pu-cta">{pro ? 'PRO ✓' : 'GO PRO'}</span>
      </button>

      <div className="set-label">APP THEME</div>
      <div className="theme-grid2">
        {THEMES.map((t) => (
          <ThemeChip key={t.id} t={t} thumb={72} />
        ))}
      </div>

      <div className="set-label">PREFERENCES</div>
      <div className="set-list">
        <PrefRow label="Share mahjs by default" on={shareDefault} onToggle={() => { const n = !shareDefault; setShareDefault(n); setPref('shareDefault', n); }} />
        <PrefRow label="Push notifications" on={push} onToggle={() => { const n = !push; setPush(n); setPref('push', n); }} />
        <PrefRow label="Show me on leaderboards" on={showOnBoards} onToggle={() => { const n = !showOnBoards; setShowOnBoards(n); setPref('leaderboards', n); }} />
        <PrefRow label="Sound & haptics" on={fx} onToggle={toggleSound} last />
      </div>

      <div className="set-label">GAME</div>
      <div className="set-list">
        <ValueRow label="Card year" value="2025" />
        <ValueRow label="Default table" value={groupName} />
        <ValueRow label="Experience level" value={EXPERIENCE_LABEL[experience]} onClick={() => setView('edit')} />
        <ValueRow label="My card (bring your own)" onClick={onEditCard} />
        <ValueRow label="Trophies & stats" onClick={onTrophies} last />
      </div>

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
            if (confirm('Sign out of Let’s Mahj? Your saved games stay on this device.')) onSignOut();
          }}
        >
          SIGN OUT
        </button>
      )}
      <div className="set-version">Let’s Mahj · v1.0</div>
    </>
  );

  /* ---- Edit Profile view ------------------------------------------------- */
  const editView = (
    <>
      <div className="set-head" style={{ marginBottom: 4 }}>
        <button className="set-back" onClick={() => setView('settings')} aria-label="Back">
          <BackChevron />
        </button>
        <h1 className="set-title">Edit profile</h1>
      </div>
      <p className="edit-sub">Your tile, name &amp; how you play.</p>

      {/* Avatar + camera badge */}
      <div className="edit-avatar-wrap">
        <div className="edit-avatar">
          <Tile face={avatar.face} char={previewChar} color={avatar.color} size={72} />
          <span className="edit-cam" aria-hidden>
            <CameraMark />
          </span>
        </div>
      </div>

      <div className="set-label">YOUR TILE</div>
      <div className="face-grid">
        {FACE_OPTIONS.map((opt) => (
          <button
            key={opt.key}
            className="face-cell"
            data-active={isActiveFace(opt)}
            onClick={() => pickFace(opt)}
          >
            <Tile
              face={opt.face}
              char={opt.face === 'letter' ? letter : opt.char}
              color={opt.fixedColor ?? avatar.color}
              size={34}
            />
            {isActiveFace(opt) && <span className="face-check">✓</span>}
          </button>
        ))}
      </div>

      <div className="set-label">TILE COLOR</div>
      <div className="swatch-row2">
        {COLOR_SWATCHES.map((c) => (
          <button
            key={c}
            className="swatch2"
            data-active={avatar.color.toLowerCase() === c.toLowerCase()}
            style={{ background: c, boxShadow: `0 0 0 ${avatar.color.toLowerCase() === c.toLowerCase() ? 3 : 0}px ${c}, 0 2px 6px rgba(20,22,42,0.18)` }}
            onClick={() => setAvatar((a) => ({ ...a, color: c }))}
            aria-label={`Use ${c}`}
          />
        ))}
      </div>

      <div className="set-label">NAME</div>
      <input className="field2" value={name} maxLength={24} placeholder="Your name" onChange={(e) => setName(e.target.value)} />

      <div className="set-label">HANDLE</div>
      <div className="handle-field">
        <span className="handle-at">@</span>
        <input value={handle} maxLength={20} placeholder="handle" onChange={(e) => setHandle(e.target.value)} />
      </div>

      <div className="set-label">BIO</div>
      <textarea className="field2 bio" rows={2} maxLength={120} placeholder="Mahjong addict. Chasing all 70." value={bio} onChange={(e) => setBio(e.target.value)} />

      <div className="edit-divider"><span>Gameplay</span><i /></div>
      <div className="set-label">EXPERIENCE LEVEL</div>
      <div className="level-seg">
        {LEVELS.map((l) => (
          <button key={l} data-active={experience === l} onClick={() => onExperience(l)}>
            {EXPERIENCE_LABEL[l]}
          </button>
        ))}
      </div>
      <p className="edit-caption">Tailors your rules &amp; tips.</p>
      <button className="card-btn" onClick={onEditCard}>
        <IconCard size={17} /> MY CARD — BRING YOUR OWN
      </button>

      <div className="edit-divider"><span>Appearance</span><i /></div>
      <button className="sound-row" onClick={toggleSound}>
        <span className="sr-label">Sound &amp; haptics</span>
        <span className="ios-toggle" data-on={fx} aria-hidden><span className="ios-knob" /></span>
      </button>

      <div className="set-label">COLOR THEME</div>
      <div className="theme-grid2" style={{ marginBottom: 22 }}>
        {THEMES.map((t) => (
          <ThemeChip key={t.id} t={t} thumb={54} />
        ))}
      </div>

      <button className="save-changes" onClick={saveProfile}>SAVE CHANGES</button>
    </>
  );

  return (
    <div className="modal-scrim" onClick={onClose}>
      <div className="sheet set-sheet" onClick={(e) => e.stopPropagation()}>
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
