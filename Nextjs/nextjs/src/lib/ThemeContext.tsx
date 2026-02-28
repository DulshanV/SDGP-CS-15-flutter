"use client";

import React, { createContext, useContext, useEffect, useState } from "react";

type Theme = "light" | "dark";

interface ThemeContextValue {
    theme: Theme;
    toggleTheme: () => void;
    isDark: boolean;
}

const ThemeContext = createContext<ThemeContextValue>({
    theme: "light",
    toggleTheme: () => { },
    isDark: false,
});

export function ThemeProvider({ children }: { children: React.ReactNode }) {
    const [theme, setTheme] = useState<Theme>("light");
    const [mounted, setMounted] = useState(false);

    // On mount, read from localStorage and apply
    useEffect(() => {
        const stored = localStorage.getItem("ceylonhs-theme") as Theme | null;
        const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
        const initial: Theme = stored ?? (prefersDark ? "dark" : "light");
        setTheme(initial);
        applyTheme(initial);
        setMounted(true);
    }, []);

    function applyTheme(t: Theme) {
        const root = document.documentElement;
        if (t === "dark") {
            root.classList.add("dark");
        } else {
            root.classList.remove("dark");
        }
    }

    function toggleTheme() {
        setTheme((prev) => {
            const next: Theme = prev === "light" ? "dark" : "light";
            localStorage.setItem("ceylonhs-theme", next);
            applyTheme(next);
            return next;
        });
    }

    // Prevent flash — render nothing until we know the real theme
    if (!mounted) return null;

    return (
        <ThemeContext.Provider value={{ theme, toggleTheme, isDark: theme === "dark" }}>
            {children}
        </ThemeContext.Provider>
    );
}

export function useTheme(): ThemeContextValue {
    return useContext(ThemeContext);
}

/** A minimal ready-to-drop-in toggle button — import and reuse across pages. */
export function ThemeToggleButton({ className = "" }: { className?: string }) {
    const { isDark, toggleTheme } = useTheme();

    return (
        <button
            onClick={toggleTheme}
            aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
            className={`relative w-12 h-6 rounded-full transition-colors duration-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-blue-500 ${isDark ? "bg-indigo-600" : "bg-gray-200"
                } ${className}`}
        >
            <span
                className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full flex items-center justify-center text-[11px] transition-transform duration-300 shadow-md ${isDark
                        ? "translate-x-6 bg-gray-900 text-yellow-300"
                        : "translate-x-0 bg-white text-amber-500"
                    }`}
            >
                {isDark ? "🌙" : "☀️"}
            </span>
        </button>
    );
}
