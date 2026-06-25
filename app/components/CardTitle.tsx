// The centered two-tone "CLUB Mahj" wordmark (design source): a small kicker
// over the heavy display word, in --title-color on the screen's art header.
export default function CardTitle() {
  return (
    <div className="logo">
      <div className="logo-kicker">CLUB</div>
      <div className="logo-word">
        Mahj<span className="logo-dots">…</span>
      </div>
    </div>
  );
}
