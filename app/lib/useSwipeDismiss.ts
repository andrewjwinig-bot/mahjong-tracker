'use client';

import { useCallback, useRef, useState } from 'react';
import type { CSSProperties, TouchEvent } from 'react';

type Opts = {
  /** Also dismiss on a rightward swipe (a "back" gesture for detail views). */
  right?: boolean;
  /** Drag distance (px) past which release dismisses. */
  threshold?: number;
};

/**
 * Drag-to-dismiss for bottom sheets / modals. Attach the returned handlers +
 * style to the sheet's scroll element. A downward drag closes it (only when the
 * content is scrolled to the top, so it never fights normal scrolling); with
 * `right`, a rightward drag also closes it. The sheet follows the finger and
 * springs back if released before the threshold.
 */
// Height (px) of the draggable zone at the top of a sheet — covers the grab
// handle and header band. Touches below this tap/scroll natively.
const GRAB_ZONE = 56;

export function useSwipeDismiss(onClose: () => void, opts: Opts = {}) {
  const { right = false, threshold = 90 } = opts;
  const start = useRef<{ x: number; y: number; top: number } | null>(null);
  const axis = useRef<'x' | 'y' | null>(null);
  const [off, setOff] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [dragging, setDragging] = useState(false);

  const onTouchStart = useCallback(
    (e: TouchEvent<HTMLElement>) => {
      // Don't hijack taps on interactive controls. Otherwise the few px of finger
      // movement in a normal tap can start dragging the sheet, which moves the
      // target out from under the finger and makes the browser cancel the click —
      // so toggles, theme cards, and rows feel unresponsive. Let those tap.
      const el = e.target as HTMLElement | null;
      if (el?.closest?.('button, a, input, textarea, select, label, [role="switch"], [role="button"]')) {
        start.current = null;
        return;
      }
      const t = e.touches[0];
      // Confine the downward drag-to-dismiss to the top "grab" zone of the sheet,
      // so taps and scrolling anywhere below are pure native gestures (no stiff
      // controls). The horizontal "back" swipe (`right`) still works anywhere.
      if (!right) {
        const top = e.currentTarget.getBoundingClientRect().top;
        if (t.clientY - top > GRAB_ZONE) {
          start.current = null;
          return;
        }
      }
      start.current = { x: t.clientX, y: t.clientY, top: e.currentTarget.scrollTop || 0 };
      axis.current = null;
      setDragging(true);
    },
    [right],
  );

  const onTouchMove = useCallback(
    (e: TouchEvent<HTMLElement>) => {
      if (!start.current) return;
      const t = e.touches[0];
      const dx = t.clientX - start.current.x;
      const dy = t.clientY - start.current.y;
      if (!axis.current && (Math.abs(dx) > 10 || Math.abs(dy) > 10)) {
        axis.current = Math.abs(dx) > Math.abs(dy) ? 'x' : 'y';
      }
      if (axis.current === 'y' && dy > 0 && start.current.top <= 0) {
        setOff({ x: 0, y: dy });
      } else if (right && axis.current === 'x' && dx > 0) {
        setOff({ x: dx, y: 0 });
      } else {
        setOff({ x: 0, y: 0 });
      }
    },
    [right],
  );

  const onTouchEnd = useCallback(() => {
    if (off.y > threshold || off.x > threshold) onClose();
    setOff({ x: 0, y: 0 });
    setDragging(false);
    start.current = null;
    axis.current = null;
  }, [off, threshold, onClose]);

  const style: CSSProperties = {
    transform: off.x || off.y ? `translate(${off.x}px, ${off.y}px)` : undefined,
    transition: dragging ? 'none' : 'transform 0.26s cubic-bezier(0.2, 0.8, 0.3, 1)',
  };

  return { onTouchStart, onTouchMove, onTouchEnd, style };
}
