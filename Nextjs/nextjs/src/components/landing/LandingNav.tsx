"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useTheme } from "@/lib/ThemeContext";

const NAV_LINKS = [
  { label: "Features", href: "#features" },
  { label: "How It Works", href: "#how-it-works" },
  { label: "Pricing", href: "#pricing" },
  { label: "Team", href: "#team" },
  { label: "Academy", href: "/learning" },
];

export default function LandingNav() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const { isDark, toggleTheme } = useTheme();

  const [user, setUser] = useState(null);

  useEffect(() => {
    try {
      const storedUser = localStorage.getItem("user");
      if (storedUser) {
        setUser(JSON.parse(storedUser));
      }
    } catch (error) {
      console.error("Invalid user data in localStorage");
    }
  }, []);


  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={`fixed top-0 inset-x-0 z-50 transition-all duration-300 ${scrolled
          ? "bg-surface/80 backdrop-blur-2xl border-b border-border shadow-sm"
          : "bg-transparent"
        }`}
    >
      <nav
        className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6"
        aria-label="Primary"
      >
        {/* ── Logo ──────────────────────────────── */}
        <Link
          href="/"
          className="flex items-center gap-1.5 text-2xl font-black tracking-tight text-copy select-none"
        >
          <img
            src="/logo.png"
            alt="CeylonHS Logo"
            className="h-8 w-8 object-contain"
          />
          Ceylon
          <span className="bg-gradient-to-r from-blue-500 to-cyan-400 bg-clip-text text-transparent">
            HS
          </span>
        </Link>

        {/* ── Desktop links ────────────────────── */}
        <div className="hidden items-center gap-8 md:flex">
          {NAV_LINKS.map((l) => (
            <a
              key={l.href}
              href={l.href}
              className="text-sm font-medium text-copy-muted transition-colors hover:text-copy"
            >
              {l.label}
            </a>
          ))}
        </div>

        {/* ── Right actions ─────────────────────── */}
        <div className="flex items-center gap-3">
          {/* Theme toggle */}
          <button
            onClick={toggleTheme}
            aria-label="Toggle theme"
            className="grid h-9 w-9 place-items-center rounded-lg text-copy-muted transition-colors hover:bg-surface/60 hover:text-copy"
          >
            {isDark ? (
              <svg className="h-[18px] w-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z" />
              </svg>
            ) : (
              <svg className="h-[18px] w-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="5" />
                <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" />
              </svg>
            )}
          </button>

          {/* Sign in (desktop) */}
          <Link
            href="/login"
            className="hidden text-sm font-medium text-copy-muted transition-colors hover:text-copy md:inline-flex"
          >
            Sign in
          </Link>

          {/* CTA */}
          <Link
            href="/search"
            className="rounded-full bg-gradient-to-r from-blue-600 to-cyan-500 px-5 py-2 text-sm font-semibold text-white shadow-md shadow-blue-500/20 transition-all hover:-translate-y-0.5 hover:shadow-lg hover:shadow-blue-500/30"
          >
            Try Free
          </Link>

          {/* Mobile hamburger */}
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label="Toggle menu"
            className="grid h-9 w-9 place-items-center rounded-lg text-copy md:hidden"
          >
            {mobileOpen ? (
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path d="M6 18L18 6M6 6l12 12" />
              </svg>
            ) : (
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            )}
          </button>
        </div>
      </nav>

      {/* ── Mobile dropdown ──────────────────── */}
      <div
        className={`overflow-hidden transition-all duration-300 md:hidden ${mobileOpen ? "max-h-80 border-b border-border" : "max-h-0"
          } bg-surface/95 backdrop-blur-2xl`}
      >
        {NAV_LINKS.map((l) => (
          <a
            key={l.href}
            href={l.href}
            onClick={() => setMobileOpen(false)}
            className="block px-6 py-3 text-sm font-medium text-copy-muted transition-colors hover:text-copy"
          >
            {l.label}
          </a>
        ))}
        <Link
          href="/login"
          onClick={() => setMobileOpen(false)}
          className="block px-6 py-3 text-sm font-medium text-copy-muted"
        >
          Sign in
        </Link>
      </div>
    </header>
  );
}
