'use client';

// Quick theme switcher — a one-tap bottom sheet of the 8 theme chips, reachable
// straight from the top chrome (palette button) so switching no longer means
// digging through Settings. Tapping a chip reskins the whole app live; locked
// (Pro) themes open the paywall, matching the Settings grid.

import { useState } from 'react';
import { THEMES, type ThemeId } from '../lib/themePrefs';
import { setPro } from '../lib/pro';
import { usePro } from '../lib/usePro';
import { useEscape } from '../lib/useEscape';
import { useSwipeDismiss } from '../lib/useSwipeDismiss';
import Paywall from './Paywall';

export default function ThemeSheet({
  theme,
  onTheme,
  onClose,
}: {
  theme: ThemeId;
  onTheme: (id: ThemeId) => void;
  onClose: () => void;
}) {
  useEscape(onClose);
  const swipe = useSwipeDismiss(onClose);
  const pro = usePro();
  const [paywall, setPaywall] = useState(false);

  return (
    <div className="modal-scrim" onClick={onClose}>
      <div
        className="sheet theme-sheet"
        onClick={(e) => e.stopPropagation()}
        onTouchStart={swipe.onTouchStart}
        onTouchMove={swipe.onTouchMove}
        onTouchEnd={swipe.onTouchEnd}
        style={swipe.style}
      >
        <div className="grab" />
        <div className="set-head">
          <h1 className="set-title">Theme</h1>
        </div>
        <p className="theme-sheet-sub">Tap to switch — reskins the whole app instantly.</p>

        <div className="theme-grid2">
          {THEMES.map((t) => {
            const active = theme === t.id;
            const locked = !!t.pro && !pro;
            return (
              <button
                key={t.id}
                className="theme-chip"
                data-active={active}
                onClick={() => (locked ? setPaywall(true) : onTheme(t.id))}
              >
                <span
                  className="tc-thumb"
                  style={{ height: 72, backgroundColor: t.swatch.page, backgroundImage: `url("${t.wallpaper}")` }}
                />
                <span className="tc-dot" style={{ background: t.swatch.brand }}>
                  {active ? '✓' : locked ? '★' : ''}
                </span>
                <span className="tc-foot">
                  <span className="tc-sq" style={{ background: t.swatch.brand }} />
                  <span className="tc-name">{t.name}</span>
                </span>
              </button>
            );
          })}
        </div>

        <button className="btn" style={{ marginTop: 16 }} onClick={onClose}>
          Done
        </button>

        {paywall && (
          <Paywall
            onUnlock={() => {
              setPro(true);
              setPaywall(false);
            }}
            onClose={() => setPaywall(false)}
          />
        )}
      </div>
    </div>
  );
}
