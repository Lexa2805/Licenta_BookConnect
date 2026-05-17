"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import type { SelectableAccountRole } from "@/lib/roles";

export default function RegisterPage() {
  const [username, setU] = useState("");
  const [email, setE] = useState("");
  const [password, setP] = useState("");
  const [role, setR] = useState<SelectableAccountRole | "">("");
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
    <main className="min-h-screen bg-bc-bg flex items-center justify-center p-6 relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="bc-orb bc-orb-primary w-96 h-96 -top-20 -right-20 mix-blend-multiply animate-pulse"></div>
        <div className="bc-orb bc-orb-secondary w-96 h-96 -bottom-20 -left-20 mix-blend-multiply animate-pulse delay-1000"></div>
      </div>

      <div className="w-full max-w-md relative z-10">
        <div className="bc-card p-8">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-bc-primary-grad rounded-2xl mb-4 shadow-bc-primary">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
              </svg>
            </div>
            <h1 className="text-3xl font-bold text-bc-text mb-2">Create Account</h1>
            <p className="text-bc-subtext">Join BookConnect today</p>
          </div>

          {/* Form */}
          <form onSubmit={submit} className="space-y-5">
            {err && (
              <div className="bg-bc-danger/10 border border-bc-danger/20 rounded-bc-md p-3">
                <p className="text-bc-danger text-sm">{err}</p>
              </div>
            )}

            {ok && (
              <div className="bg-bc-success/10 border border-bc-success/20 rounded-bc-md p-3">
                <p className="text-bc-success text-sm">✓ Account created successfully! Redirecting...</p>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-bc-text-soft mb-2">Username</label>
              <input
                className="w-full bg-bc-surface-muted border border-bc-border rounded-bc-md px-4 py-3 text-bc-text placeholder-bc-subtext outline-none focus:border-bc-primary focus:ring-1 focus:ring-bc-primary transition"
                placeholder="Choose a username"
                value={username}
                onChange={(e) => setU(e.target.value)}
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-bc-text-soft mb-2">Email</label>
              <input
                type="email"
                className="w-full bg-bc-surface-muted border border-bc-border rounded-bc-md px-4 py-3 text-bc-text placeholder-bc-subtext outline-none focus:border-bc-primary focus:ring-1 focus:ring-bc-primary transition"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setE(e.target.value)}
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-bc-text-soft mb-2">Password</label>
              <input
                type="password"
                className="w-full bg-bc-surface-muted border border-bc-border rounded-bc-md px-4 py-3 text-bc-text placeholder-bc-subtext outline-none focus:border-bc-primary focus:ring-1 focus:ring-bc-primary transition"
                placeholder="Create a password"
                value={password}
                onChange={(e) => setP(e.target.value)}
                required
                minLength={6}
              />
              <p className="text-xs text-bc-subtext mt-1">Must be at least 6 characters</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-bc-text-soft mb-2">Account Type</label>
              <select
                className="w-full bg-bc-surface-muted border border-bc-border rounded-bc-md px-4 py-3 text-bc-text outline-none focus:border-bc-primary focus:ring-1 focus:ring-bc-primary transition cursor-pointer"
                value={role}
                onChange={(e) => setR(e.target.value as SelectableAccountRole | "")}
                required
              >
                <option value="" className="bg-bc-surface text-bc-text">Select how you want to use BookConnect</option>
                <option value="reader" className="bg-bc-surface text-bc-text">Reader - discover books and public manuscripts</option>
                <option value="writer" className="bg-bc-surface text-bc-text">Writer - use Studio and Marketplace</option>
                <option value="both" className="bg-bc-surface text-bc-text">Both - read, write, and sell</option>
              </select>
            </div>

            <Button
              type="submit"
              fullWidth
              disabled={loading || ok}
              leftIcon={
                loading ? (
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                ) : undefined
              }
            >
              {loading ? "Creating account..." : ok ? "✓ Success!" : "Create Account"}
            </Button>
          </form>

          {/* Sign In Link */}
          <p className="text-center text-bc-subtext text-sm mt-6">
            Already have an account?{" "}
            <button
              onClick={() => router.push("/login")}
              className="text-bc-primary font-semibold hover:text-bc-primary-hover transition"
            >
              Sign in
            </button>
          </p>
        </div>
      </div>
    </main>
  );
}
