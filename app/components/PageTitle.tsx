// Centered two-tone page wordmark (design source): a small kicker over the
// heavy display word, both in --title-color, sitting on the screen's art header.
export default function PageTitle({ kicker, word }: { kicker: string; word: string }) {
  return (
    <div className="logo">
      <div className="logo-kicker">{kicker}</div>
      <div className="logo-word">{word}</div>
    </div>
  );
}
