"use client";

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { auth } from '@/lib/firebase';
import { onAuthStateChanged, User } from 'firebase/auth';
import { getHsCodeDetail, getFavorites, addFavorite, removeFavorite } from '@/lib/api';
import type { HsCodeDetail } from '@/lib/api';
import { ThemeToggleButton } from '@/lib/ThemeContext';

export default function HsCodeDetailPage() {
  const { hscode } = useParams<{ hscode: string }>();
  const router = useRouter();
  const [detail, setDetail] = useState<HsCodeDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [user, setUser] = useState<User | null>(null);
  const [isFav, setIsFav] = useState(false);
  const [favLoading, setFavLoading] = useState(false);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async u => {
      setUser(u);
      if (u) {
        try { const favs = await getFavorites(); setIsFav(favs.some(f => f.hscode === hscode)); } catch { }
      }
    });
    return () => unsub();
  }, [hscode]);

  useEffect(() => {
    (async () => {
      try {
        const d = await getHsCodeDetail(hscode);
        setDetail(d);
      } catch (e: any) { setError(e.message || 'Failed to load HS code.'); }
      finally { setLoading(false); }
    })();
  }, [hscode]);

  const toggleFav = async () => {
    if (!user) { router.push('/login'); return; }
    setFavLoading(true);
    try {
      if (isFav) { await removeFavorite(hscode); setIsFav(false); }
      else { await addFavorite(hscode, detail?.description, detail?.section); setIsFav(true); }
    } catch { } finally { setFavLoading(false); }
  };

  return (
    <div className="min-h-screen" style={{ background: 'var(--page-bg)' }}>
      {/* Header */}
      <div className="sticky top-0 z-20 shadow-sm" style={{ background: 'linear-gradient(135deg,#133665,#3A9EEA)' }}>
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center gap-3">
          <button onClick={() => router.back()} className="text-white/80 hover:text-white">
            <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path d="M19 12H5M12 5l-7 7 7 7" /></svg>
          </button>
          <span className="text-white font-bold text-base flex-1">HS {hscode}</span>
          <ThemeToggleButton />
          {user && (
            <button onClick={toggleFav} disabled={favLoading} className="text-xl transition-transform hover:scale-125">
              {isFav ? '❤️' : '🤍'}
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
        {error && !loading && (
          <div className="text-center py-12">
            <p className="text-copy-muted">{error}</p>
            <button onClick={() => router.back()} className="mt-4 px-4 py-2 rounded-lg border border-gray-300 text-sm">Go Back</button>
          </div>
        )}
        {detail && !loading && (
          <>
            {/* Main card */}
            <div className="bg-surface rounded-2xl border border-border p-6 mb-4 shadow-sm">
              <p className="text-3xl font-black text-[#0B3EA8] dark:text-blue-400 font-mono mb-2">{detail.hscode}</p>
              <p className="text-copy text-base leading-relaxed mb-4">{detail.description}</p>
              <div className="flex flex-wrap gap-2">
                {detail.section && (
                  <span className="px-3 py-1 rounded-lg bg-blue-50 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 text-xs font-bold">
                    Section: {detail.section}
                  </span>
                )}
                {detail.level > 0 && (
                  <span className="px-3 py-1 rounded-lg bg-purple-50 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300 text-xs font-bold">
                    Level: {detail.level}
                  </span>
                )}
                {detail.parent && (
                  <Link href={`/hscode/${detail.parent}`}
                    className="px-3 py-1 rounded-lg bg-gray-100 dark:bg-gray-800 text-copy-muted text-xs font-bold hover:bg-gray-200 transition-all">
                    Parent: {detail.parent}
                  </Link>
                )}
              </div>
            </div>

            {/* Hierarchy */}
            {detail.hierarchyPath.length > 0 && (
              <div className="bg-surface rounded-2xl border border-border p-5 mb-4 shadow-sm">
                <h2 className="text-base font-bold text-copy mb-4">Classification Hierarchy</h2>
                {detail.hierarchyPath.map((p, i) => {
                  const isLast = i === detail.hierarchyPath.length - 1;
                  return (
                    <div key={i} className="flex items-start gap-3 mb-3" style={{ paddingLeft: `${i * 16}px` }}>
                      <div className={`shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold mt-0.5 ${isLast ? 'bg-[#0B3EA8] text-white' : 'bg-blue-50 dark:bg-blue-900/40 text-[#0B3EA8] dark:text-blue-400'}`}>
                        {i + 1}
                      </div>
                      <p className={`text-sm leading-snug ${isLast ? 'text-[#0B3EA8] dark:text-blue-400 font-semibold' : 'text-copy-muted'}`}>{p}</p>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Children */}
            {detail.children.length > 0 && (
              <div>
                <h2 className="text-base font-bold text-copy mb-3">Sub-classifications ({detail.children.length})</h2>
                {detail.children.map(c => (
                  <Link key={c.hscode} href={`/hscode/${c.hscode}`}
                    className="flex items-start gap-3 bg-surface rounded-xl border border-border p-4 mb-2 shadow-sm hover:shadow-md hover:-translate-y-[2px] transition-all">
                    <div>
                      <p className="text-[#0B3EA8] dark:text-blue-400 font-bold font-mono text-[15px]">{c.hscode}</p>
                      <p className="text-copy-muted text-sm mt-0.5">{c.description}</p>
                    </div>
                    <svg className="ml-auto shrink-0 text-gray-300 mt-1" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M9 18l6-6-6-6" /></svg>
                  </Link>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
