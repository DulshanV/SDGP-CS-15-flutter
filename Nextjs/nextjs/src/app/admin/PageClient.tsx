"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { auth } from "@/lib/firebase";
import { onAuthStateChanged, User } from "firebase/auth";
import * as adminApi from "@/lib/adminApi";
import { ThemeToggleButton } from "@/lib/ThemeContext";
import AdminProfileWidget from "./components/AdminProfileWidget";
import OverviewTab from "./components/OverviewTab";
import TrainingTab from "./components/TrainingTab";
import LogsTab from "./components/LogsTab";
import SynonymsTab from "./components/SynonymsTab";
import DatasetsTab from "./components/DatasetsTab";

// ── Tab definition ────────────────────────────────────────────────────────

type Tab = "overview" | "training" | "logs" | "synonyms" | "datasets";

const TABS: { id: Tab; label: string; icon: React.ReactNode }[] = [
  {
    id: "overview",
    label: "Overview",
    icon: (
      <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
        <rect x="3" y="3" width="7" height="7" rx="1" />
        <rect x="14" y="3" width="7" height="7" rx="1" />
        <rect x="3" y="14" width="7" height="7" rx="1" />
        <rect x="14" y="14" width="7" height="7" rx="1" />
      </svg>
    ),
  },
  {
    id: "training",
    label: "Training Pairs",
    icon: (
      <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
        <path d="M12 2a10 10 0 1 0 10 10" />
        <path d="M12 12 2 2" />
        <path d="m16 8 4-4" />
        <path d="M22 2h-4v4" />
      </svg>
    ),
  },
  {
    id: "logs",
    label: "Search Logs",
    icon: (
      <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
        <line x1="8" y1="6" x2="21" y2="6" />
        <line x1="8" y1="12" x2="21" y2="12" />
        <line x1="8" y1="18" x2="21" y2="18" />
        <line x1="3" y1="6" x2="3.01" y2="6" />
        <line x1="3" y1="12" x2="3.01" y2="12" />
        <line x1="3" y1="18" x2="3.01" y2="18" />
      </svg>
    ),
  },
  {
    id: "synonyms",
    label: "Synonyms",
    icon: (
      <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
        <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
        <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
      </svg>
    ),
  },
  {
    id: "datasets",
    label: "Datasets",
    icon: (
      <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
        <ellipse cx="12" cy="5" rx="9" ry="3" />
        <path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3" />
        <path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5" />
      </svg>
    ),
  },
];

// ── Main page ─────────────────────────────────────────────────────────────

export default function AdminDashboard() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [activeTab, setActiveTab] = useState<Tab>("overview");

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u);
      if (!u) {
        setLoading(false);
        router.push("/login");
        return;
      }
      adminApi
        .getAdminStats()
        .then(() => {
          setIsAdmin(true);
          setLoading(false);
        })
        .catch(() => {
          setIsAdmin(false);
          setLoading(false);
        });
    });
    return () => unsub();
  }, [router]);

  if (loading)
    return (
      <div className="min-h-screen flex items-center justify-center bg-page">
        <div className="w-10 h-10 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
      </div>
    );

  if (!user) return null;

  if (isAdmin === false)
    return (
      <div className="min-h-screen flex items-center justify-center bg-page">
        <div className="text-center p-8 bg-surface rounded-2xl border border-border shadow max-w-md">
          <div className="w-14 h-14 mx-auto mb-4 rounded-full bg-red-100 flex items-center justify-center">
            <svg
              width="28"
              height="28"
              fill="none"
              stroke="#ef4444"
              strokeWidth="2"
              viewBox="0 0 24 24"
            >
              <path d="M18.36 5.64a9 9 0 1 1-12.73 0" />
              <line x1="12" y1="2" x2="12" y2="12" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-copy mb-2">Access Denied</h2>
          <p className="text-copy-muted mb-4">
            You don&apos;t have admin privileges. Contact your administrator if you believe
            this is an error.
          </p>
          <Link
            href="/search"
            className="inline-block px-5 py-2.5 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 transition-colors"
          >
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
          <Link href="/search" className="text-copy-muted hover:text-copy transition-colors">
            <svg
              width="20"
              height="20"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              viewBox="0 0 24 24"
            >
              <path d="M19 12H5M12 5l-7 7 7 7" />
            </svg>
          </Link>
          <div className="flex items-center gap-2 flex-1">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center">
              <svg
                width="16"
                height="16"
                fill="none"
                stroke="white"
                strokeWidth="2"
                viewBox="0 0 24 24"
              >
                <ellipse cx="12" cy="5" rx="9" ry="3" />
                <path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3" />
                <path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5" />
              </svg>
            </div>
            <span className="font-black text-copy text-lg">Admin Dashboard</span>
            <span className="text-gray-300 text-sm hidden sm:block">· CeylonHS</span>
          </div>
          <ThemeToggleButton />
          <AdminProfileWidget user={user} onSignOut={() => router.push("/login")} />
        </div>

        {/* Tab bar */}
        <div className="max-w-5xl mx-auto px-4 pb-0">
          <div className="flex gap-0 overflow-x-auto">
            {TABS.map((t) => (
              <button
                key={t.id}
                onClick={() => setActiveTab(t.id)}
                className={`flex items-center gap-2 px-4 py-2.5 text-sm font-semibold border-b-2 whitespace-nowrap transition-colors ${
                  activeTab === t.id
                    ? "border-blue-600 text-blue-700 dark:text-blue-300 bg-blue-50/60 dark:bg-blue-900/60"
                    : "border-transparent text-copy-muted hover:text-copy"
                }`}
              >
                {t.icon}
                {t.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-5xl mx-auto px-4 py-6">
        {activeTab === "overview" && <OverviewTab />}
        {activeTab === "training" && <TrainingTab />}
        {activeTab === "logs" && <LogsTab />}
        {activeTab === "synonyms" && <SynonymsTab />}
        {activeTab === "datasets" && <DatasetsTab />}
      </div>
    </div>
  );
}
