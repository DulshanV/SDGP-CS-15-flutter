"use client";
import React, { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import SmoothBeach, { Theme } from '@/components/SmoothBeach';
import Link from 'next/link';
import { useTheme } from '@/lib/ThemeContext';

const CHIPS = ['laptop', 'rice', 'Premio', 'Dilmah', 'cotton fabric', 'smartphone', 'chocolate', 'live horses', "men's wool coat", 'sedan 1300cc'];

export default function Home() {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const { theme, toggleTheme, isDark } = useTheme();

  const go = useCallback((q: string) => {
    if (q.trim()) router.push(`/search?query=${encodeURIComponent(q.trim())}`);
  }, [router]);

  const handleSubmit = (e: React.FormEvent) => { e.preventDefault(); go(query); };


  const overlayBg = isDark
    ? 'linear-gradient(to bottom, rgba(5,10,40,0.4) 0%, rgba(5,10,40,0.1) 50%, rgba(5,10,40,0.5) 100%)'
    : 'linear-gradient(to bottom, rgba(30,80,160,0.15) 0%, rgba(30,80,160,0.0) 55%, rgba(30,80,160,0.3) 100%)';
  const headingColor = isDark ? 'text-white' : 'text-[#0a2255]';
  const subColor = isDark ? 'text-white/75' : 'text-[#1a3e80]/80';
  const chipBorder = isDark ? 'border-white/20 text-white/80 hover:bg-surface/20' : 'border-[#0a2255]/20 text-[#0a2255]/80 hover:bg-[#0a2255]/10';

  return (
    <div className="min-h-screen relative overflow-hidden" style={{ background: isDark ? '#050a28' : '#a8d4f0' }}>
      <SmoothBeach theme={theme as Theme} onToggle={toggleTheme} />

      <div className="fixed inset-0 z-[1] pointer-events-none" style={{ background: overlayBg }} />

      {/* Theme toggle — top right */}
      <div className="fixed top-4 right-4 z-30 flex items-center gap-2">
        <button
          onClick={toggleTheme}
          className="flex items-center gap-2 px-4 py-2 rounded-full border backdrop-blur-md font-semibold text-sm transition-all shadow-md"
          style={{ background: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.45)', borderColor: isDark ? 'rgba(255,255,255,0.2)' : 'rgba(10,34,85,0.2)', color: isDark ? '#fff' : '#0a2255' }}
        >
          {isDark ? '🌙 Dark' : '☀️ Light'}
        </button>
        <Link href="/login"
          className="px-4 py-2 rounded-full border backdrop-blur-md font-semibold text-sm transition-all shadow-md"
          style={{ background: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.45)', borderColor: isDark ? 'rgba(255,255,255,0.2)' : 'rgba(10,34,85,0.2)', color: isDark ? '#fff' : '#0a2255' }}>
          Sign in
        </Link>
      </div>

      <main className="relative z-10 flex flex-col items-center justify-center min-h-[100vh] px-6 text-center">
        <div className="max-w-2xl w-full pt-10">
          <h1 className={`text-[clamp(60px,10vw,100px)] font-black leading-[1.0] mb-2 drop-shadow-[0_4px_32px_rgba(0,0,0,0.35)] ${headingColor}`}>
            CeylonHS
          </h1>

          <p className={`text-[clamp(20px,4vw,32px)] font-bold mb-10 tracking-wide drop-shadow-md ${subColor}`}>
            Search, Verify, Smile.
          </p>

          <form onSubmit={handleSubmit} className="flex gap-3 max-w-xl mx-auto mb-5 w-full">
            <input
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder='e.g. "wooden dining chairs" or "Premio rice"'
              className="flex-1 px-5 py-4 rounded-2xl text-base font-medium placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-400 shadow-xl"
              style={{ background: isDark ? 'rgba(255,255,255,0.95)' : 'rgba(255,255,255,0.9)', color: '#1c2b4a' }}
            />
            <button type="submit"
              className="px-8 py-4 rounded-2xl font-bold text-white shadow-xl transition-all hover:-translate-y-0.5"
              style={{ background: 'linear-gradient(135deg,#133665,#3A9EEA)' }}>
              Search
            </button>
          </form>

          <div className="flex flex-wrap justify-center gap-2 max-w-xl mx-auto">
            {CHIPS.map(c => (
              <button key={c} onClick={() => go(c)}
                className={`px-3 py-1.5 rounded-full border backdrop-blur text-xs font-medium transition-all ${chipBorder}`}>
                {c}
              </button>
            ))}
          </div>
        </div>
      </main>

    </div>
  );
}
