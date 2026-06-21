'use client';

import { useState } from 'react';
import { exportData, deleteAllData } from '../lib/dataExport';
import { isCloudEnabled, cloudSignOut, cloudDeleteAccount } from '../lib/cloudAuth';

export default function AboutSheet({ onClose }: { onClose: () => void }) {
  const [confirming, setConfirming] = useState(false);
  const [busy, setBusy] = useState(false);
  const cloud = isCloudEnabled();

  async function doDelete() {
    setBusy(true);
    if (cloud) {
      try {
        await cloudDeleteAccount();
      } catch {
        /* fall through to local wipe */
      }
    }
    await deleteAllData();
    // Reset to a clean first-launch state.
    window.location.reload();
  }

  async function signOut() {
    setBusy(true);
    try {
      await cloudSignOut();
    } catch {
      /* ignore */
    }
    await deleteAllData(); // clear the on-device mirror, return to onboarding
    window.location.reload();
  }

  return (
    <div className="modal-scrim" onClick={onClose}>
      <div className="sheet" onClick={(e) => e.stopPropagation()}>
        <div className="grab" />
        <h2>About &amp; Legal</h2>
        <p className="sheet-sub">Mahjong Tracker · v1.0</p>

        <div className="legal">
          <p>
            <strong>Not affiliated with the NMJL.</strong> Mahjong Tracker is an independent scorecard
            and learning tool. It is not affiliated with, endorsed by, or sponsored by the National
            Mah Jongg League.
          </p>
          <p>
            The hands shown are an <strong>original sample</strong> for illustration only — they are
            not the official card. Use “Bring your own card” to enter the hands from your year’s
            official card.
          </p>
          <p>
            <strong>Your privacy.</strong> For now everything lives on this device — no account,
            nothing leaves your phone. Cloud accounts &amp; sync arrive with the App Store release.
          </p>
          <p className="legal-fine">Read our policies (they open in your browser):</p>
          <div className="row">
            <a className="btn ghost" href="/privacy" target="_blank" rel="noopener noreferrer">
              Privacy Policy
            </a>
            <a className="btn ghost" href="/terms" target="_blank" rel="noopener noreferrer">
              Terms of Service
            </a>
          </div>
        </div>

        {/* Manage your data */}
        <label className="lbl" style={{ marginTop: 20 }}>
          Your data
        </label>
        <button className="btn ghost" onClick={() => void exportData()}>
          ⬇️ Export my data
        </button>

        {cloud && (
          <button className="btn ghost" style={{ marginTop: 10 }} onClick={() => void signOut()} disabled={busy}>
            ↩︎ Sign out
          </button>
        )}

        {!confirming ? (
          <button className="btn danger" style={{ marginTop: 10 }} onClick={() => setConfirming(true)}>
            🗑 Delete all my data
          </button>
        ) : (
          <div className="card" style={{ marginTop: 10, padding: 14 }}>
            <p style={{ margin: '0 0 12px', fontWeight: 700, fontSize: 13.5, color: 'var(--ink-soft)' }}>
              This permanently erases everything stored on this device — your account, progress, wins,
              tables, and settings. This can’t be undone.
            </p>
            <div className="row" style={{ marginTop: 0 }}>
              <button className="btn ghost" onClick={() => setConfirming(false)} disabled={busy}>
                Cancel
              </button>
              <button className="btn danger" onClick={doDelete} disabled={busy}>
                {busy ? 'Deleting…' : 'Delete everything'}
              </button>
            </div>
          </div>
        )}

        <button className="btn ghost" style={{ marginTop: 16 }} onClick={onClose}>
          Done
        </button>
      </div>
    </div>
  );
}
