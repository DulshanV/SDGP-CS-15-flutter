"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { auth } from '@/lib/firebase';
import { onAuthStateChanged, User } from 'firebase/auth';
import * as adminApi from '@/lib/adminApi';
import type {
    AdminStats, TrendItem, TrainingStats, TrainingPair,
    SearchLog, Synonym, Dataset, ActiveDataset, EmbeddingStatus
} from '@/lib/adminApi';
import { ThemeToggleButton } from '@/lib/ThemeContext';

// ── Helpers ────────────────────────────────────────────────────────────────

function fmt(n: number | null | undefined, suffix = '') {
    if (n == null) return '—';
    return n.toLocaleString() + suffix;
}
function fmtDate(s: string | null) {
    if (!s) return '—';
    return new Date(s).toLocaleString();
}
function sourceColor(src: string) {
    const map: Record<string, string> = {
        enrichment: 'bg-blue-100 text-blue-700 dark:text-blue-300 dark:text-blue-300',
        high_confidence: 'bg-emerald-100 text-emerald-700 dark:text-emerald-300',
        manual: 'bg-purple-100 text-purple-700 dark:text-purple-300',
    };
    return map[src] ?? 'bg-surface dark:bg-gray-800 text-copy-muted';
}
function qualityBar(q: number) {
    const pct = Math.round(q * 100);
    const color = pct >= 80 ? '#22c55e' : pct >= 60 ? '#f59e0b' : '#ef4444';
    return (
        <div className="flex items-center gap-2">
            <div className="w-16 h-1.5 rounded-full bg-surface">
                <div className="h-1.5 rounded-full" style={{ width: `${pct}%`, background: color }} />
            </div>
            <span className="text-xs text-copy-muted">{pct}%</span>
        </div>
    );
}

// ── Components ─────────────────────────────────────────────────────────────

