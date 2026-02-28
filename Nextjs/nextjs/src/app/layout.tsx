import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import BottomNav from '@/components/BottomNav';
import PageTransition from '@/components/PageTransition';
import { ThemeProvider } from '@/lib/ThemeContext';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'CeylonHS — AI-Powered HS Code Search',
  description: 'Instantly classify your products with AI-powered Harmonized System matching.',
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
        </ThemeProvider>
      </body>
    </html>
  );
}
