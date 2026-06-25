'use client';

import { useState } from 'react';
import { downloadBlob } from '../lib/shareCard';
import { track } from '../lib/analytics';
import {
  IconShare,
  IconSave,
  IconMessages,
  IconWhatsApp,
  IconX,
  IconFacebook,
  IconInstagram,
  IconCopy,
  IconFriends,
} from './brandIcons';
import { IconArrowRight } from './uiIcons';
import { useEscape } from '../lib/useEscape';
import { useSwipeDismiss } from '../lib/useSwipeDismiss';

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
  icon,
  bg,
  onClick,
}: {
  label: string;
  icon: React.ReactNode;
  bg: string;
  onClick: () => void;
}) {
  return (
    <button className="share-opt" onClick={onClick}>
      <span className="bubble" style={{ background: bg }}>
        {icon}
      </span>
      {label}
    </button>
  );
}

export default function ShareModal({ payload, groupName, onShareToGroup, onClose }: Props) {
  useEscape(onClose);
  const swipe = useSwipeDismiss(onClose);
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
      <div
        className="sheet"
        onClick={(e) => e.stopPropagation()}
        onTouchStart={swipe.onTouchStart}
        onTouchMove={swipe.onTouchMove}
        onTouchEnd={swipe.onTouchEnd}
        style={swipe.style}
      >
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
            <span className="hero-icon">
              <IconFriends size={26} />
            </span>
            <span style={{ flex: 1 }}>
              <span className="t" style={{ display: 'block' }}>
                Share to {groupName}
              </span>
              <span className="s">Drop it in your group&rsquo;s feed</span>
            </span>
            <span style={{ display: 'inline-flex', color: 'var(--muted)' }}><IconArrowRight size={20} /></span>
          </button>
        )}

        {/* Social + system destinations */}
        <div className="share-grid">
          {typeof navigator !== 'undefined' && 'share' in navigator && (
            <Opt label="Share" icon={<IconShare />} bg="var(--ink)" onClick={nativeShare} />
          )}
          {payload.image && (
            <Opt label="Save" icon={<IconSave />} bg="var(--ink)" onClick={saveImage} />
          )}
          <Opt
            label="Messages"
            icon={<IconMessages />}
            bg="#34C759"
            onClick={() => openIntent(`sms:?&body=${enc(caption)}`, 'sms')}
          />
          <Opt
            label="WhatsApp"
            icon={<IconWhatsApp />}
            bg="#25D366"
            onClick={() => openIntent(`https://wa.me/?text=${enc(caption)}`, 'whatsapp')}
          />
          <Opt
            label="X"
            icon={<IconX />}
            bg="#000000"
            onClick={() =>
              openIntent(`https://twitter.com/intent/tweet?text=${enc(text)}&url=${enc(url)}`, 'x')
            }
          />
          <Opt
            label="Facebook"
            icon={<IconFacebook />}
            bg="#1877F2"
            onClick={() =>
              openIntent(`https://www.facebook.com/sharer/sharer.php?u=${enc(url)}`, 'facebook')
            }
          />
          <Opt
            label="Instagram"
            icon={<IconInstagram />}
            bg="linear-gradient(45deg,#feda75,#fa7e1e,#d62976,#962fbf,#4f5bd5)"
            onClick={() => {
              if (payload.image) void saveImage();
              else void copyLink();
            }}
          />
          <Opt label="Copy link" icon={<IconCopy />} bg="var(--tint)" onClick={copyLink} />
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