function StatCard({ label, value, icon, color }: { label: string; value: string | number; icon: React.ReactNode; color: string }) {
    return (
        <div className="bg-surface rounded-2xl border border-border shadow-sm p-5 flex items-center gap-4">
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${color}`}>{icon}</div>
            <div>
                <p className="text-2xl font-black text-copy">{value}</p>
                <p className="text-sm text-copy-muted font-medium">{label}</p>
            </div>
        </div>
    );
}

function Badge({ label, className }: { label: string; className: string }) {
    return <span className={`px-2 py-0.5 rounded-full text-[11px] font-semibold uppercase tracking-wide ${className}`}>{label}</span>;
}

function SectionHeader({ title, action }: { title: string; action?: React.ReactNode }) {
    return (
        <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-copy">{title}</h2>
            {action}
        </div>
    );
}

function EmptyState({ icon, message }: { icon: string; message: string }) {
    return (
        <div className="flex flex-col items-center py-12 gap-2 text-center">
            <span className="text-4xl">{icon}</span>
            <p className="text-copy-muted text-sm">{message}</p>
        </div>
    );
}

function Spinner() {
    return <div className="flex justify-center py-12"><div className="w-8 h-8 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin" /></div>;
}

// ── Tabs ───────────────────────────────────────────────────────────────────

type Tab = 'overview' | 'training' | 'logs' | 'synonyms' | 'datasets';
const TABS: { id: Tab; label: string; icon: string }[] = [
    { id: 'overview', label: 'Overview', icon: '📊' },
    { id: 'training', label: 'Training Pairs', icon: '🧠' },
    { id: 'logs', label: 'Search Logs', icon: '📋' },
    { id: 'synonyms', label: 'Synonyms', icon: '🔗' },
    { id: 'datasets', label: 'Datasets', icon: '🗄️' },
];

// ── Overview Tab ──────────────────────────────────────────────────────────

function OverviewTab() {
    const [stats, setStats] = useState<AdminStats | null>(null);
    const [tStats, setTStats] = useState<TrainingStats | null>(null);
    const [trends, setTrends] = useState<TrendItem[]>([]);
    const [feedbackEnabled, setFeedbackEnabled] = useState(true);
    const [loading, setLoading] = useState(true);
    const [err, setErr] = useState('');

    const load = useCallback(async () => {
        setLoading(true); setErr('');
        try {
            const [s, ts, tr, fb] = await Promise.all([
                adminApi.getAdminStats(),
                adminApi.getTrainingStats(),
                adminApi.getSearchTrends(7, 15),
                adminApi.getFeedbackStatus(),
            ]);
            setStats(s); setTStats(ts); setTrends(tr); setFeedbackEnabled(fb.enabled);
        } catch (e: any) {
            setErr(e.response?.status === 403 ? 'Admin access required. Make sure your account has admin role.' : e.message || 'Failed to load stats.');
        } finally { setLoading(false); }
    }, []);

    useEffect(() => { load(); }, [load]);

    const toggleFeedback = async () => {
        await adminApi.toggleFeedback(!feedbackEnabled);
        setFeedbackEnabled(v => !v);
    };

    if (loading) return <Spinner />;
    if (err) return (
        <div className="bg-red-50 border border-red-200 rounded-2xl p-6 text-center">
            <p className="text-red-700 font-medium">{err}</p>
        </div>
    );

    return (
        <div className="space-y-6">
            {/* Stat cards */}
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                <StatCard label="Total Users" value={fmt(stats?.total_users)} icon={<svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></svg>} color="bg-blue-50 dark:bg-blue-900/40 dark:bg-blue-900/40 text-blue-600" />
                <StatCard label="Total Searches" value={fmt(stats?.total_searches)} icon={<svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" /></svg>} color="bg-indigo-50 text-indigo-600" />
                <StatCard label="Today's Searches" value={fmt(stats?.searches_today)} icon={<svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><rect width="18" height="18" x="3" y="4" rx="2" ry="2" /><path d="M16 2v4M8 2v4M3 10h18" /></svg>} color="bg-emerald-50 dark:bg-emerald-900/40 text-emerald-600" />
                <StatCard label="Training Pairs" value={fmt(tStats?.training_pairs)} icon={<svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M12 2a10 10 0 1 0 10 10" /><path d="M12 12 2 2" /><path d="m16 8 4-4" /><path d="M22 2h-4v4" /></svg>} color="bg-purple-50 dark:bg-purple-900/40 text-purple-600" />
            </div>

            {/* AI stats row */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <div className="bg-surface rounded-2xl border border-border shadow-sm p-4">
                    <p className="text-xs text-copy-muted mb-1 font-medium uppercase tracking-wide">Avg Match Score</p>
                    <p className="text-3xl font-black text-copy">{tStats?.avg_top_score?.toFixed(1) ?? '—'}<span className="text-base font-medium text-copy-muted">%</span></p>
                </div>
                <div className="bg-surface rounded-2xl border border-border shadow-sm p-4">
                    <p className="text-xs text-copy-muted mb-1 font-medium uppercase tracking-wide">AI Enriched Searches</p>
                    <p className="text-3xl font-black text-copy">{fmt(tStats?.enrichment_searches)}</p>
                </div>
                <div className="bg-surface rounded-2xl border border-border shadow-sm p-4 flex items-center justify-between">
                    <div>
                        <p className="text-xs text-copy-muted mb-1 font-medium uppercase tracking-wide">Feedback Loop</p>
                        <p className={`text-base font-bold ${feedbackEnabled ? 'text-emerald-600' : 'text-copy-muted'}`}>{feedbackEnabled ? 'Active' : 'Paused'}</p>
                    </div>
                    <button onClick={toggleFeedback} className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors focus:outline-none ${feedbackEnabled ? 'bg-emerald-50 dark:bg-emerald-900/400' : 'bg-gray-300'}`}>
                        <span className={`inline-block h-5 w-5 rounded-full bg-surface shadow-md transform transition-transform ${feedbackEnabled ? 'translate-x-6' : 'translate-x-1'}`} />
                    </button>
                </div>
            </div>

            {/* Trending queries */}
            <div className="bg-surface rounded-2xl border border-border shadow-sm p-5">
                <SectionHeader title="🔥 Trending Searches (Last 7 Days)" />
                {trends.length === 0 ? <EmptyState icon="📭" message="No searches recorded yet." /> : (
                    <div className="space-y-2">
                        {trends.map((t, i) => (
                            <div key={i} className="flex items-center gap-3">
                                <span className="w-6 text-center text-xs text-copy-muted font-bold">{i + 1}</span>
                                <div className="flex-1">
                                    <div className="flex-1 h-6 bg-page rounded-lg overflow-hidden">
                                        <div className="h-full rounded-lg bg-gradient-to-r from-blue-400 to-indigo-500 opacity-80" style={{ width: `${Math.min((t.search_count / (trends[0]?.search_count || 1)) * 100, 100)}%` }} />
                                    </div>
                                </div>
                                <span className="font-semibold text-sm text-copy min-w-[120px]">{t.query_text}</span>
                                <span className="text-xs text-copy-muted w-14 text-right">{t.search_count}×</span>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Top queries from training stats */}
            {tStats?.top_queries && tStats.top_queries.length > 0 && (
                <div className="bg-surface rounded-2xl border border-border shadow-sm p-5">
                    <SectionHeader title="📈 All-Time Top Queries" />
                    <div className="flex flex-wrap gap-2">
                        {tStats.top_queries.map((q, i) => (
                            <span key={i} className="px-3 py-1 rounded-full bg-blue-50 dark:bg-blue-900/40 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 dark:text-blue-300 text-sm font-medium">
                                {q.query} <span className="text-blue-400 text-xs">({q.count})</span>
                            </span>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}

// ── Training Pairs Tab ────────────────────────────────────────────────────

function TrainingTab() {
    const [pairs, setPairs] = useState<TrainingPair[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState<'all' | 'pending' | 'approved'>('all');
    const [sourceFilter, setSourceFilter] = useState('');
    const [search, setSearch] = useState('');
    const [creating, setCreating] = useState(false);
    const [newQ, setNewQ] = useState(''); const [newD, setNewD] = useState(''); const [newHS, setNewHS] = useState('');

    const load = useCallback(async () => {
        setLoading(true);
        try {
            const data = await adminApi.listTrainingPairs({
                approved_only: filter === 'approved',
                source: sourceFilter || undefined,
                search: search || undefined,
                limit: 200,
            });
            // If filter is 'pending', client-side filter since API doesn't have pending flag
            setPairs(filter === 'pending' ? data.filter(p => !p.approved) : data);
        } catch (err: any) {
            const msg = err?.response?.status === 403 ? 'Admin access required.' : (err?.message || 'Failed to load training pairs.');
            setPairs([]);
            alert(msg);
        }
        setLoading(false);
    }, [filter, sourceFilter, search]);

    useEffect(() => { load(); }, [load]);

    const approve = async (id: number, val: boolean) => {
        await adminApi.approveTrainingPair(id, val);
        setPairs(prev => prev.map(p => p.id === id ? { ...p, approved: val } : p));
    };

    const remove = async (id: number) => {
        if (!confirm('Delete this training pair?')) return;
        await adminApi.deleteTrainingPair(id);
        setPairs(prev => prev.filter(p => p.id !== id));
    };

    const create = async () => {
        if (!newQ || !newD) return;
        await adminApi.createTrainingPair(newQ, newD, newHS);
        setNewQ(''); setNewD(''); setNewHS(''); setCreating(false);
        load();
    };

    const exportData = async () => {
        const result = await adminApi.exportTrainingData(0.5, true);
        const blob = new Blob([JSON.stringify(result, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a'); a.href = url; a.download = 'training_pairs.json'; a.click();
        URL.revokeObjectURL(url);
    };

    return (
        <div className="space-y-4">
            {/* Controls */}
            <div className="bg-surface rounded-2xl border border-border shadow-sm p-4 flex flex-wrap gap-3 items-center">
                <div className="flex gap-1 bg-surface dark:bg-gray-800 rounded-xl p-1">
                    {(['all', 'pending', 'approved'] as const).map(f => (
                        <button key={f} onClick={() => setFilter(f)} className={`px-4 py-1.5 rounded-lg text-sm font-semibold transition-all capitalize ${filter === f ? 'bg-surface shadow text-blue-700 dark:text-blue-300 dark:text-blue-300' : 'text-copy-muted hover:text-copy'}`}>{f}</button>
                    ))}
                </div>
                <select value={sourceFilter} onChange={e => setSourceFilter(e.target.value)} className="px-3 py-2 rounded-xl border border-border text-sm text-copy-muted bg-surface focus:outline-none focus:ring-2 focus:ring-blue-200">
                    <option value="">All Sources</option>
                    <option value="enrichment">🤖 AI Enrichment</option>
                    <option value="high_confidence">✅ High Confidence</option>
                    <option value="manual">✏️ Manual</option>
                </select>
                <input value={search} onChange={e => setSearch(e.target.value)} onKeyDown={e => e.key === 'Enter' && load()} placeholder="Search pairs..." className="flex-1 min-w-[160px] px-3 py-2 rounded-xl border border-border text-sm focus:outline-none focus:ring-2 focus:ring-blue-200" />
                <button onClick={load} className="px-4 py-2 rounded-xl bg-blue-50 dark:bg-blue-900/40 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 dark:text-blue-300 font-semibold text-sm hover:bg-blue-100">Filter</button>
                <button onClick={() => setCreating(v => !v)} className="px-4 py-2 rounded-xl bg-purple-600 text-white font-semibold text-sm hover:bg-purple-700">+ Add Pair</button>
                <button onClick={exportData} className="px-4 py-2 rounded-xl bg-emerald-600 text-white font-semibold text-sm hover:bg-emerald-700">⬇ Export JSON</button>
            </div>

            {/* Create form */}
            {creating && (
                <div className="bg-surface rounded-2xl border border-purple-200 shadow-sm p-5 space-y-3">
                    <p className="font-bold text-purple-700 dark:text-purple-300">Add Manual Training Pair</p>
                    <input value={newQ} onChange={e => setNewQ(e.target.value)} placeholder="Query (e.g. 'Premio tuna')" className="w-full px-4 py-2.5 rounded-xl border border-border text-sm focus:outline-none focus:ring-2 focus:ring-purple-300" />
                    <input value={newD} onChange={e => setNewD(e.target.value)} placeholder="HS Description (e.g. 'Tuna, skipjack')" className="w-full px-4 py-2.5 rounded-xl border border-border text-sm focus:outline-none focus:ring-2 focus:ring-purple-300" />
                    <input value={newHS} onChange={e => setNewHS(e.target.value)} placeholder="HS Code (optional, e.g. '0302.31')" className="w-full px-4 py-2.5 rounded-xl border border-border text-sm focus:outline-none focus:ring-2 focus:ring-purple-300" />
                    <div className="flex gap-2">
                        <button onClick={create} className="px-5 py-2 rounded-xl bg-purple-600 text-white font-semibold text-sm">Save</button>
                        <button onClick={() => setCreating(false)} className="px-5 py-2 rounded-xl border border-border text-sm text-copy-muted">Cancel</button>
                    </div>
                </div>
            )}

            {/* Count */}
            <p className="text-xs text-copy-muted px-1">{pairs.length} pairs</p>

            {/* Pair list */}
            {loading ? <Spinner /> : pairs.length === 0 ? <EmptyState icon="🧠" message="No training pairs found." /> : (
                <div className="space-y-2">
                    {pairs.map(p => (
                        <div key={p.id} className={`bg-surface rounded-2xl border shadow-sm p-4 ${p.approved ? 'border-green-100' : 'border-orange-100'}`}>
                            <div className="flex items-start gap-3">
                                <div className="flex-1 min-w-0">
                                    <div className="flex flex-wrap gap-2 mb-1.5 items-center">
                                        <Badge label={p.source} className={sourceColor(p.source)} />
                                        {p.approved ? <Badge label="approved" className="bg-green-100 text-green-700" /> : <Badge label="pending" className="bg-orange-100 text-orange-700" />}
                                        {qualityBar(p.quality_score)}
                                        {p.positive_hscode && <span className="font-mono text-xs text-blue-700 dark:text-blue-300 dark:text-blue-300 bg-blue-50 dark:bg-blue-900/40 dark:bg-blue-900/40 px-2 py-0.5 rounded">{p.positive_hscode}</span>}
                                    </div>
                                    <p className="font-semibold text-copy text-sm">"{p.query}"</p>
                                    <p className="text-copy-muted text-xs mt-1 line-clamp-2">→ {p.positive_description}</p>
                                    <p className="text-gray-300 text-[10px] mt-1">{fmtDate(p.created_at)}</p>
                                </div>
                                <div className="flex flex-col gap-1.5 shrink-0">
                                    {p.approved
                                        ? <button onClick={() => approve(p.id, false)} title="Reject" className="px-3 py-1 rounded-lg bg-orange-50 text-orange-600 text-xs font-semibold hover:bg-orange-100">Reject</button>
                                        : <button onClick={() => approve(p.id, true)} title="Approve" className="px-3 py-1 rounded-lg bg-green-50 text-green-700 text-xs font-semibold hover:bg-green-100">Approve</button>
                                    }
                                    <button onClick={() => remove(p.id)} className="px-3 py-1 rounded-lg bg-red-50 text-red-600 text-xs font-semibold hover:bg-red-100">Delete</button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

// ── Search Logs Tab ────────────────────────────────────────────────────────

function LogsTab() {
    const [logs, setLogs] = useState<SearchLog[]>([]);
    const [loading, setLoading] = useState(true);
    const [enrichOnly, setEnrichOnly] = useState(false);
    const [search, setSearch] = useState('');

    const load = useCallback(async () => {
        setLoading(true);
        try {
            const data = await adminApi.getSearchLogs({ limit: 100, enrichment_only: enrichOnly, search: search || undefined });
            setLogs(data);
        } catch (err: any) {
            const msg = err?.response?.status === 403 ? 'Admin access required.' : (err?.message || 'Failed to load logs.');
            setLogs([]);
            alert(msg);
        }
        setLoading(false);
    }, [enrichOnly, search]);

    useEffect(() => { load(); }, [load]);

    return (
        <div className="space-y-4">
            <div className="bg-surface rounded-2xl border border-border shadow-sm p-4 flex flex-wrap gap-3 items-center">
                <label className="flex items-center gap-2 text-sm text-copy-muted cursor-pointer">
                    <input type="checkbox" checked={enrichOnly} onChange={e => setEnrichOnly(e.target.checked)} className="accent-blue-600 w-4 h-4 rounded" />
                    AI Enriched Only
                </label>
                <input value={search} onChange={e => setSearch(e.target.value)} onKeyDown={e => e.key === 'Enter' && load()} placeholder="Filter by query..." className="flex-1 min-w-[160px] px-3 py-2 rounded-xl border border-border text-sm focus:outline-none focus:ring-2 focus:ring-blue-200" />
                <button onClick={load} className="px-4 py-2 rounded-xl bg-blue-50 dark:bg-blue-900/40 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 dark:text-blue-300 font-semibold text-sm hover:bg-blue-100">Filter</button>
            </div>

            <p className="text-xs text-copy-muted px-1">{logs.length} logs</p>

            {loading ? <Spinner /> : logs.length === 0 ? <EmptyState icon="📋" message="No search logs yet." /> : (
                <div className="space-y-2">
                    {logs.map(log => (
                        <div key={log.id} className="bg-surface rounded-2xl border border-border shadow-sm p-4">
                            <div className="flex items-start gap-3">
                                <div className="flex-1 min-w-0">
                                    <div className="flex flex-wrap gap-2 mb-1.5">
                                        {log.enrichment_used && <Badge label="AI Enriched" className="bg-blue-100 text-blue-700 dark:text-blue-300 dark:text-blue-300" />}
                                        {log.corrected_query && <Badge label="Corrected" className="bg-amber-100 text-amber-700 dark:text-amber-300" />}
                                        {log.top_score != null && (
                                            <span className={`px-2 py-0.5 rounded-full text-[11px] font-bold ${log.top_score >= 50 ? 'bg-green-100 text-green-700' : log.top_score >= 30 ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-600'}`}>
                                                {log.top_score.toFixed(1)}%
                                            </span>
                                        )}
                                        <span className="text-[11px] text-copy-muted">{log.result_count} results</span>
                                    </div>
                                    <p className="font-semibold text-copy text-sm">"{log.query}"</p>
                                    {log.corrected_query && <p className="text-xs text-amber-600 mt-0.5">→ corrected: "{log.corrected_query}"</p>}
                                    {log.enrichment_keywords && <p className="text-xs text-blue-600 mt-0.5">🤖 keywords: {log.enrichment_keywords}</p>}
                                    {log.top_hscode && (
                                        <p className="text-xs text-copy-muted mt-1">
                                            <span className="font-mono text-blue-700 dark:text-blue-300 dark:text-blue-300 bg-blue-50 dark:bg-blue-900/40 dark:bg-blue-900/40 px-1.5 py-0.5 rounded">{log.top_hscode}</span>
                                            {log.top_description && <span className="ml-2 line-clamp-1">{log.top_description}</span>}
                                        </p>
                                    )}
                                </div>
                                <p className="text-[10px] text-gray-300 shrink-0">{fmtDate(log.created_at)}</p>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

// ── Synonyms Tab ────────────────────────────────────────────────────────────

function SynonymsTab() {
    const [synonyms, setSynonyms] = useState<Synonym[]>([]);
    const [loading, setLoading] = useState(true);
    const [creating, setCreating] = useState(false);
    const [newTerm, setNewTerm] = useState('');
    const [newKW, setNewKW] = useState('');
    const [newExpl, setNewExpl] = useState('');

    const load = useCallback(async () => {
        setLoading(true);
        try { setSynonyms(await adminApi.listSynonyms()); } catch (err: any) {
            const msg = err?.response?.status === 403 ? 'Admin access required.' : (err?.message || 'Failed to load synonyms.');
            setSynonyms([]);
            alert(msg);
        }
        setLoading(false);
    }, []);

    useEffect(() => { load(); }, [load]);

    const create = async () => {
        if (!newTerm || !newKW) return;
        await adminApi.createSynonym(newTerm, newKW, newExpl);
        setNewTerm(''); setNewKW(''); setNewExpl(''); setCreating(false);
        load();
    };

    const remove = async (id: number) => {
        if (!confirm('Delete synonym?')) return;
        await adminApi.deleteSynonym(id);
        setSynonyms(prev => prev.filter(s => s.id !== id));
    };

    const providerColor = (p: string | null) => {
        if (!p) return 'bg-surface dark:bg-gray-800 text-copy-muted';
        const map: Record<string, string> = {
            groq: 'bg-orange-100 text-orange-700',
            gemini: 'bg-blue-100 text-blue-700 dark:text-blue-300 dark:text-blue-300',
            cohere: 'bg-pink-100 text-pink-700',
            admin: 'bg-purple-100 text-purple-700 dark:text-purple-300',
        };
        return map[p] ?? 'bg-surface dark:bg-gray-800 text-copy-muted';
    };

    return (
        <div className="space-y-4">
            <div className="bg-surface rounded-2xl border border-border shadow-sm p-4 flex items-center justify-between">
                <div>
                    <p className="font-bold text-copy">Brand & Term Synonym Cache</p>
                    <p className="text-xs text-copy-muted mt-0.5">LLM-resolved mappings reused to skip repeat API calls</p>
                </div>
                <button onClick={() => setCreating(v => !v)} className="px-4 py-2 rounded-xl bg-purple-600 text-white font-semibold text-sm hover:bg-purple-700">+ Add Synonym</button>
            </div>

            {creating && (
                <div className="bg-surface rounded-2xl border border-purple-200 shadow-sm p-5 space-y-3">
                    <p className="font-bold text-purple-700 dark:text-purple-300">Add Manual Synonym</p>
                    <input value={newTerm} onChange={e => setNewTerm(e.target.value)} placeholder='Source term (e.g. "Dilmah")' className="w-full px-4 py-2.5 rounded-xl border border-border text-sm focus:outline-none focus:ring-2 focus:ring-purple-300" />
                    <input value={newKW} onChange={e => setNewKW(e.target.value)} placeholder='Keywords (e.g. "tea, black tea, Ceylon tea")' className="w-full px-4 py-2.5 rounded-xl border border-border text-sm focus:outline-none focus:ring-2 focus:ring-purple-300" />
                    <input value={newExpl} onChange={e => setNewExpl(e.target.value)} placeholder='Explanation (optional)' className="w-full px-4 py-2.5 rounded-xl border border-border text-sm focus:outline-none focus:ring-2 focus:ring-purple-300" />
                    <div className="flex gap-2">
                        <button onClick={create} className="px-5 py-2 rounded-xl bg-purple-600 text-white font-semibold text-sm">Save</button>
                        <button onClick={() => setCreating(false)} className="px-5 py-2 rounded-xl border border-border text-sm text-copy-muted">Cancel</button>
                    </div>
                </div>
            )}

            {loading ? <Spinner /> : synonyms.length === 0 ? <EmptyState icon="🔗" message="No synonyms cached yet. They'll appear here as users search for brand names." /> : (
                <div className="space-y-2">
                    {synonyms.map(s => (
                        <div key={s.id} className="bg-surface rounded-2xl border border-border shadow-sm p-4 flex items-start gap-3">
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                                    <span className="font-bold text-copy">"{s.source_term}"</span>
                                    <Badge label={s.provider ?? 'unknown'} className={providerColor(s.provider)} />
                                    {s.confidence != null && <span className="text-xs text-copy-muted">{(s.confidence * 100).toFixed(0)}% confidence</span>}
                                </div>
                                <p className="text-emerald-700 dark:text-emerald-300 font-medium text-sm">→ {s.resolved_keywords}</p>
                                {s.explanation && <p className="text-copy-muted text-xs mt-0.5 italic">{s.explanation}</p>}
                                <p className="text-[10px] text-gray-300 mt-1">{fmtDate(s.created_at)}</p>
                            </div>
                            <button onClick={() => remove(s.id)} className="px-3 py-1 rounded-lg bg-red-50 text-red-600 text-xs font-semibold hover:bg-red-100 shrink-0">Delete</button>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

// ── Datasets Tab ────────────────────────────────────────────────────────────

function DatasetsTab() {
    const [datasets, setDatasets] = useState<Dataset[]>([]);
    const [active, setActive] = useState<ActiveDataset | null>(null);
    const [status, setStatus] = useState<EmbeddingStatus | null>(null);
    const [loading, setLoading] = useState(true);
    const [uploading, setUploading] = useState(false);
    const [dsName, setDsName] = useState('');
    const [file, setFile] = useState<File | null>(null);
    const [activating, setActivating] = useState<number | null>(null);

    const load = useCallback(async () => {
        setLoading(true);
        try {
            const [ds, act, st] = await Promise.allSettled([
                adminApi.listDatasets(),
                adminApi.getActiveDataset(),
                adminApi.getEmbeddingStatus(),
            ]);
            if (ds.status === 'fulfilled') setDatasets(ds.value);
            if (act.status === 'fulfilled') setActive(act.value);
            if (st.status === 'fulfilled') setStatus(st.value);
        } catch { }
        setLoading(false);
    }, []);

    useEffect(() => { load(); }, [load]);

    // Poll status while embedding is running
    useEffect(() => {
        if (!status?.running) return;
        const id = setInterval(async () => {
            try { setStatus(await adminApi.getEmbeddingStatus()); } catch { }
        }, 3000);
        return () => clearInterval(id);
    }, [status?.running]);

    const upload = async () => {
        if (!file || !dsName) return;
        setUploading(true);
        try {
            await adminApi.uploadDataset(file, dsName);
            setFile(null); setDsName('');
            load();
        } catch (e: any) { alert(e.message || 'Upload failed'); }
        setUploading(false);
    };

    const activate = async (id: number) => {
        if (!confirm('Activate this dataset? It will re-embed all HS codes (this may take several minutes).')) return;
        setActivating(id);
        try { await adminApi.activateDataset(id); load(); } catch (e: any) { alert(e.message || 'Activation failed'); }
        setActivating(null);
    };

    const remove = async (id: number) => {
        if (!confirm('Delete this dataset?')) return;
        await adminApi.deleteDataset(id);
        load();
    };

    return (
        <div className="space-y-4">
            {/* Active dataset */}
            {active && (
                <div className="bg-gradient-to-br from-blue-600 to-indigo-700 rounded-2xl p-5 text-white shadow-lg">
                    <p className="text-xs font-bold uppercase tracking-wide text-blue-200 mb-2">Currently Active Dataset</p>
                    <p className="text-xl font-black">{active.name}</p>
                    <p className="text-blue-200 text-sm">{active.filename}</p>
                    <div className="grid grid-cols-3 gap-4 mt-4">
                        <div><p className="text-2xl font-black">{active.row_count.toLocaleString()}</p><p className="text-blue-200 text-xs">Rows</p></div>
                        <div><p className="text-2xl font-black">{active.vector_count.toLocaleString()}</p><p className="text-blue-200 text-xs">Vectors</p></div>
                        <div><p className="text-2xl font-black">{active.dimension}</p><p className="text-blue-200 text-xs">Dimensions</p></div>
                    </div>
                </div>
            )}

            {/* Embedding status */}
            {status?.running && (
                <div className="bg-amber-50 dark:bg-amber-900/40 border border-amber-200 rounded-2xl p-4">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="w-4 h-4 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
                        <p className="font-bold text-amber-700 dark:text-amber-300">Embedding in progress — {status.progress}%</p>
                    </div>
                    <p className="text-amber-600 text-sm">{status.step}</p>
                    <div className="mt-3 h-2 bg-amber-100 rounded-full overflow-hidden">
                        <div className="h-full bg-amber-50 dark:bg-amber-900/400 rounded-full transition-all" style={{ width: `${status.progress}%` }} />
                    </div>
                </div>
            )}

            {/* Upload */}
            <div className="bg-surface rounded-2xl border border-dashed border-gray-300 shadow-sm p-5">
                <p className="font-bold text-copy mb-3">Upload New CSV Dataset</p>
                <div className="space-y-3">
                    <input value={dsName} onChange={e => setDsName(e.target.value)} placeholder="Dataset name (e.g. HS 2024 v3)" className="w-full px-4 py-2.5 rounded-xl border border-border text-sm focus:outline-none focus:ring-2 focus:ring-blue-200" />
                    <label className={`block w-full border-2 border-dashed rounded-xl p-4 text-center cursor-pointer transition ${file ? 'border-blue-400 bg-blue-50 dark:bg-blue-900/40 dark:bg-blue-900/40' : 'border-border hover:border-blue-300 hover:bg-blue-50 dark:bg-blue-900/40 dark:bg-blue-900/40/50'}`}>
                        <input type="file" accept=".csv" className="hidden" onChange={e => setFile(e.target.files?.[0] ?? null)} />
                        {file ? (
                            <div><p className="font-semibold text-blue-700 dark:text-blue-300 dark:text-blue-300">{file.name}</p><p className="text-xs text-blue-500 mt-0.5">{(file.size / 1024).toFixed(1)} KB</p></div>
                        ) : (
                            <div><p className="text-copy-muted text-sm">Click to choose CSV file</p><p className="text-xs text-copy-muted mt-0.5">Must contain: hscode, description, section, parent, level columns</p></div>
                        )}
                    </label>
                    <button onClick={upload} disabled={!file || !dsName || uploading} className="w-full px-5 py-2.5 rounded-xl bg-blue-600 text-white font-semibold text-sm hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed transition">
                        {uploading ? 'Uploading...' : '⬆ Upload Dataset'}
                    </button>
                </div>
            </div>

            {/* Dataset list */}
            {loading ? <Spinner /> : datasets.length === 0 ? <EmptyState icon="🗄️" message="No datasets uploaded yet." /> : (
                <div className="space-y-2">
                    {datasets.map(ds => (
                        <div key={ds.id} className={`bg-surface rounded-2xl border shadow-sm p-4 ${ds.is_active ? 'border-blue-200' : 'border-border'}`}>
                            <div className="flex items-start gap-3">
                                <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-1">
                                        <span className="font-bold text-copy">{ds.name}</span>
                                        {ds.is_active && <Badge label="Active" className="bg-emerald-100 text-emerald-700 dark:text-emerald-300" />}
                                    </div>
                                    <p className="text-xs text-copy-muted">{ds.filename}</p>
                                    <div className="flex gap-4 mt-1 text-xs text-copy-muted">
                                        <span>{ds.row_count.toLocaleString()} rows</span>
                                        <span>{(ds.size_bytes / 1024).toFixed(1)} KB</span>
                                        <span>{fmtDate(ds.created_at)}</span>
                                    </div>
                                </div>
                                <div className="flex flex-col gap-1.5 shrink-0">
                                    {!ds.is_active && (
                                        <button onClick={() => activate(ds.id)} disabled={activating === ds.id || status?.running} className="px-3 py-1 rounded-lg bg-blue-50 dark:bg-blue-900/40 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 dark:text-blue-300 text-xs font-semibold hover:bg-blue-100 disabled:opacity-40">
                                            {activating === ds.id ? 'Starting…' : '▶ Activate'}
                                        </button>
                                    )}
                                    {!ds.is_active && (
                                        <button onClick={() => remove(ds.id)} className="px-3 py-1 rounded-lg bg-red-50 text-red-600 text-xs font-semibold hover:bg-red-100">Delete</button>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

// ── Admin Profile Widget ────────────────────────────────────────────────────

function AdminProfileWidget({ user, onSignOut }: { user: User; onSignOut: () => void }) {
    const [open, setOpen] = useState(false);
    const [imgFailed, setImgFailed] = useState(false);

    const initials = (user.displayName || user.email || 'A')
        .split(' ').slice(0, 2).map((n: string) => n[0]?.toUpperCase()).join('');

    const handleSignOut = async () => {
        setOpen(false);
        await auth.signOut();
        onSignOut();
    };

    return (
        <div className="relative">
            <button
                onClick={() => setOpen(v => !v)}
                className="flex items-center gap-2.5 pl-2 pr-3 py-1.5 rounded-xl hover:bg-surface dark:bg-gray-800 transition-colors"
            >
                {user.photoURL && !imgFailed ? (
                    <img
                        src={user.photoURL}
                        alt={user.displayName || ''}
                        className="w-8 h-8 rounded-full object-cover ring-2 ring-blue-100"
                        onError={() => setImgFailed(true)}
                    />
                ) : (
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-xs font-black ring-2 ring-blue-100">
                        {initials}
                    </div>
                )}
                <div className="hidden sm:flex flex-col items-start leading-tight">
                    <span className="text-sm font-semibold text-copy max-w-[120px] truncate">
                        {user.displayName || user.email?.split('@')[0] || 'Admin'}
                    </span>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-600 bg-indigo-50 px-1.5 py-0.5 rounded-full mt-0.5">
                        Admin
                    </span>
                </div>
                <svg className={`w-3.5 h-3.5 text-copy-muted transition-transform ${open ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path d="M6 9l6 6 6-6" /></svg>
            </button>

            {open && (
                <>
                    <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
                    <div className="absolute right-0 top-full mt-2 w-64 bg-surface rounded-2xl shadow-xl border border-border z-20 overflow-hidden">
                        <div className="px-4 py-4 bg-gradient-to-br from-blue-50 to-indigo-50 border-b border-border">
                            <div className="flex items-center gap-3">
                                {user.photoURL && !imgFailed ? (
                                    <img src={user.photoURL} alt="" className="w-11 h-11 rounded-full object-cover ring-2 ring-white shadow" />
                                ) : (
                                    <div className="w-11 h-11 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-black text-base ring-2 ring-white shadow">
                                        {initials}
                                    </div>
                                )}
                                <div className="flex-1 min-w-0">
                                    <p className="font-bold text-copy text-sm truncate">{user.displayName || 'Admin User'}</p>
                                    <p className="text-xs text-copy-muted truncate">{user.email}</p>
                                    <div className="flex items-center gap-1 mt-1">
                                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-50 dark:bg-emerald-900/400 animate-pulse" />
                                        <span className="text-[10px] font-bold text-emerald-600">Admin · Active</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="px-4 py-2.5 border-b border-border/50">
                            <p className="text-[10px] text-copy-muted font-medium uppercase tracking-wide mb-0.5">Firebase UID</p>
                            <p className="text-[11px] font-mono text-copy-muted truncate">{user.uid}</p>
                        </div>
                        <div className="p-2">
                            <Link href="/search" onClick={() => setOpen(false)} className="flex items-center gap-3 w-full px-3 py-2 rounded-xl hover:bg-page transition-colors text-sm text-copy font-medium group">
                                <div className="w-7 h-7 rounded-lg bg-blue-50 dark:bg-blue-900/40 dark:bg-blue-900/40 flex items-center justify-center text-blue-600 group-hover:bg-blue-100">
                                    <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" /></svg>
                                </div>
                                Back to Search
                            </Link>
                            <button onClick={handleSignOut} className="flex items-center gap-3 w-full px-3 py-2 rounded-xl hover:bg-red-50 transition-colors text-sm text-red-600 font-medium group mt-0.5">
                                <div className="w-7 h-7 rounded-lg bg-red-50 flex items-center justify-center text-red-500 group-hover:bg-red-100">
                                    <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><polyline points="16 17 21 12 16 7" /><line x1="21" y1="12" x2="9" y2="12" /></svg>
                                </div>
                                Sign Out
                            </button>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}

// ── Main Page ──────────────────────────────────────────────────────────────

export default function AdminDashboard() {
    const router = useRouter();
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    const [isAdmin, setIsAdmin] = useState<boolean | null>(null); // null = checking
    const [activeTab, setActiveTab] = useState<Tab>('overview');

    useEffect(() => {
        const unsub = onAuthStateChanged(auth, u => {
            setUser(u);
            if (!u) { setLoading(false); router.push('/login'); return; }
            // Verify admin role by calling an admin-only endpoint
            adminApi.getAdminStats()
                .then(() => { setIsAdmin(true); setLoading(false); })
                .catch(() => { setIsAdmin(false); setLoading(false); });
        });
        return () => unsub();
    }, [router]);

    if (loading) return (
        <div className="min-h-screen flex items-center justify-center bg-page">
            <div className="w-10 h-10 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
        </div>
    );

    if (!user) return null;

    if (isAdmin === false) return (
        <div className="min-h-screen flex items-center justify-center bg-page">
            <div className="text-center p-8 bg-surface rounded-2xl border border-border shadow max-w-md">
                <div className="w-14 h-14 mx-auto mb-4 rounded-full bg-red-100 flex items-center justify-center">
                    <svg width="28" height="28" fill="none" stroke="#ef4444" strokeWidth="2" viewBox="0 0 24 24"><path d="M18.36 5.64a9 9 0 1 1-12.73 0"/><line x1="12" y1="2" x2="12" y2="12"/></svg>
                </div>
                <h2 className="text-xl font-bold text-copy mb-2">Access Denied</h2>
                <p className="text-copy-muted mb-4">You don&apos;t have admin privileges. Contact your administrator if you believe this is an error.</p>
                <Link href="/search" className="inline-block px-5 py-2.5 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 transition-colors">
                    Back to Search
                </Link>
            </div>
        </div>
    );

    return (
        <div className="min-h-screen bg-page">
            {/* Header */}
            <div className="sticky top-0 z-20 bg-surface border-b border-border shadow-sm">
                <div className="max-w-5xl mx-auto px-4 py-4 flex items-center gap-3">
                    <Link href="/search" className="text-copy-muted hover:text-copy-muted transition-colors">
                        <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path d="M19 12H5M12 5l-7 7 7 7" /></svg>
                    </Link>
                    <div className="flex items-center gap-2 flex-1">
                        <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center">
                            <svg width="16" height="16" fill="none" stroke="white" strokeWidth="2" viewBox="0 0 24 24"><path d="M12 2a10 10 0 1 0 10 10" /><path d="m16 8 4-4" /><path d="M22 2h-4v4" /></svg>
                        </div>
                        <span className="font-black text-copy text-lg">Admin Dashboard</span>
                        <span className="text-gray-300 text-sm hidden sm:block">· CeylonHS</span>
                    </div>
                    <ThemeToggleButton />
                    <AdminProfileWidget user={user} onSignOut={() => router.push('/login')} />
                </div>
                {/* Tab bar */}
                <div className="max-w-5xl mx-auto px-4 pb-0">
                    <div className="flex gap-0 overflow-x-auto">
                        {TABS.map(t => (
                            <button
                                key={t.id}
                                onClick={() => setActiveTab(t.id)}
                                className={`flex items-center gap-2 px-4 py-2.5 text-sm font-semibold border-b-2 whitespace-nowrap transition-colors ${activeTab === t.id ? 'border-blue-600 text-blue-700 dark:text-blue-300 dark:text-blue-300 bg-blue-50 dark:bg-blue-900/40 dark:bg-blue-900/40/60' : 'border-transparent text-copy-muted hover:text-copy'}`}
                            >
                                <span className="text-base">{t.icon}</span>
                                {t.label}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Content */}
            <div className="max-w-5xl mx-auto px-4 py-6">
                {activeTab === 'overview' && <OverviewTab />}
                {activeTab === 'training' && <TrainingTab />}
                {activeTab === 'logs' && <LogsTab />}
                {activeTab === 'synonyms' && <SynonymsTab />}
                {activeTab === 'datasets' && <DatasetsTab />}
            </div>
        </div>
    );
}
