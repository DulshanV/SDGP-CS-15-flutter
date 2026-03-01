"use client";

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { auth, googleProvider, signInWithPopup } from '@/lib/firebase';
import { createUserWithEmailAndPassword, updateProfile, onAuthStateChanged } from 'firebase/auth';
import emailjs from '@emailjs/browser';
import { syncUser } from '@/lib/api';

// Re-uses same underwater canvas as login
function UnderwaterCanvas() {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        let W = 0, H = 0, raf: number, t = 0;
        const resize = () => { if (!canvas) return; W = canvas.width = canvas.offsetWidth; H = canvas.height = canvas.offsetHeight; };
        resize();
        const ro = new ResizeObserver(resize); ro.observe(canvas);
        const BUBBLE_COUNT = 35;
        const bubbles = Array.from({ length: BUBBLE_COUNT }, () => ({
            x: Math.random(), y: 1 + Math.random() * 0.8, r: 1.5 + Math.random() * 4,
            speed: 0.0006 + Math.random() * 0.001,
            opacity: 0.12 + Math.random() * 0.28,
        }));
        const rays = Array.from({ length: 6 }, (_, i) => ({
            xFrac: 0.08 + i * 0.15 + (Math.random() - 0.5) * 0.06,
            width: 0.04 + Math.random() * 0.06, opacity: 0.035 + Math.random() * 0.05,
            phase: Math.random() * Math.PI * 2, speed: 0.003 + Math.random() * 0.003,
        }));
        function draw() {
            ctx!.clearRect(0, 0, W, H);
            for (const ray of rays) {
                const a = ray.opacity * (0.7 + 0.3 * Math.sin(t * ray.speed + ray.phase));
                const xBase = ray.xFrac * W, hw = ray.width * W;
                const g = ctx!.createLinearGradient(xBase, 0, xBase, H);
                g.addColorStop(0, `rgba(100,200,255,${a})`); g.addColorStop(0.6, `rgba(60,170,220,${a * 0.5})`); g.addColorStop(1, 'rgba(60,170,220,0)');
                ctx!.beginPath(); ctx!.moveTo(xBase - hw, 0); ctx!.lineTo(xBase + hw, 0); ctx!.lineTo(xBase + hw * 0.3 + 20, H); ctx!.lineTo(xBase - hw * 0.3 - 20, H);
                ctx!.closePath(); ctx!.fillStyle = g; ctx!.fill();
            }
            for (const b of bubbles) {
                const bx = b.x * W, by = b.y * H;
                const g = ctx!.createRadialGradient(bx - b.r * 0.3, by - b.r * 0.3, 0, bx, by, b.r);
                g.addColorStop(0, `rgba(200,240,255,${b.opacity * 0.8})`); g.addColorStop(0.5, `rgba(120,200,240,${b.opacity * 0.3})`); g.addColorStop(1, `rgba(80,170,220,${b.opacity * 0.1})`);
                ctx!.beginPath(); ctx!.arc(bx, by, b.r, 0, Math.PI * 2); ctx!.fillStyle = g; ctx!.fill();
                ctx!.beginPath(); ctx!.arc(bx - b.r * 0.35, by - b.r * 0.35, b.r * 0.25, 0, Math.PI * 2); ctx!.fillStyle = `rgba(255,255,255,${b.opacity * 0.7})`; ctx!.fill();
                b.y -= b.speed;
                if (b.y < -0.1) { b.y = 1.05 + Math.random() * 0.2; b.x = Math.random(); }
            }
            t++; raf = requestAnimationFrame(draw);
        }
        raf = requestAnimationFrame(draw);
        return () => { cancelAnimationFrame(raf); ro.disconnect(); };
    }, []);
    return <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" />;
}

function GoogleButton({ onClick }: { onClick: () => void }) {
    return (
        <button type="button" onClick={onClick}
            className="w-full flex items-center justify-center gap-3 py-3 px-4 rounded-xl font-semibold text-sm text-white transition-all hover:-translate-y-0.5"
            style={{ background: 'rgba(255,255,255,0.12)', border: '1px solid rgba(255,255,255,0.25)' }}>
            <svg width="18" height="18" viewBox="0 0 18 18"><path fill="#4285F4" d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844a4.14 4.14 0 0 1-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" /><path fill="#34A853" d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z" /><path fill="#FBBC05" d="M3.964 10.706A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.706V4.962H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.038l3.007-2.332z" /><path fill="#EA4335" d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.962L3.964 7.294C4.672 5.163 6.656 3.58 9 3.58z" /></svg>
            Continue with Google
        </button>
    );
}

