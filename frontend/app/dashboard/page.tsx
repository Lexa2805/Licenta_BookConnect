"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";

export default function DashboardPage() {
  const router = useRouter();
  const { data: session, status } = useSession();

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    }
  }, [status, router]);

  if (status === "loading") {
    return (
      <main className="min-h-dvh flex items-center justify-center">
        <div className="text-gray-800 dark:text-amber-100">Loading...</div>
      </main>
    );
  }

  if (!session) {
    return (
      <main className="min-h-dvh flex items-center justify-center">
        <div className="text-gray-800 dark:text-amber-100">Redirecting...</div>
      </main>
    );
  }

  return (
    <main className="min-h-dvh flex items-center justify-center">
      <div className="bg-white/60 dark:bg-amber-900/40 backdrop-blur-xl border border-amber-200/50 dark:border-amber-700/50 rounded-xl p-6 shadow-lg">
        <h1 className="text-xl font-semibold mb-2 text-gray-800 dark:text-amber-100">
          Welcome, {session.user?.username}! 🎉
        </h1>
        <p className="text-gray-700 dark:text-amber-200">Role: {session.user?.role}</p>
        <p className="text-gray-700 dark:text-amber-200">Email: {session.user?.email}</p>
      </div>
    </main>
  );
}
