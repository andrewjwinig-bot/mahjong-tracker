import type { Metadata, Viewport } from 'next';
import { Archivo } from 'next/font/google';
import './globals.css';
import SWRegister from './components/SWRegister';

// Solid, sharp, clean — bold without the rounded/bubbly feel.
const archivo = Archivo({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800', '900'],
  variable: '--font-app',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Mahjong Tracker',
  description: 'Track your American Mahjong wins and clear all 70 hands this year.',
  manifest: '/manifest.webmanifest',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Mahjong',
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
    <html lang="en" className={archivo.variable}>
      <body>
        {/* Apply the saved color theme before paint (no flash on reload). */}
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var t=localStorage.getItem('mahj.theme');if(t&&t!=='jade'){document.documentElement.setAttribute('data-theme',t);var d={bubblegum:'#FCE7EC',electric:'#F5F4FC',sunset:'#FFF6EC',midnight:'#141826'}[t];if(d){var m=document.querySelector('meta[name="theme-color"]');if(m)m.setAttribute('content',d);}}}catch(e){}})();`,
          }}
        />
        {children}
        <SWRegister />
      </body>
    </html>
  );
}
