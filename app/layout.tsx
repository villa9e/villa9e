import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { BottomNav } from '@/components/village/BottomNav';
import { NavSpacer } from '@/components/village/NavSpacer';
import { ThemeSync } from '@/components/village/ThemeSync';
import { PostHogProvider } from '@/components/analytics/PostHogProvider';
import { SpiritVoiceProvider } from '@/components/village/SpiritVoiceProvider';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'The Village — It takes a village.',
  description: 'GPS for your goals. Community, commerce, wellness, and finance — all in one. Powered by Legaci Jackson.',
  themeColor: '#0033CC',
  manifest: '/manifest.json',
  metadataBase: new URL('https://villa9e.app'),
  icons: {
    icon: '/favicon.png',
    apple: '/favicon.png',
  },
  openGraph: {
    title: 'The Village — It takes a village.',
    description: 'GPS for your goals. Community, commerce, wellness, and finance — all in one.',
    url: 'https://villa9e.app',
    siteName: 'The Village',
    type: 'website',
    images: [{
      url: '/api/og',
      width: 1200,
      height: 630,
      alt: 'The Village — It takes a village.',
    }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'The Village — It takes a village.',
    description: 'GPS for your goals. Community, commerce, wellness, and finance — all in one.',
    images: ['/api/og'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true },
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <script dangerouslySetInnerHTML={{ __html: `
          if ('serviceWorker' in navigator) {
            window.addEventListener('load', () => {
              navigator.serviceWorker.register('/sw.js').catch(() => {});
            });
          }
        `}} />
      </head>
      <body className={inter.className} style={{ overflowX: 'hidden', WebkitTextSizeAdjust: '100%' }}>
        <PostHogProvider>
          <SpiritVoiceProvider>
            <ThemeSync />
            <div id="app-shell" style={{ width: '100%', maxWidth: 480, margin: '0 auto', minHeight: '100vh', position: 'relative', background: 'var(--v-bg)' }}>
              {children}
              <NavSpacer />
              <BottomNav />
            </div>
          </SpiritVoiceProvider>
        </PostHogProvider>
      </body>
    </html>
  );
}
