"use client";

import Link from "next/link";
import { useTheme } from "@/lib/ThemeContext";

const PRODUCT_LINKS = [
  { label: "Search", href: "/search" },
  { label: "Pricing", href: "#pricing" },
  { label: "API Docs", href: "#" },
  { label: "Changelog", href: "#" },
];

const COMPANY_LINKS = [
  { label: "About", href: "#team" },
  { label: "Team", href: "#team" },
  { label: "Careers", href: "#" },
  { label: "Contact", href: "mailto:hello@ceylonhs.com" },
];

const RESOURCE_LINKS = [
  { label: "HS Code Guide", href: "#" },
  { label: "Sri Lanka Customs", href: "https://www.customs.gov.lk", external: true },
  { label: "WCO", href: "https://www.wcoomd.org", external: true },
  { label: "Blog", href: "#" },
];

const LEGAL_LINKS = [
  { label: "Privacy Policy", href: "#" },
  { label: "Terms of Service", href: "#" },
  { label: "Cookie Policy", href: "#" },
];

export default function Footer() {
  const { isDark } = useTheme();

  const linkClass = `text-sm transition-colors ${
    isDark ? "text-gray-400 hover:text-white" : "text-gray-500 hover:text-gray-900"
  }`;

  const headingClass = `mb-4 text-xs font-semibold uppercase tracking-widest ${
    isDark ? "text-gray-300" : "text-gray-900"
  }`;

  return (
    <footer
      style={{ background: isDark ? "#060910" : "#f1f5f9" }}
      className="border-t border-border"
    >
      <div className="mx-auto max-w-7xl px-6 pb-10 pt-16">
        {/* ── Grid ────────────────────────────── */}
        <div className="grid gap-12 sm:grid-cols-2 lg:grid-cols-5">
          {/* Brand column */}
          <div className="lg:col-span-2">
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 text-xl font-black text-copy"
            >
              <svg
                className="h-6 w-6 text-blue-500"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M12 2L2 7l10 5 10-5-10-5Z" />
                <path d="M2 17l10 5 10-5" />
                <path d="M2 12l10 5 10-5" />
              </svg>
              Ceylon
              <span className="bg-gradient-to-r from-blue-500 to-cyan-400 bg-clip-text text-transparent">
                HS
              </span>
            </Link>
            <p
              className={`mt-4 max-w-sm text-sm leading-relaxed ${
                isDark ? "text-gray-400" : "text-gray-500"
              }`}
            >
              AI-powered Harmonized System code search and classification.
              Built in Sri Lanka for global trade.
            </p>

            {/* Social links */}
            <div className="mt-6 flex gap-3">
              {/* Twitter/X */}
              <a
                href="#"
                aria-label="Twitter"
                className={`grid h-9 w-9 place-items-center rounded-lg transition-colors ${
                  isDark
                    ? "text-gray-500 hover:bg-white/5 hover:text-white"
                    : "text-gray-400 hover:bg-gray-200 hover:text-gray-700"
                }`}
              >
                <svg className="h-[18px] w-[18px]" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                </svg>
              </a>
              {/* YouTube */}
              <a
                href="#"
                aria-label="YouTube"
                className={`grid h-9 w-9 place-items-center rounded-lg transition-colors ${
                  isDark
                    ? "text-gray-500 hover:bg-white/5 hover:text-white"
                    : "text-gray-400 hover:bg-gray-200 hover:text-gray-700"
                }`}
              >
                <svg className="h-[18px] w-[18px]" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M23.498 6.186a3.016 3.016 0 00-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 00.502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 002.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 002.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
                </svg>
              </a>
              {/* Facebook */}
              <a
                href="#"
                aria-label="Facebook"
                className={`grid h-9 w-9 place-items-center rounded-lg transition-colors ${
                  isDark
                    ? "text-gray-500 hover:bg-white/5 hover:text-white"
                    : "text-gray-400 hover:bg-gray-200 hover:text-gray-700"
                }`}
              >
                <svg className="h-[18px] w-[18px]" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                </svg>
              </a>
            </div>
          </div>

          {/* Product */}
          <div>
            <h4 className={headingClass}>Product</h4>
            <ul className="space-y-2.5">
              {PRODUCT_LINKS.map((l) => (
                <li key={l.label}>
                  <Link href={l.href} className={linkClass}>
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Company */}
          <div>
            <h4 className={headingClass}>Company</h4>
            <ul className="space-y-2.5">
              {COMPANY_LINKS.map((l) => (
                <li key={l.label}>
                  <Link href={l.href} className={linkClass}>
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Resources */}
          <div>
            <h4 className={headingClass}>Resources</h4>
            <ul className="space-y-2.5">
              {RESOURCE_LINKS.map((l) => (
                <li key={l.label}>
                  {l.external ? (
                    <a
                      href={l.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={linkClass}
                    >
                      {l.label} ↗
                    </a>
                  ) : (
                    <Link href={l.href} className={linkClass}>
                      {l.label}
                    </Link>
                  )}
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* ── Bottom bar ──────────────────────── */}
        <div
          className={`mt-14 flex flex-col items-center justify-between gap-4 border-t pt-6 sm:flex-row ${
            isDark ? "border-white/[0.06]" : "border-gray-200"
          }`}
        >
          <p
            className={`text-xs ${
              isDark ? "text-gray-500" : "text-gray-400"
            }`}
          >
            &copy; {new Date().getFullYear()} CeylonHS. All rights reserved.
          </p>
          <div className="flex gap-6">
            {LEGAL_LINKS.map((l) => (
              <Link
                key={l.label}
                href={l.href}
                className={`text-xs transition-colors ${
                  isDark
                    ? "text-gray-500 hover:text-gray-300"
                    : "text-gray-400 hover:text-gray-600"
                }`}
              >
                {l.label}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
