"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { useTheme } from "@/lib/ThemeContext";

const PLANS = [
  {
    name: "Starter",
    price: "$3",
    period: "/month",
    description: "For individual traders and small businesses getting started.",
    features: [
      "100 searches per day",
      "Basic HS code classification",
      "Search history (30 days)",
      "Email support",
    ],
    cta: "Get Started",
    href: "/register",
    popular: false,
  },
  {
    name: "Business",
    price: "$5",
    period: "/month",
    description: "For growing businesses that need smart trade intelligence.",
    features: [
      "Unlimited searches",
      "Brand intelligence (Gemini AI)",
      "Favourites & full history",
      "Priority support",
      "Export capabilities",
      "Smart suggestions",
    ],
    cta: "Start Free Trial",
    href: "/register",
    popular: true,
  },
  {
    name: "Enterprise",
    price: "$9",
    period: "/month",
    description: "For logistics firms and customs brokers who need it all.",
    features: [
      "Everything in Business",
      "Custom synonym management",
      "REST API access",
      "Dedicated account manager",
      "99.9% uptime SLA",
      "Admin dashboard",
    ],
    cta: "Contact Sales",
    href: "mailto:hello@ceylonhs.com",
    popular: false,
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

export default function Pricing() {
  const { isDark } = useTheme();

  return (
    <section
      id="pricing"
      className="scroll-mt-20 py-24 md:py-32"
      style={{ background: isDark ? "#0b0f1a" : "#f8fafc" }}
    >
      <div className="mx-auto max-w-6xl px-6">
        {/* ── Heading ───────────────────────── */}
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
            Simple,{" "}
            <span className="bg-gradient-to-r from-blue-500 to-cyan-400 bg-clip-text text-transparent">
              transparent
            </span>{" "}
            plans
          </h2>
          <p
            className={`mx-auto mt-4 max-w-xl text-lg ${
              isDark ? "text-gray-400" : "text-gray-500"
            }`}
          >
            Start free, upgrade when you&apos;re ready. No hidden fees, cancel anytime.
          </p>
        </motion.div>

        {/* ── Cards ─────────────────────────── */}
        <motion.div
          variants={container}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.15 }}
          className="grid gap-6 md:grid-cols-3"
        >
          {PLANS.map((plan) => (
            <motion.div
              key={plan.name}
              variants={card}
              className={`relative flex flex-col overflow-hidden rounded-3xl border p-8 transition-all hover:-translate-y-1 ${
                plan.popular
                  ? isDark
                    ? "border-blue-500/30 bg-gradient-to-b from-blue-500/10 to-transparent shadow-xl shadow-blue-500/10"
                    : "border-blue-200 bg-white shadow-xl shadow-blue-100"
                  : isDark
                  ? "border-white/[0.06] bg-white/[0.02]"
                  : "border-gray-200 bg-white"
              }`}
            >
              {/* Popular badge */}
              {plan.popular && (
                <div className="absolute right-6 top-6">
                  <span className="rounded-full bg-gradient-to-r from-blue-600 to-cyan-500 px-3 py-1 text-xs font-bold text-white">
                    Most Popular
                  </span>
                </div>
              )}

              <h3
                className={`mb-1 text-lg font-bold ${
                  isDark ? "text-white" : "text-gray-900"
                }`}
              >
                {plan.name}
              </h3>
              <p
                className={`mb-6 text-sm ${
                  isDark ? "text-gray-400" : "text-gray-500"
                }`}
              >
                {plan.description}
              </p>

              <div className="mb-8">
                <span
                  className={`text-5xl font-black ${
                    isDark ? "text-white" : "text-gray-900"
                  }`}
                >
                  {plan.price}
                </span>
                <span
                  className={`ml-1 text-base ${
                    isDark ? "text-gray-400" : "text-gray-500"
                  }`}
                >
                  {plan.period}
                </span>
              </div>

              <ul className="mb-8 flex-1 space-y-3">
                {plan.features.map((feat) => (
                  <li key={feat} className="flex items-start gap-2.5">
                    <svg
                      className="mt-0.5 h-5 w-5 flex-shrink-0 text-emerald-500"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 10-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                        clipRule="evenodd"
                      />
                    </svg>
                    <span
                      className={`text-sm ${
                        isDark ? "text-gray-300" : "text-gray-600"
                      }`}
                    >
                      {feat}
                    </span>
                  </li>
                ))}
              </ul>

              <Link
                href={plan.href}
                className={`mt-auto block rounded-full py-3 text-center text-sm font-semibold transition-all hover:-translate-y-0.5 ${
                  plan.popular
                    ? "bg-gradient-to-r from-blue-600 to-cyan-500 text-white shadow-lg shadow-blue-500/25 hover:shadow-xl hover:shadow-blue-500/30"
                    : isDark
                    ? "border border-white/15 bg-white/5 text-white hover:bg-white/10"
                    : "border border-gray-300 bg-gray-50 text-gray-700 hover:bg-gray-100"
                }`}
              >
                {plan.cta}
              </Link>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
