'use client';

import { useRef, useState } from 'react';
import { exportData, importData, deleteAllData } from '../lib/dataExport';
import { isCloudEnabled, cloudSignOut, cloudDeleteAccount } from '../lib/cloudAuth';
import { IconDownload, IconSignOut, IconTrash, IconCard } from './uiIcons';
import { useEscape } from '../lib/useEscape';
import { useSwipeDismiss } from '../lib/useSwipeDismiss';

export default function AboutSheet({ onClose }: { onClose: () => void }) {
  useEscape(onClose);
  const swipe = useSwipeDismiss(onClose);
  const [confirming, setConfirming] = useState(false);
  const [busy, setBusy] = useState(false);
  const [restoreMsg, setRestoreMsg] = useState<string | null>(null);
  const [deleteErr, setDeleteErr] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const cloud = isCloudEnabled();

  async function onRestore(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (fileRef.current) fileRef.current.value = '';
    if (!file) return;
    setRestoreMsg(null);
    setBusy(true);
    try {
      const s = await importData(file);
      const parts = [
        s.hands ? `${s.hands} hand${s.hands === 1 ? '' : 's'}` : '',
        s.wins ? `${s.wins} mahj${s.wins === 1 ? '' : 's'}` : '',
        s.profileRestored ? 'profile' : '',
      ].filter(Boolean);
      setRestoreMsg(
        `Restored ${parts.length ? parts.join(', ') : 'your settings'}. Reloading…`,
      );
      setTimeout(() => window.location.reload(), 900);
    } catch (err) {
      setBusy(false);
      setRestoreMsg(err instanceof Error ? err.message : 'Couldn’t read that file.');
    }
  }

  async function doDelete() {
    setBusy(true);
    setDeleteErr(null);
    if (cloud) {
      // Apple requires in-app deletion to actually delete the account. If the
      // server delete fails, stop and surface it — do NOT wipe only locally and
      // report success, which would leave the cloud account and data behind.
      try {
        await cloudDeleteAccount();
      } catch (err) {
        setBusy(false);
        setDeleteErr(
          err instanceof Error
            ? `Couldn’t delete your account: ${err.message}. Nothing was deleted — please try again.`
            : 'Couldn’t reach the server to delete your account. Nothing was deleted — please try again.',
        );
        return;
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
      <div
        className="sheet"
        onClick={(e) => e.stopPropagation()}
        onTouchStart={swipe.onTouchStart}
        onTouchMove={swipe.onTouchMove}
        onTouchEnd={swipe.onTouchEnd}
        style={swipe.style}
      >
        <div className="grab" />
        <div className="about-hero" aria-hidden>
          <span className="about-felt"><span className="about-lockup"><b>CLUB</b><i>Mahj</i></span></span>
        </div>
        <h2 style={{ textAlign: 'center' }}>About &amp; Legal</h2>
        <p className="sheet-sub" style={{ textAlign: 'center' }}>Club Mahj · v1.0 · The Original Mahj Social Network</p>

        <div className="legal">
          <p>
            <strong>Not affiliated with the NMJL.</strong> Club Mahj is an independent scorecard
            and learning tool. It is not affiliated with, endorsed by, or sponsored by the National
            Mah Jongg League.
          </p>
          <p>
            The hands shown are an <strong>original sample</strong> for illustration only — they are
            not the official card. Use “Bring your own card” to enter the hands from your year’s
            official card.
          </p>
          <p>
            <strong>Your privacy.</strong>{' '}
            {cloud
              ? 'Your account and game data sync securely to the cloud so you can pick up on any device. Back up a copy or delete your account anytime below.'
              : 'For now everything lives on this device — no account, nothing leaves your phone. Cloud accounts & sync arrive with the App Store release.'}
          </p>
          <p className="legal-fine">Get help or read our policies (they open in your browser):</p>
          <div className="row">
            <a className="btn ghost" href="/support" target="_blank" rel="noopener noreferrer">
              Support
            </a>
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
        <p style={{ margin: '0 0 10px', fontSize: 12, fontWeight: 700, color: 'var(--muted)' }}>
          Back up your progress to a file, or restore it on another device — no account needed.
        </p>
        <button
          className="btn ghost"
          style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}
          onClick={() => void exportData()}
          disabled={busy}
        >
          <IconDownload size={18} /> Back up my data
        </button>

        <input ref={fileRef} type="file" accept="application/json,.json" hidden onChange={onRestore} />
        <button
          className="btn ghost"
          style={{ marginTop: 10, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}
          onClick={() => fileRef.current?.click()}
          disabled={busy}
        >
          <IconCard size={18} /> Restore from backup
        </button>
        {restoreMsg && (
          <p style={{ margin: '8px 2px 0', fontSize: 12.5, fontWeight: 700, color: 'var(--brand)' }}>
            {restoreMsg}
          </p>
        )}

        {cloud && (
          <button
            className="btn ghost"
            style={{ marginTop: 10, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}
            onClick={() => void signOut()}
            disabled={busy}
          >
            <IconSignOut size={18} /> Sign out
          </button>
        )}

        {!confirming ? (
          <button
            className="btn danger"
            style={{ marginTop: 10, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}
            onClick={() => setConfirming(true)}
          >
            <IconTrash size={18} /> {cloud ? 'Delete my account' : 'Delete all my data'}
          </button>
        ) : (
          <div className="card" style={{ marginTop: 10, padding: 14 }}>
            <p style={{ margin: '0 0 12px', fontWeight: 700, fontSize: 13.5, color: 'var(--ink-soft)' }}>
              {cloud
                ? 'This permanently deletes your account and all of your data — on this device and in the cloud (progress, wins, tables, and settings). This can’t be undone.'
                : 'This permanently erases everything stored on this device — your account, progress, wins, tables, and settings. This can’t be undone.'}
            </p>
            <div className="row" style={{ marginTop: 0 }}>
              <button className="btn ghost" onClick={() => setConfirming(false)} disabled={busy}>
                Cancel
              </button>
              <button className="btn danger" onClick={doDelete} disabled={busy}>
                {busy ? 'Deleting…' : 'Delete everything'}
              </button>
            </div>
            {deleteErr && (
              <p style={{ margin: '10px 2px 0', fontSize: 12.5, fontWeight: 700, color: 'var(--brand)' }}>
                {deleteErr}
              </p>
            )}
          </div>
        )}

        <button className="btn ghost" style={{ marginTop: 16 }} onClick={onClose}>
          Done
        </button>
      </div>
    </div>
  );
}
