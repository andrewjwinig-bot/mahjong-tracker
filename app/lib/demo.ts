// Demo build switch. A demo deployment sets NEXT_PUBLIC_DEMO_MODE=1, which makes
// the app present the built-in sample card as if it were the user's real,
// scanned card (for screenshots / showcase). The real app leaves this unset and
// NEVER shows the sample — the tracker is empty until the user scans their own
// card. The value is inlined at build time by Next.js.
export const DEMO_MODE = process.env.NEXT_PUBLIC_DEMO_MODE === '1';
