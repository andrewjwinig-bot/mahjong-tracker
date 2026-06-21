import type { Metadata, Viewport } from 'next';
import { Baloo_2 } from 'next/font/google';
import './globals.css';
import SWRegister from './components/SWRegister';

// Chunky, rounded, playful — the planner/sticker vibe.
const baloo = Baloo_2({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800'],
  variable: '--font-baloo',
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
    <html lang="en" className={baloo.variable}>
      <body>
        {children}
        <SWRegister />
      </body>
    </html>
  );
}
