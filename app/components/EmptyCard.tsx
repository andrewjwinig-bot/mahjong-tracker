'use client';

import Tile from './Tile';
import { OFFICIAL_CARD_URL } from '../lib/links';
import { track } from '../lib/analytics';

// Shown on the Card tab before the user has set up a card. The rest of the app
// (scorer, tables, feed, rules) works without one — this only gates the hand
// tracker. One unified "add my card" entry opens the editor, where scanning
// (when on) and manual entry live together.
export default function EmptyCard({
  scanEnabled,
  onAdd,
  onUseSample,
}: {
  scanEnabled: boolean;
  onAdd: () => void;
  onUseSample: () => void;
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
        {scanEnabled ? ' Scan it or type it in' : ' Enter it'} once, and every hand becomes
        tappable to log your wins. Everything else in the app works without it.
      </p>

      <button className="btn" onClick={onAdd}>
        {scanEnabled ? 'Scan or add my card' : 'Add my card'}
      </button>

      <a
        className="btn ghost"
        href={OFFICIAL_CARD_URL}
        target="_blank"
        rel="noopener noreferrer"
        onClick={() => void track('official_card_clicked')}
      >
        Get the official card →
      </a>

      <button className="empty-card-sample" onClick={onUseSample}>
        Just exploring? Try a sample card
      </button>

      <p className="empty-card-fine">
        Unofficial — not affiliated with or endorsed by the National Mah Jongg League. As an Amazon
        Associate we earn from qualifying purchases.
      </p>
    </div>
  );
}
