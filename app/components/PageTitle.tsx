// Two-tone page wordmark matching the Card screen's "LET'S Mahj" logo: a small
// kicker over the heavy display word, so every page reads as a small word then a
// big one for a consistent masthead.
export default function PageTitle({ kicker, word }: { kicker: string; word: string }) {
  return (
    <div className="logo">
      <div className="logo-kicker">{kicker}</div>
      <div className="logo-word">{word}</div>
    </div>
  );
}
