"use client";

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { auth, signInWithGoogle } from '@/lib/firebase';
import { signInWithEmailAndPassword, sendPasswordResetEmail, onAuthStateChanged } from 'firebase/auth';
import { syncUser } from '@/lib/api';

// ── Underwater Canvas: light rays + bubbles ──
function UnderwaterCanvas() {
    const canvasRef = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        let W = 0, H = 0, raf: number;

        function resize() {
            if (!canvas) return;
            W = canvas.width = canvas.offsetWidth;
            H = canvas.height = canvas.offsetHeight;
        }
        resize();
        const ro = new ResizeObserver(resize);
        ro.observe(canvas);

        // ── Bubbles ──
        const BUBBLE_COUNT = 40;
        const bubbles = Array.from({ length: BUBBLE_COUNT }, () => ({
            x: Math.random() * 1,  // relative to W
            y: 1 + Math.random() * 0.8,
            r: 2 + Math.random() * 5,
            speed: 0.0006 + Math.random() * 0.0008,
            opacity: 0.15 + Math.random() * 0.3,
        }));

        // ── Light rays ──
        const RAY_COUNT = 7;
        const rays = Array.from({ length: RAY_COUNT }, (_, i) => ({
            xFrac: 0.05 + i * 0.14 + (Math.random() - 0.5) * 0.08,
            width: 0.04 + Math.random() * 0.06,
            opacity: 0.04 + Math.random() * 0.06,
            phase: Math.random() * Math.PI * 2,
            speed: 0.003 + Math.random() * 0.003,
        }));

        let t = 0;

        function draw() {
            if (!ctx) return;
            ctx.clearRect(0, 0, W, H);

            // ── Light rays ──
            for (const ray of rays) {
                const alpha = ray.opacity * (0.7 + 0.3 * Math.sin(t * ray.speed + ray.phase));
                const xBase = ray.xFrac * W;
                const halfW = ray.width * W;
                const grad = ctx.createLinearGradient(xBase, 0, xBase, H);
                grad.addColorStop(0, `rgba(100,200,255,${alpha})`);
                grad.addColorStop(0.6, `rgba(60,170,220,${alpha * 0.5})`);
                grad.addColorStop(1, 'rgba(60,170,220,0)');

                ctx.beginPath();
                ctx.moveTo(xBase - halfW, 0);
                ctx.lineTo(xBase + halfW, 0);
                ctx.lineTo(xBase + halfW * 0.3 + 20, H);
                ctx.lineTo(xBase - halfW * 0.3 - 20, H);
                ctx.closePath();
                ctx.fillStyle = grad;
                ctx.fill();
            }

            // ── Bubbles ──
            for (const b of bubbles) {
                const bx = b.x * W;
                const by = b.y * H;

                const grad = ctx.createRadialGradient(bx - b.r * 0.3, by - b.r * 0.3, 0, bx, by, b.r);
                grad.addColorStop(0, `rgba(200,240,255,${b.opacity * 0.8})`);
                grad.addColorStop(0.5, `rgba(120,200,240,${b.opacity * 0.3})`);
                grad.addColorStop(1, `rgba(80,170,220,${b.opacity * 0.1})`);

                ctx.beginPath();
                ctx.arc(bx, by, b.r, 0, Math.PI * 2);
                ctx.fillStyle = grad;
                ctx.fill();

                // Bubble highlight
                ctx.beginPath();
                ctx.arc(bx - b.r * 0.35, by - b.r * 0.35, b.r * 0.25, 0, Math.PI * 2);
                ctx.fillStyle = `rgba(255,255,255,${b.opacity * 0.7})`;
                ctx.fill();

                // Move bubble gracefully upward 
                b.y -= b.speed;
                if (b.y < -0.1) {
                    b.y = 1.05 + Math.random() * 0.2;
                    b.x = Math.random();
                }
            }

            t++;
            raf = requestAnimationFrame(draw);
        }

        raf = requestAnimationFrame(draw);
        return () => { cancelAnimationFrame(raf); ro.disconnect(); };
    }, []);

    return <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" />;
}

function GoogleButton({ onClick, label = 'Continue with Google' }: { onClick: () => void; label?: string }) {
    return (
        <button type="button" onClick={onClick}
            className="w-full flex items-center justify-center gap-3 py-3 px-4 rounded-xl font-semibold text-sm transition-all hover:-translate-y-0.5"
            style={{ background: 'rgba(255,255,255,0.12)', border: '1px solid rgba(255,255,255,0.25)', color: '#fff' }}>
            <svg width="18" height="18" viewBox="0 0 18 18"><path fill="#4285F4" d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844a4.14 4.14 0 0 1-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" /><path fill="#34A853" d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z" /><path fill="#FBBC05" d="M3.964 10.706A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.706V4.962H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.038l3.007-2.332z" /><path fill="#EA4335" d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.962L3.964 7.294C4.672 5.163 6.656 3.58 9 3.58z" /></svg>
            {label}
        </button>
    );
}

