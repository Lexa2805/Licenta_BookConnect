"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { useTheme } from "@/app/theme-provider";
import { signOut, useSession } from "next-auth/react";

export default function Navigation() {
    const pathname = usePathname();
    const [isOpen, setIsOpen] = useState(false);
    const { theme, toggleTheme } = useTheme();
    const { data: session, status } = useSession();
    const isAuthenticated = status === "authenticated";

    // Base nav links (always visible)
    const baseNavLinks = [
        { href: "/", label: "Home" },
        { href: "/library", label: "Library" },
        { href: "/marketplace", label: "Marketplace" },
        { href: "/studio", label: "Studio" },
        { href: "/community", label: "Community" },
    ];

    // Add My Profile only if authenticated
    const navLinks = isAuthenticated
        ? [...baseNavLinks, { href: "/profile", label: "My Profile" }]
        : baseNavLinks;

    const handleSignOut = () => {
        signOut({ callbackUrl: "/login" });
    };

    // Hide navigation on login and register pages
    if (pathname === "/login" || pathname === "/register") {
        return (
            <button
                onClick={toggleTheme}
                className="fixed top-6 right-6 p-3 rounded-full bg-white/20 dark:bg-white/10 backdrop-blur-sm border border-amber-200/50 dark:border-white/20 hover:bg-white/30 dark:hover:bg-white/20 transition z-50"
                aria-label="Toggle theme"
            >
                {theme === "light" ? (
                    <svg className="w-5 h-5 text-amber-900 dark:text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                    </svg>
                ) : (
                    <svg className="w-5 h-5 text-yellow-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                    </svg>
                )}
            </button>
        );
    }

    return (
        <nav className="bg-white/80 dark:bg-amber-900/50 backdrop-blur-md border-b border-amber-200 dark:border-amber-700/50 sticky top-0 z-50">
            <div className="container mx-auto px-4">
                <div className="flex justify-between items-center h-16">
                    {/* Logo */}
                    <Link href="/" className="text-2xl font-bold text-amber-900 dark:text-amber-100 hover:text-amber-700 dark:hover:text-amber-200 transition flex items-center gap-2">
                        <span className="text-3xl">📚</span> BookConnect
                    </Link>

                    {/* Desktop Navigation */}
                    <div className="hidden md:flex items-center space-x-8">
                        {navLinks.map((link) => {
                            const isActive = pathname === link.href ||
                                (link.href === '/community' && pathname.startsWith('/community'));
                            return (
                                <Link
                                    key={link.href}
                                    href={link.href}
                                    className={`px-4 py-2 rounded-full text-sm font-medium transition ${isActive
                                        ? "bg-amber-100 dark:bg-amber-800/40 text-amber-900 dark:text-amber-100"
                                        : "text-gray-600 dark:text-orange-300 hover:bg-amber-50 dark:hover:bg-amber-800/30 hover:text-amber-800 dark:hover:text-amber-100"
                                        }`}
                                >
                                    {link.label}
                                </Link>
                            );
                        })}

                        {/* Theme Toggle Button */}
                        <button
                            onClick={toggleTheme}
                            className="p-2 rounded-full text-amber-900 dark:text-amber-100 hover:bg-amber-50 dark:hover:bg-amber-800/30 transition"
                            aria-label="Toggle theme"
                        >
                            {theme === "light" ? (
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                                </svg>
                            ) : (
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                                </svg>
                            )}
                        </button>

                        {/* Auth Buttons */}
                        {isAuthenticated ? (
                            <button
                                onClick={handleSignOut}
                                className="px-4 py-2 rounded-full text-sm font-medium text-red-600 hover:bg-red-50 transition"
                            >
                                Sign Out
                            </button>
                        ) : (
                            <Link
                                href="/login"
                                className="px-4 py-2 rounded-full text-sm font-medium bg-amber-600 text-white hover:bg-amber-700 transition"
                            >
                                Login
                            </Link>
                        )}
                    </div>

                    {/* Mobile menu button */}
                    <button
                        onClick={() => setIsOpen(!isOpen)}
                        className="md:hidden p-2 rounded-md text-amber-900 dark:text-amber-100 hover:bg-amber-50 dark:hover:bg-amber-800/30"
                    >
                        <svg
                            className="h-6 w-6"
                            fill="none"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                        >
                            {isOpen ? (
                                <path d="M6 18L18 6M6 6l12 12" />
                            ) : (
                                <path d="M4 6h16M4 12h16M4 18h16" />
                            )}
                        </svg>
                    </button>
                </div>

                {/* Mobile Navigation */}
                {isOpen && (
                    <div className="md:hidden pb-4 bg-white/90 dark:bg-amber-900/90 backdrop-blur-md rounded-b-xl shadow-lg absolute left-0 right-0 px-4 border-b border-amber-200 dark:border-amber-700/50">
                        {navLinks.map((link) => {
                            const isActive = pathname === link.href ||
                                (link.href === '/community' && pathname.startsWith('/community'));
                            return (
                                <Link
                                    key={link.href}
                                    href={link.href}
                                    className={`block px-4 py-3 rounded-lg text-base font-medium transition mb-1 ${isActive
                                        ? "bg-amber-100 dark:bg-amber-800/40 text-amber-900 dark:text-amber-100"
                                        : "text-gray-600 dark:text-orange-300 hover:bg-amber-50 dark:hover:bg-amber-800/30 hover:text-amber-800 dark:hover:text-amber-100"
                                        }`}
                                    onClick={() => setIsOpen(false)}
                                >
                                    {link.label}
                                </Link>
                            );
                        })}

                        {/* Mobile Theme Toggle */}
                        <button
                            onClick={toggleTheme}
                            className="w-full text-left px-4 py-3 rounded-lg text-base font-medium text-gray-600 dark:text-orange-300 hover:bg-amber-50 dark:hover:bg-amber-800/30 hover:text-amber-800 dark:hover:text-amber-100 transition mb-1 flex items-center gap-2"
                        >
                            {theme === "light" ? (
                                <>
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                                    </svg>
                                    Dark Mode
                                </>
                            ) : (
                                <>
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                                    </svg>
                                    Light Mode
                                </>
                            )}
                        </button>

                        {/* Mobile Auth Button */}
                        {isAuthenticated ? (
                            <button
                                onClick={handleSignOut}
                                className="w-full text-left px-4 py-3 rounded-lg text-base font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 transition flex items-center gap-2"
                            >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                                </svg>
                                Sign Out
                            </button>
                        ) : (
                            <Link
                                href="/login"
                                className="w-full text-left px-4 py-3 rounded-lg text-base font-medium bg-amber-600 text-white hover:bg-amber-700 transition flex items-center gap-2"
                                onClick={() => setIsOpen(false)}
                            >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                                </svg>
                                Login
                            </Link>
                        )}
                    </div>
                )}
            </div>
        </nav>
    );
}
