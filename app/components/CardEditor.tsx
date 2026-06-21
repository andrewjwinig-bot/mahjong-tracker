'use client';

import { useEffect, useRef, useState } from 'react';
import type { MahjongCard } from '../lib/types';
import {
  buildCard,
  saveCustomCard,
  rowsFromCard,
  loadCardPhoto,
  saveCardPhoto,
  clearCardPhoto,
  type HandRow,
} from '../lib/customCard';
import { downscaleImage } from '../lib/image';
import { IconCamera } from './uiIcons';

export default function CardEditor({
  current,
  onSave,
  onUseSample,
  onClose,
}: {
  current: MahjongCard;
  onSave: (card: MahjongCard) => void;
  onUseSample: () => void;
  onClose: () => void;
}) {
  const [year, setYear] = useState(current.year);
  const [rows, setRows] = useState<HandRow[]>(() =>
    current.source === 'custom'
      ? rowsFromCard(current)
      : [{ category: '', notation: '', points: 25, concealed: false }],
  );
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [lightbox, setLightbox] = useState(false);
  const [photoBusy, setPhotoBusy] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    let url: string | null = null;
    void loadCardPhoto().then((blob) => {
      if (blob) {
        url = URL.createObjectURL(blob);
        setPhotoUrl(url);
      }
    });
    return () => {
      if (url) URL.revokeObjectURL(url);
    };
  }, []);

  async function onPhoto(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setPhotoBusy(true);
    try {
      const blob = await downscaleImage(file, 1600, 0.85);
      await saveCardPhoto(blob);
      setPhotoUrl((prev) => {
        if (prev) URL.revokeObjectURL(prev);
        return URL.createObjectURL(blob);
      });
    } finally {
      setPhotoBusy(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  }

  async function removePhoto() {
    await clearCardPhoto();
    setPhotoUrl((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return null;
    });
  }

  function update(i: number, patch: Partial<HandRow>) {
    setRows((r) => r.map((row, n) => (n === i ? { ...row, ...patch } : row)));
  }
  function addRow() {
    setRows((r) => [...r, { category: r[r.length - 1]?.category ?? '', notation: '', points: 25, concealed: false }]);
  }
  function removeRow(i: number) {
    setRows((r) => r.filter((_, n) => n !== i));
  }

  const valid = rows.some((r) => r.notation.trim());

  function save() {
    const card = buildCard(year, rows);
    if (!card.hands.length) return;
    saveCustomCard(card);
    onSave(card);
    onClose();
  }

  return (
    <div className="editor">
      <div className="editor-bar">
        <button className="icon-btn" onClick={onClose} aria-label="Close">
          ‹
        </button>
        <div className="detail-title" style={{ flex: 1 }}>
          My Card
        </div>
        <button className="btn" style={{ width: 'auto', padding: '9px 16px' }} onClick={save} disabled={!valid}>
          Save
        </button>
      </div>

      <p className="editor-note">
        Enter the hands from your own card. Type each hand’s notation, points, and tap <strong>C</strong>{' '}
        if it must be concealed. Group hands by giving them the same category name.
      </p>

      <input ref={fileRef} type="file" accept="image/*" hidden onChange={onPhoto} />
      {photoUrl ? (
        <div className="card-photo">
          <button className="card-photo-thumb" onClick={() => setLightbox(true)} aria-label="View card photo">
            <img src={photoUrl} alt="Your card reference" />
          </button>
          <div className="card-photo-actions">
            <div className="card-photo-label" style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
              <IconCamera size={15} /> Reference photo
            </div>
            <button className="btn ghost" onClick={() => fileRef.current?.click()} disabled={photoBusy}>
              {photoBusy ? 'Saving…' : 'Replace'}
            </button>
            <button className="btn ghost" onClick={() => void removePhoto()}>
              Remove
            </button>
          </div>
        </div>
      ) : (
        <button
          className="btn ghost"
          style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 7 }}
          onClick={() => fileRef.current?.click()}
          disabled={photoBusy}
        >
          {photoBusy ? 'Saving…' : <><IconCamera size={17} /> Add a photo of your card to copy from</>}
        </button>
      )}

      <div className="editor-year">
        <label className="lbl">Card year</label>
        <input
          className="field"
          type="number"
          value={year}
          style={{ maxWidth: 120 }}
          onChange={(e) => setYear(Number(e.target.value) || new Date().getFullYear())}
        />
      </div>

      <div className="editor-rows">
        {rows.map((r, i) => (
          <div className="editor-row" key={i}>
            <input
              className="field"
              placeholder="Notation, e.g. FF 2026 2026 DDDD"
              value={r.notation}
              onChange={(e) => update(i, { notation: e.target.value })}
            />
            <div className="editor-meta">
              <input
                className="field"
                placeholder="Category"
                value={r.category}
                onChange={(e) => update(i, { category: e.target.value })}
              />
              <input
                className="field"
                type="number"
                aria-label="Points"
                value={r.points}
                style={{ maxWidth: 76 }}
                onChange={(e) => update(i, { points: Number(e.target.value) })}
              />
              <button
                className="c-toggle"
                data-on={r.concealed}
                aria-label="Concealed"
                onClick={() => update(i, { concealed: !r.concealed })}
              >
                C
              </button>
              <button className="row-del" aria-label="Delete hand" onClick={() => removeRow(i)}>
                ×
              </button>
            </div>
          </div>
        ))}
      </div>

      <button className="btn green" style={{ marginTop: 12 }} onClick={addRow}>
        ＋ Add hand
      </button>

      <button
        className="btn ghost"
        style={{ marginTop: 10 }}
        onClick={() => {
          void clearCardPhoto();
          onUseSample();
          onClose();
        }}
      >
        Use sample card instead
      </button>

      <p className="editor-fine">
        Entering your own card keeps it private to your device and ensures the app never ships a copy
        of any official card.
      </p>

      {lightbox && photoUrl && (
        <div className="photo-lightbox" onClick={() => setLightbox(false)}>
          <img src={photoUrl} alt="Your card reference" />
          <button className="lightbox-close" aria-label="Close photo">
            ×
          </button>
        </div>
      )}
    </div>
  );
}
