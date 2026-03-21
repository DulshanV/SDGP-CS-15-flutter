"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { useTheme } from "@/lib/ThemeContext";

export default function CTASection() {
  const { isDark } = useTheme();

  return (
    <section className="relative overflow-hidden py-24 md:py-32">
      {/* ── Background ────────────────────────── */}
      <div
        className="absolute inset-0"
        style={{
          background: isDark
            ? "linear-gradient(135deg, #0c1a3d 0%, #1e3a6e 50%, #0c1a3d 100%)"
            : "linear-gradient(135deg, #1e40af 0%, #2563eb 50%, #1e40af 100%)",
        }}
      />
      {/* Blurred orbs */}
      <div
        aria-hidden
        className="pointer-events-none absolute -left-32 top-0 h-[400px] w-[400px] rounded-full bg-cyan-500/20 blur-[100px]"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -right-32 bottom-0 h-[400px] w-[400px] rounded-full bg-blue-500/20 blur-[100px]"
      />

      {/* ── Content ───────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.3 }}
        transition={{ duration: 0.7 }}
        className="relative mx-auto max-w-3xl px-6 text-center"
      >
        <h2 className="mb-6 text-[clamp(1.75rem,5vw,3rem)] font-bold leading-tight text-white">
          Stop guessing HS codes.
          <br />
          Start classifying with confidence.
        </h2>
        <p className="mx-auto mb-10 max-w-xl text-lg text-blue-100/80">
          CeylonHS is free to start — no account required. Upgrade when you need
          more searches, brand intelligence, or API access.
        </p>
        <div className="flex flex-wrap items-center justify-center gap-4">
          <Link
            href="/search"
            className="group inline-flex items-center gap-2 rounded-full bg-white px-8 py-3.5 text-base font-semibold text-blue-700 shadow-xl transition-all hover:-translate-y-0.5 hover:shadow-2xl"
          >
            Try It Free
            <svg
              className="h-4 w-4 transition-transform group-hover:translate-x-0.5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth="2.5"
            >
              <path d="M5 12h14M12 5l7 7-7 7" />
            </svg>
          </Link>
          <Link
            href="/register"
            className="inline-flex items-center gap-2 rounded-full border border-white/25 px-8 py-3.5 text-base font-semibold text-white transition-all hover:-translate-y-0.5 hover:bg-white/10"
          >
            Create Account
          </Link>
        </div>
      </motion.div>
    </section>
  );
}
