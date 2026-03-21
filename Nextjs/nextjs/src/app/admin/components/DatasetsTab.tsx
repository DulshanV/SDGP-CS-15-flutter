"use client";

import { useState, useEffect, useCallback } from "react";
import * as adminApi from "@/lib/adminApi";
import type { Dataset, ActiveDataset, EmbeddingStatus } from "@/lib/adminApi";
import { fmtDate, Badge, EmptyState, Spinner, Icons } from "./AdminShared";

export default function DatasetsTab() {
  const [datasets, setDatasets] = useState<Dataset[]>([]);
  const [active, setActive] = useState<ActiveDataset | null>(null);
  const [status, setStatus] = useState<EmbeddingStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [dsName, setDsName] = useState("");
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
      if (ds.status === "fulfilled") setDatasets(ds.value);
      if (act.status === "fulfilled") setActive(act.value);
      if (st.status === "fulfilled") setStatus(st.value);
    } catch {}
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  // Poll status while embedding is running
  useEffect(() => {
    if (!status?.running) return;
    const id = setInterval(async () => {
      try {
        setStatus(await adminApi.getEmbeddingStatus());
      } catch {}
    }, 3000);
    return () => clearInterval(id);
  }, [status?.running]);

  const upload = async () => {
    if (!file || !dsName) return;
    setUploading(true);
    try {
      await adminApi.uploadDataset(file, dsName);
      setFile(null);
      setDsName("");
      load();
    } catch (e: any) {
      alert(e.message || "Upload failed");
    }
    setUploading(false);
  };

  const activate = async (id: number) => {
    if (
      !confirm(
        "Activate this dataset? It will re-embed all HS codes (this may take several minutes)."
      )
    )
      return;
    setActivating(id);
    try {
      await adminApi.activateDataset(id);
      load();
    } catch (e: any) {
      alert(e.message || "Activation failed");
    }
    setActivating(null);
  };

  const remove = async (id: number) => {
    if (!confirm("Delete this dataset?")) return;
    await adminApi.deleteDataset(id);
    load();
  };

  return (
    <div className="space-y-4">
      {/* Active dataset */}
      {active && (
        <div className="bg-gradient-to-br from-blue-600 to-indigo-700 rounded-2xl p-5 text-white shadow-lg">
          <p className="text-xs font-bold uppercase tracking-wide text-blue-200 mb-2">
            Currently Active Dataset
          </p>
          <p className="text-xl font-black">{active.name}</p>
          <p className="text-blue-200 text-sm">{active.filename}</p>
          <div className="grid grid-cols-3 gap-4 mt-4">
            <div>
              <p className="text-2xl font-black">{active.row_count.toLocaleString()}</p>
              <p className="text-blue-200 text-xs">Rows</p>
            </div>
            <div>
              <p className="text-2xl font-black">{active.vector_count.toLocaleString()}</p>
              <p className="text-blue-200 text-xs">Vectors</p>
            </div>
            <div>
              <p className="text-2xl font-black">{active.dimension}</p>
              <p className="text-blue-200 text-xs">Dimensions</p>
            </div>
          </div>
        </div>
      )}

      {/* Embedding status */}
      {status?.running && (
        <div className="bg-amber-50 dark:bg-amber-900/40 border border-amber-200 rounded-2xl p-4">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-4 h-4 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
            <p className="font-bold text-amber-700 dark:text-amber-300">
              Embedding in progress — {status.progress}%
            </p>
          </div>
          <p className="text-amber-600 text-sm">{status.step}</p>
          <div className="mt-3 h-2 bg-amber-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-amber-500 rounded-full transition-all"
              style={{ width: `${status.progress}%` }}
            />
          </div>
        </div>
      )}

      {/* Upload */}
      <div className="bg-surface rounded-2xl border border-dashed border-gray-300 shadow-sm p-5">
        <p className="font-bold text-copy mb-3">Upload New CSV Dataset</p>
        <div className="space-y-3">
          <input
            value={dsName}
            onChange={(e) => setDsName(e.target.value)}
            placeholder="Dataset name (e.g. HS 2024 v3)"
            className="w-full px-4 py-2.5 rounded-xl border border-border text-sm focus:outline-none focus:ring-2 focus:ring-blue-200"
          />
          <label
            className={`block w-full border-2 border-dashed rounded-xl p-4 text-center cursor-pointer transition ${
              file
                ? "border-blue-400 bg-blue-50 dark:bg-blue-900/40"
                : "border-border hover:border-blue-300 hover:bg-blue-50/50"
            }`}
          >
            <input
              type="file"
              accept=".csv"
              className="hidden"
              onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            />
            {file ? (
              <div>
                <p className="font-semibold text-blue-700 dark:text-blue-300">{file.name}</p>
                <p className="text-xs text-blue-500 mt-0.5">
                  {(file.size / 1024).toFixed(1)} KB
                </p>
              </div>
            ) : (
              <div>
                <p className="text-copy-muted text-sm">Click to choose CSV file</p>
                <p className="text-xs text-copy-muted mt-0.5">
                  Must contain: hscode, description, section, parent, level columns
                </p>
              </div>
            )}
          </label>
          <button
            onClick={upload}
            disabled={!file || !dsName || uploading}
            className="w-full inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 text-white font-semibold text-sm hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed transition"
          >
            {Icons.uploadArrow}
            {uploading ? "Uploading..." : "Upload Dataset"}
          </button>
        </div>
      </div>

      {/* Dataset list */}
      {loading ? (
        <Spinner />
      ) : datasets.length === 0 ? (
        <EmptyState icon={Icons.database} message="No datasets uploaded yet." />
      ) : (
        <div className="space-y-2">
          {datasets.map((ds) => (
            <div
              key={ds.id}
              className={`bg-surface rounded-2xl border shadow-sm p-4 ${
                ds.is_active ? "border-blue-200" : "border-border"
              }`}
            >
              <div className="flex items-start gap-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-bold text-copy">{ds.name}</span>
                    {ds.is_active && (
                      <Badge
                        label="Active"
                        className="bg-emerald-100 text-emerald-700 dark:text-emerald-300"
                      />
                    )}
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
                    <>
                      <button
                        onClick={() => activate(ds.id)}
                        disabled={activating === ds.id || !!status?.running}
                        className="px-3 py-1 rounded-lg bg-blue-50 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 text-xs font-semibold hover:bg-blue-100 disabled:opacity-40"
                      >
                        {activating === ds.id ? "Starting…" : "Activate"}
                      </button>
                      <button
                        onClick={() => remove(ds.id)}
                        className="px-3 py-1 rounded-lg bg-red-50 text-red-600 text-xs font-semibold hover:bg-red-100"
                      >
                        Delete
                      </button>
                    </>
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
