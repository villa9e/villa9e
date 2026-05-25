import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'villa9e — It takes a village.',
  description: 'A GPS system for your goals. Powered by Legaci Jackson.',
  themeColor: '#1877F2',
  openGraph: {
    title: 'villa9e',
    description: 'It takes a village.',
    url: 'https://villa9e.app',
    siteName: 'villa9e',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={inter.className}>{children}</body>
    </html>
  );
}
