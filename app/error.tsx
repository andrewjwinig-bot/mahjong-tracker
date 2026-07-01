'use client';

// Route-level error boundary: catches render/runtime errors in the app tree so
// a crash shows a friendly recovery screen instead of a blank page.

import { useEffect } from 'react';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Surfaced in the console (and any future error sink) for diagnosis.
    console.error('App error boundary caught:', error);
  }, [error]);

  return (
    <div className="err-screen">
      <div className="err-card">
        <div className="err-emoji" aria-hidden>
          🀄
        </div>
        <h1 className="err-title">Something went sideways</h1>
        <p className="err-body">
          The app hit an unexpected snag. Your games and photos are saved on this device — nothing
          was lost.
        </p>
        <div className="err-actions">
          <button className="err-btn" onClick={() => reset()}>
            Try again
          </button>
          <button
            className="err-btn err-btn-ghost"
            onClick={() => {
              if (typeof window !== 'undefined') window.location.href = '/';
            }}
          >
            Reload Club Mahj
          </button>
        </div>
      </div>
    </div>
  );
}
