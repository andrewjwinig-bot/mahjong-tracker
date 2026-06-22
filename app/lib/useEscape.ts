'use client';

import { useEffect } from 'react';

// Shared modal behavior: press Escape to dismiss. A module-level stack ensures
// that with nested modals open, Escape only closes the top-most one.
const stack: Array<() => void> = [];

export function useEscape(onClose: () => void): void {
  useEffect(() => {
    stack.push(onClose);
    const handler = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return;
      if (stack[stack.length - 1] === onClose) {
        e.stopPropagation();
        onClose();
      }
    };
    window.addEventListener('keydown', handler);
    return () => {
      window.removeEventListener('keydown', handler);
      const i = stack.lastIndexOf(onClose);
      if (i >= 0) stack.splice(i, 1);
    };
  }, [onClose]);
}
