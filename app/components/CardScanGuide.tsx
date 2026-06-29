'use client';

import { useRef, useState } from 'react';
import { downscaleImage } from '../lib/image';
import { scanCardImage, type ScanRow, type ScanSummary } from '../lib/cardScan';
import { useEscape } from '../lib/useEscape';

const MAX_PANELS = 3;

// Type system per the design: Bricolage display, Hanken body, Space Mono meta.
const F_DISPLAY = "var(--font-display), 'Bricolage Grotesque', sans-serif";
const F_BODY = "var(--font-app), 'Hanken Grotesk', sans-serif";
const F_MONO = "var(--font-mono), 'Space Mono', monospace";

const rowKey = (r: ScanRow) => `${r.category}|${r.notation}`.toLowerCase();

type Step = 'intro' | 'capture' | 'captured';

// Diagonal hatch overlay shared by every primary action button.
const HATCH = 'repeating-linear-gradient(-45deg,#fff 0,#fff 2px,transparent 2px,transparent 11px)';

const CameraIcon = ({ size = 16, stroke = '#fff', sw = 2.2 }: { size?: number; stroke?: string; sw?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={stroke} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round" style={{ position: 'relative' }}>
    <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
    <circle cx="12" cy="13" r="3.5" />
  </svg>
);

const CheckIcon = ({ size = 15, stroke = '#2E7D43', sw = 3.6 }: { size?: number; stroke?: string; sw?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={stroke} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 6L9 17l-5-5" />
  </svg>
);

/**
 * Guided trifold capture. The user photographs each of the 3 card panels one at
 * a time; each panel is read by OCR and the hands are merged on-device. Drives a
 * { step, panel, captured[] } state machine: intro → capture → captured → … →
 * Done, which hands the merged rows back to the editor to land on the card.
 */
export default function CardScanGuide({
  onComplete,
  onCancel,
}: {
  onComplete: (rows: ScanRow[], summary: ScanSummary, year?: number) => void;
  onCancel: () => void;
}) {
  useEscape(onCancel);

  const [step, setStep] = useState<Step>('intro');
  const [panel, setPanel] = useState(1); // active panel, 1–3
  const [captured, setCaptured] = useState<boolean[]>([false, false, false]);
  const [panelCounts, setPanelCounts] = useState<number[]>([0, 0, 0]); // hands read per panel
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const rowsRef = useRef<ScanRow[]>([]);
  const yearRef = useRef<number | undefined>(undefined);
  const camRef = useRef<HTMLInputElement>(null); // native camera (capture)
  const galRef = useRef<HTMLInputElement>(null); // photo library

  const doneCount = captured.filter(Boolean).length;
  const total = panelCounts.reduce((s, n) => s + (n || 0), 0);
  const handsThis = panelCounts[panel - 1] || 0;
  const isLast = panel >= MAX_PANELS;

  // Read a captured photo, merge its hands (de-duping panels that overlap), then
  // advance to the per-panel confirmation.
  async function ingest(file: File) {
    setBusy(true);
    setError(null);
    try {
      const blob = await downscaleImage(file, 1800, 0.85);
      const res = await scanCardImage(blob);
      if (!res.ok) {
        setError(res.error);
        return;
      }
      if (res.year && !yearRef.current) yearRef.current = res.year;
      const seen = new Set(rowsRef.current.map(rowKey));
      const fresh = res.rows.filter((r) => !seen.has(rowKey(r)));
      // No new hands on this panel (blank/duplicate shot) — don't advance into a
      // "0 hands captured" dead-end; keep the user on capture so they can retry.
      if (fresh.length === 0) {
        setError('We didn’t find any new hands on that panel. Make sure it’s a different panel, well-lit and filling the frame.');
        return;
      }
      rowsRef.current = [...rowsRef.current, ...fresh];
      setPanelCounts((p) => p.map((n, i) => (i === panel - 1 ? fresh.length : n)));
      setCaptured((c) => c.map((v, i) => (i === panel - 1 ? true : v)));
      setStep('captured');
    } catch {
      setError('Couldn’t read that photo. Try a closer, well-lit shot of the panel.');
    } finally {
      setBusy(false);
    }
  }

  function onPick(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (file) void ingest(file);
  }

  function onStart() {
    setPanel(1);
    setError(null);
    setStep('capture');
  }

  function onNext() {
    if (isLast) {
      finish();
      return;
    }
    setPanel((p) => p + 1);
    setError(null);
    setStep('capture');
  }

  // Drop the just-captured panel's rows so it can be shot again.
  function onRetake() {
    const cnt = panelCounts[panel - 1] || 0;
    rowsRef.current = rowsRef.current.slice(0, rowsRef.current.length - cnt);
    setPanelCounts((p) => p.map((n, i) => (i === panel - 1 ? 0 : n)));
    setCaptured((c) => c.map((v, i) => (i === panel - 1 ? false : v)));
    setError(null);
    setStep('capture');
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

  // ── stepper: landscape trifold panels in a green vinyl sleeve ──
  const stepper = (
    <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 20 }}>
      <div style={{ display: 'flex', gap: 5, background: 'linear-gradient(180deg,#7CB877,#5C9D5A)', borderRadius: 8, padding: 6, boxShadow: 'inset 0 1px 2px rgba(255,255,255,0.4),0 4px 10px rgba(40,80,38,0.22)' }}>
        {[1, 2, 3].map((i) => {
          const done = captured[i - 1];
          const current = !done && i === panel;
          const border = done ? '#2E7D43' : current ? '#C0392B' : 'rgba(20,22,42,0.18)';
          return (
            <div
              key={i}
              style={{
                position: 'relative',
                width: 64,
                height: 50,
                borderRadius: 5,
                background: '#fff',
                border: `2px solid ${border}`,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '5px 7px',
                boxShadow: current ? '0 0 0 2px rgba(192,57,43,0.15)' : undefined,
              }}
            >
              {done ? (
                <CheckIcon />
              ) : (
                <span style={{ fontFamily: F_MONO, fontWeight: 700, fontSize: 12, lineHeight: 1, color: current ? '#C0392B' : '#9A9488' }}>{i}</span>
              )}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 3, width: '100%', marginTop: 3 }}>
                <div style={{ display: 'flex', gap: 2, justifyContent: 'center' }}>
                  <span style={{ height: 2.5, borderRadius: 2, width: '40%', background: 'rgba(192,57,43,0.6)' }} />
                  <span style={{ height: 2.5, borderRadius: 2, width: '28%', background: 'rgba(46,125,67,0.6)' }} />
                </div>
                <div style={{ display: 'flex', gap: 2, justifyContent: 'center' }}>
                  <span style={{ height: 2.5, borderRadius: 2, width: '30%', background: 'rgba(46,125,67,0.6)' }} />
                  <span style={{ height: 2.5, borderRadius: 2, width: '24%', background: 'rgba(192,57,43,0.6)' }} />
                </div>
              </div>
              {current && (
                <div style={{ position: 'absolute', left: '50%', bottom: -12, transform: 'translateX(-50%)', width: 26, height: 26, borderRadius: '50%', background: '#C0392B', border: '2.5px solid #fff', boxShadow: '0 3px 8px rgba(192,57,43,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 5 }}>
                  <CameraIcon size={13} sw={2.3} />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 360 }}>
      {/* scrim */}
      <div style={{ position: 'absolute', inset: 0, background: 'rgba(28,40,30,0.42)', animation: 'scyScrim .25s ease both' }} />

      {/* hidden capture inputs: native camera vs. photo library */}
      <input ref={camRef} type="file" accept="image/*" capture="environment" hidden onChange={onPick} />
      <input ref={galRef} type="file" accept="image/*" hidden onChange={onPick} />

      {/* bottom sheet */}
      <div
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          bottom: 0,
          background: '#FFFFFF',
          borderRadius: '26px 26px 0 0',
          boxShadow: '0 -16px 40px rgba(20,30,22,0.28)',
          padding: '12px 22px calc(26px + env(safe-area-inset-bottom))',
          animation: 'scySheetUp .34s cubic-bezier(.2,.7,.2,1) both',
          maxHeight: '96%',
          overflowY: 'auto',
          fontFamily: F_BODY,
        }}
      >
        {/* grabber */}
        <div style={{ width: 42, height: 5, borderRadius: 3, background: '#E2E0D8', margin: '0 auto 16px' }} />

        {/* ── INTRO ── */}
        {step === 'intro' && (
          <div>
            {/* annual badge */}
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 18 }}>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: '#FBF1E4', border: '1.5px solid rgba(201,135,26,0.32)', borderRadius: 999, padding: '7px 14px' }}>
                <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#E0A21B', boxShadow: '0 0 0 3px rgba(224,162,27,0.20)' }} />
                <span style={{ fontFamily: F_BODY, fontWeight: 800, fontSize: 10.5, letterSpacing: 1.4, color: '#A9740E' }}>ONCE A YEAR · 60 SECONDS</span>
              </div>
            </div>

            {/* trifold illustration — folds open on mount, camera badge pops */}
            <div style={{ position: 'relative', display: 'flex', justifyContent: 'center', alignItems: 'center', marginBottom: 14, height: 120, perspective: 880, transform: 'rotate(-1.5deg)' }}>
              {/* green vinyl sleeve */}
              <div style={{ position: 'absolute', left: '50%', top: '50%', transform: 'translate(-50%,-50%)', width: 286, height: 100, borderRadius: 9, background: 'linear-gradient(180deg,#7CB877,#5C9D5A)', boxShadow: 'inset 0 1px 2px rgba(255,255,255,0.4),0 8px 18px rgba(40,80,38,0.28)', zIndex: 0 }} />
              {/* panel 1 — left, highlighted */}
              <div style={{ position: 'relative', width: 88, height: 86, borderRadius: '7px 2px 2px 7px', background: 'linear-gradient(160deg,#FFFFFF,#FCF7EC)', border: '2.5px solid #C0392B', boxShadow: '-3px 5px 12px rgba(20,22,42,0.16)', transformOrigin: 'right center', animation: 'scyFoldL .8s cubic-bezier(.2,.8,.2,1) .22s both', zIndex: 3, padding: '9px 9px' }}>
                <div style={{ fontFamily: F_MONO, fontWeight: 700, fontSize: 10, color: '#C0392B', marginBottom: 7, textAlign: 'center' }}>1</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                  {[['30%', '42%'], ['46%', '28%'], ['24%', '50%'], ['40%', '30%']].map((w, k) => (
                    <div key={k} style={{ display: 'flex', gap: 3 }}>
                      <span style={{ height: 3, borderRadius: 2, width: w[0], background: k % 2 ? 'rgba(46,125,67,0.6)' : 'rgba(192,57,43,0.6)' }} />
                      <span style={{ height: 3, borderRadius: 2, width: w[1], background: k % 2 ? 'rgba(192,57,43,0.6)' : 'rgba(46,125,67,0.6)' }} />
                    </div>
                  ))}
                </div>
                {/* camera badge */}
                <div style={{ position: 'absolute', left: '50%', bottom: -14, transform: 'translateX(-50%)', width: 34, height: 34, borderRadius: '50%', background: '#C0392B', border: '3px solid #fff', boxShadow: '0 4px 10px rgba(192,57,43,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 5, animation: 'scyCamPop .35s ease .95s both' }}>
                  <CameraIcon />
                </div>
              </div>
              {/* panel 2 — center spine */}
              <div style={{ width: 88, height: 86, background: 'linear-gradient(160deg,#FFFFFF,#FCF7EC)', borderTop: '2.5px solid rgba(20,22,42,0.10)', borderBottom: '2.5px solid rgba(20,22,42,0.10)', boxShadow: '0 6px 14px rgba(20,22,42,0.10)', zIndex: 1, padding: '9px 9px' }}>
                <div style={{ fontFamily: F_MONO, fontWeight: 700, fontSize: 10, color: '#B9B2A2', marginBottom: 7, textAlign: 'center' }}>2</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                  {[['44%', '30%'], ['26%', '48%'], ['38%', '34%'], ['50%', '24%']].map((w, k) => (
                    <div key={k} style={{ display: 'flex', gap: 3 }}>
                      <span style={{ height: 3, borderRadius: 2, width: w[0], background: k === 0 || k === 2 ? 'rgba(46,125,67,0.55)' : 'rgba(192,57,43,0.55)' }} />
                      <span style={{ height: 3, borderRadius: 2, width: w[1], background: k === 0 || k === 2 ? 'rgba(192,57,43,0.55)' : 'rgba(46,125,67,0.55)' }} />
                    </div>
                  ))}
                </div>
              </div>
              {/* panel 3 — right */}
              <div style={{ width: 88, height: 86, borderRadius: '2px 7px 7px 2px', background: 'linear-gradient(160deg,#FFFFFF,#FCF7EC)', border: '2.5px solid rgba(20,22,42,0.10)', boxShadow: '3px 5px 12px rgba(20,22,42,0.13)', transformOrigin: 'left center', animation: 'scyFoldR .8s cubic-bezier(.2,.8,.2,1) .22s both', zIndex: 3, padding: '9px 9px' }}>
                <div style={{ fontFamily: F_MONO, fontWeight: 700, fontSize: 10, color: '#B9B2A2', marginBottom: 7, textAlign: 'center' }}>3</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                  {[['34%', '40%'], ['48%', '26%'], ['28%', '46%'], ['42%', '30%']].map((w, k) => (
                    <div key={k} style={{ display: 'flex', gap: 3 }}>
                      <span style={{ height: 3, borderRadius: 2, width: w[0], background: k % 2 ? 'rgba(46,125,67,0.55)' : 'rgba(192,57,43,0.55)' }} />
                      <span style={{ height: 3, borderRadius: 2, width: w[1], background: k % 2 ? 'rgba(192,57,43,0.55)' : 'rgba(46,125,67,0.55)' }} />
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div style={{ textAlign: 'center', fontFamily: F_DISPLAY, fontWeight: 800, fontSize: 25, letterSpacing: -0.5, color: '#14402A', marginTop: 14 }}>Scan your card</div>
            <div style={{ textAlign: 'center', fontSize: 14, color: '#3E6450', lineHeight: 1.5, marginTop: 8, padding: '0 4px' }}>
              We&apos;ll walk you through photographing <strong style={{ color: '#14402A' }}>each panel one at a time</strong>, then read every hand for you.
            </div>
            <div style={{ textAlign: 'center', fontSize: 12.5, color: '#7B9184', lineHeight: 1.45, marginTop: 12, padding: '0 8px' }}>
              Only do this <strong style={{ color: '#3E6450' }}>once per season</strong> — your card stays saved all year.
            </div>

            <div style={{ marginTop: 22, display: 'flex', flexDirection: 'column', gap: 11 }}>
              <button className="scy-btn" onClick={onStart} style={{ position: 'relative', overflow: 'hidden', background: '#C0392B', border: '2.5px solid rgba(20,22,42,0.10)', borderRadius: 14, padding: 17, textAlign: 'center', cursor: 'pointer', boxShadow: '0 8px 20px rgba(192,57,43,0.28)' }}>
                <div style={{ position: 'absolute', inset: 0, opacity: 0.14, background: HATCH }} />
                <div style={{ position: 'absolute', top: 0, bottom: 0, left: 0, width: '38%', background: 'linear-gradient(100deg,transparent,rgba(255,255,255,.5),transparent)', transform: 'translateX(-130%)', animation: 'scyShine 4.5s ease-in-out infinite' }} />
                <span style={{ position: 'relative', fontFamily: F_DISPLAY, fontWeight: 800, fontSize: 17, letterSpacing: 0.6, color: '#fff', textShadow: '1.5px 1.5px 0 rgba(120,20,12,0.5)' }}>START — SCAN PANEL 1</span>
              </button>
              <button onClick={onCancel} style={{ background: '#EDDFD2', border: 0, borderRadius: 14, padding: 15, textAlign: 'center', cursor: 'pointer', fontFamily: F_BODY, fontWeight: 800, fontSize: 15, letterSpacing: 0.5, color: '#C0392B' }}>CANCEL</button>
            </div>
          </div>
        )}

        {/* ── CAPTURE ── */}
        {step === 'capture' && (
          <div>
            {stepper}

            <div style={{ textAlign: 'center', fontFamily: F_MONO, fontWeight: 700, fontSize: 11, letterSpacing: 2, color: '#C0392B', marginBottom: 4 }}>PANEL {panel} OF 3</div>
            <div style={{ textAlign: 'center', fontFamily: F_DISPLAY, fontWeight: 800, fontSize: 22, letterSpacing: -0.4, color: '#14402A', marginBottom: 14 }}>Line up panel {panel}</div>

            {/* viewfinder */}
            <div style={{ position: 'relative', height: 188, borderRadius: 16, background: 'linear-gradient(160deg,#21302A,#16241E)', overflow: 'hidden', boxShadow: 'inset 0 2px 14px rgba(0,0,0,0.4)' }}>
              {/* faux landscape card panel */}
              <div style={{ position: 'absolute', left: '50%', top: '50%', transform: 'translate(-50%,-50%)', width: 188, height: 124, borderRadius: 8, background: 'linear-gradient(160deg,#FFFFFF,#F1E9D7)', boxShadow: '0 6px 18px rgba(0,0,0,0.35)', padding: '13px 16px' }}>
                <div style={{ fontFamily: F_MONO, fontWeight: 700, fontSize: 10, letterSpacing: 1, color: '#C0392B', textAlign: 'center', marginBottom: 10 }}>PANEL {panel}</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {[['30%', '40%', '18%'], ['44%', '24%', '20%'], ['22%', '48%', '16%'], ['38%', '28%', '22%']].map((w, k) => (
                    <div key={k} style={{ display: 'flex', gap: 5 }}>
                      <span style={{ height: 3, borderRadius: 2, width: w[0], background: k % 2 ? 'rgba(46,125,67,0.55)' : 'rgba(192,57,43,0.55)' }} />
                      <span style={{ height: 3, borderRadius: 2, width: w[1], background: k % 2 ? 'rgba(192,57,43,0.55)' : 'rgba(46,125,67,0.55)' }} />
                      <span style={{ height: 3, borderRadius: 2, width: w[2], background: k % 2 ? 'rgba(46,125,67,0.55)' : 'rgba(192,57,43,0.55)' }} />
                    </div>
                  ))}
                </div>
              </div>
              {/* corner brackets */}
              <div style={{ position: 'absolute', left: 14, top: 14, width: 26, height: 26, borderLeft: '3px solid #6FE3C4', borderTop: '3px solid #6FE3C4', borderRadius: '5px 0 0 0', animation: 'scyBracket 1.8s ease-in-out infinite' }} />
              <div style={{ position: 'absolute', right: 14, top: 14, width: 26, height: 26, borderRight: '3px solid #6FE3C4', borderTop: '3px solid #6FE3C4', borderRadius: '0 5px 0 0', animation: 'scyBracket 1.8s ease-in-out infinite' }} />
              <div style={{ position: 'absolute', left: 14, bottom: 14, width: 26, height: 26, borderLeft: '3px solid #6FE3C4', borderBottom: '3px solid #6FE3C4', borderRadius: '0 0 0 5px', animation: 'scyBracket 1.8s ease-in-out infinite' }} />
              <div style={{ position: 'absolute', right: 14, bottom: 14, width: 26, height: 26, borderRight: '3px solid #6FE3C4', borderBottom: '3px solid #6FE3C4', borderRadius: '0 0 5px 0', animation: 'scyBracket 1.8s ease-in-out infinite' }} />
              {/* scan line */}
              <div style={{ position: 'absolute', left: '7%', right: '7%', height: 2, background: 'linear-gradient(90deg,transparent,#6FE3C4,transparent)', boxShadow: '0 0 10px #6FE3C4', animation: 'scyScan 2.6s ease-in-out infinite' }} />
              {/* OCR in progress */}
              {busy && (
                <div style={{ position: 'absolute', inset: 0, background: 'rgba(16,24,20,0.55)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 6 }}>
                  <span className="scy-spinner" />
                </div>
              )}
            </div>

            {/* framing tips */}
            <div style={{ display: 'flex', gap: 7, marginTop: 14 }}>
              {[['⌖', 'Straight on'], ['⤢', 'Fill frame'], ['☀', 'Good light'], ['▭', 'Flat surface']].map(([ic, label]) => (
                <div key={label} style={{ flex: 1, textAlign: 'center', background: '#F4F8F4', borderRadius: 10, padding: '9px 4px' }}>
                  <div style={{ fontSize: 16, lineHeight: 1 }}>{ic}</div>
                  <div style={{ fontFamily: F_BODY, fontWeight: 700, fontSize: 9.5, color: '#3E6450', marginTop: 3, letterSpacing: 0.2 }}>{label}</div>
                </div>
              ))}
            </div>

            {error && (
              <p style={{ fontFamily: F_BODY, fontWeight: 600, fontSize: 12.5, color: '#C0392B', textAlign: 'center', margin: '12px 0 0', lineHeight: 1.4 }}>{error}</p>
            )}

            {/* buttons */}
            <div style={{ marginTop: 18, display: 'flex', flexDirection: 'column', gap: 11 }}>
              <button className="scy-btn" onClick={() => camRef.current?.click()} disabled={busy} style={{ position: 'relative', overflow: 'hidden', background: '#C0392B', border: '2.5px solid rgba(20,22,42,0.10)', borderRadius: 14, padding: 17, textAlign: 'center', cursor: busy ? 'default' : 'pointer', boxShadow: '0 8px 20px rgba(192,57,43,0.28)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, opacity: busy ? 0.7 : 1 }}>
                <div style={{ position: 'absolute', inset: 0, opacity: 0.14, background: HATCH }} />
                <CameraIcon size={20} sw={2.3} />
                <span style={{ position: 'relative', fontFamily: F_DISPLAY, fontWeight: 800, fontSize: 16, letterSpacing: 0.5, color: '#fff', textShadow: '1.5px 1.5px 0 rgba(120,20,12,0.5)' }}>TAKE PHOTO</span>
              </button>
              <button onClick={() => galRef.current?.click()} disabled={busy} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 9, background: '#F1F5F1', border: '1.5px solid rgba(46,125,67,0.18)', borderRadius: 14, padding: 14, textAlign: 'center', cursor: busy ? 'default' : 'pointer', opacity: busy ? 0.7 : 1 }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#2E7D43" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="3" width="18" height="18" rx="2" />
                  <circle cx="8.5" cy="8.5" r="1.5" />
                  <path d="M21 15l-5-5L5 21" />
                </svg>
                <span style={{ fontFamily: F_BODY, fontWeight: 800, fontSize: 14.5, letterSpacing: 0.3, color: '#2E7D43' }}>Upload a photo instead</span>
              </button>
              <button onClick={onCancel} style={{ background: 'none', border: 0, textAlign: 'center', fontFamily: F_BODY, fontWeight: 700, fontSize: 13.5, color: '#9DAFA2', cursor: 'pointer', padding: 6 }}>Cancel</button>
            </div>
          </div>
        )}

        {/* ── CAPTURED (per-panel confirmation) ── */}
        {step === 'captured' && (
          <div>
            {stepper}

            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
              <div style={{ width: 64, height: 64, borderRadius: '50%', background: '#DDEBDD', display: 'flex', alignItems: 'center', justifyContent: 'center', animation: 'scyPop .45s ease both' }}>
                <CheckIcon size={34} sw={3} />
              </div>
              <div style={{ fontFamily: F_DISPLAY, fontWeight: 800, fontSize: 23, letterSpacing: -0.4, color: '#14402A', marginTop: 16 }}>Panel {panel} captured</div>
              <div style={{ fontSize: 14.5, color: '#3E6450', marginTop: 6 }}>
                <strong style={{ color: '#C0392B', fontFamily: F_DISPLAY }}>{handsThis}</strong> hands read from this panel
              </div>
              <div style={{ fontFamily: F_MONO, fontSize: 11.5, color: '#7B9184', marginTop: 10 }}>{total} hands so far · {doneCount} of 3 panels</div>
            </div>

            {/* buttons */}
            <div style={{ marginTop: 24, display: 'flex', flexDirection: 'column', gap: 11 }}>
              <button className="scy-btn" onClick={onNext} style={{ position: 'relative', overflow: 'hidden', background: isLast ? '#2E78C8' : '#C0392B', border: '2.5px solid rgba(20,22,42,0.10)', borderRadius: 14, padding: 17, textAlign: 'center', cursor: 'pointer', boxShadow: `0 8px 20px ${isLast ? 'rgba(46,120,200,0.30)' : 'rgba(192,57,43,0.28)'}` }}>
                <div style={{ position: 'absolute', inset: 0, opacity: 0.14, background: HATCH }} />
                <div style={{ position: 'absolute', top: 0, bottom: 0, left: 0, width: '38%', background: 'linear-gradient(100deg,transparent,rgba(255,255,255,.5),transparent)', transform: 'translateX(-130%)', animation: 'scyShine 4.5s ease-in-out infinite' }} />
                <span style={{ position: 'relative', fontFamily: F_DISPLAY, fontWeight: 800, fontSize: 16, letterSpacing: 0.5, color: '#fff', textShadow: '1.5px 1.5px 0 rgba(120,20,12,0.5)' }}>{isLast ? `DONE — USE THESE ${total} HANDS` : `NEXT — SCAN PANEL ${panel + 1}`}</span>
              </button>
              <button onClick={onRetake} style={{ background: '#EDDFD2', border: 0, borderRadius: 14, padding: 14, textAlign: 'center', cursor: 'pointer', fontFamily: F_BODY, fontWeight: 800, fontSize: 14.5, letterSpacing: 0.3, color: '#C0392B' }}>Retake panel {panel}</button>
            </div>
          </div>
        )}

        {/* NMJL disclaimer — kept on the entry screen of the flow. */}
        {step === 'intro' && (
          <p style={{ fontSize: 11, color: '#7B9184', textAlign: 'center', lineHeight: 1.5, margin: '18px 4px 0' }}>
            Club Mahj is unofficial and not affiliated with or endorsed by the National Mah Jongg League.
          </p>
        )}
      </div>
    </div>
  );
}
