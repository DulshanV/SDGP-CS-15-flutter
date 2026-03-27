"use client";

import { motion } from "framer-motion";
import { useTheme } from "@/lib/ThemeContext";

const TESTIMONIALS = [
  {
    quote:
      "CeylonHS cut our HS lookup time from 20 minutes down to seconds. The brand recognition feature alone is worth it – it correctly classified 'Dilmah' as tea without any extra configuration.",
    name: "Amara Perera",
    role: "Senior Customs Broker",
    company: "LK Trade Solutions",
    initials: "AP",
    gradient: "from-blue-500 to-indigo-500",
  },
  {
    quote:
      "We integrated CeylonHS into our logistics pipeline via the API. The accuracy on 6-digit codes is remarkable, and the sub-100ms response time keeps our workflow smooth.",
    name: "Raj Mendis",
    role: "Head of Operations",
    company: "CeylonFreight Pvt Ltd",
    initials: "RM",
    gradient: "from-violet-500 to-purple-500",
  },
  {
    quote:
      "As an SME exporter, I used to struggle with HS codes. CeylonHS lets me just type my product name and get the right code instantly. The free tier is incredibly generous.",
    name: "Nishani Fernando",
    role: "Founder",
    company: "Island Spice Exports",
    initials: "NF",
    gradient: "from-emerald-500 to-teal-500",
  },
];

const container = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.12 } },
};

const card = {
  hidden: { opacity: 0, y: 24 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.55, ease: [0.25, 0.4, 0.25, 1] as const },
  },
};

export default function Testimonials() {
  const { isDark } = useTheme();

  return (
    <section
      className="py-24 md:py-32"
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
          <p className="mb-3 text-sm font-semibold uppercase tracking-widest text-blue-500">
            Testimonials
          </p>
          <h2
            className={`text-[clamp(1.75rem,4vw,3rem)] font-bold leading-tight ${
              isDark ? "text-white" : "text-gray-900"
            }`}
          >
            Trusted by{" "}
            <span className="bg-gradient-to-r from-blue-500 to-cyan-400 bg-clip-text text-transparent">
              Trade Professionals
            </span>
          </h2>
        </motion.div>

        {/* ── Cards ───────────────────────────── */}
        <motion.div
          variants={container}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.15 }}
          className="grid gap-6 md:grid-cols-3"
        >
          {TESTIMONIALS.map((t) => (
            <motion.blockquote
              key={t.name}
              variants={card}
              className={`flex flex-col rounded-3xl border p-8 transition-all hover:-translate-y-1 ${
                isDark
                  ? "border-white/[0.06] bg-white/[0.03] hover:border-white/10"
                  : "border-gray-200 bg-white hover:border-gray-300 hover:shadow-lg"
              }`}
            >
              {/* Stars */}
              <div className="mb-4 flex gap-1 text-amber-400">
                {[...Array(5)].map((_, i) => (
                  <svg
                    key={i}
                    className="h-4 w-4"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                ))}
              </div>

              <p
                className={`mb-6 flex-1 text-sm leading-relaxed ${
                  isDark ? "text-gray-300" : "text-gray-600"
                }`}
              >
                &ldquo;{t.quote}&rdquo;
              </p>

              {/* Author */}
              <div className="flex items-center gap-3">
                <div
                  className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br ${t.gradient} text-sm font-bold text-white`}
                >
                  {t.initials}
                </div>
                <div>
                  <p
                    className={`text-sm font-semibold ${
                      isDark ? "text-white" : "text-gray-900"
                    }`}
                  >
                    {t.name}
                  </p>
                  <p
                    className={`text-xs ${
                      isDark ? "text-gray-400" : "text-gray-500"
                    }`}
                  >
                    {t.role}, {t.company}
                  </p>
                </div>
              </div>
            </motion.blockquote>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
