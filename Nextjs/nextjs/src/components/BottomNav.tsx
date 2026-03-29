"use client";

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { auth } from '@/lib/firebase';
import { onAuthStateChanged, signOut, User } from 'firebase/auth';
import { useState, useEffect } from 'react';

const NAV = [
    {
        href: '/search',
        label: 'Search',
        icon: (active: boolean) => (
            <svg width="22" height="22" fill={active ? '#0B3EA8' : 'none'} stroke={active ? '#0B3EA8' : '#9BA5B7'} strokeWidth="2" viewBox="0 0 24 24">
                <circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" />
            </svg>
        ),
    },
    {
        href: '/favorites',
        label: 'Favorites',
        icon: (active: boolean) => (
            <svg width="22" height="22" fill={active ? '#0B3EA8' : 'none'} stroke={active ? '#0B3EA8' : '#9BA5B7'} strokeWidth="2" viewBox="0 0 24 24">
                <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
            </svg>
        ),
    },
    {
        href: '/history',
        label: 'History',
        icon: (active: boolean) => (
            <svg width="22" height="22" fill="none" stroke={active ? '#0B3EA8' : '#9BA5B7'} strokeWidth="2" viewBox="0 0 24 24">
                <circle cx="12" cy="12" r="10" /><path d="M12 6v6l4 2" />
            </svg>
        ),
    },
    {
        href: '/learning',
        label: 'Learn',
        icon: (active: boolean) => (
            <svg width="22" height="22" fill="none" stroke={active ? '#0B3EA8' : '#9BA5B7'} strokeWidth="2" viewBox="0 0 24 24">
                <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20" />
            </svg>
        ),
    },
];

export default function BottomNav() {
    const pathname = usePathname();
    const router = useRouter();
    const [user, setUser] = useState<User | null>(null);
    const [showProfile, setShowProfile] = useState(false);

    useEffect(() => {
        const unsub = onAuthStateChanged(auth, setUser);
        return () => unsub();
    }, []);

    // Only show on app-inner pages (not home/login/register)
    const appPages = ['/search', '/favorites', '/history', '/hscode', '/learning'];
    if (!appPages.some(p => pathname.startsWith(p))) return null;

    const handleSignOut = async () => {
        await signOut(auth);
        setShowProfile(false);
        router.push('/');
    };

    return (
        <>
            {/* Profile dropdown */}
            {showProfile && (
                <div className="fixed bottom-20 right-4 z-50 bg-white rounded-2xl shadow-xl border border-gray-100 p-4 min-w-[220px]">
                    {user ? (
                        <>
                            <div className="flex items-center gap-3 mb-3 pb-3 border-b border-gray-100">
                                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#133665] to-[#3A9EEA] flex items-center justify-center text-white font-bold text-sm">
                                    {(user.displayName || user.email || 'U')[0].toUpperCase()}
                                </div>
                                <div className="min-w-0">
                                    <p className="text-[#2C3442] font-semibold text-sm truncate">{user.displayName || 'User'}</p>
                                    <p className="text-gray-400 text-xs truncate">{user.email}</p>
                                </div>
                            </div>
                            <button onClick={handleSignOut} className="w-full text-left text-sm text-red-500 font-semibold py-2 hover:text-red-600 transition-colors">
                                Sign Out
                            </button>
                        </>
                    ) : (
                        <div className="flex flex-col gap-2">
                            <Link href="/login" onClick={() => setShowProfile(false)} className="text-sm text-[#0B3EA8] font-semibold">Sign In</Link>
                            <Link href="/register" onClick={() => setShowProfile(false)} className="text-sm text-gray-500">Create account</Link>
                        </div>
                    )}
                </div>
            )}

            {/* Bottom nav bar */}
            <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-gray-200 flex items-center justify-around px-2 pb-safe shadow-[0_-4px_20px_rgba(0,0,0,0.06)]" style={{ height: '60px' }}>
                {NAV.map(item => {
                    const active = pathname.startsWith(item.href);
                    return (
                        <Link key={item.href} href={item.href}
                            className={`flex flex-col items-center justify-center gap-0.5 px-5 py-1 rounded-xl transition-all ${active ? 'text-[#0B3EA8]' : 'text-[#9BA5B7]'}`}>
                            {item.icon(active)}
                            <span className={`text-[10px] font-semibold ${active ? 'text-[#0B3EA8]' : 'text-[#9BA5B7]'}`}>{item.label}</span>
                        </Link>
                    );
                })}

                {/* Profile Link (Updated to route to the new page) */}
                <Link
                    href="/profile"
                    className={`flex flex-col items-center justify-center gap-0.5 px-5 py-1 rounded-xl transition-all`}
                >
                    {user ? (
                        <div className="w-7 h-7 rounded-full bg-gradient-to-br from-[#133665] to-[#3A9EEA] flex items-center justify-center text-white font-bold text-xs shrink-0 shadow-sm">
                            {(user.displayName || user.email || 'U')[0].toUpperCase()}
                        </div>
                    ) : (
                        <svg width="22" height="22" fill="none" stroke="#9BA5B7" strokeWidth="2" viewBox="0 0 24 24">
                            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" />
                        </svg>
                    )}
                    <span className="text-[10px] font-semibold text-[#9BA5B7]">Profile</span>
                </Link>
            </nav>

            {/* Safe padding for content above bottom nav */}
            <div style={{ height: '60px' }} />
        </>
    );
}