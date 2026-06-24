import Tile from './Tile';

// The two-tone "LET'S Mahj" wordmark (design v6 Card-screen masthead): a small
// kicker over the heavy display word, centered on the art-header band with a
// paper tile flanking each side.
export default function CardTitle() {
  return (
    <div className="masthead">
      <Tile face="bam" color="#15803D" size={34} className="mast-tile" />
      <div className="logo">
        <div className="logo-kicker">LET’S</div>
        <div className="logo-word">
          Mahj<span className="logo-dots">…</span>
        </div>
      </div>
      <Tile face="crack" color="#C0392B" size={34} className="mast-tile" />
    </div>
  );
}
