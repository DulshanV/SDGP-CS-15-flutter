"use client";
import { useEffect, useRef } from 'react';

export type Theme = 'dark' | 'light';

interface Props {
    theme: Theme;
    onToggle: () => void;
}

export default function PixelBeach({ theme, onToggle }: Props) {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const tickRef = useRef(0);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const PX = 6; // slightly chunkier pixels
        let W = 0, H = 0, cols = 0, rows = 0;
        let raf: number;
        let lastTs = 0;

        function resize() {
            if (!canvas) return;
            W = canvas.width = window.innerWidth;
            H = canvas.height = window.innerHeight;
            cols = Math.ceil(W / PX);
            rows = Math.ceil(H / PX);
        }
        resize();
        window.addEventListener('resize', resize);

        function lerp(a: number[], b: number[], t: number) {
            return a.map((v, i) => Math.round(v + (b[i] - v) * Math.max(0, Math.min(1, t))));
        }
        function rgb(c: number[], a = 1) {
            return `rgba(${c[0]},${c[1]},${c[2]},${a})`;
        }
        function px(c: number, r: number, color: number[], a = 1) {
            ctx!.globalAlpha = a;
            ctx!.fillStyle = rgb(color);
            ctx!.fillRect(c * PX, r * PX, PX, PX);
        }

        // Stars
        const STAR_COUNT = 150;
        const stars = Array.from({ length: STAR_COUNT }, () => ({
            c: Math.floor(Math.random() * 800),
            r: Math.floor(Math.random() * 60), // sky goes deep
            phase: Math.random() * Math.PI * 2,
            speed: 0.01 + Math.random() * 0.05,
        }));

        // Wind wisps
        const wisps = Array.from({ length: 15 }, () => ({
            x: Math.random() * W,
            y: H * (0.05 + Math.random() * 0.4),
            len: 50 + Math.random() * 100,
            alpha: 0.05 + Math.random() * 0.1,
            speed: 1 + Math.random() * 1.5,
        }));

        let horizonRow = 0;
        let maxSandRow = 0;

        // Waves come from horizon (top) to shore (bottom)
        interface WaveLayer {
            baseRow: number;       // where this wave "spawned"
            currentRow: number;    // current descending row
            phase: number;         // horizontal wiggle phase
            speed: number;         // descending speed (rows per frame)
            receding: boolean;     // 
            recedeTimer: number;
            recedeDuration: number;
            color: number[];
            foamColor: number[];
        }

        let waves: WaveLayer[] = [];

        function initLayout() {
            horizonRow = Math.floor(rows * 0.40); // Horizon at 40% height
            maxSandRow = rows; // Waves can go all the way down
            waves = [
                { baseRow: horizonRow, currentRow: horizonRow + 5, phase: 0, speed: 0.15, receding: false, recedeTimer: 0, recedeDuration: 80, color: [40, 100, 180], foamColor: [210, 235, 255] },
                { baseRow: horizonRow, currentRow: horizonRow + 25, phase: 2, speed: 0.2, receding: false, recedeTimer: 0, recedeDuration: 60, color: [40, 100, 180], foamColor: [210, 235, 255] },
                { baseRow: horizonRow, currentRow: horizonRow + 45, phase: 4, speed: 0.25, receding: false, recedeTimer: 0, recedeDuration: 40, color: [40, 100, 180], foamColor: [210, 235, 255] },
            ];
        }
        initLayout();
        window.addEventListener('resize', initLayout);

        function stepWaves() {
            // Advance top-to-bottom
            for (const w of waves) {
                if (!w.receding) {
                    w.currentRow += w.speed;
                    // Curve speed increases slightly as it nears shore
                    w.speed += 0.001;

                    if (w.currentRow >= maxSandRow - 4) { // Hit the bottom edge
                        w.receding = true;
                        w.recedeTimer = 0;
                    }
                } else {
                    // Recede back up
                    w.recedeTimer++;
                    const progress = w.recedeTimer / w.recedeDuration;
                    w.currentRow -= (w.speed * 0.4); // recede slower than advance

                    if (w.recedeTimer >= w.recedeDuration || w.currentRow <= horizonRow + 2) {
                        // Respawn at horizon
                        w.currentRow = horizonRow + 1;
                        w.receding = false;
                        w.recedeTimer = 0;
                        w.speed = 0.1 + Math.random() * 0.1;
                    }
                }
                w.phase += 0.05; // horizontal wiggle animation
            }
        }

        const isDark = () => theme === 'dark';

        function draw() {
            if (!ctx) return;
            ctx.globalAlpha = 1;
            ctx.clearRect(0, 0, W, H);

            const dark = isDark();

            const SKY_TOP = dark ? [10, 15, 35] : [135, 195, 240];
            const SKY_BOT = dark ? [20, 35, 70] : [200, 230, 255];
            const HORIZON = dark ? [30, 60, 110] : [110, 175, 230];

            const DEEP_SEA = dark ? [15, 35, 75] : [25, 90, 175];
            const MID_SEA = dark ? [25, 60, 115] : [40, 130, 210];
            const SURF_SEA = dark ? [40, 85, 155] : [60, 160, 220];

            const WET_SAND = dark ? [85, 75, 55] : [190, 160, 115];
            const DRY_SAND = dark ? [65, 55, 45] : [230, 210, 165];

            // ── Sky ──
            for (let r = 0; r <= horizonRow; r++) {
                const t = r / horizonRow;
                const col = lerp(SKY_TOP, SKY_BOT, t);
                for (let c = 0; c < cols; c++) px(c, r, col);
            }
            for (let c = 0; c < cols; c++) px(c, horizonRow, HORIZON);

            // ── Sand base (underneath everything below horizon) ──
            for (let r = horizonRow + 1; r < rows; r++) {
                const t = (r - horizonRow) / (rows - horizonRow);
                const col = lerp(WET_SAND, DRY_SAND, t * t); // curve for more wet sand
                for (let c = 0; c < cols; c++) px(c, r, col);
            }

            // ── Sea body (from horizon down to the lowest non-receding wave) ──
            // This fills the water behind the leading waves.
            let lowestSeaRow = horizonRow + 1;
            for (const w of waves) {
                if (!w.receding && w.currentRow > lowestSeaRow) lowestSeaRow = Math.floor(w.currentRow);
            }

            for (let r = horizonRow + 1; r <= lowestSeaRow; r++) {
                const t = (r - horizonRow) / (lowestSeaRow - horizonRow || 1);
                const col = lerp(DEEP_SEA, SURF_SEA, t);
                for (let c = 0; c < cols; c++) {
                    // Add some horizontal wiggle to the sea boundary
                    const wiggle = Math.sin(c * 0.1 + tickRef.current * 0.05) * 1.5;
                    if (r < lowestSeaRow + wiggle) {
                        px(c, r, col);
                    }
                }
            }

            // ── Wave crests & foam ──
            // Sort so receding waves draw first (underneath advancing ones)
            const sortedWaves = [...waves].sort((a, b) => (a.receding ? -1 : 1) - (b.receding ? -1 : 1));

            for (const w of sortedWaves) {
                const waveRow = Math.floor(w.currentRow);
                if (waveRow <= horizonRow) continue; // don't draw above horizon

                for (let c = 0; c < cols; c++) {
                    // Horizontal undulating edge
                    const dy = Math.sin(c * 0.08 + w.phase) * (w.receding ? 0.8 : 1.5);
                    const r = waveRow + Math.round(dy);

                    if (w.receding) {
                        // Receding waves leave thin wet trails and light foam
                        const fade = 1 - (w.recedeTimer / w.recedeDuration);
                        px(c, r, w.foamColor, 0.4 * fade);
                        px(c, r - 1, w.foamColor, 0.2 * fade);
                    } else {
                        // Advancing waves
                        // White foam at front
                        px(c, r, w.foamColor, 0.9);
                        px(c, r - 1, w.foamColor, 0.6);
                        // Surf body right behind foam
                        px(c, r - 2, SURF_SEA, 0.8);
                        px(c, r - 3, MID_SEA, 0.6);
                    }
                }
            }

            // ── Dark mode: Moon + Stars ──
            if (dark) {
                // Moon – visible in upper right, well above horizon
                const moonX = cols - 25; // moved further left to ensure visibility
                const moonY = Math.floor(horizonRow * 0.2); // high up
                const moonData = [
                    [0, 1, 1, 1, 0], [1, 1, 1, 1, 1], [1, 1, 1, 1, 1], [1, 1, 1, 1, 1], [0, 1, 1, 1, 0],
                ];
                moonData.forEach((row, dr) =>
                    row.forEach((v, dc) => {
                        if (v) px(moonX + dc, moonY + dr, [255, 245, 190], 0.95);
                    })
                );
                ctx.globalAlpha = 0.15;
                ctx.fillStyle = 'rgb(255,245,180)';
                ctx.fillRect((moonX - 2) * PX, (moonY - 2) * PX, 9 * PX, 9 * PX);
                ctx.globalAlpha = 1;

                // Stars (blinking)
                const t = tickRef.current;
                for (const s of stars) {
                    if (s.r >= horizonRow - 2) continue; // no stars in water
                    if (s.c >= cols) continue;
                    const blink = (Math.sin(t * s.speed + s.phase) + 1) / 2;
                    if (blink > 0.4) {
                        px(s.c, s.r, [255, 255, 240], blink * 0.9);
                    }
                }
            }

            // ── Light mode: Sun + Wind wisps ──
            if (!dark) {
                // Sun – upper left, clearly visible
                const sx = 20, sy = Math.floor(horizonRow * 0.25);
                for (let dr = -3; dr <= 3; dr++) {
                    for (let dc = -3; dc <= 3; dc++) {
                        const d = Math.sqrt(dr * dr + dc * dc);
                        if (d < 3.2) px(sx + dc, sy + dr, [255, 225, 40], 1 - d * 0.1);
                    }
                }
                ctx.globalAlpha = 0.3;
                ctx.fillStyle = 'rgb(255,225,40)';
                ctx.fillRect((sx - 4) * PX, (sy + 2) * PX, PX * 2, PX);
                ctx.fillRect((sx + 3) * PX, (sy + 2) * PX, PX * 2, PX);
                ctx.fillRect((sx + 3) * PX, (sy - 4) * PX, PX, PX * 2);
                ctx.fillRect((sx + 3) * PX, (sy + 3) * PX, PX, PX * 2);
                ctx.globalAlpha = 1;

                // Wind wisps
                ctx.globalAlpha = 0;
                for (const wisp of wisps) {
                    ctx.globalAlpha = wisp.alpha;
                    const gy = wisp.y;
                    ctx.beginPath();
                    ctx.moveTo(wisp.x, gy);
                    ctx.bezierCurveTo(wisp.x + wisp.len * 0.3, gy - 6, wisp.x + wisp.len * 0.7, gy + 6, wisp.x + wisp.len, gy);
                    ctx.strokeStyle = 'rgba(255,255,255,1)';
                    ctx.lineWidth = 2;
                    ctx.stroke();

                    wisp.x += wisp.speed;
                    if (wisp.x > W + 50) wisp.x = -wisp.len - 50;
                }
                ctx.globalAlpha = 1;
                ctx.lineWidth = 1;
            }
        }

        function loop(ts: number) {
            if (ts - lastTs > 60) { // ~16fps for pixel feel
                tickRef.current++;
                stepWaves();
                draw();
                lastTs = ts;
            }
            raf = requestAnimationFrame(loop);
        }

        raf = requestAnimationFrame(loop);

        return () => {
            cancelAnimationFrame(raf);
            window.removeEventListener('resize', resize);
            window.removeEventListener('resize', initLayout);
        };
    }, [theme]);

    return (
        <canvas
            ref={canvasRef}
            className="fixed inset-0 w-full h-full z-0 pointer-events-none"
            style={{ imageRendering: 'pixelated' }}
        />
    );
}
