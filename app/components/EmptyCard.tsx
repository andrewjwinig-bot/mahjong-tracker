'use client';

import Tile from './Tile';
import { OFFICIAL_CARD_URL } from '../lib/links';
import { track } from '../lib/analytics';
import { IconCamera } from './uiIcons';

// Shown on the Card tab before the user has set up a card. The rest of the app
// (scorer, tables, feed, rules) works without one — this only gates the hand
// tracker. One unified "add my card" entry opens the editor, where scanning
// (when on) and manual entry live together.
export default function EmptyCard({
  scanEnabled,
  onScan,
  onManual,
}: {
  scanEnabled: boolean;
  /** Jump straight into the photo/upload capture. */
  onScan: () => void;
  /** Open the editor to type the card in by hand. */
  onManual: () => void;
}) {
  return (
    <div className="empty-card">
      <div className="empty-card-tiles" aria-hidden>
        <Tile face="crack" size={42} />
        <Tile face="flower" color="#E8455F" size={42} />
        <Tile face="dragon" char="發" color="#1FA85B" size={42} />
      </div>
      <h2 className="empty-card-title">Add your card to start tracking</h2>
      <p className="empty-card-blurb">
        The hand tracker follows the hands on your own National Mah Jongg League card.
        {scanEnabled ? ' Scan it' : ' Enter it'} once, and every hand becomes tappable to log your
        wins. Everything else in the app works without it.
      </p>

      {scanEnabled ? (
        <>
          <button
            className="btn"
            style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}
            onClick={onScan}
          >
            <IconCamera size={18} /> Scan my card
          </button>
          <button className="empty-card-manual" onClick={onManual}>
            or enter card manually
          </button>
        </>
      ) : (
        <button className="btn" onClick={onManual}>
          Add my card
        </button>
      )}

      <a
        className="btn ghost"
        href={OFFICIAL_CARD_URL}
        target="_blank"
        rel="noopener noreferrer"
        onClick={() => void track('official_card_clicked')}
      >
        Get the official card →
      </a>

      <p className="empty-card-fine">
        Unofficial — not affiliated with or endorsed by the National Mah Jongg League. As an Amazon
        Associate we earn from qualifying purchases.
      </p>
    </div>
  );
}
