"use client";

import { useEffect, useRef } from "react";

/**
 * HeroCanvas – Product → HS Code particle transformation animation.
 *
 * Product names slide in horizontally from the left at different vertical
 * levels. Near the center headings they disintegrate into particles which
 * then reassemble as the corresponding HS code on the right, before
 * sliding off the right edge.
 *
 * SEO-neutral (canvas is aria-hidden, no blocking JS).
 */

interface Props {
  isDark: boolean;
}

/* ── Product → HS code pairs ──────────────────── */
const MORPH_PAIRS: [string, string][] = [
  ["Dilmah Tea", "0902.30"],
  ["iPhone 15", "8517.13"],
  ["Rice", "1006.30"],
  ["Wooden Chair", "9401.69"],
  ["Cotton Fabric", "5208.21"],
  ["Chocolate", "1806.31"],
  ["Cinnamon", "0906.11"],
  ["Live Horses", "0101.21"],
  ["Rubber Tyre", "4011.10"],
  ["Ceramic Tiles", "6908.90"],
  ["Coconut Oil", "1513.11"],
  ["Laptop", "8471.30"],
];

/* ── Phase boundaries (fraction of 0→1 lifecycle) ─────────
 *  Nearly-sequential with crossfade overlap:
 *  The next phase kicks in when the previous is ~25% opacity,
 *  so there's a smooth handoff with no visible gap.
 */
const P_PROD_IN = 0.18;     // product finishes sliding in
const P_PROD_FADE = 0.22;   // product starts fading out
const P_PROD_GONE = 0.30;   // product text fully gone
const P_PARTS_START = 0.24; // particles begin (while text is ~25% opacity)
const P_PARTS_END = 0.58;   // particles fully arrived at right
const P_HS_START = 0.54;    // HS code begins forming (while particles ~25% opacity)
const P_HS_SOLID = 0.62;    // HS code fully visible, starts sliding out

/* ── Lane vertical positions ─────────────────── */
const LANE_YS_DESKTOP = [0.15, 0.31, 0.48, 0.65, 0.82];
const LANE_YS_MOBILE = [0.22, 0.50, 0.78];

const PARTICLES_PER_CHAR_DESKTOP = 4;
const PARTICLES_PER_CHAR_MOBILE = 2;

/* ── Types ────────────────────────────────────── */
interface Particle {
  srcFrac: number; // fraction within product text width
  tgtFrac: number; // fraction within HS code text width
  srcJY: number; // y jitter at source
  tgtJY: number; // y jitter at target
  midX: number; // scatter X (fraction of W)
  midY: number; // scatter Y offset (px from lane Y)
  size: number;
  delay: number; // 0–0.2 stagger
}

interface Lane {
  product: string;
  hscode: string;
  y: number; // fraction of H
  phase: number; // 0 → 1
  speed: number;
  particles: Particle[];
}

