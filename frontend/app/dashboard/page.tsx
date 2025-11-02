"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/store/auth";

export default function DashboardPage() {
  const router = useRouter();
    const { user, token } = useAuth();

  useEffect(() => {     
    if (!token) {
      router.push("/login");
    }
  }, [token, router]);

  if (!token) {
    return (
      <main className="min-h-dvh flex items-center justify-center text-white">
        <div>Redirecționare...</div>
      </main>
    );
  }

  if (!user) {
    return (
      <main className="min-h-dvh flex items-center justify-center text-white">
        <div>Se încarcă profilul...</div>
      </main>
    );
  }

  return (
    <main className="min-h-dvh flex items-center justify-center text-white">
      <div className="border rounded-xl p-6">
        <h1 className="text-xl font-semibold mb-2">
          Bun venit, {user.username}! 🎉
        </h1>
        <p>Rol: {user.role}</p>
        <p>Email: {user.email}</p>
      </div>
    </main>
  );
}
