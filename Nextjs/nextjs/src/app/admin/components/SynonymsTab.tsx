"use client";

import { useState, useEffect, useCallback } from "react";
import * as adminApi from "@/lib/adminApi";
import type { Synonym } from "@/lib/adminApi";
import { fmtDate, Badge, EmptyState, Spinner, Icons } from "./AdminShared";

function providerColor(p: string | null) {
  if (!p) return "bg-surface dark:bg-gray-800 text-copy-muted";
  const map: Record<string, string> = {
    groq: "bg-orange-100 text-orange-700",
    gemini: "bg-blue-100 text-blue-700 dark:text-blue-300",
    cohere: "bg-pink-100 text-pink-700",
    admin: "bg-purple-100 text-purple-700 dark:text-purple-300",
  };
  return map[p] ?? "bg-surface dark:bg-gray-800 text-copy-muted";
}

export default function SynonymsTab() {
  const [synonyms, setSynonyms] = useState<Synonym[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [newTerm, setNewTerm] = useState("");
  const [newKW, setNewKW] = useState("");
  const [newExpl, setNewExpl] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setSynonyms(await adminApi.listSynonyms());
    } catch (err: any) {
      const msg =
        err?.response?.status === 403
          ? "Admin access required."
          : err?.message || "Failed to load synonyms.";
      setSynonyms([]);
      alert(msg);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const create = async () => {
    if (!newTerm || !newKW) return;
    await adminApi.createSynonym(newTerm, newKW, newExpl);
    setNewTerm("");
    setNewKW("");
    setNewExpl("");
    setCreating(false);
    load();
  };

  const remove = async (id: number) => {
    if (!confirm("Delete synonym?")) return;
    await adminApi.deleteSynonym(id);
    setSynonyms((prev) => prev.filter((s) => s.id !== id));
  };

  return (
    <div className="space-y-4">
      <div className="bg-surface rounded-2xl border border-border shadow-sm p-4 flex items-center justify-between">
        <div>
          <p className="font-bold text-copy">Brand & Term Synonym Cache</p>
          <p className="text-xs text-copy-muted mt-0.5">
            LLM-resolved mappings reused to skip repeat API calls
          </p>
        </div>
        <button
          onClick={() => setCreating((v) => !v)}
          className="px-4 py-2 rounded-xl bg-purple-600 text-white font-semibold text-sm hover:bg-purple-700"
        >
          + Add Synonym
        </button>
      </div>

      {creating && (
        <div className="bg-surface rounded-2xl border border-purple-200 shadow-sm p-5 space-y-3">
          <p className="font-bold text-purple-700 dark:text-purple-300">
            Add Manual Synonym
          </p>
          <input
            value={newTerm}
            onChange={(e) => setNewTerm(e.target.value)}
            placeholder='Source term (e.g. "Dilmah")'
            className="w-full px-4 py-2.5 rounded-xl border border-border text-sm focus:outline-none focus:ring-2 focus:ring-purple-300"
          />
          <input
            value={newKW}
            onChange={(e) => setNewKW(e.target.value)}
            placeholder='Keywords (e.g. "tea, black tea, Ceylon tea")'
            className="w-full px-4 py-2.5 rounded-xl border border-border text-sm focus:outline-none focus:ring-2 focus:ring-purple-300"
          />
          <input
            value={newExpl}
            onChange={(e) => setNewExpl(e.target.value)}
            placeholder="Explanation (optional)"
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

      {loading ? (
        <Spinner />
      ) : synonyms.length === 0 ? (
        <EmptyState
          icon={Icons.link}
          message="No synonyms cached yet. They'll appear here as users search for brand names."
        />
      ) : (
        <div className="space-y-2">
          {synonyms.map((s) => (
            <div
              key={s.id}
              className="bg-surface rounded-2xl border border-border shadow-sm p-4 flex items-start gap-3"
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                  <span className="font-bold text-copy">"{s.source_term}"</span>
                  <Badge
                    label={s.provider ?? "unknown"}
                    className={providerColor(s.provider)}
                  />
                  {s.confidence != null && (
                    <span className="text-xs text-copy-muted">
                      {(s.confidence * 100).toFixed(0)}% confidence
                    </span>
                  )}
                </div>
                <p className="text-emerald-700 dark:text-emerald-300 font-medium text-sm">
                  → {s.resolved_keywords}
                </p>
                {s.explanation && (
                  <p className="text-copy-muted text-xs mt-0.5 italic">{s.explanation}</p>
                )}
                <p className="text-[10px] text-gray-300 mt-1">{fmtDate(s.created_at)}</p>
              </div>
              <button
                onClick={() => remove(s.id)}
                className="px-3 py-1 rounded-lg bg-red-50 text-red-600 text-xs font-semibold hover:bg-red-100 shrink-0"
              >
                Delete
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
