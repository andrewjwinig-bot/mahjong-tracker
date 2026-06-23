// The compact two-tone "LET'S Mahj" logo (design's Card-screen wordmark): a
// small kicker over the heavy display word, both in the theme's title color
// with its hard offset.
export default function CardTitle() {
  return (
    <div className="logo">
      <div className="logo-kicker">LET’S</div>
      <div className="logo-word">
        Mahj<span className="logo-dots">…</span>
      </div>
    </div>
  );
}
