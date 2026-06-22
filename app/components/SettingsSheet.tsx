'use client';

import { useState } from 'react';
import Tile from './Tile';
import type { Profile, TileAvatar } from '../lib/social';
import { initialOf } from '../lib/social';
import type { TileFace } from '../lib/tileArt';
import { THEMES, type ThemeId } from '../lib/themePrefs';
import { EXPERIENCE_LABEL, type Experience } from '../lib/account';
import { fxOn, setFx } from '../lib/sound';
import AboutSheet from './AboutSheet';
import Paywall from './Paywall';
import { IconSettings, IconTrophy, IconCard, IconInfo, IconCrown, IconSound, IconLock } from './uiIcons';
import { isPro, setPro } from '../lib/pro';
import { useEscape } from '../lib/useEscape';

interface Props {
  profile: Profile;
  theme: ThemeId;
  experience: Experience;
  onSaveProfile: (p: Profile) => void;
  onTheme: (id: ThemeId) => void;
  onExperience: (e: Experience) => void;
  onTrophies: () => void;
  onEditCard: () => void;
  onClose: () => void;
}

const LEVELS: Experience[] = ['beginner', 'intermediate', 'expert'];

// Avatar choices: your initial + a favorite tile + a couple of jokers/dragons.
const FACE_OPTIONS: { key: string; face: TileFace; char?: string; fixedColor?: string }[] = [
  { key: 'letter', face: 'letter' },
  { key: 'crack', face: 'crack' },
  { key: 'bam', face: 'bam' },
  { key: 'dot', face: 'dot' },
  { key: 'flower', face: 'flower' },
  { key: 'wind', face: 'wind', char: '東' },
  { key: 'dragonR', face: 'dragon', char: '中', fixedColor: '#E8455F' },
  { key: 'dragonG', face: 'dragon', char: '發', fixedColor: '#1FA85B' },
  { key: 'joker', face: 'joker' },
];

const COLOR_SWATCHES = ['#0EAD96', '#E8455F', '#2F80ED', '#7C5CE0', '#E59A2B', '#1FA85B', '#2C3A57'];

