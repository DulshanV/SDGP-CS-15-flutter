"use client";

import { useState, useEffect, useCallback } from "react";
import * as adminApi from "@/lib/adminApi";
import type { SearchLog } from "@/lib/adminApi";
import { fmtDate, Badge, EmptyState, Spinner, Icons } from "./AdminShared";

export default function LogsTab() {
  const [logs, setLogs] = useState<SearchLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [enrichOnly, setEnrichOnly] = useState(false);
  const [search, setSearch] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await adminApi.getSearchLogs({
        limit: 100,
        enrichment_only: enrichOnly,
        search: search || undefined,
      });
      setLogs(data);
    } catch (err: any) {
      const msg =
        err?.response?.status === 403
          ? "Admin access required."
          : err?.message || "Failed to load logs.";
      setLogs([]);
      alert(msg);
    }
    setLoading(false);
  }, [enrichOnly, search]);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <div className="space-y-4">
      <div className="bg-surface rounded-2xl border border-border shadow-sm p-4 flex flex-wrap gap-3 items-center">
        <label className="flex items-center gap-2 text-sm text-copy-muted cursor-pointer">
          <input
            type="checkbox"
            checked={enrichOnly}
            onChange={(e) => setEnrichOnly(e.target.checked)}
            className="accent-blue-600 w-4 h-4 rounded"
          />
          AI Enriched Only
        </label>
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && load()}
          placeholder="Filter by query..."
          className="flex-1 min-w-[160px] px-3 py-2 rounded-xl border border-border text-sm focus:outline-none focus:ring-2 focus:ring-blue-200"
        />
        <button
          onClick={load}
          className="px-4 py-2 rounded-xl bg-blue-50 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 font-semibold text-sm hover:bg-blue-100"
        >
          Filter
        </button>
      </div>

      <p className="text-xs text-copy-muted px-1">{logs.length} logs</p>

      {loading ? (
        <Spinner />
      ) : logs.length === 0 ? (
        <EmptyState icon={Icons.list} message="No search logs yet." />
      ) : (
        <div className="space-y-2">
          {logs.map((log) => (
            <div
              key={log.id}
              className="bg-surface rounded-2xl border border-border shadow-sm p-4"
            >
              <div className="flex items-start gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap gap-2 mb-1.5">
                    {log.enrichment_used && (
                      <Badge
                        label="AI Enriched"
                        className="bg-blue-100 text-blue-700 dark:text-blue-300"
                      />
                    )}
                    {log.corrected_query && (
                      <Badge
                        label="Corrected"
                        className="bg-amber-100 text-amber-700 dark:text-amber-300"
                      />
                    )}
                    {log.top_score != null && (
                      <span
                        className={`px-2 py-0.5 rounded-full text-[11px] font-bold ${
                          log.top_score >= 50
                            ? "bg-green-100 text-green-700"
                            : log.top_score >= 30
                            ? "bg-yellow-100 text-yellow-700"
                            : "bg-red-100 text-red-600"
                        }`}
                      >
                        {log.top_score.toFixed(1)}%
                      </span>
                    )}
                    <span className="text-[11px] text-copy-muted">
                      {log.result_count} results
                    </span>
                  </div>
                  <p className="font-semibold text-copy text-sm">"{log.query}"</p>
                  {log.corrected_query && (
                    <p className="text-xs text-amber-600 mt-0.5">
                      → corrected: "{log.corrected_query}"
                    </p>
                  )}
                  {log.enrichment_keywords && (
                    <p className="text-xs text-blue-600 mt-0.5 flex items-center gap-1">
                      {Icons.sparkles} keywords: {log.enrichment_keywords}
                    </p>
                  )}
                  {log.top_hscode && (
                    <p className="text-xs text-copy-muted mt-1">
                      <span className="font-mono text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-900/40 px-1.5 py-0.5 rounded">
                        {log.top_hscode}
                      </span>
                      {log.top_description && (
                        <span className="ml-2 line-clamp-1">{log.top_description}</span>
                      )}
                    </p>
                  )}
                </div>
                <p className="text-[10px] text-gray-300 shrink-0">
                  {fmtDate(log.created_at)}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
