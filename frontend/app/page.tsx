"use client";

import Link from "next/link";

export default function Home() {

    return (
        <main className="min-h-screen">
            {/* Hero Section */}
            <section className="relative py-20 overflow-hidden">
                {/* Background Elements */}
                <div className="absolute inset-0 z-0">
                    <div className="absolute -top-40 -right-40 w-96 h-96 bg-orange-300/30 rounded-full mix-blend-multiply filter blur-3xl animate-pulse"></div>
                    <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-rose-300/30 rounded-full mix-blend-multiply filter blur-3xl animate-pulse delay-1000"></div>
                </div>

                <div className="container mx-auto px-4 text-center relative z-10">
                    <h1 className="text-5xl font-bold mb-4 text-amber-900 dark:text-amber-100">Welcome to BookConnect</h1>
                    <p className="text-xl mb-8 text-amber-800 dark:text-amber-200">A comprehensive social marketplace and self-publishing platform for book lovers</p>
                    <div className="flex gap-4 justify-center">
                        <Link href="/marketplace" className="btn-secondary">
                            Browse Marketplace
                        </Link>
                        <Link href="/studio" className="btn-primary">
                            Start Writing
                        </Link>
                    </div>
                </div>
            </section>

            {/* Features Section */}
            <section className="container mx-auto px-4 py-16">
                <h2 className="text-3xl font-bold text-center mb-12 text-amber-900 dark:text-amber-100">Explore Our Features</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    <Link href="/marketplace" className="bg-white/60 dark:bg-amber-900/40 backdrop-blur-sm border border-amber-200 dark:border-amber-700/50 p-6 rounded-2xl shadow-sm hover:shadow-md transition hover:bg-white/80 dark:hover:bg-amber-900/60">
                        <div className="text-4xl mb-4">🛒</div>
                        <h3 className="text-xl font-semibold mb-2 text-amber-900 dark:text-amber-100">Marketplace</h3>
                        <p className="text-amber-800/80 dark:text-amber-200/80">Buy and sell second-hand books. List your books with photos and prices.</p>
                    </Link>

                    <Link href="/studio" className="bg-white/60 dark:bg-amber-900/40 backdrop-blur-sm border border-amber-200 dark:border-amber-700/50 p-6 rounded-2xl shadow-sm hover:shadow-md transition hover:bg-white/80 dark:hover:bg-amber-900/60">
                        <div className="text-4xl mb-4">✍️</div>
                        <h3 className="text-xl font-semibold mb-2 text-amber-900 dark:text-amber-100">Creative Studio</h3>
                        <p className="text-amber-800/80 dark:text-amber-200/80">Write and publish your own manuscripts. Share your stories with the world.</p>
                    </Link>

                    <Link href="/community" className="bg-white/60 dark:bg-amber-900/40 backdrop-blur-sm border border-amber-200 dark:border-amber-700/50 p-6 rounded-2xl shadow-sm hover:shadow-md transition hover:bg-white/80 dark:hover:bg-amber-900/60">
                        <div className="text-4xl mb-4">💬</div>
                        <h3 className="text-xl font-semibold mb-2 text-amber-900 dark:text-amber-100">Community</h3>
                        <p className="text-amber-800/80 dark:text-amber-200/80">Join groups, chat with fellow readers, and discuss your favorite books.</p>
                    </Link>
                </div>
            </section>

            {/* CTA Section */}
            <section className="py-16">
                <div className="container mx-auto px-4 text-center">
                    <div className="bg-gradient-to-r from-amber-700 to-orange-800 dark:from-amber-800 dark:to-orange-900 rounded-3xl p-12 text-white shadow-xl">
                        <h2 className="text-3xl font-bold mb-4">Ready to Get Started?</h2>
                        <p className="text-xl mb-8 text-orange-100 dark:text-orange-200">Join our community of book lovers today!</p>
                        <div className="flex gap-4 justify-center">
                            <Link href="/register" className="bg-white dark:bg-amber-100 text-amber-900 px-8 py-3 rounded-xl font-semibold hover:bg-gray-100 dark:hover:bg-amber-200 transition shadow-lg">
                                Sign Up
                            </Link>
                            <Link href="/login" className="bg-transparent border-2 border-white text-white px-8 py-3 rounded-xl font-semibold hover:bg-white/10 dark:hover:bg-white/20 transition">
                                Login
                            </Link>
                        </div>
                    </div>
                </div>
            </section>
        </main>
    );
}
