import Link from 'next/link';

// Shown for unknown routes. The app is a single-page PWA, so most "pages" live
// under / — this just points a stray URL back home.
export default function NotFound() {
  return (
    <div className="err-screen">
      <div className="err-card">
        <div className="err-emoji" aria-hidden>
          🔍
        </div>
        <h1 className="err-title">Page not found</h1>
        <p className="err-body">This page doesn’t exist. Let’s get you back to the table.</p>
        <div className="err-actions">
          <Link className="err-btn" href="/">
            Back to Club Mahj
          </Link>
        </div>
      </div>
    </div>
  );
}