export default function Register() {
    const router = useRouter();
    const [first, setFirst] = useState('');
    const [last, setLast] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirm, setConfirm] = useState('');
    const [showPw, setShowPw] = useState(false);
    const [loading, setLoading] = useState(false);
    const [errorMsg, setErrorMsg] = useState('');
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        const ejsKey = process.env.NEXT_PUBLIC_EMAILJS_PUBLIC_KEY;
        if (ejsKey) emailjs.init({ publicKey: ejsKey });
        const t = setTimeout(() => setMounted(true), 60);
        const unsub = onAuthStateChanged(auth, u => { if (u) router.push('/search'); });
        return () => { clearTimeout(t); unsub(); };
    }, [router]);

    const handleGoogle = async () => {
        try { await signInWithPopup(auth, googleProvider); await syncUser(); router.push('/search'); }
        catch (err: any) { setErrorMsg(err.message || 'Google sign-in failed.'); }
    };

    const handleRegister = async (e: React.FormEvent) => {
        e.preventDefault(); setErrorMsg('');
        if (password !== confirm) { setErrorMsg('Passwords do not match.'); return; }
        setLoading(true);
        try {
            const cred = await createUserWithEmailAndPassword(auth, email, password);
            const displayName = [first, last].filter(Boolean).join(' ') || email.split('@')[0];
            await updateProfile(cred.user, { displayName });
            try {
                const svcId = process.env.NEXT_PUBLIC_EMAILJS_SERVICE_ID;
                const tplId = process.env.NEXT_PUBLIC_EMAILJS_TEMPLATE_ID;
                if (svcId && tplId) {
                    await emailjs.send(svcId, tplId, { to_email: email, user_name: displayName, from_name: 'CeylonHS Team', reply_to: 'ceylonhscode@gmail.com' });
                }
            } catch { }
            await syncUser();
            router.push('/search');
        } catch (err: any) { setErrorMsg(err.message); }
        finally { setLoading(false); }
    };

    const inputStyle = { background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(100,200,255,0.2)', color: '#fff' };
    const labelStyle = { color: 'rgba(150,215,255,0.6)' };

    return (
        <div className="min-h-screen relative flex items-center justify-center overflow-hidden py-10"
            style={{ background: 'linear-gradient(180deg, #062040 0%, #0a3060 20%, #0d4a8a 55%, #0a5ea8 80%, #0870c0 100%)' }}>
            <div className="absolute inset-0 z-0"><UnderwaterCanvas /></div>
            <div className="absolute inset-0 z-[1] pointer-events-none" style={{ background: 'radial-gradient(ellipse at 50% 0%, rgba(0,140,255,0.18) 0%, transparent 65%)' }} />
            <div className="absolute top-0 left-0 right-0 h-2 z-[2] pointer-events-none" style={{ background: 'linear-gradient(90deg,rgba(100,210,255,0.3),rgba(200,240,255,0.5),rgba(100,210,255,0.3))' }} />
            <Link href="/" className="absolute top-5 left-5 z-20 flex items-center gap-2 text-white/60 hover:text-white/90 text-sm font-medium transition-colors">
                <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M19 12H5M12 5l-7 7 7 7" /></svg>
                Back
            </Link>

            <div className="relative z-10 w-full max-w-[420px] mx-4 rounded-3xl p-8 transition-all duration-700"
                style={{
                    background: 'rgba(5, 30, 65, 0.65)', backdropFilter: 'blur(28px)', WebkitBackdropFilter: 'blur(28px)',
                    border: '1px solid rgba(100, 200, 255, 0.2)', boxShadow: '0 32px 80px rgba(0,0,0,0.5), 0 0 0 1px rgba(100,200,255,0.08) inset',
                    opacity: mounted ? 1 : 0, transform: mounted ? 'translateY(0) scale(1)' : 'translateY(60px) scale(0.96)',
                }}>
                <div className="flex items-center gap-2 mb-1">
                    <div className="w-8 h-8 rounded-[8px] bg-gradient-to-br from-[#133665] to-[#3A9EEA] flex items-center justify-center text-white text-xs font-black">HS</div>
                    <span className="text-white/70 text-sm font-semibold">CeylonHS</span>
                </div>
                <h1 className="text-[26px] font-extrabold text-white mt-4 mb-1">Create account</h1>
                <p className="text-sm mb-6" style={{ color: 'rgba(255,255,255,0.4)' }}>Join and start classifying with AI</p>

                <GoogleButton onClick={handleGoogle} />
                <div className="flex items-center gap-3 my-5">
                    <div className="flex-1 h-px" style={{ background: 'rgba(100,200,255,0.2)' }} />
                    <span className="text-[11px]" style={{ color: 'rgba(255,255,255,0.3)' }}>or</span>
                    <div className="flex-1 h-px" style={{ background: 'rgba(100,200,255,0.2)' }} />
                </div>

                <form onSubmit={handleRegister} className="flex flex-col gap-3">
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="block text-[11px] font-semibold uppercase tracking-wider mb-1.5" style={labelStyle}>First name</label>
                            <input type="text" value={first} onChange={e => setFirst(e.target.value)} placeholder="John"
                                className="w-full px-4 py-3 rounded-xl text-sm focus:outline-none transition-all placeholder-white/20" style={inputStyle} />
                        </div>
                        <div>
                            <label className="block text-[11px] font-semibold uppercase tracking-wider mb-1.5" style={labelStyle}>Last name</label>
                            <input type="text" value={last} onChange={e => setLast(e.target.value)} placeholder="Smith"
                                className="w-full px-4 py-3 rounded-xl text-sm focus:outline-none transition-all placeholder-white/20" style={inputStyle} />
                        </div>
                    </div>
                    <div>
                        <label className="block text-[11px] font-semibold uppercase tracking-wider mb-1.5" style={labelStyle}>Email <span className="text-red-400">*</span></label>
                        <input required type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com"
                            className="w-full px-4 py-3 rounded-xl text-sm focus:outline-none transition-all placeholder-white/20" style={inputStyle} />
                    </div>
                    <div>
                        <label className="block text-[11px] font-semibold uppercase tracking-wider mb-1.5" style={labelStyle}>Password <span className="text-red-400">*</span></label>
                        <div className="relative">
                            <input required type={showPw ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)} placeholder="Min 6 characters"
                                className="w-full px-4 py-3 pr-12 rounded-xl text-sm focus:outline-none transition-all placeholder-white/20" style={inputStyle} />
                            <button type="button" onClick={() => setShowPw(!showPw)} className="absolute right-3 top-1/2 -translate-y-1/2" style={{ color: 'rgba(255,255,255,0.3)' }}>{showPw ? '🙈' : '👁'}</button>
                        </div>
                    </div>
                    <div>
                        <label className="block text-[11px] font-semibold uppercase tracking-wider mb-1.5" style={labelStyle}>Confirm password <span className="text-red-400">*</span></label>
                        <input required type="password" value={confirm} onChange={e => setConfirm(e.target.value)} placeholder="Repeat password"
                            className="w-full px-4 py-3 rounded-xl text-sm focus:outline-none transition-all placeholder-white/20" style={inputStyle} />
                    </div>

                    {errorMsg && <div className="rounded-xl p-3 text-xs text-red-300" style={{ background: 'rgba(255,80,80,0.12)', border: '1px solid rgba(255,80,80,0.3)' }}>{errorMsg}</div>}

                    <button type="submit" disabled={loading}
                        className="w-full py-3.5 rounded-xl font-bold text-white text-sm disabled:opacity-50 transition-all hover:-translate-y-0.5 mt-1"
                        style={{ background: 'linear-gradient(135deg,#0d4a9a,#3A9EEA)', boxShadow: '0 4px 20px rgba(58,158,234,0.35)' }}>
                        {loading ? 'Creating…' : 'Create Account'}
                    </button>
                </form>

                <p className="text-center text-xs mt-5" style={{ color: 'rgba(255,255,255,0.35)' }}>
                    Already have an account?{' '}
                    <Link href="/login" className="font-semibold" style={{ color: 'rgba(100,200,255,0.7)' }}>Sign in →</Link>
                </p>
            </div>
        </div>
    );
}
