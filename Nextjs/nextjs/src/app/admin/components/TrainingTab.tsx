"use client";

import { useState, useEffect, useCallback } from "react";
import * as adminApi from "@/lib/adminApi";
import type { TrainingPair } from "@/lib/adminApi";
import {
  fmt,
  fmtDate,
  sourceColor,
  qualityBar,
  Badge,
  EmptyState,
  Spinner,
  Icons,
} from "./AdminShared";

export default function TrainingTab() {
  const [pairs, setPairs] = useState<TrainingPair[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "pending" | "approved">("all");
  const [sourceFilter, setSourceFilter] = useState("");
  const [search, setSearch] = useState("");
  const [creating, setCreating] = useState(false);
  const [newQ, setNewQ] = useState("");
  const [newD, setNewD] = useState("");
  const [newHS, setNewHS] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await adminApi.listTrainingPairs({
        approved_only: filter === "approved",
        source: sourceFilter || undefined,
        search: search || undefined,
        limit: 200,
      });
      setPairs(filter === "pending" ? data.filter((p) => !p.approved) : data);
    } catch (err: any) {
      const msg =
        err?.response?.status === 403
          ? "Admin access required."
          : err?.message || "Failed to load training pairs.";
      setPairs([]);
      alert(msg);
    }
    setLoading(false);
  }, [filter, sourceFilter, search]);

  useEffect(() => {
    load();
  }, [load]);

  const approve = async (id: number, val: boolean) => {
    await adminApi.approveTrainingPair(id, val);
    setPairs((prev) => prev.map((p) => (p.id === id ? { ...p, approved: val } : p)));
  };

  const remove = async (id: number) => {
    if (!confirm("Delete this training pair?")) return;
    await adminApi.deleteTrainingPair(id);
    setPairs((prev) => prev.filter((p) => p.id !== id));
  };

  const create = async () => {
    if (!newQ || !newD) return;
    await adminApi.createTrainingPair(newQ, newD, newHS);
    setNewQ("");
    setNewD("");
    setNewHS("");
    setCreating(false);
    load();
  };

  const exportData = async () => {
    const result = await adminApi.exportTrainingData(0.5, true);
    const blob = new Blob([JSON.stringify(result, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "training_pairs.json";
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-4">
      {/* Controls */}
      <div className="bg-surface rounded-2xl border border-border shadow-sm p-4 flex flex-wrap gap-3 items-center">
        <div className="flex gap-1 bg-page rounded-xl p-1">
          {(["all", "pending", "approved"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-1.5 rounded-lg text-sm font-semibold transition-all capitalize ${
                filter === f
                  ? "bg-surface shadow text-blue-700 dark:text-blue-300"
                  : "text-copy-muted hover:text-copy"
              }`}
            >
              {f}
            </button>
          ))}
        </div>
        <select
          value={sourceFilter}
          onChange={(e) => setSourceFilter(e.target.value)}
          className="px-3 py-2 rounded-xl border border-border text-sm text-copy-muted bg-surface focus:outline-none focus:ring-2 focus:ring-blue-200"
        >
          <option value="">All Sources</option>
          <option value="enrichment">AI Enrichment</option>
          <option value="high_confidence">High Confidence</option>
          <option value="manual">Manual</option>
        </select>
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && load()}
          placeholder="Search pairs..."
          className="flex-1 min-w-[160px] px-3 py-2 rounded-xl border border-border text-sm focus:outline-none focus:ring-2 focus:ring-blue-200"
        />
        <button
          onClick={load}
          className="px-4 py-2 rounded-xl bg-blue-50 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 font-semibold text-sm hover:bg-blue-100"
        >
          Filter
        </button>
        <button
          onClick={() => setCreating((v) => !v)}
          className="px-4 py-2 rounded-xl bg-purple-600 text-white font-semibold text-sm hover:bg-purple-700"
        >
          + Add Pair
        </button>
        <button
          onClick={exportData}
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 text-white font-semibold text-sm hover:bg-emerald-700"
        >
          {Icons.downloadArrow} Export JSON
        </button>
      </div>

      {/* Create form */}
      {creating && (
        <div className="bg-surface rounded-2xl border border-purple-200 shadow-sm p-5 space-y-3">
          <p className="font-bold text-purple-700 dark:text-purple-300">
            Add Manual Training Pair
          </p>
          <input
            value={newQ}
            onChange={(e) => setNewQ(e.target.value)}
            placeholder="Query (e.g. 'Premio tuna')"
            className="w-full px-4 py-2.5 rounded-xl border border-border text-sm focus:outline-none focus:ring-2 focus:ring-purple-300"
          />
          <input
            value={newD}
            onChange={(e) => setNewD(e.target.value)}
            placeholder="HS Description (e.g. 'Tuna, skipjack')"
            className="w-full px-4 py-2.5 rounded-xl border border-border text-sm focus:outline-none focus:ring-2 focus:ring-purple-300"
          />
          <input
            value={newHS}
            onChange={(e) => setNewHS(e.target.value)}
            placeholder="HS Code (optional, e.g. '0302.31')"
            className="w-full px-4 py-2.5 rounded-xl border border-border text-sm focus:outline-none focus:ring-2 focus:ring-purple-300"
          />
          <div className="flex gap-2">
            <button
              onClick={create}
              className="px-5 py-2 rounded-xl bg-purple-600 text-white font-semibold text-sm"
            >
              Save
            </button>
            <button
              onClick={() => setCreating(false)}
              className="px-5 py-2 rounded-xl border border-border text-sm text-copy-muted"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      <p className="text-xs text-copy-muted px-1">{pairs.length} pairs</p>

      {/* Pair list */}
      {loading ? (
        <Spinner />
      ) : pairs.length === 0 ? (
        <EmptyState icon={Icons.neural} message="No training pairs found." />
      ) : (
        <div className="space-y-2">
          {pairs.map((p) => (
            <div
              key={p.id}
              className={`bg-surface rounded-2xl border shadow-sm p-4 ${
                p.approved ? "border-green-100" : "border-orange-100"
              }`}
            >
              <div className="flex items-start gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap gap-2 mb-1.5 items-center">
                    <Badge label={p.source} className={sourceColor(p.source)} />
                    {p.approved ? (
                      <Badge label="approved" className="bg-green-100 text-green-700" />
                    ) : (
                      <Badge label="pending" className="bg-orange-100 text-orange-700" />
                    )}
                    {qualityBar(p.quality_score)}
                    {p.positive_hscode && (
                      <span className="font-mono text-xs text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-900/40 px-2 py-0.5 rounded">
                        {p.positive_hscode}
                      </span>
                    )}
                  </div>
                  <p className="font-semibold text-copy text-sm">"{p.query}"</p>
                  <p className="text-copy-muted text-xs mt-1 line-clamp-2">
                    → {p.positive_description}
                  </p>
                  <p className="text-gray-300 text-[10px] mt-1">
                    {fmtDate(p.created_at)}
                  </p>
                </div>
                <div className="flex flex-col gap-1.5 shrink-0">
                  {p.approved ? (
                    <button
                      onClick={() => approve(p.id, false)}
                      className="px-3 py-1 rounded-lg bg-orange-50 text-orange-600 text-xs font-semibold hover:bg-orange-100"
                    >
                      Reject
                    </button>
                  ) : (
                    <button
                      onClick={() => approve(p.id, true)}
                      className="px-3 py-1 rounded-lg bg-green-50 text-green-700 text-xs font-semibold hover:bg-green-100"
                    >
                      Approve
                    </button>
                  )}
                  <button
                    onClick={() => remove(p.id)}
                    className="px-3 py-1 rounded-lg bg-red-50 text-red-600 text-xs font-semibold hover:bg-red-100"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
