"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { useTheme } from "@/lib/ThemeContext";
import HeroCanvas from "./HeroCanvas";

const fade = (delay = 0) => ({
  hidden: { opacity: 0, y: 30 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.7, delay, ease: [0.25, 0.4, 0.25, 1] as const },
  },
});

export default function Hero() {
  const { isDark } = useTheme();

  return (
    <section
      className="relative flex min-h-[100dvh] items-center justify-center overflow-hidden px-6 pt-16"
    >
      {/* ── Product → HS code particle animation ── */}
      <HeroCanvas isDark={isDark} />

      {/* ── Soft overlay so text stays readable ─── */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 z-[1]"
        style={{
          background: isDark
            ? "radial-gradient(ellipse 80% 60% at 50% 35%, rgba(8,12,30,0.35) 0%, rgba(8,12,30,0.0) 70%)"
            : "radial-gradient(ellipse 80% 60% at 50% 35%, rgba(255,255,255,0.45) 0%, rgba(255,255,255,0.0) 70%)",
        }}
      />

      {/* ── Content ───────────────────────────── */}
      <motion.div
        initial="hidden"
        animate="visible"
        className="relative z-10 mx-auto max-w-4xl text-center"
        style={{ textShadow: isDark ? "0 2px 20px rgba(0,0,0,0.5)" : "0 2px 16px rgba(255,255,255,0.6)" }}
      >
        {/* Badge */}
        <motion.div variants={fade(0)} className="mb-8 inline-flex items-center gap-2">
          <span
            className={`inline-flex items-center gap-1.5 rounded-full border px-4 py-1.5 text-xs font-semibold tracking-wide ${
              isDark
                ? "border-white/10 bg-white/5 text-blue-300"
                : "border-blue-200 bg-blue-50 text-blue-700"
            }`}
          >
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-blue-400 opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-blue-500" />
            </span>
            AI-Powered Trade Classification
          </span>
        </motion.div>

        {/* Headline */}
        <motion.h1
          variants={fade(0.1)}
          className="mb-6 text-[clamp(2.5rem,7vw,4.5rem)] font-black leading-[1.08] tracking-tight"
        >
          <span className={isDark ? "text-white" : "text-gray-900"}>
            From Product to HS&nbsp;Code
          </span>
          <br />
          <span className="bg-gradient-to-r from-blue-500 via-cyan-400 to-teal-400 bg-clip-text text-transparent">
            in Seconds
          </span>
        </motion.h1>

        {/* Subtitle */}
        <motion.p
          variants={fade(0.2)}
          className={`mx-auto mb-10 max-w-2xl text-lg leading-relaxed md:text-xl ${
            isDark ? "text-gray-400" : "text-gray-600"
          }`}
        >
          Stop guessing customs codes. CeylonHS uses hybrid AI search and real&#8209;time
          brand recognition to classify your products to{" "}
          <strong className={isDark ? "text-gray-200" : "text-gray-800"}>6&#8209;digit precision</strong> —
          instantly.
        </motion.p>

        {/* CTAs */}
        <motion.div variants={fade(0.3)} className="mb-14 flex flex-wrap items-center justify-center gap-4">
          <Link
            href="/search"
            className="group relative inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-blue-600 to-cyan-500 px-8 py-3.5 text-base font-semibold text-white shadow-xl shadow-blue-500/25 transition-all hover:-translate-y-0.5 hover:shadow-2xl hover:shadow-blue-500/30"
          >
            Start Searching Free
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
          <a
            href="#how-it-works"
            className={`inline-flex items-center gap-2 rounded-full border px-8 py-3.5 text-base font-semibold transition-all hover:-translate-y-0.5 ${
              isDark
                ? "border-white/15 text-white hover:bg-white/5"
                : "border-gray-300 text-gray-700 hover:bg-gray-50"
            }`}
          >
            <svg
              className="h-4 w-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth="2"
            >
              <circle cx="12" cy="12" r="10" />
              <polygon points="10,8 16,12 10,16" fill="currentColor" stroke="none" />
            </svg>
            See How It Works
          </a>
        </motion.div>

        {/* Trust indicators */}
        <motion.div
          variants={fade(0.4)}
          className={`flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm font-medium ${
            isDark ? "text-gray-500" : "text-gray-400"
          }`}
        >
          <span className="flex items-center gap-1.5">
            <svg className="h-4 w-4 text-emerald-500" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 10-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                clipRule="evenodd"
              />
            </svg>
            16,000+ HS Codes
          </span>
          <span className="flex items-center gap-1.5">
            <svg className="h-4 w-4 text-emerald-500" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 10-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                clipRule="evenodd"
              />
            </svg>
            Sub-second Results
          </span>
          <span className="flex items-center gap-1.5">
            <svg className="h-4 w-4 text-emerald-500" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 10-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                clipRule="evenodd"
              />
            </svg>
            No Credit Card Required
          </span>
        </motion.div>
      </motion.div>

      {/* ── Scroll indicator ──────────────────── */}
      <div className="absolute bottom-8 left-1/2 z-10 -translate-x-1/2">
        <motion.div
          animate={{ y: [0, 8, 0] }}
          transition={{ repeat: Infinity, duration: 1.8, ease: "easeInOut" }}
          className={`h-10 w-6 rounded-full border-2 ${
            isDark ? "border-white/20" : "border-gray-400/40"
          }`}
        >
          <div
            className={`mx-auto mt-2 h-2 w-1 rounded-full ${
              isDark ? "bg-white/40" : "bg-gray-400/60"
            }`}
          />
        </motion.div>
      </div>
    </section>
  );
}
