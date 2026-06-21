'use client';

import { useState } from 'react';
import type { MahjongCard } from '../lib/types';
import { buildCard, saveCustomCard, rowsFromCard, type HandRow } from '../lib/customCard';

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
    </div>
  );
}