/* ── Helpers ──────────────────────────────────── */
function easeCubic(t: number): number {
  return t < 0.5
    ? 4 * t * t * t
    : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

function makeParticles(
  prodLen: number,
  hsLen: number,
  laneY: number,
  mobile = false,
): Particle[] {
  const ppc = mobile ? PARTICLES_PER_CHAR_MOBILE : PARTICLES_PER_CHAR_DESKTOP;
  const count = Math.max(prodLen, hsLen) * ppc;
  const out: Particle[] = [];
  for (let i = 0; i < count; i++) {
    out.push({
      srcFrac: Math.random(),
      tgtFrac: Math.random(),
      srcJY: (Math.random() - 0.5) * 18,
      tgtJY: (Math.random() - 0.5) * 18,
      midX: 0.36 + Math.random() * 0.28, // scatter across center 36%–64%
      midY: (Math.random() - 0.5) * 90,
      size: 1.2 + Math.random() * 2.4,
      delay: Math.random() * 0.18,
    });
  }
  return out;
}

function spawnLane(y: number, initialPhase: number, mobile = false): Lane {
  const pair =
    MORPH_PAIRS[Math.floor(Math.random() * MORPH_PAIRS.length)];
  return {
    product: pair[0],
    hscode: pair[1],
    y,
    phase: initialPhase,
    speed: 0.0009 + Math.random() * 0.0005,
    particles: makeParticles(
      pair[0].replace(/ /g, "").length,
      pair[1].replace(/[. ]/g, "").length,
      y,
      mobile,
    ),
  };
}

function resetLane(lane: Lane, mobile = false): void {
  const pair =
    MORPH_PAIRS[Math.floor(Math.random() * MORPH_PAIRS.length)];
  lane.product = pair[0];
  lane.hscode = pair[1];
  lane.phase = 0;
  lane.speed = 0.0009 + Math.random() * 0.0005;
  lane.particles = makeParticles(
    pair[0].replace(/ /g, "").length,
    pair[1].replace(/[. ]/g, "").length,
    lane.y,
    mobile,
  );
}

/* ── Component ────────────────────────────────── */
export default function HeroCanvas({ isDark }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let W = 0;
    let H = 0;
    let raf: number;

    function resize() {
      if (!canvas) return;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      W = window.innerWidth;
      H = window.innerHeight;
      canvas.width = W * dpr;
      canvas.height = H * dpr;
      canvas.style.width = `${W}px`;
      canvas.style.height = `${H}px`;
      ctx!.setTransform(dpr, 0, 0, dpr, 0, 0);
    }
    resize();

    // Build lanes – fewer on mobile to avoid clutter
    let mobile = W < 768;
    let laneYs = mobile ? LANE_YS_MOBILE : LANE_YS_DESKTOP;
    let lanes: Lane[] = laneYs.map((y, i) =>
      spawnLane(y, (i / laneYs.length) * 0.75, mobile),
    );

    function onResize() {
      resize();
      const nowMobile = W < 768;
      if (nowMobile !== mobile) {
        mobile = nowMobile;
        laneYs = mobile ? LANE_YS_MOBILE : LANE_YS_DESKTOP;
        lanes = laneYs.map((y, i) =>
          spawnLane(y, (i / laneYs.length) * 0.75, mobile),
        );
      }
    }
    window.addEventListener("resize", onResize);

    function draw() {
      if (!ctx) return;
      ctx.clearRect(0, 0, W, H);

      /* ── Responsive params ───────────────── */
      const isMobile = W < 768;
      const masterAlpha = isMobile ? 0.45 : 1; // subtler on mobile

      // On mobile, push text closer to edges so it doesn't overlap headings
      const xProdOff = isMobile ? -0.25 : -0.18;
      const xProdStop = isMobile ? 0.15 : 0.26;
      const xHsStart = isMobile ? 0.85 : 0.74;
      const xHsOff = isMobile ? 1.25 : 1.18;

      /* ── Palette ─────────────────────────── */
      const prodCol = isDark
        ? "rgba(160, 190, 230, 0.6)"
        : "rgba(30, 58, 138, 0.4)";
      const hsCol = isDark
        ? "rgba(147, 197, 253, 0.9)"
        : "rgba(37, 99, 235, 0.7)";
      const dotCol = isDark
        ? "rgba(96, 165, 250, 0.75)"
        : "rgba(59, 130, 246, 0.55)";
      const glowCol = isDark
        ? "rgba(96, 165, 250, 0.35)"
        : "rgba(59, 130, 246, 0.2)";

      const fontSize = isMobile
        ? Math.round(10 + W * 0.004)
        : Math.round(13 + Math.min(W, 1600) * 0.003);

      for (const lane of lanes) {
        lane.phase += lane.speed;
        if (lane.phase >= 1) {
          resetLane(lane, isMobile);
          continue;
        }

        const p = lane.phase;
        const py = lane.y * H;

        /* ── 1. Product text – slide in, hold, fade out ── */
        if (p < P_PROD_GONE) {
          const slideT = Math.min(1, p / P_PROD_IN);
          const textX = lerp(
            xProdOff,
            xProdStop,
            easeCubic(slideT),
          );

          let alpha = 1;
          if (p < P_PROD_IN * 0.25) {
            alpha = p / (P_PROD_IN * 0.25);
          } else if (p > P_PROD_FADE) {
            alpha =
              1 -
              easeCubic(
                (p - P_PROD_FADE) / (P_PROD_GONE - P_PROD_FADE),
              );
          }

          ctx.save();
          ctx.globalAlpha = Math.max(0, alpha) * 0.85 * masterAlpha;
          ctx.font = `${fontSize}px "Inter", system-ui, sans-serif`;
          ctx.textAlign = "right";
          ctx.textBaseline = "middle";
          ctx.fillStyle = prodCol;
          ctx.fillText(lane.product, textX * W, py);
          ctx.restore();
        }

        /* ── 2. Particles – crossfade overlap with text & HS code ── */
        if (p >= P_PARTS_START && p < P_PARTS_END) {
          ctx.save();

          ctx.font = `${fontSize}px "Inter", system-ui, sans-serif`;
          const prodW = ctx.measureText(lane.product).width;
          ctx.font = `bold ${fontSize}px "Inter", system-ui, monospace`;
          const hsW = ctx.measureText(lane.hscode).width;

          const particleSpan = P_PARTS_END - P_PARTS_START;

          for (const pt of lane.particles) {
            const fullT = (p - P_PARTS_START) / particleSpan;
            const t = Math.max(
              0,
              Math.min(1, (fullT - pt.delay) / (1 - pt.delay)),
            );

            // Source (end of product text), mid (scattered), target (start of HS code)
            const srcX =
              xProdStop * W - prodW * (1 - pt.srcFrac);
            const srcY = py + pt.srcJY;
            const midPx = pt.midX * W;
            const midPy = py + (isMobile ? pt.midY * 0.5 : pt.midY);
            const tgtX = xHsStart * W + hsW * pt.tgtFrac;
            const tgtY = py + pt.tgtJY;

            // 3-point interpolation: source → mid → target
            let cx: number;
            let cy: number;
            if (t < 0.5) {
              const s = easeCubic(t * 2);
              cx = lerp(srcX, midPx, s);
              cy = lerp(srcY, midPy, s);
            } else {
              const s = easeCubic((t - 0.5) * 2);
              cx = lerp(midPx, tgtX, s);
              cy = lerp(midPy, tgtY, s);
            }

            // Fade in at start, full mid, fade out at end
            let opA: number;
            if (t < 0.12) {
              opA = t / 0.12; // quick fade in
            } else if (t > 0.88) {
              opA = (1 - t) / 0.12; // quick fade out
            } else {
              opA = 1;
            }

            ctx.globalAlpha = opA * 0.8 * masterAlpha;
            ctx.beginPath();
            ctx.arc(cx, cy, pt.size, 0, Math.PI * 2);
            ctx.fillStyle = dotCol;
            ctx.fill();

            // Soft glow on larger particles
            if (pt.size > 2.4) {
              ctx.globalAlpha = opA * 0.25 * masterAlpha;
              ctx.beginPath();
              ctx.arc(cx, cy, pt.size * 2.8, 0, Math.PI * 2);
              ctx.fillStyle = glowCol;
              ctx.fill();
            }
          }
          ctx.restore();
        }

        /* ── 3. HS code – crossfade in, then slide out ──── */
        if (p >= P_HS_START) {
          let alpha: number;
          let textX: number;

          if (p < P_HS_SOLID) {
            // Fading in at the right-side position
            alpha = easeCubic(
              (p - P_HS_START) / (P_HS_SOLID - P_HS_START),
            );
            textX = xHsStart;
          } else {
            // Sliding out to the right
            const slideT =
              (p - P_HS_SOLID) / (1 - P_HS_SOLID);
            textX = lerp(
              xHsStart,
              xHsOff,
              easeCubic(slideT),
            );
            alpha = slideT > 0.7 ? (1 - slideT) / 0.3 : 1;
          }

          ctx.save();
          ctx.globalAlpha = Math.max(0, alpha) * 0.9 * masterAlpha;
          ctx.font = `bold ${fontSize}px "Inter", system-ui, monospace`;
          ctx.textAlign = "left";
          ctx.textBaseline = "middle";
          ctx.shadowColor = glowCol;
          ctx.shadowBlur = 12 * Math.min(1, alpha);
          ctx.fillStyle = hsCol;
          ctx.fillText(lane.hscode, textX * W, py);
          ctx.shadowBlur = 0;
          ctx.restore();
        }
      }

      raf = requestAnimationFrame(draw);
    }

    raf = requestAnimationFrame(draw);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", onResize);
    };
  }, [isDark]);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 z-0 h-full w-full"
    />
  );
}
