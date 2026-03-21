"use client";

import { motion } from "framer-motion";
import { useTheme } from "@/lib/ThemeContext";

const MEMBERS = [
  {
    name: "Dulshan V.",
    role: "Project Lead & Full-Stack",
    initials: "DV",
    gradient: "from-blue-600 to-indigo-600",
    bio: "Architected the hybrid search pipeline and Typesense integration. Leads backend and infra.",
  },
  {
    name: "Thevinu",
    role: "AI & Search Engineer",
    initials: "TH",
    gradient: "from-violet-600 to-purple-600",
    bio: "Built the Gemini Flash enrichment layer and FAISS fallback search engine.",
  },
  {
    name: "Thamadi",
    role: "Frontend Engineer",
    initials: "TM",
    gradient: "from-pink-500 to-rose-500",
    bio: "Designed and built the Next.js web app, landing page, and glassmorphic UI system.",
  },
  {
    name: "Chanugi",
    role: "Flutter Developer",
    initials: "CH",
    gradient: "from-emerald-500 to-teal-500",
    bio: "Developed the cross-platform Flutter mobile app for iOS and Android.",
  },
  {
    name: "Muditha",
    role: "Data & ML Engineer",
    initials: "MU",
    gradient: "from-amber-500 to-orange-500",
    bio: "Curated the HS code dataset and fine-tuned embedding models for semantic search.",
  },
  {
    name: "Yasmi",
    role: "QA & Documentation",
    initials: "YA",
    gradient: "from-cyan-500 to-sky-500",
    bio: "Ensured end-to-end quality, wrote API docs, and managed the testing pipeline.",
  },
];

const container = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.08 } },
};

const card = {
  hidden: { opacity: 0, y: 24 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: [0.25, 0.4, 0.25, 1] as const },
  },
};

export default function Team() {
  const { isDark } = useTheme();

  return (
    <section
      id="team"
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
          className="mb-16 text-center"
        >
          <h2
            className={`text-[clamp(1.75rem,4vw,3rem)] font-bold leading-tight ${
              isDark ? "text-white" : "text-gray-900"
            }`}
          >
            Built by{" "}
            <span className="bg-gradient-to-r from-blue-500 to-cyan-400 bg-clip-text text-transparent">
              passionate engineers
            </span>
          </h2>
          <p
            className={`mx-auto mt-4 max-w-xl text-lg ${
              isDark ? "text-gray-400" : "text-gray-500"
            }`}
          >
            A focused team of six turning trade classification into a solved problem.
          </p>
        </motion.div>

        {/* ── Grid ────────────────────────────── */}
        <motion.div
          variants={container}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.1 }}
          className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3"
        >
          {MEMBERS.map((m) => (
            <motion.div
              key={m.name}
              variants={card}
              className={`group rounded-3xl border p-8 text-center transition-all hover:-translate-y-1 ${
                isDark
                  ? "border-white/[0.06] bg-white/[0.03] hover:border-white/10"
                  : "border-gray-200 bg-white hover:border-gray-300 hover:shadow-lg"
              }`}
            >
              {/* Avatar */}
              <div
                className={`mx-auto mb-5 flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br ${m.gradient} text-2xl font-bold text-white shadow-lg transition-transform group-hover:scale-105`}
              >
                {m.initials}
              </div>

              <h3
                className={`mb-1 text-lg font-bold ${
                  isDark ? "text-white" : "text-gray-900"
                }`}
              >
                {m.name}
              </h3>
              <p className="mb-3 text-sm font-semibold text-blue-500">
                {m.role}
              </p>
              <p
                className={`text-sm leading-relaxed ${
                  isDark ? "text-gray-400" : "text-gray-500"
                }`}
              >
                {m.bio}
              </p>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
