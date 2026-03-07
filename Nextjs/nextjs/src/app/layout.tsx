import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import PageTransition from '@/components/PageTransition';
import { ThemeProvider } from '@/lib/ThemeContext';
import BottomNav from '@/components/BottomNav';
import Chatbot from '@/components/Chatbot';

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter',
});

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#ffffff' },
    { media: '(prefers-color-scheme: dark)', color: '#0a0a0a' },
  ],
};

export const metadata: Metadata = {
  metadataBase: new URL('https://ceylonhs.com'),
  title: {
    default: 'CeylonHS — AI-Powered HS Code Search & Trade Classification',
    template: '%s | CeylonHS',
  },
  description:
    'Classify products to 6-digit HS codes in seconds with AI-powered hybrid search. Smart brand recognition, 16,000+ codes, sub-second results.',
  icons: {
    icon: '/favicon.ico',
    apple: '/favicon.ico',
  },
  manifest: '/manifest.webmanifest',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'CeylonHS',
  },
  formatDetection: {
    telephone: false,
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <ThemeProvider>
          <PageTransition>
            {children}
          </PageTransition>
          <BottomNav />
          <Chatbot />
        </ThemeProvider>
      </body>
    </html>
  );
}
