"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function RegisterPage() {
  const [username, setU] = useState("");
  const [email, setE] = useState("");
  const [password, setP] = useState("");
  const [role, setR] = useState<"reader" | "author" | "admin">("reader");
  const [err, setErr] = useState<string | null>(null);
  const [ok, setOk] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr(null);
    setOk(false);
    setLoading(true);
    try {
      const response = await fetch("/api/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ username, email, password, role }),
      });

      const data = await response.json();

      if (!response.ok) {
        setErr(data.detail || "Registration failed");
        return;
      }

      setOk(true);
      setTimeout(() => router.push("/login"), 1500);
    } catch (e: any) {
      setErr("Registration failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-rose-100 dark:from-amber-950 dark:via-orange-950 dark:to-amber-900 flex items-center justify-center p-6 relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-orange-300/30 dark:bg-amber-800/20 rounded-full mix-blend-multiply filter blur-3xl opacity-70 animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-rose-300/30 dark:bg-orange-900/20 rounded-full mix-blend-multiply filter blur-3xl opacity-70 animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-amber-300/30 dark:bg-amber-700/20 rounded-full mix-blend-multiply filter blur-3xl opacity-70 animate-pulse delay-500"></div>
      </div>

      <div className="w-full max-w-md relative z-10">
        <div className="bg-white/60 dark:bg-white/10 backdrop-blur-xl border border-amber-200/50 dark:border-white/20 rounded-3xl p-8 shadow-2xl">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-amber-700 to-orange-800 dark:from-amber-700 dark:to-orange-800 rounded-2xl mb-4 shadow-lg">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
              </svg>
            </div>
            <h1 className="text-3xl font-bold text-gray-800 dark:text-white mb-2">Create Account</h1>
            <p className="text-gray-600 dark:text-gray-300">Join BookConnect today</p>
          </div>

          {/* Form */}
          <form onSubmit={submit} className="space-y-5">
            {err && (
              <div className="bg-red-100 dark:bg-red-500/20 border border-red-300 dark:border-red-500/50 rounded-lg p-3">
                <p className="text-red-700 dark:text-red-200 text-sm">{err}</p>
              </div>
            )}

            {ok && (
              <div className="bg-green-100 dark:bg-green-500/20 border border-green-300 dark:border-green-500/50 rounded-lg p-3">
                <p className="text-green-700 dark:text-green-200 text-sm">✓ Account created successfully! Redirecting...</p>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">Username</label>
              <input
                className="w-full bg-white/80 dark:bg-white/10 border border-amber-200 dark:border-white/30 rounded-xl px-4 py-3 text-gray-800 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 outline-none focus:border-amber-400 dark:focus:border-purple-400 focus:ring-2 focus:ring-amber-200 dark:focus:ring-purple-400/50 transition"
                placeholder="Choose a username"
                value={username}
                onChange={(e) => setU(e.target.value)}
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">Email</label>
              <input
                type="email"
                className="w-full bg-white/80 dark:bg-white/10 border border-amber-200 dark:border-white/30 rounded-xl px-4 py-3 text-gray-800 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 outline-none focus:border-amber-400 dark:focus:border-purple-400 focus:ring-2 focus:ring-amber-200 dark:focus:ring-purple-400/50 transition"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setE(e.target.value)}
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">Password</label>
              <input
                type="password"
                className="w-full bg-white/80 dark:bg-white/10 border border-amber-200 dark:border-white/30 rounded-xl px-4 py-3 text-gray-800 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 outline-none focus:border-amber-400 dark:focus:border-purple-400 focus:ring-2 focus:ring-amber-200 dark:focus:ring-purple-400/50 transition"
                placeholder="Create a password"
                value={password}
                onChange={(e) => setP(e.target.value)}
                required
                minLength={6}
              />
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Must be at least 6 characters</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">Account Type</label>
              <select
                className="w-full bg-white/80 dark:bg-white/10 border border-amber-200 dark:border-white/30 rounded-xl px-4 py-3 text-gray-800 dark:text-white outline-none focus:border-amber-400 dark:focus:border-purple-400 focus:ring-2 focus:ring-amber-200 dark:focus:ring-purple-400/50 transition cursor-pointer"
                value={role}
                onChange={(e) => setR(e.target.value as any)}
              >
                <option value="reader" className="bg-white dark:bg-gray-800 text-gray-800 dark:text-white">📚 Reader - Discover and read books</option>
                <option value="author" className="bg-white dark:bg-gray-800 text-gray-800 dark:text-white">✍️ Author - Write and publish</option>
                <option value="admin" className="bg-white dark:bg-gray-800 text-gray-800 dark:text-white">👑 Admin - Manage platform</option>
              </select>
            </div>

            <button
              type="submit"
              className="w-full bg-gradient-to-r from-amber-700 to-orange-800 dark:from-amber-700 dark:to-orange-800 text-white font-semibold py-3 rounded-xl hover:from-amber-800 hover:to-orange-900 dark:hover:from-amber-800 dark:hover:to-orange-900 transition-all duration-200 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={loading || ok}
            >
              {loading ? (
                <span className="flex items-center justify-center">
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Creating account...
                </span>
              ) : ok ? (
                "✓ Success!"
              ) : (
                "Create Account"
              )}
            </button>
          </form>

          {/* Sign In Link */}
          <p className="text-center text-gray-600 dark:text-gray-300 text-sm mt-6">
            Already have an account?{" "}
            <button
              onClick={() => router.push("/login")}
              className="text-amber-700 dark:text-purple-300 font-semibold hover:text-amber-900 dark:hover:text-purple-200 transition"
            >
              Sign in
            </button>
          </p>
        </div>
      </div>
    </main>
  );
}
