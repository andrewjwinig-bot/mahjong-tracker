import type { Metadata, Viewport } from 'next';
import { Bricolage_Grotesque, Hanken_Grotesk, Space_Mono } from 'next/font/google';
import './globals.css';
import SWRegister from './components/SWRegister';

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

export const metadata: Metadata = {
  title: 'Let’s Mahj — The Original Mahj Social Network',
  description:
    'The original mahj social network. Track your American Mahjong wins, clear all 70 hands, score live games, and play along with your table.',
  manifest: '/manifest.webmanifest',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Let’s Mahj',
  },
  icons: {
    icon: '/icons/icon-192.png',
    apple: '/icons/apple-touch-icon.png',
  },
};

export const viewport: Viewport = {
  themeColor: '#E8455F',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  viewportFit: 'cover',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${display.variable} ${body.variable} ${mono.variable}`}>
      <body>
        {/* Apply the saved color theme before paint (no flash on reload). */}
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var t=localStorage.getItem('mahj.theme');if(t&&t!=='jade'){document.documentElement.setAttribute('data-theme',t);var d={bam:'#F0F5E9',dot:'#EEF4FB',crak:'#FCEDED',dragon:'#F4EFE1',flower:'#FFF0F6',joker:'#F5F2FD',midnight:'#141826'}[t];if(d){var m=document.querySelector('meta[name="theme-color"]');if(m)m.setAttribute('content',d);}}}catch(e){}})();`,
          }}
        />
        {children}
        <SWRegister />
      </body>
    </html>
  );
}
