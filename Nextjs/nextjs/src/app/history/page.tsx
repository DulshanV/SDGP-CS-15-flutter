"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { auth } from '@/lib/firebase';
import { onAuthStateChanged, User } from 'firebase/auth';
import { getSearchHistory, clearSearchHistory } from '@/lib/api';
import type { HistoryItem } from '@/lib/api';
import { ThemeToggleButton } from '@/lib/ThemeContext';

function formatDate(iso: string) {
  const dt = new Date(iso);
  const now = new Date();
  const diff = (now.getTime() - dt.getTime()) / 1000;
  if (diff < 60) return 'just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`;
  return `${dt.getDate()}/${dt.getMonth() + 1}/${dt.getFullYear()}`;
}

export default function HistoryPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [items, setItems] = useState<HistoryItem[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [confirmClear, setConfirmClear] = useState(false);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async u => {
      setUser(u);
      if (!u) { setLoading(false); return; }
      try {
        const h = await getSearchHistory(50);
        setItems(h.items); setTotal(h.total);
      } catch (e: any) { setError(e.message || 'Failed to load history.'); }
      finally { setLoading(false); }
    });
    return () => unsub();
  }, []);

  const doClear = async () => {
    setConfirmClear(false);
    try {
      await clearSearchHistory();
      setItems([]); setTotal(0);
    } catch { setError('Failed to clear history.'); }
  };

  return (
    <div className="min-h-screen" style={{ background: 'var(--page-bg)' }}>
      <div className="sticky top-0 z-20 shadow-sm" style={{ background: '#0B3EA8' }}>
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center gap-3">
          <Link href="/search" className="text-white/80 hover:text-white">
            <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path d="M19 12H5M12 5l-7 7 7 7" /></svg>
          </Link>
          <h1 className="text-white font-bold text-lg flex-1">Search History</h1>
          <ThemeToggleButton />
          {items.length > 0 && (
            <button onClick={() => setConfirmClear(true)} className="text-white/70 hover:text-white transition-colors">
              <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6" /></svg>
            </button>
          )}
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
            <span className="text-6xl">🕐</span>
            <p className="text-copy-muted font-semibold">Sign in to view search history</p>
            <Link href="/login" className="px-5 py-2.5 rounded-xl text-white font-semibold" style={{ background: '#0B3EA8' }}>Sign In</Link>
          </div>
        )}

        {user && !loading && error && (
          <div className="flex flex-col items-center py-12 gap-3">
            <p className="text-copy-muted text-sm">{error}</p>
          </div>
        )}

        {user && !loading && !error && items.length === 0 && (
          <div className="flex flex-col items-center py-16 gap-4 text-center">
            <span className="text-6xl text-gray-300">🔍</span>
            <p className="text-copy-muted font-semibold text-lg">No search history yet</p>
            <p className="text-gray-400 text-sm">Your searches will appear here once you start searching.</p>
            <Link href="/search" className="px-5 py-2.5 rounded-xl text-white font-semibold mt-2" style={{ background: '#0B3EA8' }}>Start Searching</Link>
          </div>
        )}

        {user && !loading && items.length > 0 && (
          <>
            <p className="text-xs text-gray-400 font-medium mb-3">{total} search{total !== 1 ? 'es' : ''}</p>
            {items.map((item, i) => (
              <div
                key={i}
                className="bg-surface rounded-2xl border border-border p-4 mb-2 shadow-sm hover:shadow-md hover:-translate-y-[2px] transition-all cursor-pointer flex items-start gap-3"
                onClick={() => router.push(`/search?query=${encodeURIComponent(item.queryText)}`)}
              >
                <svg className="text-gray-300 shrink-0 mt-0.5" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" /></svg>
                <div className="flex-1 min-w-0">
                  <p className="text-copy font-semibold text-[15px]">{item.queryText}</p>
                  {item.topResultHscode && (
                    <p className="text-gray-400 text-xs mt-0.5 truncate">
                      Top: <span className="text-[#0B3EA8] dark:text-blue-400 font-mono font-semibold">{item.topResultHscode}</span>
                      {item.topResultDescription && ` — ${item.topResultDescription}`}
                    </p>
                  )}
                  <p className="text-gray-300 text-[11px] mt-0.5">
                    {item.resultsCount} results · {formatDate(item.createdAt)}
                  </p>
                </div>
                <svg className="text-gray-300 shrink-0 mt-1" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M9 18l6-6-6-6" /></svg>
              </div>
            ))}
          </>
        )}
      </div>

      {/* Clear confirmation dialog */}
      {confirmClear && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm" onClick={() => setConfirmClear(false)}>
          <div className="bg-surface rounded-2xl p-6 mx-5 max-w-sm w-full shadow-2xl" onClick={e => e.stopPropagation()}>
            <h3 className="text-copy font-bold text-lg mb-2">Clear History?</h3>
            <p className="text-copy-muted text-sm mb-5">This will permanently delete all your search history.</p>
            <div className="flex gap-3">
              <button onClick={() => setConfirmClear(false)} className="flex-1 py-2.5 rounded-xl border border-border text-copy-muted font-semibold text-sm hover:bg-gray-50">Cancel</button>
              <button onClick={doClear} className="flex-1 py-2.5 rounded-xl bg-red-500 text-white font-semibold text-sm hover:bg-red-600">Clear All</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
