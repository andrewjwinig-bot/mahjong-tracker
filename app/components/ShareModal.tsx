'use client';

import { useState } from 'react';
import { downloadBlob } from '../lib/shareCard';
import { track } from '../lib/analytics';

export interface SharePayload {
  /** Sheet title, e.g. "SHARE YOUR MAHJ! 🀄" */
  title: string;
  /** Caption text used for social captions + copy. */
  text: string;
  /** Link back to the app. */
  url: string;
  /** Optional generator for a share-card PNG (wins). */
  image?: () => Promise<Blob>;
}

interface Props {
  payload: SharePayload;
  /** When present, shows the big in-app "share to your group" option. */
  groupName?: string;
  onShareToGroup?: () => void;
  onClose: () => void;
}

function Opt({
  label,
  emoji,
  onClick,
}: {
  label: string;
  emoji: string;
  onClick: () => void;
}) {
  return (
    <button className="share-opt" onClick={onClick}>
      <span className="bubble">{emoji}</span>
      {label}
    </button>
  );
}

export default function ShareModal({ payload, groupName, onShareToGroup, onClose }: Props) {
  const [status, setStatus] = useState<string | null>(null);
  const { title, text, url } = payload;
  const caption = `${text} ${url}`.trim();

  const flash = (msg: string) => {
    setStatus(msg);
    setTimeout(() => setStatus(null), 1600);
  };

  async function getImage(): Promise<File | null> {
    if (!payload.image) return null;
    const blob = await payload.image();
    return new File([blob], 'mahjong-win.png', { type: 'image/png' });
  }

  async function nativeShare() {
    void track('share_opened', { method: 'native' });
    try {
      const file = await getImage();
      const nav = navigator as Navigator & { canShare?: (d: ShareData) => boolean };
      if (file && nav.canShare?.({ files: [file] })) {
        await navigator.share({ files: [file], title, text });
      } else if (navigator.share) {
        await navigator.share({ title, text, url });
      } else {
        await navigator.clipboard?.writeText(caption);
        flash('Copied! Paste anywhere 💌');
        return;
      }
    } catch {
      /* user cancelled — no-op */
    }
  }

  async function saveImage() {
    if (!payload.image) return;
    void track('share_opened', { method: 'save_image' });
    const blob = await payload.image();
    downloadBlob(blob, 'mahjong-win.png');
    flash('Saved to your photos 📸');
  }

  async function copyLink() {
    void track('share_opened', { method: 'copy' });
    try {
      await navigator.clipboard?.writeText(caption);
      flash('Copied! 🎉');
    } catch {
      flash('Could not copy');
    }
  }

  function openIntent(href: string, method: string) {
    void track('share_opened', { method });
    window.open(href, '_blank', 'noopener,noreferrer');
  }

  const enc = encodeURIComponent;

  return (
    <div className="modal-scrim" onClick={onClose}>
      <div className="sheet" onClick={(e) => e.stopPropagation()}>
        <div className="grab" />
        <h2>{title}</h2>
        <p className="sheet-sub">Brag a little — you earned it!</p>

        {/* In-app: share to the group feed */}
        {groupName && onShareToGroup && (
          <button
            className="share-hero"
            onClick={() => {
              void track('share_opened', { method: 'group' });
              onShareToGroup();
              flash(`Posted to ${groupName}! 👯`);
            }}
          >
            <span className="emoji">👯</span>
            <span style={{ flex: 1 }}>
              <span className="t" style={{ display: 'block' }}>
                Share to {groupName}
              </span>
              <span className="s">Drop it in your group&rsquo;s feed</span>
            </span>
            <span style={{ fontSize: 22 }}>→</span>
          </button>
        )}

        {/* Social + system destinations */}
        <div className="share-grid">
          {typeof navigator !== 'undefined' && 'share' in navigator && (
            <Opt label="Share" emoji="📲" onClick={nativeShare} />
          )}
          {payload.image && <Opt label="Save" emoji="📸" onClick={saveImage} />}
          <Opt
            label="Messages"
            emoji="💬"
            onClick={() => openIntent(`sms:?&body=${enc(caption)}`, 'sms')}
          />
          <Opt
            label="WhatsApp"
            emoji="🟢"
            onClick={() => openIntent(`https://wa.me/?text=${enc(caption)}`, 'whatsapp')}
          />
          <Opt
            label="X"
            emoji="✖️"
            onClick={() =>
              openIntent(`https://twitter.com/intent/tweet?text=${enc(text)}&url=${enc(url)}`, 'x')
            }
          />
          <Opt
            label="Facebook"
            emoji="📘"
            onClick={() =>
              openIntent(`https://www.facebook.com/sharer/sharer.php?u=${enc(url)}`, 'facebook')
            }
          />
          <Opt
            label="Insta"
            emoji="📷"
            onClick={() => {
              if (payload.image) void saveImage();
              else void copyLink();
            }}
          />
          <Opt label="Copy link" emoji="🔗" onClick={copyLink} />
        </div>

        {status && (
          <p
            style={{
              textAlign: 'center',
              marginTop: 16,
              color: 'var(--green)',
              fontWeight: 800,
            }}
          >
            {status}
          </p>
        )}

        <button className="btn ghost" style={{ marginTop: 18 }} onClick={onClose}>
          Done
        </button>
      </div>
    </div>
  );
}
