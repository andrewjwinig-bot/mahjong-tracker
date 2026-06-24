import Tile from './Tile';

// Two-tone page wordmark (design v6): a small kicker over the heavy display
// word, centered on the screen's art-header band with a paper tile flanking
// each side.
export default function PageTitle({ kicker, word }: { kicker: string; word: string }) {
  return (
    <div className="masthead">
      <Tile face="dot" color="#2F80ED" size={34} className="mast-tile" />
      <div className="logo">
        <div className="logo-kicker">{kicker}</div>
        <div className="logo-word">{word}</div>
      </div>
      <Tile face="crack" color="#C0392B" size={34} className="mast-tile" />
    </div>
  );
}
