'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import type { MahjongCard, Win } from '../lib/types';
import type { FeedPost } from '../lib/social';
import { downscaleImage, rotateImage } from '../lib/image';
import { buildShareCard } from '../lib/shareCard';
import { captionFor, appUrl } from '../lib/share';
import { recordShare, track } from '../lib/analytics';
import ShareModal from './ShareModal';
import { useConfetti } from './Confetti';
import { colorNotation } from '../lib/theme';
import Tile from './Tile';
import { IconShare, IconTrash, IconCamera, IconRotate } from './uiIcons';
import { useSwipeDismiss } from '../lib/useSwipeDismiss';

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
        <div className="empty empty-mahjs">
          <div className="em-tiles" aria-hidden>
            <span className="em-tile em-l"><Tile face="bam" color="#1FA85B" size={46} /></span>
            <span className="em-tile em-c"><Tile face="crack" size={58} /></span>
            <span className="em-tile em-r"><Tile face="flower" color="#E8455F" size={46} /></span>
            <span className="em-spark em-spark-1" aria-hidden>✦</span>
            <span className="em-spark em-spark-2" aria-hidden>✦</span>
          </div>
          <div className="em-title">No mahjs yet</div>
          <div className="em-sub">Call “Mahjong!” at your next game and log it here.</div>
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
            // …and optionally posts into your table's chat.
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
  post,
  onRemove,
  onPostToGroup,
}: {
  win: Win;
  groupName: string;
  /** The matching feed post, if this mahj was shared — for likes/comments. */
  post?: FeedPost | null;
  onRemove: () => void;
  onPostToGroup: (win: Win) => void;
}) {
  const [url, setUrl] = useState<string | null>(null);
  const [shareOpen, setShareOpen] = useState(false);

  useEffect(() => {
    // Prefer the on-device Blob; fall back to the synced cloud URL (e.g. a win
    // restored on another device, where there's no local photo).
    if (win.photo) {
      const u = URL.createObjectURL(win.photo);
      setUrl(u);
      return () => URL.revokeObjectURL(u);
    }
    setUrl(win.photoUrl ?? null);
  }, [win.photo, win.photoUrl]);

  const when = new Date(win.createdAt).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
  });

  function openShare() {
    void recordShare(win.handLabel);
    setShareOpen(true);
  }

  return (
    <div className="win-row">
      {url ? (
        <img
          className="win-thumb"
          src={url}
          alt="Win photo"
          style={{ objectPosition: `50% ${win.photoPos ?? 50}%` }}
        />
      ) : (
        <span className="win-check" aria-hidden>
          ✓
        </span>
      )}

      <div className="win-main">
        <div className="notation">
          {win.handLabel ? (
            colorNotation(win.handLabel).map((g, i, arr) => (
              <span key={i} className={g.cls}>
                {g.text}
                {i < arr.length - 1 ? ' ' : ''}
              </span>
            ))
          ) : (
            <span style={{ color: 'var(--muted)' }}>Freeform mahj</span>
          )}
        </div>
        <div className="win-meta">
          <span>{when}</span>
          {win.note && <span className="win-note">· {win.note}</span>}
          {post ? (
            <span className="win-social">
              ❤️ {post.likes} · 💬 {post.comments.length}
            </span>
          ) : (
            <span className="win-social muted">· in {groupName}</span>
          )}
        </div>
      </div>

      <button className="win-act" onClick={openShare} aria-label="Share mahj">
        <IconShare size={16} />
      </button>
      <button className="win-act danger" onClick={onRemove} aria-label="Delete mahj">
        <IconTrash size={15} />
      </button>

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
  initialHandId,
  onClose,
  onSave,
}: {
  card: MahjongCard;
  handNotes: Record<string, string>;
  groupName: string;
  /** Pre-select this hand (e.g. tapping a row on the Card). */
  initialHandId?: string | null;
  onClose: () => void;
  onSave: (win: Win, opts: { shareToGroup: boolean }) => void;
}) {
  const initialHand = initialHandId ? card.hands.find((h) => h.id === initialHandId) : null;
  const [handId, setHandId] = useState<string>(initialHand?.id ?? '');
  // When a hand was pre-selected (tapping a Card row), skip the picker and show
  // it as already chosen — the user shouldn't have to re-select it.
  const [picking, setPicking] = useState<boolean>(!initialHand);
  const [note, setNote] = useState('');
  const [photo, setPhoto] = useState<Blob | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  // Vertical focal point (0–100%) so the user can frame the cover-cropped photo.
  const [photoPos, setPhotoPos] = useState(50);
  const [shareToGroup, setShareToGroup] = useState(true);
  const [busy, setBusy] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const frameRef = useRef<HTMLDivElement>(null);
  const drag = useRef<{ y: number; pos: number } | null>(null);

  function onDragStart(e: React.PointerEvent) {
    if (!preview) return;
    drag.current = { y: e.clientY, pos: photoPos };
    e.currentTarget.setPointerCapture?.(e.pointerId);
  }
  function onDragMove(e: React.PointerEvent) {
    if (!drag.current) return;
    const h = frameRef.current?.clientHeight || 240;
    const delta = e.clientY - drag.current.y;
    // Pull down → reveal the top of the photo (lower focal %).
    const next = drag.current.pos - (delta / h) * 100;
    setPhotoPos(Math.max(0, Math.min(100, next)));
  }
  function onDragEnd() {
    drag.current = null;
  }

  function removePhoto() {
    if (preview) URL.revokeObjectURL(preview);
    setPreview(null);
    setPhoto(null);
    setPhotoPos(50);
    if (fileRef.current) fileRef.current.value = '';
  }

  async function rotate() {
    if (!photo || busy) return;
    setBusy(true);
    try {
      const rotated = await rotateImage(photo, 1);
      setPhoto(rotated);
      // Orientation changed — reset the focal point to center.
      setPhotoPos(50);
      if (preview) URL.revokeObjectURL(preview);
      setPreview(URL.createObjectURL(rotated));
    } catch {
      alert('Sorry, that photo couldn’t be rotated. Try a different one.');
    } finally {
      setBusy(false);
    }
  }

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
      setPhotoPos(50);
      if (preview) URL.revokeObjectURL(preview);
      setPreview(URL.createObjectURL(blob));
    } catch {
      // Some formats (e.g. HEIC on unsupported browsers) can't be decoded —
      // skip rather than crash, and let the user pick a different photo.
      alert('Sorry, that photo couldn’t be added. Try a different one (JPEG or PNG).');
    } finally {
      setBusy(false);
      // Allow re-picking the same file after a failure.
      if (fileRef.current) fileRef.current.value = '';
    }
  }

  function save() {
    const win: Win = {
      id: crypto.randomUUID(),
      handId: handId || null,
      handLabel: handId ? labelFor(handId) : null,
      note: note.trim(),
      photo,
      photoPos: photo ? photoPos : undefined,
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

  const [cat, setCat] = useState<string>(initialHand?.category ?? ''); // '' = Freeform
  const swipe = useSwipeDismiss(onClose);

  return (
    <div className="modal-scrim" onClick={onClose}>
      <div
        className="sheet log-sheet"
        onClick={(e) => e.stopPropagation()}
        onTouchStart={swipe.onTouchStart}
        onTouchMove={swipe.onTouchMove}
        onTouchEnd={swipe.onTouchEnd}
        style={swipe.style}
      >
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

          {handId && !picking ? (
            // A hand is already chosen (tapped from the Card) — show it, don't re-pick.
            <div className="line-pick">
              <div className="line-row" data-picked>
                <span className="check" data-checked>
                  ✓
                </span>
                <span className="notation">
                  {colorNotation(handNotes[handId] ?? labelFor(handId) ?? '').map((g, i, arr) => (
                    <span key={i} className={g.cls}>
                      {g.text}
                      {i < arr.length - 1 ? ' ' : ''}
                    </span>
                  ))}
                </span>
                <button
                  className="change-hand"
                  onClick={() => {
                    setPicking(true);
                  }}
                >
                  Change
                </button>
              </div>
            </div>
          ) : (
            <>
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
                          onClick={() => {
                            setHandId(picked ? '' : h.id);
                            if (!picked) setPicking(false);
                          }}
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
            </>
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
          {previewUrl && (
            <div
              className="log-photo-frame"
              ref={frameRef}
              onPointerDown={onDragStart}
              onPointerMove={onDragMove}
              onPointerUp={onDragEnd}
              onPointerCancel={onDragEnd}
            >
              <img
                className="log-photo"
                src={previewUrl}
                alt="Preview"
                draggable={false}
                style={{ objectPosition: `50% ${photoPos}%` }}
              />
              <div className="log-photo-tools">
                <button
                  className="log-photo-tool"
                  type="button"
                  onClick={(e) => { e.stopPropagation(); void rotate(); }}
                  onPointerDown={(e) => e.stopPropagation()}
                  disabled={busy}
                  aria-label="Rotate photo"
                >
                  <IconRotate size={15} />
                </button>
                <button
                  className="log-photo-tool"
                  type="button"
                  onClick={(e) => { e.stopPropagation(); removePhoto(); }}
                  onPointerDown={(e) => e.stopPropagation()}
                  aria-label="Remove photo"
                >
                  <IconTrash size={15} />
                </button>
              </div>
              <span className="log-photo-hint" aria-hidden>
                Drag to reposition · tap ⟳ to rotate
              </span>
            </div>
          )}
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
