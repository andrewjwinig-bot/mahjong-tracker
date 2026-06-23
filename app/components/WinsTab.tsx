'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import type { MahjongCard, Win } from '../lib/types';
import { downscaleImage } from '../lib/image';
import { buildShareCard } from '../lib/shareCard';
import { captionFor, appUrl } from '../lib/share';
import { recordShare, track } from '../lib/analytics';
import ShareModal from './ShareModal';
import { useConfetti } from './Confetti';
import { colorNotation } from '../lib/theme';
import Tile from './Tile';
import { IconShare, IconTrash, IconCamera } from './uiIcons';

interface Props {
  card: MahjongCard;
  handNotes: Record<string, string>;
  wins: Win[];
  groupName: string;
  onAddWin: (win: Win) => void;
  onRemoveWin: (id: string) => void;
  onBump: (handId: string, delta: number) => void;
  onPostToGroup: (win: Win) => void;
}

export default function WinsTab({
  card,
  handNotes,
  wins,
  groupName,
  onAddWin,
  onRemoveWin,
  onBump,
  onPostToGroup,
}: Props) {
  const [open, setOpen] = useState(false);
  const [shareWin, setShareWin] = useState<Win | null>(null);
  const { celebrate } = useConfetti();

  return (
    <div className="screen">
      <header className="app-header">
        <h1>Your Mahjs</h1>
        <p className="sub">Log every MAHJ with a photo &amp; note — then brag a little.</p>
      </header>

      <button className="mahj-hero" onClick={() => setOpen(true)}>
        <span className="mahj-hero-shine" aria-hidden />
        <Tile face="crack" size={34} className="mahj-hero-tile" />
        <span className="mahj-hero-label">CALL MAHJ!</span>
      </button>

      {wins.length === 0 ? (
        <div className="empty">
          <div className="big">🀅🀄🀅</div>
          No mahjs yet. Call “Mahjong!” at your next game and log it here!
        </div>
      ) : (
        <div style={{ marginTop: 16 }}>
          {wins.map((w) => (
            <WinCard
              key={w.id}
              win={w}
              groupName={groupName}
              onRemove={() => onRemoveWin(w.id)}
              onPostToGroup={onPostToGroup}
            />
          ))}
        </div>
      )}

      {open && (
        <LogWinSheet
          card={card}
          handNotes={handNotes}
          groupName={groupName}
          onClose={() => setOpen(false)}
          onSave={(win, opts) => {
            onAddWin(win);
            // Logging a MAHJ advances your card (and the leaderboard)…
            if (win.handId) onBump(win.handId, +1);
            // …and optionally lands in the feed.
            if (opts.shareToGroup) onPostToGroup(win);
            setOpen(false);
            const pts = win.handId
              ? card.hands.find((h) => h.id === win.handId)?.points
              : undefined;
            celebrate({
              title: 'I Got Mahj! 🎉',
              handLabel: win.handLabel,
              points: pts,
              posted: opts.shareToGroup,
              onShare: () => setShareWin(win),
              onPost: opts.shareToGroup ? undefined : () => onPostToGroup(win),
            });
          }}
        />
      )}

      {shareWin && (
        <ShareModal
          payload={{
            title: 'Share Your Mahj! 🀄',
            text: captionFor(shareWin),
            url: appUrl(),
            image: () => buildShareCard(shareWin, shareWin.handLabel),
          }}
          groupName={groupName}
          onShareToGroup={() => onPostToGroup(shareWin)}
          onClose={() => setShareWin(null)}
        />
      )}
    </div>
  );
}

export function WinCard({
  win,
  groupName,
  onRemove,
  onPostToGroup,
}: {
  win: Win;
  groupName: string;
  onRemove: () => void;
  onPostToGroup: (win: Win) => void;
}) {
  const [url, setUrl] = useState<string | null>(null);
  const [shareOpen, setShareOpen] = useState(false);

  useEffect(() => {
    if (!win.photo) return;
    const u = URL.createObjectURL(win.photo);
    setUrl(u);
    return () => URL.revokeObjectURL(u);
  }, [win.photo]);

  const when = new Date(win.createdAt).toLocaleDateString(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });

  function openShare() {
    void recordShare(win.handLabel);
    setShareOpen(true);
  }

  return (
    <div className="win">
      {url && <img className="photo" src={url} alt="Win photo" />}
      <div className="body">
        <div className="when">{when}</div>
        {win.handLabel && (
          <p className="note" style={{ fontWeight: 800 }}>
            🀄 {win.handLabel}
          </p>
        )}
        {win.note && <p className="note">{win.note}</p>}
        <div className="actions">
          <button
            className="btn coral"
            style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 7 }}
            onClick={openShare}
          >
            <IconShare size={17} /> Share
          </button>
          <button className="btn ghost" onClick={onRemove} aria-label="Delete mahj">
            <IconTrash size={18} />
          </button>
        </div>
      </div>

      {shareOpen && (
        <ShareModal
          payload={{
            title: 'Share Your Mahj! 🀄',
            text: captionFor(win),
            url: appUrl(),
            image: () => buildShareCard(win, win.handLabel),
          }}
          groupName={groupName}
          onShareToGroup={() => onPostToGroup(win)}
          onClose={() => setShareOpen(false)}
        />
      )}
    </div>
  );
}

