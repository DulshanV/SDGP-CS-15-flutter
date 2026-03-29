"use client";

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { auth } from '@/lib/firebase';
import { onAuthStateChanged, signOut, User } from 'firebase/auth';

export default function Navbar() {
    const pathname = usePathname();
    const [user, setUser] = useState<User | null>(null);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (u) => {
            setUser(u);
        });
        return () => unsubscribe();
    }, []);

    const handleLogout = async () => {
        await signOut(auth);
        localStorage.removeItem('isLoggedIn');
        localStorage.removeItem('userEmail');
    };

    const navItems = [
        { href: '/', icon: 'home', label: 'Home' },
        { href: '/finder', icon: 'search', label: 'Finder' },
        { href: '/team', icon: 'users', label: 'Team' },
        { href: '/learning', icon: 'book', label: 'Learn' },
    ];

    return (
        <>
            <div className="fixed top-[30px] left-1/2 -translate-x-1/2 z-[100] bg-white/15 backdrop-blur-[20px] border border-white/30 rounded-[20px] p-[10px] shadow-[0_8px_32px_rgba(0,0,0,0.1)] flex max-md:top-auto max-md:bottom-[20px] max-md:w-[calc(100%-40px)] max-md:left-[20px] max-md:transform-none">
                <ul className="flex list-none gap-[10px] max-md:w-full max-md:justify-around max-md:gap-[5px]">
                    {navItems.map((item) => (
                        <li key={item.label} className="group flex items-center">
                            <Link
                                href={item.href}
                                className={`flex items-center justify-start w-[50px] h-[50px] rounded-[16px] text-white no-underline font-semibold text-[14px] overflow-hidden transition-all duration-[400ms] ease-[cubic-bezier(0.23,1,0.32,1)] px-[13px] gap-[10px] relative group-hover:w-[150px] group-hover:bg-white/25 group-hover:shadow-[0_6px_25px_rgba(0,0,0,0.15)] max-md:p-0 max-md:w-[50px] max-md:justify-center max-md:group-hover:w-[50px] ${pathname === item.href ? 'w-[150px] bg-white/25 shadow-[0_6px_25px_rgba(0,0,0,0.15)] max-md:w-[50px]' : ''}`}
                            >
                                {item.icon === 'home' && (
                                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path><polyline points="9 22 9 12 15 12 15 22"></polyline></svg>
                                )}
                                {item.icon === 'search' && (
                                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0"><circle cx="11" cy="11" r="8"></circle><path d="m21 21-4.3-4.3"></path></svg>
                                )}
                                {item.icon === 'users' && (
                                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M22 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>
                                )}
                                {item.icon === 'book' && (
                                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0"><path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20"></path></svg>
                                )}
                                <span className="whitespace-nowrap">{item.label}</span>
                            </Link>
                        </li>
                    ))}
                </ul>
            </div>

            <div className="absolute top-[30px] right-[30px] z-[100] flex flex-col items-center">
                {!user ? (
                    <Link href="/login" className="flex flex-col items-center text-white no-underline transition-all duration-300 hover:-translate-y-[2px] group">
                        <div className="w-[50px] h-[50px] rounded-full bg-white/15 border border-white/30 backdrop-blur-[20px] shadow-[0_4px_20px_rgba(0,0,0,0.1)] flex items-center justify-center transition-all duration-300 group-hover:bg-white/25 group-hover:shadow-[0_6px_25px_rgba(0,0,0,0.15)]">
                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"></path><polyline points="10 17 15 12 10 7"></polyline><line x1="15" y1="12" x2="3" y2="12"></line></svg>
                        </div>
                        <span className="text-[13px] font-semibold text-white mt-[8px] text-shadow-[0_2px_10px_rgba(0,0,0,0.2)]">Sign in</span>
                    </Link>
                ) : (
                    <div className="flex flex-row gap-[10px] p-[6px_14px_6px_6px] rounded-[50px] bg-white/12 border border-white/25 items-center">
                        <div className="w-[38px] h-[38px] rounded-full bg-gradient-to-br from-[oklch(0.55_0.22_260)] to-[oklch(0.45_0.28_300)] text-white text-[15px] font-bold flex items-center justify-center shrink-0 border-2 border-white/45 shadow-[0_4px_14px_rgba(0,0,0,0.25)]">
                            {(user.displayName || user.email || 'U').charAt(0).toUpperCase()}
                        </div>
                        <div className="flex flex-col">
                            <span className="text-[13px] font-semibold text-white text-shadow-[0_2px_10px_rgba(0,0,0,0.2)] max-w-[90px] overflow-hidden text-ellipsis whitespace-nowrap">
                                {user.displayName?.split(' ')[0] || user.email?.split('@')[0]}
                            </span>
                            <button onClick={handleLogout} className="text-[10px] text-white/70 hover:text-white text-left">Logout</button>
                        </div>
                    </div>
                )}
            </div>
        </>
    );
}
