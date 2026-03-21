"use client";

import { useState, useEffect, useCallback } from "react";
import * as adminApi from "@/lib/adminApi";
import type { AdminStats, TrendItem, TrainingStats } from "@/lib/adminApi";
import {
  fmt,
  fmtDate,
  qualityBar,
  StatCard,
  SectionHeader,
  EmptyState,
  Spinner,
  Icons,
} from "./AdminShared";

export default function OverviewTab() {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [tStats, setTStats] = useState<TrainingStats | null>(null);
  const [trends, setTrends] = useState<TrendItem[]>([]);
  const [feedbackEnabled, setFeedbackEnabled] = useState(true);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setErr("");
    try {
      const [s, ts, tr, fb] = await Promise.all([
        adminApi.getAdminStats(),
        adminApi.getTrainingStats(),
        adminApi.getSearchTrends(7, 15),
        adminApi.getFeedbackStatus(),
      ]);
      setStats(s);
      setTStats(ts);
      setTrends(tr);
      setFeedbackEnabled(fb.enabled);
    } catch (e: any) {
      setErr(
        e.response?.status === 403
          ? "Admin access required. Make sure your account has admin role."
          : e.message || "Failed to load stats."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const toggleFeedback = async () => {
    await adminApi.toggleFeedback(!feedbackEnabled);
    setFeedbackEnabled((v) => !v);
  };

  if (loading) return <Spinner />;
  if (err)
    return (
      <div className="bg-red-50 border border-red-200 rounded-2xl p-6 text-center">
        <p className="text-red-700 font-medium">{err}</p>
      </div>
    );

  return (
    <div className="space-y-6">
      {/* Stat cards */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard
          label="Total Users"
          value={fmt(stats?.total_users)}
          color="bg-blue-50 dark:bg-blue-900/40 text-blue-600"
          icon={
            <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
              <circle cx="9" cy="7" r="4" />
              <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
              <path d="M16 3.13a4 4 0 0 1 0 7.75" />
            </svg>
          }
        />
        <StatCard
          label="Total Searches"
          value={fmt(stats?.total_searches)}
          color="bg-indigo-50 text-indigo-600"
          icon={
            <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <circle cx="11" cy="11" r="8" />
              <path d="m21 21-4.3-4.3" />
            </svg>
          }
        />
        <StatCard
          label="Today's Searches"
          value={fmt(stats?.searches_today)}
          color="bg-emerald-50 dark:bg-emerald-900/40 text-emerald-600"
          icon={
            <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <rect width="18" height="18" x="3" y="4" rx="2" ry="2" />
              <path d="M16 2v4M8 2v4M3 10h18" />
            </svg>
          }
        />
        <StatCard
          label="Training Pairs"
          value={fmt(tStats?.training_pairs)}
          color="bg-purple-50 dark:bg-purple-900/40 text-purple-600"
          icon={
            <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path d="M12 2a10 10 0 1 0 10 10" />
              <path d="M12 12 2 2" />
              <path d="m16 8 4-4" />
              <path d="M22 2h-4v4" />
            </svg>
          }
        />
      </div>

      {/* AI stats row */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="bg-surface rounded-2xl border border-border shadow-sm p-4">
          <p className="text-xs text-copy-muted mb-1 font-medium uppercase tracking-wide">
            Avg Match Score
          </p>
          <p className="text-3xl font-black text-copy">
            {tStats?.avg_top_score?.toFixed(1) ?? "—"}
            <span className="text-base font-medium text-copy-muted">%</span>
          </p>
        </div>
        <div className="bg-surface rounded-2xl border border-border shadow-sm p-4">
          <p className="text-xs text-copy-muted mb-1 font-medium uppercase tracking-wide">
            AI Enriched Searches
          </p>
          <p className="text-3xl font-black text-copy">
            {fmt(tStats?.enrichment_searches)}
          </p>
        </div>
        <div className="bg-surface rounded-2xl border border-border shadow-sm p-4 flex items-center justify-between">
          <div>
            <p className="text-xs text-copy-muted mb-1 font-medium uppercase tracking-wide">
              Feedback Loop
            </p>
            <p
              className={`text-base font-bold ${
                feedbackEnabled ? "text-emerald-600" : "text-copy-muted"
              }`}
            >
              {feedbackEnabled ? "Active" : "Paused"}
            </p>
          </div>
          <button
            onClick={toggleFeedback}
            className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors focus:outline-none ${
              feedbackEnabled ? "bg-emerald-500" : "bg-gray-300"
            }`}
          >
            <span
              className={`inline-block h-5 w-5 rounded-full bg-surface shadow-md transform transition-transform ${
                feedbackEnabled ? "translate-x-6" : "translate-x-1"
              }`}
            />
          </button>
        </div>
      </div>

      {/* Trending queries */}
      <div className="bg-surface rounded-2xl border border-border shadow-sm p-5">
        <SectionHeader
          title="Trending Searches"
          action={
            <span className="text-copy-muted">{Icons.trendingUp}</span>
          }
        />
        {trends.length === 0 ? (
          <EmptyState icon={Icons.inbox} message="No searches recorded yet." />
        ) : (
          <div className="space-y-2">
            {trends.map((t, i) => (
              <div key={i} className="flex items-center gap-3">
                <span className="w-6 text-center text-xs text-copy-muted font-bold">
                  {i + 1}
                </span>
                <div className="flex-1">
                  <div className="flex-1 h-6 bg-page rounded-lg overflow-hidden">
                    <div
                      className="h-full rounded-lg bg-gradient-to-r from-blue-400 to-indigo-500 opacity-80"
                      style={{
                        width: `${Math.min(
                          (t.search_count / (trends[0]?.search_count || 1)) * 100,
                          100
                        )}%`,
                      }}
                    />
                  </div>
                </div>
                <span className="font-semibold text-sm text-copy min-w-[120px]">
                  {t.query_text}
                </span>
                <span className="text-xs text-copy-muted w-14 text-right">
                  {t.search_count}×
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Top queries */}
      {tStats?.top_queries && tStats.top_queries.length > 0 && (
        <div className="bg-surface rounded-2xl border border-border shadow-sm p-5">
          <SectionHeader
            title="All-Time Top Queries"
            action={<span className="text-copy-muted">{Icons.barChart}</span>}
          />
          <div className="flex flex-wrap gap-2">
            {tStats.top_queries.map((q, i) => (
              <span
                key={i}
                className="px-3 py-1 rounded-full bg-blue-50 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 text-sm font-medium"
              >
                {q.query}{" "}
                <span className="text-blue-400 text-xs">({q.count})</span>
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
