"use client";

import { useState } from "react";
import Link from "next/link";
import { auth } from "@/lib/firebase";
import type { User } from "firebase/auth";

export default function AdminProfileWidget({
  user,
  onSignOut,
}: {
  user: User;
  onSignOut: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [imgFailed, setImgFailed] = useState(false);

  const initials = (user.displayName || user.email || "A")
    .split(" ")
    .slice(0, 2)
    .map((n: string) => n[0]?.toUpperCase())
    .join("");

  const handleSignOut = async () => {
    setOpen(false);
    await auth.signOut();
    onSignOut();
  };

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-2.5 pl-2 pr-3 py-1.5 rounded-xl hover:bg-page transition-colors"
      >
        {user.photoURL && !imgFailed ? (
          <img
            src={user.photoURL}
            alt={user.displayName || ""}
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
            {user.displayName || user.email?.split("@")[0] || "Admin"}
          </span>
          <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-600 bg-indigo-50 px-1.5 py-0.5 rounded-full mt-0.5">
            Admin
          </span>
        </div>
        <svg
          className={`w-3.5 h-3.5 text-copy-muted transition-transform ${
            open ? "rotate-180" : ""
          }`}
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          viewBox="0 0 24 24"
        >
          <path d="M6 9l6 6 6-6" />
        </svg>
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-full mt-2 w-64 bg-surface rounded-2xl shadow-xl border border-border z-20 overflow-hidden">
            <div className="px-4 py-4 bg-gradient-to-br from-blue-50 to-indigo-50 border-b border-border">
              <div className="flex items-center gap-3">
                {user.photoURL && !imgFailed ? (
                  <img
                    src={user.photoURL}
                    alt=""
                    className="w-11 h-11 rounded-full object-cover ring-2 ring-white shadow"
                  />
                ) : (
                  <div className="w-11 h-11 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-black text-base ring-2 ring-white shadow">
                    {initials}
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-copy text-sm truncate">
                    {user.displayName || "Admin User"}
                  </p>
                  <p className="text-xs text-copy-muted truncate">{user.email}</p>
                  <div className="flex items-center gap-1 mt-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    <span className="text-[10px] font-bold text-emerald-600">
                      Admin · Active
                    </span>
                  </div>
                </div>
              </div>
            </div>
            <div className="px-4 py-2.5 border-b border-border/50">
              <p className="text-[10px] text-copy-muted font-medium uppercase tracking-wide mb-0.5">
                Firebase UID
              </p>
              <p className="text-[11px] font-mono text-copy-muted truncate">{user.uid}</p>
            </div>
            <div className="p-2">
              <Link
                href="/search"
                onClick={() => setOpen(false)}
                className="flex items-center gap-3 w-full px-3 py-2 rounded-xl hover:bg-page transition-colors text-sm text-copy font-medium group"
              >
                <div className="w-7 h-7 rounded-lg bg-blue-50 dark:bg-blue-900/40 flex items-center justify-center text-blue-600 group-hover:bg-blue-100">
                  <svg
                    width="14"
                    height="14"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    viewBox="0 0 24 24"
                  >
                    <circle cx="11" cy="11" r="8" />
                    <path d="m21 21-4.3-4.3" />
                  </svg>
                </div>
                Back to Search
              </Link>
              <button
                onClick={handleSignOut}
                className="flex items-center gap-3 w-full px-3 py-2 rounded-xl hover:bg-red-50 transition-colors text-sm text-red-600 font-medium group mt-0.5"
              >
                <div className="w-7 h-7 rounded-lg bg-red-50 flex items-center justify-center text-red-500 group-hover:bg-red-100">
                  <svg
                    width="14"
                    height="14"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    viewBox="0 0 24 24"
                  >
                    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                    <polyline points="16 17 21 12 16 7" />
                    <line x1="21" y1="12" x2="9" y2="12" />
                  </svg>
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