export function LogWinSheet({
  card,
  handNotes,
  groupName,
  onClose,
  onSave,
}: {
  card: MahjongCard;
  handNotes: Record<string, string>;
  groupName: string;
  onClose: () => void;
  onSave: (win: Win, opts: { shareToGroup: boolean }) => void;
}) {
  const [handId, setHandId] = useState<string>('');
  const [note, setNote] = useState('');
  const [photo, setPhoto] = useState<Blob | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [shareToGroup, setShareToGroup] = useState(true);
  const [busy, setBusy] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const labelFor = (id: string) => {
    const h = card.hands.find((x) => x.id === id);
    return h ? handNotes[h.id] ?? h.notation : null;
  };

  const previewUrl = useMemo(() => preview, [preview]);
  useEffect(
    () => () => {
      if (preview) URL.revokeObjectURL(preview);
    },
    [preview],
  );

  async function onPhoto(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setBusy(true);
    try {
      const blob = await downscaleImage(file);
      setPhoto(blob);
      if (preview) URL.revokeObjectURL(preview);
      setPreview(URL.createObjectURL(blob));
    } finally {
      setBusy(false);
    }
  }

  function save() {
    const win: Win = {
      id: crypto.randomUUID(),
      handId: handId || null,
      handLabel: handId ? labelFor(handId) : null,
      note: note.trim(),
      photo,
      createdAt: Date.now(),
    };
    void track('win_logged', { hasPhoto: !!photo, hasHand: !!handId, sharedToGroup: shareToGroup });
    onSave(win, { shareToGroup });
  }

  const { burst } = useConfetti();
  // A rain of tiles when the sheet opens — "before the tiles get scooped up".
  useEffect(() => {
    burst({ x: window.innerWidth / 2, y: 90 });
  }, [burst]);

  const [cat, setCat] = useState<string>(''); // '' = Freeform

  return (
    <div className="modal-scrim" onClick={onClose}>
      <div className="sheet log-sheet" onClick={(e) => e.stopPropagation()}>
        {/* Celebratory header band */}
        <div className="log-band">
          <div className="grab light" />
          <Tile face="crack" size={40} className="log-band-tile" />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div className="log-kicker">LOG YOUR WIN</div>
            <div className="log-title">CALL MAHJ!</div>
            <div className="log-band-sub">Log it before the tiles get scooped up.</div>
          </div>
        </div>

        <div className="log-body">
          <label className="lbl">Which hand?</label>
          <div className="chip-wrap">
            <button className="cat-chip" data-active={cat === ''} onClick={() => { setCat(''); setHandId(''); }}>
              Freeform
            </button>
            {card.categories.map((c) => (
              <button
                key={c}
                className="cat-chip"
                data-active={cat === c}
                onClick={() => { setCat(c); setHandId(''); }}
              >
                {c}
              </button>
            ))}
          </div>

          {cat !== '' && (
            <div className="line-pick">
              <div className="line-pick-head">Pick your line — check the one you won</div>
              {card.hands
                .filter((h) => h.category === cat)
                .map((h) => {
                  const picked = handId === h.id;
                  return (
                    <button
                      key={h.id}
                      className="line-row"
                      data-picked={picked}
                      onClick={() => setHandId(picked ? '' : h.id)}
                    >
                      <span className="check" data-checked={picked}>
                        {picked ? '✓' : ''}
                      </span>
                      <span className="notation">
                        {colorNotation(handNotes[h.id] ?? h.notation).map((g, i, arr) => (
                          <span key={i} className={g.cls}>
                            {g.text}
                            {i < arr.length - 1 ? ' ' : ''}
                          </span>
                        ))}
                      </span>
                    </button>
                  );
                })}
            </div>
          )}

          <label className="lbl" style={{ marginTop: 16 }}>
            Note <span style={{ color: 'var(--muted)' }}>— optional</span>
          </label>
          <textarea
            className="field"
            rows={2}
            placeholder="Tuesday game with the girls…"
            value={note}
            onChange={(e) => setNote(e.target.value)}
          />

          <label className="lbl" style={{ marginTop: 16 }}>
            Photo <span style={{ color: 'var(--muted)' }}>— optional</span>
          </label>
          <input ref={fileRef} type="file" accept="image/*" hidden onChange={onPhoto} />
          {previewUrl && <img className="photo" src={previewUrl} alt="Preview" style={{ marginBottom: 8 }} />}
          <button className="photo-add" onClick={() => fileRef.current?.click()} disabled={busy}>
            <IconCamera size={18} /> {busy ? 'Processing…' : previewUrl ? 'CHANGE PHOTO' : 'ADD PHOTO'}
          </button>

          <button
            type="button"
            className="share-row"
            role="switch"
            aria-checked={shareToGroup}
            data-on={shareToGroup}
            onClick={() => setShareToGroup((v) => !v)}
          >
            <Tile face="flower" size={34} />
            <span style={{ flex: 1, textAlign: 'left' }}>
              <span className="share-row-title">Share to {groupName}</span>
              <span className="share-row-sub">PLAYERS WILL SEE IT</span>
            </span>
            <span className="ios-toggle" data-on={shareToGroup} aria-hidden>
              <span className="ios-knob" />
            </span>
          </button>

          <div className="log-footer">
            <button className="act-btn" onClick={onClose}>
              CANCEL
            </button>
            <button className="mahj-hero log-save" onClick={save} disabled={busy}>
              <span className="mahj-hero-shine" aria-hidden />
              <Tile face="crack" size={26} className="mahj-hero-tile" />
              <span className="mahj-hero-label">SAVE MY MAHJ</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
