'use client';

import { useRef, useState } from 'react';
import { downscaleImage } from '../lib/image';
import { scanCardImage, type ScanRow, type ScanSummary } from '../lib/cardScan';
import { useEscape } from '../lib/useEscape';

const MAX_PANELS = 3;
// American cards usually carry ~60–70 hands. A generic genre fact (NOT this
// card's data) used only to nudge the user if a panel looks missing.
const TYPICAL_MIN = 55;

const rowKey = (r: ScanRow) => `${r.category}|${r.notation}`.toLowerCase();

/**
 * Guided trifold capture: the card opens, then the user photographs each panel
 * up close. Each panel is scanned and the hands are merged on-device, so a
 * fold-out card reads at far higher resolution than one wide shot.
 */
export default function CardScanGuide({
  onComplete,
  onCancel,
}: {
  onComplete: (rows: ScanRow[], summary: ScanSummary, year?: number) => void;
  onCancel: () => void;
}) {
  useEscape(onCancel);
  const [panelCounts, setPanelCounts] = useState<number[]>([]); // hands added per panel
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const rowsRef = useRef<ScanRow[]>([]);
  const yearRef = useRef<number | undefined>(undefined);
  const inputRef = useRef<HTMLInputElement>(null);

  const done = panelCounts.length;
  const total = rowsRef.current.length;
  const lowSoFar = done > 0 && done < MAX_PANELS && total < TYPICAL_MIN;

  async function onPick(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setBusy(true);
    setMsg(null);
    try {
      const blob = await downscaleImage(file, 1800, 0.85);
      const res = await scanCardImage(blob);
      if (!res.ok) {
        setMsg(res.error);
        return;
      }
      if (res.year && !yearRef.current) yearRef.current = res.year;
      // Merge, de-duping panels that overlap (same category + notation).
      const seen = new Set(rowsRef.current.map(rowKey));
      const fresh = res.rows.filter((r) => !seen.has(rowKey(r)));
      rowsRef.current = [...rowsRef.current, ...fresh];
      setPanelCounts((p) => [...p, fresh.length]);
    } catch {
      setMsg('Couldn’t read that photo. Try a closer, well-lit shot of the panel.');
    } finally {
      setBusy(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  }

  // Undo the most recent panel (e.g. the wrong one was uploaded first). Each
  // panel appended its fresh rows to the end, so dropping the last panel's
  // count removes exactly that panel's hands; then it can be re-added.
  function undoLast() {
    if (done === 0 || busy) return;
    const last = panelCounts[panelCounts.length - 1] ?? 0;
    rowsRef.current = rowsRef.current.slice(0, rowsRef.current.length - last);
    setPanelCounts((p) => p.slice(0, -1));
    setMsg(null);
  }

  function finish() {
    const rows = rowsRef.current;
    const sections = new Set(rows.map((r) => r.category).filter(Boolean));
    const summary: ScanSummary = {
      handCount: rows.length,
      sectionCount: sections.size,
      needsReview: rows.filter((r) => (r.issues?.length ?? 0) > 0).length,
      tileFlags: rows.filter((r) => r.tileCount !== undefined && r.tileCount !== 14).length,
      lowConfidence: rows.filter((r) => r.confidence === 'low').length,
    };
    onComplete(rows, summary, yearRef.current);
  }

  const panelState = (i: number): 'done' | 'active' | 'pending' =>
    i < done ? 'done' : i === done ? 'active' : 'pending';

  const captureLabel = busy
    ? `Reading panel ${done + 1}…`
    : done === 0
      ? 'Add panel 1 — photo or upload'
      : `Add panel ${done + 1}`;

  return (
    <div className="scan-guide-scrim" onClick={onCancel}>
      <div className="scan-guide" onClick={(e) => e.stopPropagation()}>
        {/* No `capture` attribute: the OS picker offers both "Take Photo" and
            "Photo Library", so you can shoot a panel live or upload one you
            already have. */}
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          hidden
          onChange={onPick}
        />

        {/* trifold: opens on mount, panels light up as they're scanned */}
        <div className="tri" aria-hidden>
          <div className="tri-inner">
            {[0, 1, 2].map((i) => (
              <div key={i} className={`tri-panel tri-${'lcr'[i]}`} data-state={panelState(i)}>
                <span className="tri-num">{i + 1}</span>
                <span className="tri-lines" />
              </div>
            ))}
          </div>
        </div>

        <h2 className="scan-guide-title">Scan your card</h2>
        <p className="scan-guide-sub">
          Your card folds out into <strong>3 panels</strong>. Photograph (or upload a photo of) each
          one up close — straight on, filling the frame. We’ll stitch them together.
        </p>

        {done > 0 && (
          <div className="scan-guide-tally">
            <span className="sgt-count">{total}</span> hand{total === 1 ? '' : 's'} captured
            <span className="sgt-panels"> · {done} of {MAX_PANELS} panels</span>
          </div>
        )}

        {lowSoFar && (
          <p className="scan-guide-hint">
            Most cards have ~60–70 hands — add the next panel to get them all.
          </p>
        )}
        {msg && <p className="scan-guide-err">{msg}</p>}

        {done < MAX_PANELS && (
          <button className="btn" onClick={() => inputRef.current?.click()} disabled={busy}>
            {captureLabel}
          </button>
        )}

        {done > 0 && (
          <button className="scan-undo" onClick={undoLast} disabled={busy}>
            ↩ Undo panel {done}{done === MAX_PANELS ? '' : ' — re-add it'}
          </button>
        )}

        {done > 0 && (
          <button className="btn green" style={{ marginTop: 10 }} onClick={finish} disabled={busy}>
            Done — use these {total} hand{total === 1 ? '' : 's'}
          </button>
        )}

        <button className="btn ghost" style={{ marginTop: 10 }} onClick={onCancel} disabled={busy}>
          Cancel
        </button>
      </div>
    </div>
  );
}
