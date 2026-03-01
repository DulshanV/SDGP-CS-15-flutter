"use client";

import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { useTheme } from "@/lib/ThemeContext";

/* ── Animated counter hook ──────────────────── */
function useCounter(target: number, duration = 2000) {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLDivElement>(null);
  const started = useRef(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !started.current) {
          started.current = true;
          const start = performance.now();
          const step = (now: number) => {
            const progress = Math.min((now - start) / duration, 1);
            const eased = 1 - Math.pow(1 - progress, 3); // ease-out cubic
            setCount(Math.round(eased * target));
            if (progress < 1) requestAnimationFrame(step);
          };
          requestAnimationFrame(step);
        }
      },
      { threshold: 0.4 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [target, duration]);

  return { ref, count };
}

const STATS = [
  { value: 16000, suffix: "+", label: "HS Codes Indexed" },
  { value: 100, suffix: "ms", prefix: "<", label: "Avg Response Time" },
  { value: 99, suffix: "%", label: "Classification Accuracy" },
  { value: 6, suffix: "-Digit", label: "Hierarchical Depth" },
];

export default function Stats() {
  const { isDark } = useTheme();

  return (
    <section
      className="relative overflow-hidden py-20 md:py-28"
      style={{
        background: isDark
          ? "linear-gradient(135deg, #0f172a 0%, #1e1b4b 50%, #0f172a 100%)"
          : "linear-gradient(135deg, #1e3a5f 0%, #1e40af 50%, #1e3a5f 100%)",
      }}
    >
      {/* Decorative glow */}
      <div
        aria-hidden
        className="pointer-events-none absolute left-1/2 top-1/2 h-[600px] w-[600px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-blue-500/10 blur-[120px]"
      />

      <div className="relative mx-auto max-w-6xl px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.6 }}
          className="grid grid-cols-2 gap-8 md:grid-cols-4 md:gap-12"
        >
          {STATS.map((s) => (
            <StatItem key={s.label} {...s} isDark={isDark} />
          ))}
        </motion.div>
      </div>
    </section>
  );
}

function StatItem({
  value,
  suffix,
  prefix,
  label,
}: {
  value: number;
  suffix: string;
  prefix?: string;
  label: string;
  isDark: boolean;
}) {
  const { ref, count } = useCounter(value);

  return (
    <div ref={ref} className="text-center">
      <p className="mb-1 text-[clamp(2rem,5vw,3.5rem)] font-black leading-none text-white">
        {prefix}
        {count.toLocaleString()}
        <span className="text-blue-300">{suffix}</span>
      </p>
      <p className="text-sm font-medium text-blue-200/70">{label}</p>
    </div>
  );
}
