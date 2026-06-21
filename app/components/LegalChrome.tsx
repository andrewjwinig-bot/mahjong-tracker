import Link from 'next/link';

/** Simple readable wrapper for the hosted legal pages. */
export default function LegalChrome({
  title,
  updated,
  children,
}: {
  title: string;
  updated: string;
  children: React.ReactNode;
}) {
  return (
    <div className="legal-page">
      <header className="legal-head">
        <Link href="/" className="legal-back">
          ‹ Back to app
        </Link>
        <h1>{title}</h1>
        <p className="legal-updated">Last updated: {updated}</p>
      </header>
      <div className="legal-body">{children}</div>
      <footer className="legal-foot">© {new Date().getFullYear()} Mahjong Tracker</footer>
    </div>
  );
}
