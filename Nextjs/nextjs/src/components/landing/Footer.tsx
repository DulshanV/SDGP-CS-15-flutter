"use client";

import Link from "next/link";
import { useTheme } from "@/lib/ThemeContext";

const PRODUCT_LINKS = [
  { label: "Search", href: "/search" },
  { label: "Pricing", href: "#pricing" },
];

const COMPANY_LINKS = [
  { label: "Team", href: "#team" },
  { label: "Contact", href: "mailto:hello@ceylonhs.com" },
];

const RESOURCE_LINKS = [
  { label: "Sri Lanka Customs", href: "https://www.customs.gov.lk" },
  { label: "WCO HS Nomenclature", href: "https://www.wcoomd.org" },
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
        {/* ── Grid ────────────────────────────────────────── */}
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
                  <a
                    href={l.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={linkClass}
                  >
                    {l.label} ↗
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* ── Bottom bar ──────────────────────────────────── */}
        <div
          className={`mt-14 border-t pt-6 ${
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
        </div>
      </div>
    </footer>
  );
}
