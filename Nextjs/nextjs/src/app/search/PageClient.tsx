"use client";

import React, { useState, useEffect, useRef, useCallback, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { auth } from '@/lib/firebase';
import { onAuthStateChanged, User } from 'firebase/auth';
import { search, addFavorite, removeFavorite, getFavorites, recordSearch } from '@/lib/api';
import type { HsCodeResult, SearchResponse } from '@/lib/api';
import { ThemeToggleButton } from '@/lib/ThemeContext';

const CHIPS = ['laptop', 'rice', 'Premio', 'Dilmah', 'cotton fabric', 'smartphone', 'chocolate', 'live horses', "men's wool coat", 'sedan 1300cc'];
const LS_RECENT = 'ceylonhs_recent';

function getRecent(): string[] {
  try { return JSON.parse(localStorage.getItem(LS_RECENT) || '[]'); } catch { return []; }
}
function saveRecent(q: string) {
  const prev = getRecent().filter(x => x !== q);
  localStorage.setItem(LS_RECENT, JSON.stringify([q, ...prev].slice(0, 8)));
}
function removeRecent(q: string) {
  localStorage.setItem(LS_RECENT, JSON.stringify(getRecent().filter(x => x !== q)));
}
function clearRecent() { localStorage.removeItem(LS_RECENT); }

function relBadge(pct: number) {
  if (pct >= 50) return { bg: 'bg-emerald-50 dark:bg-emerald-900/40', text: 'text-emerald-700 dark:text-emerald-300', bar: '#34A853', icon: '✓' };
  if (pct >= 30) return { bg: 'bg-amber-50 dark:bg-amber-900/40', text: 'text-amber-700 dark:text-amber-300', bar: '#F9AB00', icon: '!' };
  return { bg: 'bg-gray-100', text: 'text-copy-muted', bar: '#B7BFCC', icon: '?' };
}

function ResultCard({ r, user, favorites, onToggleFav, onNavigate }: {
  r: HsCodeResult;
  user: User | null;
  favorites: Set<string>;
  onToggleFav: (r: HsCodeResult) => void;
  onNavigate: (code: string) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const badge = relBadge(r.relevancePct);
  const crumb = r.hierarchyPath.length >= 2
    ? r.hierarchyPath.slice(0, -1).map(p => { const i = p.indexOf(': '); return i >= 0 ? p.substring(i + 2) : p; }).join(' › ').substring(0, 80)
    : null;

  return (
    <div
      className="bg-surface rounded-2xl border border-border p-5 mb-3 shadow-sm hover:shadow-md hover:-translate-y-[2px] transition-all cursor-pointer"
      onClick={() => onNavigate(r.hscode)}
    >
      <div className="flex items-start justify-between gap-3 mb-2">
        <span className="text-[20px] font-black text-[#0B3EA8] dark:text-blue-400 font-mono tracking-wide">{r.hscode}</span>
        <div className="flex items-center gap-2">
          <span className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold ${badge.bg} ${badge.text}`}>
            {badge.icon} {r.relevancePct.toFixed(1)}%
          </span>
          {user && (
            <button
              onClick={e => { e.stopPropagation(); onToggleFav(r); }}
              className="text-lg transition-transform hover:scale-125"
              title={favorites.has(r.hscode) ? 'Remove favorite' : 'Add favorite'}
            >
              {favorites.has(r.hscode) ? '❤️' : '🤍'}
            </button>
          )}
        </div>
      </div>

      {/* Confidence bar */}
      <div className="h-1 rounded-full bg-gray-100 dark:bg-gray-800 mb-3">
        <div className="h-1 rounded-full transition-all" style={{ width: `${Math.min(r.relevancePct, 100)}%`, background: badge.bar }} />
      </div>

      {crumb && (
        <div className="flex items-center gap-1 text-xs text-gray-400 italic mb-2">
          <svg className="shrink-0" width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M3 6h18M3 12h18M3 18h18" /></svg>
          {crumb}
        </div>
      )}

      <p className="text-[15px] text-copy font-medium leading-snug mb-3">{r.description}</p>

      <div className="flex items-center gap-2 flex-wrap">
        {r.section && <span className="px-2 py-0.5 rounded-md text-[11px] font-semibold bg-blue-50 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300">{r.section}</span>}
        {r.level > 0 && <span className="px-2 py-0.5 rounded-md text-[11px] font-semibold bg-purple-50 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300">Level {r.level}</span>}
        {r.hierarchyPath.length > 1 && (
          <button
            onClick={e => { e.stopPropagation(); setExpanded(!expanded); }}
            className="ml-auto flex items-center gap-1 text-[11px] text-gray-400 hover:text-copy-muted transition-colors"
          >
            <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M3 6h18M7 12h10M11 18h2" /></svg>
            {r.hierarchyPath.length} levels {expanded ? '▲' : '▼'}
          </button>
        )}
      </div>

      {expanded && r.hierarchyPath.length > 0 && (
        <div className="mt-3 pt-3 border-t border-gray-100">
          {r.hierarchyPath.map((p, i) => {
            const isLast = i === r.hierarchyPath.length - 1;
            return (
              <div key={i} className="flex items-start gap-2 mb-1.5" style={{ paddingLeft: `${i * 12}px` }}>
                <div className={`shrink-0 w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold mt-0.5 ${isLast ? 'bg-[#0B3EA8] text-white' : 'bg-blue-50 dark:bg-blue-900/40 text-[#0B3EA8] dark:text-blue-400'}`}>{i + 1}</div>
                <p className={`text-xs leading-snug ${isLast ? 'text-[#0B3EA8] dark:text-blue-400 font-semibold' : 'text-copy-muted'}`}>{p}</p>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function SearchContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const [q, setQ] = useState(searchParams.get('query') || '');
  const [response, setResponse] = useState<SearchResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [recent, setRecent] = useState<string[]>([]);
  const [user, setUser] = useState<User | null>(null);
  const [favorites, setFavorites] = useState<Set<string>>(new Set());
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    setRecent(getRecent());
    const unsub = onAuthStateChanged(auth, async u => {
      setUser(u);
      if (u) {
        try { const favs = await getFavorites(); setFavorites(new Set(favs.map(f => f.hscode))); } catch { }
      }
    });
    return () => unsub();
  }, []);

  const doSearch = useCallback(async (query: string) => {
    if (!query.trim()) return;
    setLoading(true); setError('');
    try {
      const res = await search(query.trim());
      setResponse(res);
      saveRecent(query.trim());
      setRecent(getRecent());
      if (auth.currentUser) {
        recordSearch(query.trim(), res.totalResults, res.results[0]?.hscode, res.results[0]?.description);
      }
    } catch (e: any) {
      setError(e.message || 'Search failed. Is the backend running?');
    } finally { setLoading(false); }
  }, []);

  // Run initial search from URL param
  useEffect(() => {
    const initial = searchParams.get('query');
    if (initial) doSearch(initial);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onQueryChange = (val: string) => {
    setQ(val);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (val.trim().length >= 2) {
      debounceRef.current = setTimeout(() => doSearch(val.trim()), 500);
    } else if (!val.trim()) {
      setResponse(null); setError('');
    }
  };

  const submitSearch = (val: string) => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    setQ(val);
    doSearch(val);
    router.replace(`/search?query=${encodeURIComponent(val)}`, { scroll: false });
  };

  const toggleFav = async (r: HsCodeResult) => {
    if (!user) { router.push('/login'); return; }
    const isFav = favorites.has(r.hscode);
    setFavorites(prev => { const n = new Set(prev); isFav ? n.delete(r.hscode) : n.add(r.hscode); return n; });
    try {
      isFav ? await removeFavorite(r.hscode) : await addFavorite(r.hscode, r.description, r.section);
    } catch { setFavorites(prev => { const n = new Set(prev); isFav ? n.add(r.hscode) : n.delete(r.hscode); return n; }); }
  };

  return (
    <div className="min-h-screen" style={{ background: 'var(--page-bg)' }}>
      {/* Header */}
      <div className="sticky top-0 z-20 shadow-sm" style={{ background: 'linear-gradient(135deg,#133665,#3A9EEA)' }}>
        <div className="max-w-2xl mx-auto px-4 py-3">
          <div className="flex items-center gap-3 mb-2">
            <Link href="/" className="text-white/80 hover:text-white">
              <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path d="M19 12H5M12 5l-7 7 7 7" /></svg>
            </Link>
            <span className="text-white font-bold text-base">CeylonHS</span>
            <span className="text-white/60 text-sm ml-auto">HS Code Search</span>
            <ThemeToggleButton className="ml-2" />
            <Link href="/admin" className="ml-1 text-white/50 hover:text-white/90 transition-colors" title="Admin Dashboard">
              <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /></svg>
            </Link>
          </div>
          <div className="flex items-center gap-2 bg-surface rounded-xl shadow-md px-3 py-1">
            <svg className="text-gray-400 shrink-0" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" /></svg>
            <input
              value={q}
              onChange={e => onQueryChange(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && submitSearch(q)}
              placeholder='Search products or brands, e.g. "laptop", "Premio"…'
              className="flex-1 py-2.5 text-[15px] text-copy placeholder-gray-400 bg-transparent focus:outline-none"
              autoFocus
            />
            {q && (
              <button onClick={() => { setQ(''); setResponse(null); }} className="text-gray-400 hover:text-copy-muted"><svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M18 6L6 18M6 6l12 12" /></svg></button>
            )}
            <button onClick={() => submitSearch(q)} className="px-3 py-1.5 rounded-lg font-semibold text-white text-sm" style={{ background: '#0B3EA8' }}>Go</button>
          </div>
          <p className="text-white/50 text-xs mt-1.5 pl-1">Try brand names like "Premio" or "Dilmah" – AI-powered search</p>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-5">
        {/* Loading */}
        {loading && (
          <div className="flex flex-col items-center py-16 gap-4">
            <div className="w-10 h-10 rounded-full border-4 border-blue-200 border-t-[#0B3EA8] animate-spin" />
            <p className="text-copy-muted text-sm">Searching…</p>
          </div>
        )}

        {/* Error */}
        {error && !loading && (
          <div className="flex flex-col items-center py-12 gap-3 text-center">
            <svg className="text-gray-300" width="48" height="48" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><path d="M8.111 16.404a5.5 5.5 0 0 1 7.778 0M12 20h.01M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0z" /></svg>
            <p className="text-copy-muted text-sm whitespace-pre-line">{error}</p>
            <button onClick={() => doSearch(q)} className="px-4 py-2 rounded-lg border border-[#0B3EA8] text-[#0B3EA8] dark:text-blue-400 text-sm font-semibold hover:bg-blue-50 dark:bg-blue-900/40 transition-all">Retry</button>
          </div>
        )}

        {/* Results */}
        {!loading && !error && response && (
          <>
            {/* Did you mean? */}
            {response.correctedQuery && (
              <div className="rounded-xl p-3 mb-3 border border-yellow-300 bg-yellow-50 text-sm text-copy">
                Did you mean{' '}
                <button onClick={() => submitSearch(response.correctedQuery!)} className="font-bold text-[#0B3EA8] dark:text-blue-400 underline">{response.correctedQuery}</button>?
              </div>
            )}
            {/* AI Enrichment */}
            {response.enrichmentInfo && (
              <div className="rounded-xl p-3 mb-3 border border-blue-200 bg-blue-50 dark:bg-blue-900/40 flex gap-2">
                <svg className="shrink-0 text-blue-500 mt-0.5" width="16" height="16" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 0 0 .95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 0 0-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 0 0-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 0 0-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 0 0 .951-.69l1.07-3.292z" /></svg>
                <div>
                  <p className="text-[11px] font-bold text-blue-700 dark:text-blue-300 uppercase tracking-wide mb-0.5">AI-Powered Result</p>
                  <p className="text-sm text-blue-900 font-medium">{response.enrichmentInfo}</p>
                </div>
              </div>
            )}
            {/* Count */}
            {response.totalResults > 0 && (
              <p className="text-xs text-gray-400 font-medium mb-3">{response.totalResults} result{response.totalResults !== 1 ? 's' : ''} found</p>
            )}
            {/* Cards */}
            {response.results.length === 0 ? (
              <div className="flex flex-col items-center py-16 gap-3 text-center">
                <svg className="text-gray-300" width="48" height="48" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><path d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607z" /></svg>
                <p className="text-copy-muted font-semibold">No results for "{response.query}"</p>
                <p className="text-gray-400 text-sm">Try different keywords or check your spelling.</p>
              </div>
            ) : (
              response.results.map((r, i) => (
                <ResultCard key={i} r={r} user={user} favorites={favorites}
                  onToggleFav={toggleFav}
                  onNavigate={code => router.push(`/hscode/${code}`)}
                />
              ))
            )}
          </>
        )}

        {/* Empty state */}
        {!loading && !error && !response && (
          <div>
            <p className="text-sm text-copy-muted font-medium mb-3">Try searching for</p>
            <div className="flex flex-wrap gap-2 mb-6">
              {CHIPS.map(c => (
                <button key={c} onClick={() => submitSearch(c)}
                  className="px-3 py-1.5 rounded-full bg-blue-50 dark:bg-blue-900/40 text-[#1967D2] text-[13px] font-medium hover:bg-blue-100 transition-all">
                  {c}
                </button>
              ))}
            </div>

            {recent.length > 0 && (
              <>
                <div className="flex items-center justify-between mb-2">
                  <p className="text-base font-bold text-copy">Recent Searches</p>
                  <button onClick={() => { clearRecent(); setRecent([]); }} className="text-xs text-gray-400 hover:text-copy-muted">Clear all</button>
                </div>
                {recent.map(r => (
                  <div key={r} className="flex items-center gap-3 py-2.5 border-b border-gray-100 cursor-pointer group" onClick={() => submitSearch(r)}>
                    <svg className="text-gray-300 shrink-0" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" /><path d="M12 6v6l4 2" /></svg>
                    <span className="flex-1 text-[15px] text-copy font-medium group-hover:text-[#0B3EA8] dark:text-blue-400 transition-colors">{r}</span>
                    <button onClick={e => { e.stopPropagation(); removeRecent(r); setRecent(getRecent()); }}
                      className="text-gray-300 hover:text-copy-muted">
                      <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M18 6L6 18M6 6l12 12" /></svg>
                    </button>
                  </div>
                ))}
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--page-bg)' }}>
        <div className="w-10 h-10 rounded-full border-4 border-blue-200 border-t-[#0B3EA8] animate-spin" />
      </div>
    }>
      <SearchContent />
    </Suspense>
  );
}
