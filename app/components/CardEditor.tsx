'use client';

import { useEffect, useState } from 'react';
import type { MahjongCard } from '../lib/types';
import {
  buildCard,
  saveCustomCard,
  rowsFromCard,
  clearCardPhoto,
  type HandRow,
} from '../lib/customCard';
import type { ScanRow, ScanSummary } from '../lib/cardScan';
import CardScanGuide from './CardScanGuide';
import { useEscape } from '../lib/useEscape';

export default function CardEditor({
  current,
  scanEnabled = false,
  autoScan = false,
  onSave,
  onScanComplete,
  onClose,
}: {
  current: MahjongCard;
  scanEnabled?: boolean;
  /** Open straight into the photo/upload capture (from "Scan my card"). */
  autoScan?: boolean;
  onSave: (card: MahjongCard) => void;
  /** Guided scan finished and committed — land on My Card with a celebration. */
  onScanComplete?: (info: { count: number; year: number }) => void;
  onClose: () => void;
}) {
  useEscape(onClose);
  const [year, setYear] = useState(current.year);
  const [rows, setRows] = useState<HandRow[]>(() =>
    current.source === 'custom'
      ? rowsFromCard(current)
      : [{ category: '', notation: '', points: 25, concealed: false }],
  );
  const [guideOpen, setGuideOpen] = useState(false);
  // Per-row validation flags (index-aligned with rows); cleared as the user
  // fixes a line. Surfaced beside a row in the manual editor.
  const [flags, setFlags] = useState<string[][]>([]);

  // "Scan my card" opens straight into the capture flow, skipping the manual
  // editor entirely.
  useEffect(() => {
    if (autoScan && scanEnabled) setGuideOpen(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // The guided trifold scan finished → adopt its merged rows (each scanned from
  // YOUR photos, stitched on-device) and go straight to the card. The flow
  // confirms each panel as it's read, so there's no separate review step: Done
  // commits and lands on My Card with the "hands saved" toast + confetti.
  function applyScan(scanRows: ScanRow[], _summary: ScanSummary, scanYear?: number) {
    const mapped: HandRow[] = scanRows.map((r) => ({
      category: r.category,
      notation: r.notation,
      points: r.points,
      concealed: r.concealed,
    }));
    const nextYear = scanYear ?? year;
    setGuideOpen(false);
    const card = buildCard(nextYear, mapped);
    if (!card.hands.length) return; // nothing read — stay put, keep manual entry
    void clearCardPhoto();
    saveCustomCard(card);
    onSave(card);
    onScanComplete?.({ count: card.hands.length, year: card.year });
    onClose();
  }

  function update(i: number, patch: Partial<HandRow>) {
    setRows((r) => r.map((row, n) => (n === i ? { ...row, ...patch } : row)));
    // Editing a flagged line is the user resolving it — clear its flag.
    setFlags((f) => (f[i]?.length ? f.map((x, n) => (n === i ? [] : x)) : f));
  }
  function addRow() {
    setRows((r) => [...r, { category: r[r.length - 1]?.category ?? '', notation: '', points: 25, concealed: false }]);
    setFlags((f) => [...f, []]);
  }
  function removeRow(i: number) {
    setRows((r) => r.filter((_, n) => n !== i));
    setFlags((f) => f.filter((_, n) => n !== i));
  }

  const valid = rows.some((r) => r.notation.trim());

  function commit(committedYear: number, committedRows: HandRow[]) {
    const card = buildCard(committedYear, committedRows);
    if (!card.hands.length) return;
    // We no longer keep a reference photo — purge any saved from older versions.
    void clearCardPhoto();
    saveCustomCard(card);
    onSave(card);
    onClose();
  }

  function save() {
    commit(year, rows);
  }

  function renderRow(i: number) {
    const r = rows[i];
    return (
      <div className="editor-row" key={i} data-flag={flags[i]?.length ? true : undefined}>
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
        {flags[i]?.length > 0 && (
          <ul className="row-issues">
            {flags[i].map((msg, k) => (
              <li key={k}>{msg}</li>
            ))}
          </ul>
        )}
      </div>
    );
  }

  const yearField = (
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
  );

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

      {guideOpen && <CardScanGuide onComplete={applyScan} onCancel={() => setGuideOpen(false)} />}

      {scanEnabled ? (
        <>
          <p className="editor-note">
            Scan your card and we’ll fill in every hand for you — fastest way to get set up.
          </p>
          <button className="btn empty-card-scan" onClick={() => setGuideOpen(true)}>
            Scan my card
          </button>
          <div className="editor-or">or enter by hand</div>
        </>
      ) : (
        <p className="editor-note">
          Enter the hands from your own card. Type each hand’s notation, points, and tap{' '}
          <strong>C</strong> if it must be concealed. Group hands by giving them the same category name.
        </p>
      )}

      {yearField}

      <div className="editor-rows">{rows.map((_, i) => renderRow(i))}</div>
      <button className="btn green" style={{ marginTop: 12 }} onClick={addRow}>
        ＋ Add hand
      </button>

      <p className="editor-fine">
        Entering your own card keeps it private to your device and ensures the app never ships a copy
        of any official card. Club Mahj is unofficial and is not affiliated with or endorsed by the
        National Mah Jongg League.
      </p>
    </div>
  );
}