export default function SettingsSheet({
  profile,
  theme,
  experience,
  onSaveProfile,
  onTheme,
  onExperience,
  onTrophies,
  onEditCard,
  onClose,
}: Props) {
  useEscape(onClose);
  const [name, setName] = useState(profile.name);
  const [handle, setHandle] = useState(profile.handle);
  const [bio, setBio] = useState(profile.bio);
  const [avatar, setAvatar] = useState<TileAvatar>(profile.avatar);
  const [fx, setFxState] = useState(fxOn());
  const [aboutOpen, setAboutOpen] = useState(false);
  const [pro, setProState] = useState(isPro());
  const [paywall, setPaywall] = useState(false);

  const letter = initialOf(name);
  // For the letter tile, the displayed character always tracks the name.
  const previewChar = avatar.face === 'letter' ? letter : avatar.char;

  function pickFace(opt: (typeof FACE_OPTIONS)[number]) {
    setAvatar({
      face: opt.face,
      char: opt.face === 'letter' ? letter : opt.char,
      color: opt.fixedColor ?? avatar.color,
    });
  }

  function pickColor(c: string) {
    setAvatar((a) => ({ ...a, color: c }));
  }

  function isActiveFace(opt: (typeof FACE_OPTIONS)[number]) {
    return avatar.face === opt.face && (opt.char ?? undefined) === (opt.face === 'letter' ? undefined : avatar.char);
  }

  function save() {
    onSaveProfile({
      name: name.trim() || 'You',
      handle: (handle.trim().replace(/^@+/, '') || 'you').toLowerCase(),
      bio: bio.trim(),
      avatar: { ...avatar, char: avatar.face === 'letter' ? letter : avatar.char },
    });
    onClose();
  }

  return (
    <div className="modal-scrim" onClick={onClose}>
      <div className="sheet" onClick={(e) => e.stopPropagation()}>
        <div className="grab" />
        <h2 style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
          Settings <IconSettings size={20} />
        </h2>
        <p className="sheet-sub">Profile, gameplay, appearance &amp; account.</p>

        <div className="set-section">Profile</div>

        {/* Avatar preview */}
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 12 }}>
          <Tile face={avatar.face} char={previewChar} color={avatar.color} size={84} />
        </div>

        {/* Avatar picker */}
        <label className="lbl">Your tile</label>
        <div className="avatar-grid">
          {FACE_OPTIONS.map((opt) => (
            <button
              key={opt.key}
              className="avatar-opt"
              data-active={isActiveFace(opt)}
              onClick={() => pickFace(opt)}
            >
              <Tile
                face={opt.face}
                char={opt.face === 'letter' ? letter : opt.char}
                color={opt.fixedColor ?? avatar.color}
                size={42}
              />
            </button>
          ))}
        </div>

        <label className="lbl" style={{ marginTop: 14 }}>
          Tile color
        </label>
        <div className="swatch-row">
          {COLOR_SWATCHES.map((c) => (
            <button
              key={c}
              className="swatch-dot"
              data-active={avatar.color.toLowerCase() === c.toLowerCase()}
              style={{ background: c }}
              onClick={() => pickColor(c)}
              aria-label={`Use ${c}`}
            />
          ))}
        </div>

        <label className="lbl" style={{ marginTop: 14 }}>
          Name
        </label>
        <input
          className="field"
          value={name}
          maxLength={24}
          placeholder="Your name"
          onChange={(e) => setName(e.target.value)}
        />

        <label className="lbl" style={{ marginTop: 12 }}>
          Handle
        </label>
        <div style={{ position: 'relative' }}>
          <span
            style={{
              position: 'absolute',
              left: 14,
              top: 13,
              fontWeight: 800,
              color: 'var(--muted)',
            }}
          >
            @
          </span>
          <input
            className="field"
            style={{ paddingLeft: 28 }}
            value={handle}
            maxLength={20}
            placeholder="handle"
            onChange={(e) => setHandle(e.target.value)}
          />
        </div>

        <label className="lbl" style={{ marginTop: 12 }}>
          Bio
        </label>
        <textarea
          className="field"
          rows={2}
          maxLength={120}
          placeholder="Mahjong addict. Chasing all 70. 🀄"
          value={bio}
          onChange={(e) => setBio(e.target.value)}
        />

        <div className="set-section">Gameplay</div>

        {/* Experience level */}
        <label className="lbl">Experience level</label>
        <div className="segmented">
          {LEVELS.map((l) => (
            <button key={l} data-active={experience === l} onClick={() => onExperience(l)}>
              {EXPERIENCE_LABEL[l]}
            </button>
          ))}
        </div>
        <p style={{ color: 'var(--muted)', fontSize: 11.5, fontWeight: 700, margin: '6px 2px 0' }}>
          Tailors your rules &amp; tips.
        </p>

        <button
          className="btn ghost"
          style={{ marginTop: 14, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}
          onClick={onEditCard}
        >
          <IconCard size={18} /> My Card (bring your own)
        </button>

        <div className="set-section">Appearance</div>

        {/* Sound + haptics */}
        <button
          type="button"
          className="fx-row"
          role="switch"
          aria-checked={fx}
          aria-label="Sound and haptics"
          onClick={() => {
            const next = !fx;
            setFxState(next);
            setFx(next);
          }}
        >
          <span style={{ display: 'inline-flex' }} aria-hidden>
            <IconSound size={20} />
          </span>
          <span style={{ flex: 1, textAlign: 'left', fontWeight: 800, fontSize: 14 }}>
            Sound &amp; haptics
          </span>
          <span className="switch" data-on={fx} aria-hidden>
            <span className="knob" />
          </span>
        </button>

        {/* Theme picker */}
        <label className="lbl" style={{ marginTop: 18 }}>
          Color theme
        </label>
        <div className="theme-grid">
          {THEMES.map((t) => {
            const locked = !!t.pro && !pro;
            return (
            <button
              key={t.id}
              className="theme-card"
              data-active={theme === t.id}
              data-locked={locked}
              style={{ background: `linear-gradient(160deg, ${t.swatch.page}, ${t.swatch.brand}30)` }}
              onClick={() => (locked ? setPaywall(true) : onTheme(t.id))}
            >
              {theme === t.id && <span className="tick">✓</span>}
              {locked && <span className="theme-lock"><IconLock size={15} /></span>}
              <Tile face={t.tile.face} char={t.tile.char} color={t.tile.color} size={52} />
              <span className="tname" style={{ color: t.dark ? '#fff' : '#243240' }}>
                {t.name}
              </span>
              <span
                className="ttag"
                style={{ color: t.dark ? 'rgba(255,255,255,0.72)' : undefined }}
              >
                {t.tagline}
              </span>
            </button>
            );
          })}
        </div>

        {!pro && (
          <button
            className="btn"
            style={{ marginTop: 16, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}
            onClick={() => setPaywall(true)}
          >
            <IconCrown size={18} /> Go Pro
          </button>
        )}

        <div className="set-section">Account</div>

        <button
          className="btn ghost"
          style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}
          onClick={onTrophies}
        >
          <IconTrophy size={18} /> Trophies &amp; Stats
        </button>

        <button
          className="btn ghost"
          style={{ marginTop: 10, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}
          onClick={() => setAboutOpen(true)}
        >
          <IconInfo size={18} /> About &amp; Legal
        </button>

        <div className="row" style={{ marginTop: 14 }}>
          <button className="btn ghost" onClick={onClose}>
            Cancel
          </button>
          <button className="btn" onClick={save}>
            Save Profile
          </button>
        </div>
      </div>

      {aboutOpen && <AboutSheet onClose={() => setAboutOpen(false)} />}
      {paywall && (
        <Paywall
          onUnlock={() => {
            setPro(true);
            setProState(true);
            setPaywall(false);
          }}
          onClose={() => setPaywall(false)}
        />
      )}
    </div>
  );
}
