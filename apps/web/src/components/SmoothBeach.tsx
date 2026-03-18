"use client";
import { useEffect, useRef } from 'react';

export type Theme = 'dark' | 'light';

interface Props {
    theme: Theme;
    onToggle: () => void;
}

export default function SmoothBeach({ theme, onToggle }: Props) {
    const canvasRef = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        let W = 0, H = 0;
        let raf: number;
        let tick = 0;

        function resize() {
            if (!canvas) return;
            W = canvas.width = window.innerWidth;
            H = canvas.height = window.innerHeight;
        }
        resize();
        window.addEventListener('resize', resize);

        // Stars for dark mode
        const stars = Array.from({ length: 100 }, () => ({
            x: Math.random() * 1, // fraction of W
            y: Math.random() * 0.45, // fraction of horizon
            r: 0.5 + Math.random() * 1.5,
            phase: Math.random() * Math.PI * 2,
            speed: 0.01 + Math.random() * 0.03,
        }));

        // Wind wisps for light mode
        const wisps = Array.from({ length: 12 }, () => ({
            x: Math.random() * 1, // fraction
            y: 0.05 + Math.random() * 0.35, // fraction
            len: 0.05 + Math.random() * 0.1, // fraction of W
            speed: 0.001 + Math.random() * 0.002,
            opacity: 0.05 + Math.random() * 0.15,
        }));

        function draw() {
            if (!ctx) return;
            ctx.clearRect(0, 0, W, H);
            const isDark = theme === 'dark';

            // Dimensions
            const horizonY = H * 0.45;
            const shoreBaseY = H * 0.75;

            // Colors
            const skyTop = isDark ? '#080c1e' : '#87c3f0';
            const skyBot = isDark ? '#141e3c' : '#c8e6ff';
            const seaTop = isDark ? '#0f1c3f' : '#195aaf';
            const seaBot = isDark ? '#1a376e' : '#3cb0d2';
            const sandTop = isDark ? '#4b4030' : '#d2b48c';
            const sandBot = isDark ? '#322a20' : '#e6cdab';
            const waveFoam = isDark ? 'rgba(180, 200, 230, 0.6)' : 'rgba(255, 255, 255, 0.8)';

            // 1. Draw Sky
            const skyGrad = ctx.createLinearGradient(0, 0, 0, horizonY);
            skyGrad.addColorStop(0, skyTop);
            skyGrad.addColorStop(1, skyBot);
            ctx.fillStyle = skyGrad;
            ctx.fillRect(0, 0, W, horizonY);

            // Sun/Moon
            if (isDark) {
                // Moon (top left, visible)
                const mx = W * 0.15, my = H * 0.15;
                ctx.fillStyle = '#fff5e0';
                ctx.beginPath(); ctx.arc(mx, my, 25, 0, Math.PI * 2); ctx.fill();
                // Moon glow
                const glow = ctx.createRadialGradient(mx, my, 25, mx, my, 80);
                glow.addColorStop(0, 'rgba(255,245,224,0.3)');
                glow.addColorStop(1, 'rgba(255,245,224,0)');
                ctx.fillStyle = glow;
                ctx.beginPath(); ctx.arc(mx, my, 80, 0, Math.PI * 2); ctx.fill();

                // Stars
                ctx.fillStyle = '#fff';
                for (const s of stars) {
                    const alpha = 0.3 + 0.7 * ((Math.sin(tick * s.speed + s.phase) + 1) / 2);
                    ctx.globalAlpha = alpha;
                    ctx.beginPath(); ctx.arc(s.x * W, s.y * H, s.r, 0, Math.PI * 2); ctx.fill();
                }
                ctx.globalAlpha = 1;
            } else {
                // Sun (top left, visible)
                const sx = W * 0.15, sy = H * 0.15;
                ctx.fillStyle = '#ffeaa0';
                ctx.beginPath(); ctx.arc(sx, sy, 35, 0, Math.PI * 2); ctx.fill();
                const glow = ctx.createRadialGradient(sx, sy, 35, sx, sy, 120);
                glow.addColorStop(0, 'rgba(255,234,160,0.5)');
                glow.addColorStop(1, 'rgba(255,234,160,0)');
                ctx.fillStyle = glow;
                ctx.beginPath(); ctx.arc(sx, sy, 120, 0, Math.PI * 2); ctx.fill();

                // Wisps
                ctx.strokeStyle = '#fff';
                ctx.lineWidth = 2;
                ctx.lineCap = 'round';
                for (const w of wisps) {
                    ctx.globalAlpha = w.opacity;
                    const x = w.x * W;
                    const y = w.y * H;
                    const len = w.len * W;
                    ctx.beginPath();
                    ctx.moveTo(x, y);
                    ctx.bezierCurveTo(x + len * 0.3, y - 10, x + len * 0.7, y + 10, x + len, y);
                    ctx.stroke();
                    w.x += w.speed;
                    if (w.x > 1.1) w.x = -w.len - 0.1;
                }
                ctx.globalAlpha = 1;
            }

            // 2. Draw Sand (Background behind water)
            const sandGrad = ctx.createLinearGradient(0, horizonY, 0, H);
            sandGrad.addColorStop(0, sandTop);
            sandGrad.addColorStop(1, sandBot);
            ctx.fillStyle = sandGrad;
            ctx.fillRect(0, horizonY, W, H - horizonY);

            // 3. Draw Sea & Waves

            // Global surge (moves up and down the beach extremely slowly)
            // Using a combination of sine and cosine for a natural, non-repeating feel
            const surge = Math.sin(tick * 0.003) * (H * 0.08) + Math.cos(tick * 0.0015) * (H * 0.05);
            const baseShorelineY = shoreBaseY + surge;

            // Define 5 overlapping layers for high realism and texture
            // The lower the offset, the closer it is to the shore (closer to bottom of screen)
            const waveLayers = [
                { offset: -5, ampY: 8, speed: 0.015, phase1: 0.006, phase2: 0.009, alpha: 1.0, color: seaBot, foam: waveFoam, foamThickness: 6 },
                { offset: 12, ampY: 12, speed: 0.012, phase1: 0.004, phase2: 0.011, alpha: 0.8, color: seaBot, foam: waveFoam, foamThickness: 4 },
                { offset: 30, ampY: 18, speed: 0.010, phase1: 0.005, phase2: 0.007, alpha: 0.6, color: seaTop, foam: waveFoam, foamThickness: 3 },
                { offset: 55, ampY: 22, speed: 0.008, phase1: 0.003, phase2: 0.008, alpha: 0.4, color: seaTop, foam: waveFoam, foamThickness: 2 },
                { offset: 85, ampY: 30, speed: 0.006, phase1: 0.002, phase2: 0.005, alpha: 0.3, color: seaTop, foam: waveFoam, foamThickness: 1 },
            ];

            // Draw each layer from back (highest offset) to front (lowest offset)
            for (let i = waveLayers.length - 1; i >= 0; i--) {
                const layer = waveLayers[i];

                // Each layer has its own micro-surge
                const layerSurge = Math.sin(tick * layer.speed) * (layer.offset * 0.4);
                const layerY = baseShorelineY - layer.offset + layerSurge;

                ctx.beginPath();
                ctx.moveTo(0, horizonY);
                ctx.lineTo(W, horizonY);
                ctx.lineTo(W, layerY);

                // Draw the wavy shoreline for this layer with complex interlaced sine waves
                for (let x = W; x >= 0; x -= 10) {
                    const wave1 = Math.sin(x * layer.phase1 + tick * layer.speed * 1.5) * layer.ampY;
                    const wave2 = Math.cos(x * layer.phase2 + tick * layer.speed * 1.2) * (layer.ampY * 0.6);
                    const wave3 = Math.sin(x * (layer.phase1 + layer.phase2) - tick * layer.speed) * (layer.ampY * 0.3);
                    ctx.lineTo(x, layerY + wave1 + wave2 + wave3);
                }
                ctx.lineTo(0, horizonY);
                ctx.closePath();

                // Fill Sea body for this layer
                const seaGrad = ctx.createLinearGradient(0, horizonY, 0, layerY + 20);
                seaGrad.addColorStop(0, seaTop);
                seaGrad.addColorStop(1, layer.color);
                ctx.globalAlpha = layer.alpha;
                ctx.fillStyle = seaGrad;
                ctx.fill();

                // Draw Foam Edge for this layer
                ctx.lineWidth = layer.foamThickness;
                ctx.strokeStyle = layer.foam;
                ctx.stroke();

                // Add soft glow to the leading foam edge (the very front wave)
                if (i === 0) {
                    ctx.shadowColor = isDark ? 'rgba(200, 230, 255, 0.5)' : 'rgba(255, 255, 255, 0.8)';
                    ctx.shadowBlur = 10;
                    ctx.stroke();
                    ctx.shadowBlur = 0; // reset
                }

                ctx.globalAlpha = 1.0;
            }

            // Inner thin foam lines trailing behind the front wave (effervescence)
            ctx.beginPath();
            for (let x = 0; x <= W; x += 15) {
                const w1 = Math.sin(x * 0.006 + tick * 0.014) * 10;
                const w2 = Math.cos(x * 0.008 + tick * 0.018) * 8;
                ctx.lineTo(x, baseShorelineY + w1 + w2 - 25);
            }
            ctx.lineWidth = 2;
            ctx.strokeStyle = isDark ? 'rgba(180, 200, 230, 0.2)' : 'rgba(255, 255, 255, 0.3)';
            ctx.stroke();

            // Additional scattered foam texture just behind the front wave
            ctx.beginPath();
            for (let x = W; x >= 0; x -= 30) {
                const w1 = Math.sin(x * 0.008 + tick * 0.02) * 8;
                const w2 = Math.cos(x * 0.005 - tick * 0.01) * 12;
                ctx.lineTo(x, baseShorelineY + w1 + w2 - 45);
            }
            ctx.lineWidth = 1.5;
            ctx.strokeStyle = isDark ? 'rgba(180, 200, 230, 0.15)' : 'rgba(255, 255, 255, 0.2)';
            ctx.stroke();

            // Wet sand sheen (visible when wave recedes)
            // Follows the MAXIMUM reach of the front wave surge globally
            const maxShorelineY = shoreBaseY + (H * 0.14) + 15;
            if (baseShorelineY < maxShorelineY) {
                ctx.beginPath();
                for (let x = W; x >= 0; x -= 20) {
                    // Static wave shape for the wet line sitting on the sand
                    const staticWave1 = Math.sin(x * 0.006) * 10;
                    const staticWave2 = Math.cos(x * 0.008) * 8;
                    ctx.lineTo(x, maxShorelineY + staticWave1 + staticWave2);
                }
                ctx.lineTo(0, baseShorelineY - 15);
                ctx.lineTo(W, baseShorelineY - 15);
                ctx.closePath();

                const sheenGrad = ctx.createLinearGradient(0, baseShorelineY - 15, 0, maxShorelineY + 15);
                sheenGrad.addColorStop(0, isDark ? 'rgba(40,100,180,0.25)' : 'rgba(100,200,255,0.3)');
                sheenGrad.addColorStop(1, 'rgba(100,200,255,0)');
                ctx.fillStyle = sheenGrad;
                ctx.fill();
            }

            tick++;
            raf = requestAnimationFrame(draw);
        }

        raf = requestAnimationFrame(draw);

        return () => {
            cancelAnimationFrame(raf);
            window.removeEventListener('resize', resize);
        };
    }, [theme]);

    // no pixelated style applied here, rendering normally for smoothness
    return (
        <canvas
            ref={canvasRef}
            className="fixed inset-0 w-full h-full z-0 pointer-events-none"
        />
    );
}