export default function Login() {
    const router = useRouter();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPw, setShowPw] = useState(false);
    const [loading, setLoading] = useState(false);
    const [errorMsg, setErrorMsg] = useState('');
    const [successMsg, setSuccessMsg] = useState('');
    const [mounted, setMounted] = useState(false);

    const authErrorMessage = (err: any, fallback: string) => {
        const code = err?.code as string | undefined;
        if (code === 'auth/network-request-failed') {
            const isLocal = typeof window !== 'undefined' &&
                (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');
            if (isLocal) {
                return 'Firebase connection failed on localhost. Check Firebase Authorized domains (add localhost/127.0.0.1) and API key referrer restrictions.';
            }
            return 'Network error while contacting Firebase. Check your internet/firewall and retry.';
        }
        return fallback;
    };

    // Dive-in animation on mount
    useEffect(() => {
        const t = setTimeout(() => setMounted(true), 60);
        const unsub = onAuthStateChanged(auth, u => { if (u) router.push('/search'); });
        return () => { clearTimeout(t); unsub(); };
    }, [router]);

    const handleGoogle = async () => {
        setErrorMsg('');
        try {
            const cred = await signInWithGoogle();
            if (!cred) return;
            await syncUser();
            router.push('/search');
        }
        catch (err: any) { setErrorMsg(authErrorMessage(err, err.message || 'Google sign-in failed.')); }
    };

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setErrorMsg(''); setSuccessMsg('');
        if (!email || !password) { setErrorMsg('Please fill in all fields.'); return; }
        setLoading(true);
        try {
            await signInWithEmailAndPassword(auth, email, password);
            await syncUser();
            router.push('/search');
        } catch (err: any) {
            const map: Record<string, string> = {
                'auth/invalid-email': 'Invalid email address.',
                'auth/wrong-password': 'Incorrect password.',
                'auth/invalid-credential': 'Incorrect email or password.',
                'auth/too-many-requests': 'Too many attempts. Try again later.',
                'auth/user-disabled': 'Account has been disabled.',
            };
            setErrorMsg(authErrorMessage(err, map[err.code] || err.message));
        } finally { setLoading(false); }
    };

    const handleForgot = async () => {
        if (!email) { setErrorMsg('Enter your email first.'); return; }
        try { await sendPasswordResetEmail(auth, email); setSuccessMsg(`Reset link sent to ${email}`); }
        catch (err: any) { setErrorMsg(authErrorMessage(err, 'Could not send reset email.')); }
    };

    return (
        <div
            className="min-h-screen relative flex items-center justify-center overflow-hidden"
            style={{ background: 'linear-gradient(180deg, #062040 0%, #0a3060 20%, #0d4a8a 55%, #0a5ea8 80%, #0870c0 100%)' }}
        >
            {/* Underwater canvas */}
            <div className="absolute inset-0 z-0">
                <UnderwaterCanvas />
            </div>

            {/* Caustics overlay */}
            <div className="absolute inset-0 z-[1] pointer-events-none"
                style={{ background: 'radial-gradient(ellipse at 50% 0%, rgba(0,140,255,0.18) 0%, transparent 65%)' }} />

            {/* Back home */}
            <Link href="/" className="absolute top-5 left-5 z-20 flex items-center gap-2 text-white/60 hover:text-white/90 text-sm font-medium transition-colors">
                <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M19 12H5M12 5l-7 7 7 7" /></svg>
                Back
            </Link>

            {/* Surface shimmer at top */}
            <div className="absolute top-0 left-0 right-0 h-2 z-[2] pointer-events-none"
                style={{ background: 'linear-gradient(90deg,rgba(100,210,255,0.3),rgba(200,240,255,0.5),rgba(100,210,255,0.3))' }} />

            {/* Card – dive-in animation */}
            <div
                className="relative z-10 w-full max-w-[400px] mx-4 rounded-3xl p-8 transition-all duration-700"
                style={{
                    background: 'rgba(5, 30, 65, 0.65)',
                    backdropFilter: 'blur(28px)',
                    WebkitBackdropFilter: 'blur(28px)',
                    border: '1px solid rgba(100, 200, 255, 0.2)',
                    boxShadow: '0 32px 80px rgba(0,0,0,0.5), 0 0 0 1px rgba(100,200,255,0.08) inset',
                    opacity: mounted ? 1 : 0,
                    transform: mounted ? 'translateY(0) scale(1)' : 'translateY(60px) scale(0.96)',
                }}
            >
                {/* Logo + title */}
                <div className="flex items-center gap-2 mb-1">
                    <div className="w-8 h-8 rounded-[8px] bg-gradient-to-br from-[#133665] to-[#3A9EEA] flex items-center justify-center text-white text-xs font-black">HS</div>
                    <span className="text-white/70 text-sm font-semibold">CeylonHS</span>
                </div>

                <h1 className="text-[26px] font-extrabold text-white mt-4 mb-1">Welcome back</h1>
                <p className="text-white/45 text-sm mb-6">Sign in to continue your dive</p>

                <GoogleButton onClick={handleGoogle} />

                <div className="flex items-center gap-3 my-5">
                    <div className="flex-1 h-px" style={{ background: 'rgba(100,200,255,0.2)' }} />
                    <span className="text-white/30 text-xs">or</span>
                    <div className="flex-1 h-px" style={{ background: 'rgba(100,200,255,0.2)' }} />
                </div>

                <form onSubmit={handleLogin} className="flex flex-col gap-4">
                    <div>
                        <label className="block text-[11px] font-semibold uppercase tracking-wider mb-2" style={{ color: 'rgba(150,215,255,0.6)' }}>Email</label>
                        <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com"
                            className="w-full px-4 py-3 rounded-xl text-white placeholder-white/20 text-sm focus:outline-none transition-all"
                            style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(100,200,255,0.2)' }}
                            onFocus={e => (e.target.style.borderColor = 'rgba(100,200,255,0.5)')}
                            onBlur={e => (e.target.style.borderColor = 'rgba(100,200,255,0.2)')} />
                    </div>
                    <div>
                        <label className="block text-[11px] font-semibold uppercase tracking-wider mb-2" style={{ color: 'rgba(150,215,255,0.6)' }}>Password</label>
                        <div className="relative">
                            <input type={showPw ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••"
                                className="w-full px-4 py-3 pr-12 rounded-xl text-white placeholder-white/20 text-sm focus:outline-none transition-all"
                                style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(100,200,255,0.2)' }}
                                onFocus={e => (e.target.style.borderColor = 'rgba(100,200,255,0.5)')}
                                onBlur={e => (e.target.style.borderColor = 'rgba(100,200,255,0.2)')} />
                            <button type="button" onClick={() => setShowPw(!showPw)} className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60 transition-colors">
                                {showPw ? '🙈' : '👁'}
                            </button>
                        </div>
                        <button type="button" onClick={handleForgot} className="float-right mt-1.5 text-[11px] transition-colors" style={{ color: 'rgba(100,200,255,0.6)' }}
                            onMouseEnter={e => (e.currentTarget.style.color = 'rgba(100,200,255,0.9)')}
                            onMouseLeave={e => (e.currentTarget.style.color = 'rgba(100,200,255,0.6)')}>Forgot password?</button>
                    </div>

                    {errorMsg && <div className="rounded-xl p-3 text-xs text-red-300" style={{ background: 'rgba(255,80,80,0.12)', border: '1px solid rgba(255,80,80,0.3)' }}>{errorMsg}</div>}
                    {successMsg && <div className="rounded-xl p-3 text-xs text-emerald-300" style={{ background: 'rgba(52,168,83,0.12)', border: '1px solid rgba(52,168,83,0.3)' }}>{successMsg}</div>}

                    <button type="submit" disabled={loading}
                        className="w-full py-3.5 rounded-xl font-bold text-white text-sm disabled:opacity-50 transition-all hover:-translate-y-0.5 mt-1"
                        style={{ background: 'linear-gradient(135deg,#0d4a9a,#3A9EEA)', boxShadow: '0 4px 20px rgba(58,158,234,0.35)' }}>
                        {loading ? 'Signing in…' : 'Sign In'}
                    </button>
                </form>

                <p className="text-center text-xs mt-5" style={{ color: 'rgba(255,255,255,0.35)' }}>
                    New here?{' '}
                    <Link href="/register" className="font-semibold transition-colors" style={{ color: 'rgba(100,200,255,0.7)' }}
                        onMouseEnter={(e: any) => (e.target.style.color = 'rgba(100,200,255,1)')}
                        onMouseLeave={(e: any) => (e.target.style.color = 'rgba(100,200,255,0.7)')}>
                        Create account →
                    </Link>
                </p>
            </div>
        </div>
    );
}
