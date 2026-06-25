import Tile from './Tile';
import { OFFICIAL_CARD_URL } from '../lib/links';
import { track } from '../lib/analytics';

// Encourages players to use a real National Mah Jongg League card. Companion
// framing (we point at the official source, not replace it) + the required
// Amazon Associate affiliate disclosure.
export default function OfficialCardCallout({ blurb }: { blurb?: string }) {
  return (
    <div className="card-callout">
      <Tile face="crack" size={46} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div className="cc-title">Play with the official card</div>
        <p className="cc-blurb">
          {blurb ??
            'Club Mahj is a companion scorecard — for real games, grab your official National Mah Jongg League card. A fresh one comes out every year.'}
        </p>
        <a
          className="btn"
          href={OFFICIAL_CARD_URL}
          target="_blank"
          rel="noopener noreferrer"
          onClick={() => void track('official_card_clicked')}
        >
          Get this year’s card →
        </a>
        <p className="cc-fine">
          Not affiliated with or endorsed by the National Mah Jongg League. As an Amazon Associate we
          earn from qualifying purchases.
        </p>
      </div>
    </div>
  );
}
