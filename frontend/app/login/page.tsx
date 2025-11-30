"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";

export default function LoginPage() {
  const [username, setU] = useState("");
  const [password, setP] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const router = useRouter();

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr(null);
    setLoading(true);

    try {
      const result = await signIn("credentials", {
        username,
        password,
        redirect: false,
      });

      if (result?.error) {
        setErr(result.error);
      } else if (result?.ok) {
        router.push("/HomePage");
        router.refresh();
      }
    } catch (e: any) {
      setErr("An error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-rose-100 dark:from-amber-950 dark:via-orange-950 dark:to-amber-900 flex items-center justify-center p-6 relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-orange-300/30 dark:bg-amber-800/20 rounded-full mix-blend-multiply filter blur-3xl animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-rose-300/30 dark:bg-orange-900/20 rounded-full mix-blend-multiply filter blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-amber-300/30 dark:bg-amber-700/20 rounded-full mix-blend-multiply filter blur-3xl animate-pulse delay-500"></div>
      </div>

      <div className="w-full max-w-md relative z-10">
        <div className="bg-white/60 dark:bg-white/10 backdrop-blur-xl border border-amber-200/50 dark:border-white/20 rounded-3xl p-8 shadow-2xl">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-amber-700 to-orange-800 dark:from-amber-700 dark:to-orange-800 rounded-2xl mb-4 shadow-lg">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
            </div>
            <h1 className="text-3xl font-bold text-gray-800 dark:text-white mb-2">Welcome Back</h1>
            <p className="text-gray-600 dark:text-gray-300">Sign in to continue to BookConnect</p>
          </div>

          {/* Form */}
          <form onSubmit={submit} className="space-y-5">
            {err && (
              <div className="bg-red-100 dark:bg-red-500/20 border border-red-300 dark:border-red-500/50 rounded-lg p-3">
                <p className="text-red-700 dark:text-red-200 text-sm">{err}</p>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">Username</label>
              <input
                className="w-full bg-white/80 dark:bg-white/10 border border-amber-200 dark:border-white/30 rounded-xl px-4 py-3 text-gray-800 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 outline-none focus:border-amber-400 dark:focus:border-purple-400 focus:ring-2 focus:ring-amber-200 dark:focus:ring-purple-400/50 transition"
                placeholder="Enter your username"
                value={username}
                onChange={(e) => setU(e.target.value)}
                autoComplete="username"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">Password</label>
              <input
                type="password"
                className="w-full bg-white/80 dark:bg-white/10 border border-amber-200 dark:border-white/30 rounded-xl px-4 py-3 text-gray-800 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 outline-none focus:border-amber-400 dark:focus:border-purple-400 focus:ring-2 focus:ring-amber-200 dark:focus:ring-purple-400/50 transition"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setP(e.target.value)}
                autoComplete="current-password"
                required
              />
            </div>

            <div className="flex items-center justify-between text-sm">
              <label className="flex items-center text-gray-600 dark:text-gray-300 cursor-pointer">
                <input type="checkbox" className="mr-2 rounded" />
                <span>Remember me</span>
              </label>
              <button
                type="button"
                onClick={() => router.push("/reset-password")}
                className="text-amber-700 dark:text-purple-300 hover:text-amber-900 dark:hover:text-purple-200 transition"
              >
                Forgot password?
              </button>
            </div>

            <button
              type="submit"
              className="w-full bg-gradient-to-r from-amber-700 to-orange-800 dark:from-amber-700 dark:to-orange-800 text-white font-semibold py-3 rounded-xl hover:from-amber-800 hover:to-orange-900 dark:hover:from-amber-800 dark:hover:to-orange-900 transition-all duration-200 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={loading}
            >
              {loading ? (
                <span className="flex items-center justify-center">
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Signing in...
                </span>
              ) : (
                "Sign In"
              )}
            </button>
          </form>

          {/* Divider */}
          <div className="flex items-center gap-4 my-6">
            <div className="h-px bg-amber-200 dark:bg-white/20 flex-1" />
            <span className="text-gray-500 dark:text-gray-400 text-sm">or</span>
            <div className="h-px bg-amber-200 dark:bg-white/20 flex-1" />
          </div>

          {/* Social Login */}
          <div className="space-y-3">
            <button className="w-full bg-white/80 dark:bg-white/5 border border-amber-200 dark:border-white/20 rounded-xl py-3 text-gray-700 dark:text-white hover:bg-white dark:hover:bg-white/10 transition flex items-center justify-center gap-2">
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
              </svg>
              Continue with Google
            </button>
          </div>

          {/* Sign Up Link */}
          <p className="text-center text-gray-600 dark:text-gray-300 text-sm mt-6">
            Don't have an account?{" "}
            <button
              onClick={() => router.push("/register")}
              className="text-amber-700 dark:text-purple-300 font-semibold hover:text-amber-900 dark:hover:text-purple-200 transition"
            >
              Sign up
            </button>
          </p>
        </div>
      </div>
    </main>
  );
}
