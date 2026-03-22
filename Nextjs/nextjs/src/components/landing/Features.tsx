"use client";

import { motion } from "framer-motion";
import { useTheme } from "@/lib/ThemeContext";

/* ── icon helpers (inline SVG, no extra deps) ──────────────── */

const IconAI = () => (
  <svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
    <circle cx="12" cy="12" r="4" />
  </svg>
);

const IconBrand = () => (
  <svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
  </svg>
);

const IconSpeed = () => (
  <svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
  </svg>
);

const IconLayers = () => (
  <svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 2L2 7l10 5 10-5-10-5Z" />
    <path d="M2 17l10 5 10-5" />
    <path d="M2 12l10 5 10-5" />
  </svg>
);

const FEATURES = [
  {
    icon: <IconAI />,
    title: "AI-Powered Classification",
    description:
      "Describe your product in plain language – our hybrid engine combines keyword search with semantic AI to find the exact HS code every time.",
    accent: "from-blue-500 to-indigo-500",
  },
  {
    icon: <IconBrand />,
    title: "Smart Brand Recognition",
    description:
      'CeylonHS auto-resolves brand names like "Dilmah" to the correct product category using Gemini Flash enrichment. No other classifier does this.',
    accent: "from-violet-500 to-purple-500",
  },
  {
    icon: <IconSpeed />,
    title: "Lightning-Fast Search",
    description:
      "Typesense-powered hybrid search delivers results in under 100 ms with instant autocomplete, typo tolerance, and smart suggestions built in.",
    accent: "from-amber-500 to-orange-500",
  },
  {
    icon: <IconLayers />,
    title: "6-Digit Precision",
    description:
      "Navigate the full HS code hierarchy – Section, Chapter, Heading. View parent codes, child codes, and related classifications at a glance.",
    accent: "from-emerald-500 to-teal-500",
  },
];

const container = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.12 } },
};

const card = {
  hidden: { opacity: 0, y: 28 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.55, ease: [0.25, 0.4, 0.25, 1] as const },
  },
};

export default function Features() {
  const { isDark } = useTheme();

  return (
    <section id="features" className="scroll-mt-20 py-24 md:py-32" style={{ background: isDark ? "#0b0f1a" : "#f8fafc" }}>
      <div className="mx-auto max-w-7xl px-6">
        {/* ── Section heading ─────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.6 }}
          className="mb-16 text-center"
        >
          <p className="mb-3 text-sm font-semibold uppercase tracking-widest text-blue-500">
            Capabilities
          </p>
          <h2
            className={`text-[clamp(1.75rem,4vw,3rem)] font-bold leading-tight ${
              isDark ? "text-white" : "text-gray-900"
            }`}
          >
            Everything You Need for
            <br className="hidden sm:block" />{" "}
            <span className="bg-gradient-to-r from-blue-500 to-cyan-400 bg-clip-text text-transparent">
              Trade Classification
            </span>
          </h2>
          <p
            className={`mx-auto mt-4 max-w-2xl text-lg ${
              isDark ? "text-gray-400" : "text-gray-500"
            }`}
          >
            Powered by a hybrid AI pipeline that combines Typesense keyword search,
            semantic embeddings, and real-time brand enrichment.
          </p>
        </motion.div>

        {/* ── Cards grid ──────────────────────── */}
        <motion.div
          variants={container}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.15 }}
          className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4"
        >
          {FEATURES.map((f) => (
            <motion.article
              key={f.title}
              variants={card}
              className={`group relative overflow-hidden rounded-3xl border p-8 transition-all hover:-translate-y-1 ${
                isDark
                  ? "border-white/[0.06] bg-white/[0.03] hover:border-white/10 hover:bg-white/[0.05]"
                  : "border-gray-200 bg-white hover:border-gray-300 hover:shadow-xl hover:shadow-gray-200/50"
              }`}
            >
              {/* Gradient glow on hover */}
              <div
                aria-hidden
                className={`pointer-events-none absolute -right-8 -top-8 h-32 w-32 rounded-full bg-gradient-to-br ${f.accent} opacity-0 blur-3xl transition-opacity group-hover:opacity-20`}
              />

              <div
                className={`mb-5 inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br ${f.accent} text-white shadow-lg`}
              >
                {f.icon}
              </div>

              <h3
                className={`mb-2 text-lg font-bold ${
                  isDark ? "text-white" : "text-gray-900"
                }`}
              >
                {f.title}
              </h3>

              <p
                className={`text-sm leading-relaxed ${
                  isDark ? "text-gray-400" : "text-gray-500"
                }`}
              >
                {f.description}
              </p>
            </motion.article>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
