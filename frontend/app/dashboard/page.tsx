"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { useAuth } from "@/store/auth";

export default function Dashboard() {
  const { accessToken, user, setUser, logout } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!accessToken) {
      router.replace("/login");
      return;
    }
    if (!user) {
      api.get("/auth/me/").then(r => setUser(r.data)).catch(() => logout());
    }
  }, [accessToken, user]);

  if (!accessToken) return null;

  return (
    <main className="p-8">
      <h1 className="text-2xl font-semibold">Dashboard</h1>
      <p className="mt-2 opacity-80">
        Salut, <b>{user?.username}</b> — rol: <b>{user?.role}</b>
      </p>

      {user?.role === "author" && (
        <div className="mt-6 border rounded p-4">Zona autor: publică / editează cărți</div>
      )}
      {user?.role === "admin" && (
        <div className="mt-6 border rounded p-4">Zona admin: management utilizatori / rapoarte</div>
      )}
    </main>
  );
}
