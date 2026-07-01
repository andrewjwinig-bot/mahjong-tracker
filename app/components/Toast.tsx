'use client';

// A tiny app-wide toast. Any code can call showToast(...) to surface a brief,
// non-blocking message (replacing alert()). ToastHost is mounted once near the
// app root and listens for a custom event, so callers don't need context.

import { useEffect, useState } from 'react';

export type ToastTone = 'info' | 'error' | 'success';

interface ToastItem {
  id: number;
  message: string;
  tone: ToastTone;
}

const EVENT = 'mahj:toast';
let seq = 0;

export function showToast(message: string, opts: { tone?: ToastTone } = {}): void {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(
    new CustomEvent<Omit<ToastItem, 'id'>>(EVENT, {
      detail: { message, tone: opts.tone ?? 'info' },
    }),
  );
}

export function ToastHost() {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  useEffect(() => {
    const onToast = (e: Event) => {
      const detail = (e as CustomEvent<Omit<ToastItem, 'id'>>).detail;
      const id = (seq += 1);
      setToasts((list) => [...list, { id, ...detail }]);
      window.setTimeout(() => {
        setToasts((list) => list.filter((t) => t.id !== id));
      }, 3800);
    };
    window.addEventListener(EVENT, onToast);
    return () => window.removeEventListener(EVENT, onToast);
  }, []);

  if (!toasts.length) return null;
  return (
    <div className="toast-host" role="status" aria-live="polite">
      {toasts.map((t) => (
        <button
          key={t.id}
          className="app-toast"
          data-tone={t.tone}
          onClick={() => setToasts((list) => list.filter((x) => x.id !== t.id))}
        >
          {t.message}
        </button>
      ))}
    </div>
  );
}
