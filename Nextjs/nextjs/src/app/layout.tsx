import type { Metadata } from 'next';
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

export const metadata: Metadata = {
  title: {
    default: 'CeylonHS — AI-Powered HS Code Search & Trade Classification',
    template: '%s | CeylonHS',
  },
  description:
    'Classify products to 6-digit HS codes in seconds with AI-powered hybrid search. Smart brand recognition, 16,000+ codes, sub-second results.',
  icons: {
    icon: '/favicon.ico',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
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
