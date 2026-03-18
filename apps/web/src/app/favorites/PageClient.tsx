"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { auth } from '@/lib/firebase';
import { onAuthStateChanged, User } from 'firebase/auth';
import { getFavorites, removeFavorite } from '@/lib/api';
import type { FavoriteItem } from '@/lib/api';
import { ThemeToggleButton } from '@/lib/ThemeContext';

export default function FavoritesPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [favorites, setFavorites] = useState<FavoriteItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async u => {
      setUser(u);
      if (!u) { setLoading(false); return; }
      try {
        const favs = await getFavorites();
        setFavorites(favs);
      } catch (e: any) { setError(e.message || 'Failed to load favorites.'); }
      finally { setLoading(false); }
    });
    return () => unsub();
  }, []);

  const removeFav = async (hscode: string) => {
    try {
      await removeFavorite(hscode);
      setFavorites(prev => prev.filter(f => f.hscode !== hscode));
    } catch { }
  };

  return (
    <div className="min-h-screen" style={{ background: 'var(--page-bg)' }}>
      <div className="sticky top-0 z-20 shadow-sm" style={{ background: '#0B3EA8' }}>
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center gap-3">
          <Link href="/search" className="text-white/80 hover:text-white">
            <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path d="M19 12H5M12 5l-7 7 7 7" /></svg>
          </Link>
          <h1 className="text-white font-bold text-lg flex-1">Favorites</h1>
          <ThemeToggleButton />
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-5">
        {loading && (
          <div className="flex justify-center py-16">
            <div className="w-10 h-10 rounded-full border-4 border-blue-200 border-t-[#0B3EA8] animate-spin" />
          </div>
        )}

        {!user && !loading && (
          <div className="flex flex-col items-center py-16 gap-4 text-center">
            <span className="text-6xl">🔖</span>
            <p className="text-copy-muted font-semibold">Sign in to view favorites</p>
            <Link href="/login" className="px-5 py-2.5 rounded-xl text-white font-semibold" style={{ background: '#0B3EA8' }}>Sign In</Link>
          </div>
        )}

        {user && !loading && error && (
          <div className="flex flex-col items-center py-12 gap-3">
            <p className="text-copy-muted text-sm">{error}</p>
            <button onClick={() => router.refresh()} className="px-4 py-2 rounded-lg border border-gray-300 text-sm">Retry</button>
          </div>
        )}

        {user && !loading && !error && favorites.length === 0 && (
          <div className="flex flex-col items-center py-16 gap-4 text-center">
            <span className="text-6xl text-gray-300">🤍</span>
            <p className="text-copy-muted font-semibold text-lg">No favorites yet</p>
            <p className="text-gray-400 text-sm">Search for HS codes and tap the heart icon to save them here.</p>
            <Link href="/search" className="px-5 py-2.5 rounded-xl text-white font-semibold mt-2" style={{ background: '#0B3EA8' }}>Start Searching</Link>
          </div>
        )}

        {user && !loading && favorites.map(fav => (
          <div key={fav.hscode} className="bg-surface rounded-2xl border border-border p-4 mb-3 shadow-sm flex items-start gap-3">
            <div className="flex-1 cursor-pointer" onClick={() => router.push(`/hscode/${fav.hscode}`)}>
              <p className="text-[#0B3EA8] dark:text-blue-400 font-bold font-mono text-[16px]">{fav.hscode}</p>
              {fav.description && <p className="text-copy-muted text-sm mt-0.5 line-clamp-2">{fav.description}</p>}
              {fav.section && <p className="text-gray-400 text-xs mt-1">Section {fav.section}</p>}
            </div>
            <button onClick={() => removeFav(fav.hscode)} className="text-xl hover:scale-125 transition-transform text-red-400">❤️</button>
          </div>
        ))}
      </div>
    </div>
  );
}
