"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { getProviders, signIn } from "next-auth/react";
import { Button } from "@/components/ui/Button";

export default function LoginPage() {
  const [username, setU] = useState("");
  const [password, setP] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  const router = useRouter();

  const getCallbackUrl = () => {
    const params = new URLSearchParams(window.location.search);
    const callbackUrl = params.get("callbackUrl");
    return callbackUrl?.startsWith("/") ? callbackUrl : "/";
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr(null);
    setLoading(true);

    try {
      const result = await signIn("credentials", {
        username,
        password,
        rememberMe: rememberMe ? "true" : "false",
        redirect: false,
      });

      if (result?.error) {
        setErr(result.error);
      } else if (result?.ok) {
        router.push(getCallbackUrl());
        router.refresh();
      }
    } catch (e: any) {
      setErr("An error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setErr(null);
    setGoogleLoading(true);

    try {
      const providers = await getProviders();

      if (!providers?.google) {
        setErr(
          "Google login is not configured yet. Add GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET to frontend/.env.local.",
        );
        setGoogleLoading(false);
        return;
      }

      await signIn("google", {
        callbackUrl: getCallbackUrl(),
      });
    } catch {
      setErr("Could not start Google sign in. Please try again.");
      setGoogleLoading(false);
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
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
            </div>
            <h1 className="text-3xl font-bold text-bc-text mb-2">Welcome Back</h1>
            <p className="text-bc-subtext">Sign in to continue to BookConnect</p>
          </div>

          {/* Form */}
          <form onSubmit={submit} className="space-y-5">
            {err && (
              <div className="bg-bc-danger/10 border border-bc-danger/20 rounded-bc-md p-3">
                <p className="text-bc-danger text-sm">{err}</p>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-bc-text-soft mb-2">Username</label>
              <input
                className="w-full bg-bc-surface-muted border border-bc-border rounded-bc-md px-4 py-3 text-bc-text placeholder-bc-subtext outline-none focus:border-bc-primary focus:ring-1 focus:ring-bc-primary transition"
                placeholder="Enter your username"
                value={username}
                onChange={(e) => setU(e.target.value)}
                autoComplete="username"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-bc-text-soft mb-2">Password</label>
              <input
                type="password"
                className="w-full bg-bc-surface-muted border border-bc-border rounded-bc-md px-4 py-3 text-bc-text placeholder-bc-subtext outline-none focus:border-bc-primary focus:ring-1 focus:ring-bc-primary transition"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setP(e.target.value)}
                autoComplete="current-password"
                required
              />
            </div>

            <div className="flex items-center justify-between text-sm">
              <label className="flex items-center text-bc-text-soft cursor-pointer">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="mr-2 rounded border-bc-border text-bc-primary focus:ring-bc-primary"
                />
                <span>Remember me</span>
              </label>
              <button
                type="button"
                onClick={() => router.push("/reset-password")}
                className="text-bc-primary hover:text-bc-primary-hover font-medium transition"
              >
                Forgot password?
              </button>
            </div>

            <Button
              type="submit"
              fullWidth
              disabled={loading}
              leftIcon={
                loading ? (
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                ) : undefined
              }
            >
              {loading ? "Signing in..." : "Sign In"}
            </Button>
          </form>

          {/* Divider */}
          <div className="flex items-center gap-4 my-6">
            <div className="h-px bg-bc-border flex-1" />
            <span className="text-bc-subtext text-sm">or</span>
            <div className="h-px bg-bc-border flex-1" />
          </div>

          {/* Social Login */}
          <div className="space-y-3">
            <Button
              type="button"
              variant="secondary"
              fullWidth
              disabled={loading || googleLoading}
              onClick={handleGoogleSignIn}
              leftIcon={
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
              </svg>
            }
            >
              {googleLoading ? "Opening Google..." : "Continue with Google"}
            </Button>
          </div>

          {/* Sign Up Link */}
          <p className="text-center text-bc-subtext text-sm mt-6">
            Don't have an account?{" "}
            <button
              onClick={() => router.push("/register")}
              className="text-bc-primary font-semibold hover:text-bc-primary-hover transition"
            >
              Sign up
            </button>
          </p>
        </div>
      </div>
    </main>
  );
}
