import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { BottomNav } from '@/components/village/BottomNav';
import { ThemeSync } from '@/components/village/ThemeSync';
import { PostHogProvider } from '@/components/analytics/PostHogProvider';
import { SpiritVoiceProvider } from '@/components/village/SpiritVoiceProvider';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'villa9e — It takes a village.',
  description: 'A GPS system for your goals. Set goals, build GPS plans with AI, validate progress with your village, and earn $VLG.',
  themeColor: '#1877F2',
  manifest: '/manifest.json',
  metadataBase: new URL('https://villa9e.app'),
  icons: {
    icon: '/logo.svg',
    apple: '/logo.svg',
  },
  openGraph: {
    title: 'villa9e — It takes a village.',
    description: 'A GPS system for your goals. Set goals, build GPS plans with AI, validate progress with your village, and earn $VLG.',
    url: 'https://villa9e.app',
    siteName: 'villa9e',
    type: 'website',
    images: [{
      url: '/api/og',
      width: 1200,
      height: 630,
      alt: 'villa9e — It takes a village.',
    }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'villa9e — It takes a village.',
    description: 'A GPS system for your goals. Set goals, build GPS plans with AI, validate progress with your village.',
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
        {/* Register service worker for PWA */}
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
            {children}
            <BottomNav />
          </SpiritVoiceProvider>
        </PostHogProvider>
      </body>
    </html>
  );
}
