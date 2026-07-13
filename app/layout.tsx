import type { Metadata, Viewport } from 'next';
import { Bricolage_Grotesque, Hanken_Grotesk, Space_Mono } from 'next/font/google';
import './globals.css';
import SWRegister from './components/SWRegister';
import PresenceHeartbeat from './components/PresenceHeartbeat';

// Type system per the design: Bricolage Grotesque for display/headlines, Hanken
// Grotesk for body/labels, Space Mono for meta (timestamps, counts, eyebrows).
const display = Bricolage_Grotesque({
  subsets: ['latin'],
  weight: ['500', '600', '700', '800'],
  variable: '--font-display',
  display: 'swap',
});

const body = Hanken_Grotesk({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800'],
  variable: '--font-app',
  display: 'swap',
});

const mono = Space_Mono({
  subsets: ['latin'],
  weight: ['400', '700'],
  variable: '--font-mono',
  display: 'swap',
});

// Tolerate a trailing slash in the env value so URLs never end up with `//`.
const SITE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL || 'https://clubmahj.vercel.app'
).replace(/\/+$/, '');
const APP_TITLE = 'Club Mahj — The Original Mahj Social Network';
const APP_DESC =
  'The original mahj social network. Track your American Mahjong wins, clear the card, score live games, follow friends, and play along with your table.';

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: APP_TITLE,
  description: APP_DESC,
  manifest: '/manifest.webmanifest',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Club Mahj',
  },
  icons: {
    icon: '/icons/icon-192.png',
    apple: '/icons/apple-touch-icon.png',
  },
  // og:image is the static app/opengraph-image.png; X/Twitter fall back to it.
  openGraph: {
    type: 'website',
    siteName: 'Club Mahj',
    title: APP_TITLE,
    description: APP_DESC,
    url: SITE_URL,
  },
  twitter: {
    card: 'summary_large_image',
    title: APP_TITLE,
    description: APP_DESC,
  },
};

export const viewport: Viewport = {
  themeColor: '#E8F1EA',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  viewportFit: 'cover',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${display.variable} ${body.variable} ${mono.variable}`}>
      <body>
        {/* CJK serif for the launch-splash tile glyphs (lazy unicode-range). */}
        {/* eslint-disable-next-line @next/next/no-page-custom-font */}
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Noto+Serif+SC:wght@700;900&display=swap"
        />
        {/* Apply the saved color theme before paint (no flash on reload). */}
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var t=localStorage.getItem('mahj.theme');var d={bam:'#E9F4EC',dot:'#EBF1F4',crak:'#F6EEDD',dragon:'#E7F0EA',flower:'#FAECF3',joker:'#F0EBFA',wind:'#EAF2F3'}[t];if(t&&d){document.documentElement.setAttribute('data-theme',t);var m=document.querySelector('meta[name="theme-color"]');if(m)m.setAttribute('content',d);}}catch(e){}})();`,
          }}
        />
        {children}
        <SWRegister />
        <PresenceHeartbeat />
      </body>
    </html>
  );
}
