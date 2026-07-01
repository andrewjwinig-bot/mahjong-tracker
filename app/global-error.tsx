'use client';

// Last-resort boundary: catches errors in the root layout itself. It replaces
// the whole document, so it must render its own <html>/<body> and can't rely on
// the app's stylesheet — styles are inlined.

import { useEffect } from 'react';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Global error boundary caught:', error);
  }, [error]);

  return (
    <html lang="en">
      <body
        style={{
          margin: 0,
          minHeight: '100vh',
          display: 'grid',
          placeItems: 'center',
          background: '#1f7d43',
          fontFamily: "'Hanken Grotesk', system-ui, sans-serif",
          color: '#14162a',
          padding: '24px',
        }}
      >
        <div
          style={{
            maxWidth: 380,
            width: '100%',
            background: '#f6f2e8',
            borderRadius: 20,
            padding: '28px 24px',
            textAlign: 'center',
            boxShadow: '0 18px 40px rgba(10,24,16,0.34)',
          }}
        >
          <div style={{ fontSize: 40, marginBottom: 8 }} aria-hidden>
            🀄
          </div>
          <h1 style={{ margin: '0 0 8px', fontSize: 24, fontWeight: 800, color: '#c0392b' }}>
            Club Mahj hit a snag
          </h1>
          <p style={{ margin: '0 0 20px', fontSize: 14, fontWeight: 600, color: '#5a5f52' }}>
            Something went wrong loading the app. Your data is safe on this device.
          </p>
          <button
            onClick={() => reset()}
            style={{
              border: 'none',
              cursor: 'pointer',
              background: '#c0392b',
              color: '#fff2e9',
              fontWeight: 800,
              fontSize: 16,
              padding: '14px 20px',
              borderRadius: 14,
              width: '100%',
            }}
          >
            Reload
          </button>
        </div>
      </body>
    </html>
  );
}
