"use client";

import { motion } from "framer-motion";
import { useTheme } from "@/lib/ThemeContext";

const STEPS = [
  {
    num: "01",
    title: "Describe Your Product",
    description:
      'Type a product name, brand, or description into the search bar. Use natural language — say "wooden dining chairs" or even just "Dilmah".',
    icon: (
      <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="4" width="20" height="16" rx="3" />
        <path d="M6 10h.01M10 10h.01M14 10h.01M18 10h.01M8 14h8" />
      </svg>
    ),
  },
  {
    num: "02",
    title: "AI Finds Your Code",
    description:
      "Our hybrid engine searches 16,000+ codes using keyword matching and semantic AI. Gemini Flash resolves unknown brands on the fly.",
    icon: (
      <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
        <circle cx="12" cy="12" r="3" />
      </svg>
    ),
  },
  {
    num: "03",
    title: "Verify & Export",
    description:
      "Review the matched HS code, explore the full hierarchy, save to your favourites, and access your search history anytime.",
    icon: (
      <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
        <path d="M9 12l2 2 4-4" />
        <path d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  },
];

const fade = (delay: number) => ({
  hidden: { opacity: 0, y: 30 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, delay, ease: [0.25, 0.4, 0.25, 1] as const },
  },
});

export default function HowItWorks() {
  const { isDark } = useTheme();

  return (
    <section
      id="how-it-works"
      className="scroll-mt-20 py-24 md:py-32"
      style={{ background: isDark ? "#080c16" : "#ffffff" }}
    >
      <div className="mx-auto max-w-6xl px-6">
        {/* ── Heading ─────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.6 }}
          className="mb-20 text-center"
        >
          <p className="mb-3 text-sm font-semibold uppercase tracking-widest text-blue-500">
            Simple Workflow
          </p>
          <h2
            className={`text-[clamp(1.75rem,4vw,3rem)] font-bold leading-tight ${
              isDark ? "text-white" : "text-gray-900"
            }`}
          >
            Three Steps to the{" "}
            <span className="bg-gradient-to-r from-blue-500 to-cyan-400 bg-clip-text text-transparent">
              Right Code
            </span>
          </h2>
        </motion.div>

        {/* ── Steps ───────────────────────────── */}
        <div className="relative grid gap-12 md:grid-cols-3 md:gap-8">
          {/* Connector line (desktop) */}
          <div
            aria-hidden
            className={`absolute left-0 right-0 top-16 hidden h-px md:block ${
              isDark ? "bg-white/10" : "bg-gray-200"
            }`}
            style={{ left: "16.6%", right: "16.6%" }}
          />

          {STEPS.map((step, i) => (
            <motion.div
              key={step.num}
              variants={fade(i * 0.15)}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, amount: 0.3 }}
              className="relative text-center"
            >
              {/* Number badge */}
              <div className="relative z-10 mx-auto mb-6 flex h-16 w-16 items-center justify-center">
                <div
                  className={`absolute inset-0 rounded-2xl ${
                    isDark ? "bg-blue-500/10" : "bg-blue-50"
                  }`}
                />
                <span className="relative text-2xl font-black text-blue-500">
                  {step.num}
                </span>
              </div>

              {/* Icon */}
              <div
                className={`mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-xl ${
                  isDark
                    ? "bg-white/[0.04] text-gray-300"
                    : "bg-gray-50 text-gray-600"
                }`}
              >
                {step.icon}
              </div>

              <h3
                className={`mb-3 text-xl font-bold ${
                  isDark ? "text-white" : "text-gray-900"
                }`}
              >
                {step.title}
              </h3>
              <p
                className={`text-sm leading-relaxed ${
                  isDark ? "text-gray-400" : "text-gray-500"
                }`}
              >
                {step.description}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
