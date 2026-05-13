"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";

type ResetRequestResponse = {
  message?: string;
  detail?: string;
  resetUrl?: string;
};

export default function ResetPasswordPage() {
  const router = useRouter();
  const [token, setToken] = useState("");
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [devResetUrl, setDevResetUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    setToken(params.get("token") || "");
  }, []);

  const requestReset = async (event: React.FormEvent) => {
    event.preventDefault();
    setErr(null);
    setMessage(null);
    setDevResetUrl(null);
    setLoading(true);

    try {
      const response = await fetch("/api/password-reset/request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ identifier }),
      });
      const data = (await response.json()) as ResetRequestResponse;

      if (!response.ok) {
        setErr(data.detail || "Could not create a reset link");
        return;
      }

      setMessage(data.message || "Reset link created.");
      setDevResetUrl(data.resetUrl || null);
    } catch {
      setErr("Could not create a reset link. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const confirmReset = async (event: React.FormEvent) => {
    event.preventDefault();
    setErr(null);
    setMessage(null);

    if (password !== confirmPassword) {
      setErr("Passwords do not match");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch("/api/password-reset/confirm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });
      const data = await response.json();

      if (!response.ok) {
        setErr(data.detail || "Could not reset password");
        return;
      }

      setMessage(data.message || "Password updated successfully.");
      setPassword("");
      setConfirmPassword("");
      setTimeout(() => router.push("/login"), 1500);
    } catch {
      setErr("Could not reset password. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-bc-bg flex items-center justify-center p-6 relative overflow-hidden">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="bc-orb bc-orb-primary w-96 h-96 -top-20 -right-20 mix-blend-multiply animate-pulse" />
        <div className="bc-orb bc-orb-secondary w-96 h-96 -bottom-20 -left-20 mix-blend-multiply animate-pulse delay-1000" />
      </div>

      <div className="w-full max-w-md relative z-10">
        <div className="bc-card p-8">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-bc-primary-grad rounded-2xl mb-4 shadow-bc-primary">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586l6.257-6.257A6 6 0 1121 9z" />
              </svg>
            </div>
            <h1 className="text-3xl font-bold text-bc-text mb-2">
              Reset Password
            </h1>
            <p className="text-bc-subtext">
              {token ? "Choose a new password for your account" : "Enter your username or email"}
            </p>
          </div>

          {err && (
            <div className="bg-bc-danger/10 border border-bc-danger/20 rounded-bc-md p-3 mb-5">
              <p className="text-bc-danger text-sm">{err}</p>
            </div>
          )}

          {message && (
            <div className="bg-bc-success/10 border border-bc-success/20 rounded-bc-md p-3 mb-5">
              <p className="text-bc-success text-sm">{message}</p>
            </div>
          )}

          {token ? (
            <form onSubmit={confirmReset} className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-bc-text-soft mb-2">
                  New password
                </label>
                <input
                  type="password"
                  className="w-full bg-bc-surface-muted border border-bc-border rounded-bc-md px-4 py-3 text-bc-text placeholder-bc-subtext outline-none focus:border-bc-primary focus:ring-1 focus:ring-bc-primary transition"
                  placeholder="Enter a new password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  required
                  minLength={6}
                  autoComplete="new-password"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-bc-text-soft mb-2">
                  Confirm password
                </label>
                <input
                  type="password"
                  className="w-full bg-bc-surface-muted border border-bc-border rounded-bc-md px-4 py-3 text-bc-text placeholder-bc-subtext outline-none focus:border-bc-primary focus:ring-1 focus:ring-bc-primary transition"
                  placeholder="Confirm your new password"
                  value={confirmPassword}
                  onChange={(event) => setConfirmPassword(event.target.value)}
                  required
                  minLength={6}
                  autoComplete="new-password"
                />
              </div>

              <Button type="submit" fullWidth disabled={loading}>
                {loading ? "Updating..." : "Update Password"}
              </Button>
            </form>
          ) : (
            <form onSubmit={requestReset} className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-bc-text-soft mb-2">
                  Username or email
                </label>
                <input
                  className="w-full bg-bc-surface-muted border border-bc-border rounded-bc-md px-4 py-3 text-bc-text placeholder-bc-subtext outline-none focus:border-bc-primary focus:ring-1 focus:ring-bc-primary transition"
                  placeholder="Enter your username or email"
                  value={identifier}
                  onChange={(event) => setIdentifier(event.target.value)}
                  required
                  autoComplete="username"
                />
              </div>

              <Button type="submit" fullWidth disabled={loading}>
                {loading ? "Creating link..." : "Create Reset Link"}
              </Button>

              {devResetUrl && (
                <Button
                  type="button"
                  variant="secondary"
                  fullWidth
                  onClick={() => router.push(devResetUrl)}
                >
                  Open Reset Form
                </Button>
              )}
            </form>
          )}

          <p className="text-center text-bc-subtext text-sm mt-6">
            Remembered your password?{" "}
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
