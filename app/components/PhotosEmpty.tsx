// Presentational empty state for a table's Photos tab — a fanned stack of three
// Polaroid snapshots over a green-felt card, per the design handoff. Shown when
// the table has no photos yet. No tap targets; the Photos screen provides the
// "Add Photo" affordance above this.

// The Club Mahj peony mark (green), drawn at 10px wide inside the logo fan tile.
function Peony() {
  return (
    <svg viewBox="0 0 164 227" style={{ width: 10, height: 'auto', display: 'block' }} aria-hidden>
      <path
        fill="#15803D"
        d="M 125.0 8.0 L 117.0 31.0 L 87.0 91.0 L 88.0 101.0 L 105.0 118.0 L 107.0 117.0 L 150.0 33.0 L 161.0 18.0 L 161.0 24.0 L 131.0 80.0 L 129.0 113.0 L 133.0 118.0 L 129.0 121.0 L 131.0 134.0 L 130.0 194.0 L 125.0 217.0 L 163.0 217.0 L 161.0 147.0 L 163.0 120.0 L 134.0 117.0 L 135.0 115.0 L 163.0 113.0 L 163.0 10.0 Z M 4.0 11.0 L 2.0 15.0 L 6.0 29.0 L 8.0 99.0 L 6.0 113.0 L 8.0 115.0 L 38.0 115.0 L 40.0 113.0 L 38.0 107.0 L 38.0 81.0 L 29.0 67.0 L 8.0 25.0 L 7.0 19.0 L 9.0 18.0 L 34.0 62.0 L 62.0 116.0 L 63.0 121.0 L 66.0 122.0 L 76.0 108.0 L 76.0 104.0 L 80.0 99.0 L 82.0 92.0 L 48.0 24.0 L 46.0 10.0 L 42.0 8.0 L 9.0 9.0 L 7.0 11.0 Z M 9.0 118.0 L 7.0 119.0 L 6.0 121.0 L 7.0 133.0 L 8.0 134.0 L 8.0 154.0 L 7.0 155.0 L 7.0 189.0 L 6.0 190.0 L 5.0 205.0 L 2.0 213.0 L 0.0 214.0 L 0.0 217.0 L 2.0 218.0 L 6.0 218.0 L 7.0 217.0 L 37.0 217.0 L 38.0 218.0 L 44.0 218.0 L 44.0 214.0 L 41.0 207.0 L 41.0 204.0 L 40.0 203.0 L 40.0 196.0 L 39.0 195.0 L 38.0 130.0 L 39.0 129.0 L 40.0 121.0 L 38.0 119.0 L 31.0 119.0 L 30.0 118.0 Z M 86.0 103.0 L 84.0 103.0 L 82.0 105.0 L 81.0 109.0 L 78.0 112.0 L 75.0 119.0 L 69.0 127.0 L 69.0 131.0 L 76.0 143.0 L 76.0 145.0 L 80.0 152.0 L 80.0 154.0 L 83.0 160.0 L 85.0 160.0 L 86.0 159.0 L 86.0 157.0 L 99.0 131.0 L 102.0 127.0 L 102.0 122.0 L 100.0 119.0 L 97.0 117.0 L 97.0 116.0 Z"
      />
    </svg>
  );
}

// One Polaroid: float wrapper → rotation wrapper → deal-in wrapper → frame.
function Polaroid({
  variant,
  children,
}: {
  variant: 'a' | 'b' | 'c';
  children: React.ReactNode;
}) {
  return (
    <div className={`pe-float pe-float-${variant}`}>
      <div className={`pe-rot pe-rot-${variant}`}>
        <div className={`pe-deal pe-deal-${variant}`}>
          <div className={`pe-frame pe-frame-${variant}`}>
            <div className="pe-photo">{children}</div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function PhotosEmpty() {
  return (
    <div className="photos-empty">
      <div className="pe-panel">
        <span className="pe-highlight" aria-hidden />

        <div className="pe-cluster-region">
          <span className="pe-glow" aria-hidden />
          <div className="pe-cluster">
            {/* A — back-left: the Club Mahj two-tile fan logo */}
            <Polaroid variant="a">
              <div className="pe-fan" aria-hidden>
                <span className="pe-fan-tile pe-fan-l">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src="/table-motifs/flower_cherry.png" alt="" />
                </span>
                <span className="pe-fan-tile pe-fan-r">
                  <Peony />
                </span>
              </div>
            </Polaroid>

            {/* B — back-right: a winning dragon hand (R / G + white-dragon soap) */}
            <Polaroid variant="b">
              <div className="pe-hand" aria-hidden>
                <span className="pe-mini" style={{ color: '#C0392B' }}>R</span>
                <span className="pe-mini" style={{ color: '#15803D' }}>G</span>
                <span className="pe-mini"><span className="pe-soap" /></span>
              </div>
            </Polaroid>

            {/* C — front-center: the Club Mahj wordmark, with a camera glint */}
            <Polaroid variant="c">
              <div className="pe-mark" aria-hidden>
                <span className="pe-mark-club">CLUB</span>
                <span className="pe-mark-word">Mahj</span>
              </div>
              <span className="pe-glint" aria-hidden />
            </Polaroid>
          </div>
        </div>

        <h3 className="pe-title">No photos yet</h3>
        <p className="pe-sub">
          Snap your <b>prettiest hands</b> &amp; wins — they land here for the whole table to see.
        </p>
      </div>
    </div>
  );
}
