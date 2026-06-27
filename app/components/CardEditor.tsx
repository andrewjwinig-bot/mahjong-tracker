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
import { IconCamera } from './uiIcons';
import { useEscape } from '../lib/useEscape';

export default function CardEditor({
  current,
  scanEnabled = false,
  autoScan = false,
  onSave,
  onClose,
}: {
  current: MahjongCard;
  scanEnabled?: boolean;
  /** Open straight into the photo/upload capture (from "Scan my card"). */
  autoScan?: boolean;
  onSave: (card: MahjongCard) => void;
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
  // Per-row validation flags from the scan (index-aligned with rows); cleared
  // as the user fixes a line. A "review queue" so nothing dubious slips through.
  const [flags, setFlags] = useState<string[][]>([]);
  // After a scan we show a calm, confident result: only the few flagged lines
  // up front, the full list tucked behind an explicit Edit toggle.
  const [scanned, setScanned] = useState(false);
  const [editing, setEditing] = useState(false);

  // "Scan my card" opens straight into the capture flow, skipping the manual
  // editor entirely.
  useEffect(() => {
    if (autoScan && scanEnabled) setGuideOpen(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // The guided trifold scan finished → adopt its merged rows (each scanned from
  // YOUR photos, stitched on-device) into the editable review.
  function applyScan(scanRows: ScanRow[], _summary: ScanSummary, scanYear?: number) {
    if (scanYear) setYear(scanYear);
    setRows(
      scanRows.map((r) => ({
        category: r.category,
        notation: r.notation,
        points: r.points,
        concealed: r.concealed,
      })),
    );
    setFlags(scanRows.map((r) => r.issues ?? []));
    setScanned(true);
    setEditing(false);
    setGuideOpen(false);
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

  const reviewCount = flags.filter((x) => x.length).length;
  const valid = rows.some((r) => r.notation.trim());

  function save() {
    const card = buildCard(year, rows);
    if (!card.hands.length) return;
    // We no longer keep a reference photo — purge any saved from older versions.
    void clearCardPhoto();
    saveCustomCard(card);
    onSave(card);
    onClose();
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

      {scanned ? (
        <>
          <div className="scan-done">
            <div className="scan-done-emoji" aria-hidden>🀄</div>
            <div className="scan-done-title">
              Your {year} card — {rows.length} hand{rows.length === 1 ? '' : 's'}
            </div>
            <div className="scan-done-sub">
              {reviewCount > 0
                ? `${reviewCount} line${reviewCount === 1 ? '' : 's'} worth a quick look — the rest checked out.`
                : 'Locked in for the season — every line is a complete 14-tile hand.'}
            </div>
          </div>

          {reviewCount > 0 && (
            <div className="quick-check">
              <div className="quick-check-head">
                Quick check · {reviewCount} to confirm
              </div>
              <p className="quick-check-hint">
                These didn’t look like complete hands. Fix each one — or leave it and edit anytime.
              </p>
              {rows.map((_, i) => (flags[i]?.length ? renderRow(i) : null))}
            </div>
          )}

          <button className="btn" style={{ marginTop: 14 }} onClick={save} disabled={!valid}>
            {reviewCount > 0 ? 'Looks good — start tracking' : 'Start tracking'}
          </button>

          <button className="btn ghost" style={{ marginTop: 10 }} onClick={() => setEditing((s) => !s)}>
            {editing ? 'Hide hands' : 'Edit hands'}
          </button>

          {editing && (
            <>
              {yearField}
              <div className="editor-rows" style={{ marginTop: 12 }}>
                {rows.map((_, i) => renderRow(i))}
              </div>
              <button className="btn green" style={{ marginTop: 12 }} onClick={addRow}>
                ＋ Add hand
              </button>
            </>
          )}
        </>
      ) : (
        <>
          <p className="editor-note">
            Enter the hands from your own card. Type each hand’s notation, points, and tap <strong>C</strong>{' '}
            if it must be concealed. Group hands by giving them the same category name.
          </p>

          {scanEnabled && (
            <button
              className="btn"
              style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 7 }}
              onClick={() => setGuideOpen(true)}
            >
              <IconCamera size={17} /> Scan my card
            </button>
          )}

          {yearField}

          <div className="editor-rows">{rows.map((_, i) => renderRow(i))}</div>
          <button className="btn green" style={{ marginTop: 12 }} onClick={addRow}>
            ＋ Add hand
          </button>
        </>
      )}

      <p className="editor-fine">
        Entering your own card keeps it private to your device and ensures the app never ships a copy
        of any official card. Club Mahj is unofficial and is not affiliated with or endorsed by the
        National Mah Jongg League.
      </p>
    </div>
  );
}
