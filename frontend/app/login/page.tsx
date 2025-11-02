"use client";

import { useState } from "react";
import Image from "next/image";
import { api } from "@/lib/api";
import { useRouter } from "next/navigation";
import { useAuth } from "@/store/auth";

export default function LoginPage() {
  const [username, setU] = useState("");
  const [password, setP] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const router = useRouter();
  const { setToken, setUser } = useAuth();

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr(null);
    setLoading(true);

    try {
      // LOGIN
      const { data } = await api.post("/api/auth/login/", {
        username,
        password,
      });

      // salvăm tokenul în store
      setToken(data.access);

      // luăm user-ul curent
      const me = await api.get("/api/auth/me/", {
        headers: {
          Authorization: `Bearer ${data.access}`,
        },
      });

      setUser(me.data);

      // du-te în homepage după login
      router.push("/HomePage");
    } catch (e: any) {
      const detail = e?.response?.data?.detail;

      if (
        e?.response?.status === 401 ||
        detail === "Credențiale invalide." ||
        detail === "Invalid credentials"
      ) {
        setErr("Credențiale invalide. Verifică username-ul și parola.");
      } else {
        setErr(detail || "A apărut o eroare. Încearcă din nou.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-dvh bg-black flex items-center justify-center p-6">
      <div className="w-full max-w-md bg-black/30 border border-gray-600 rounded-2xl p-7 shadow-xl">
        {}
        <div className="flex items-center gap-4 mb-6">
          <div className="relative w-16 h-16 hidden sm:block">
            <Image
              src="/images/books.png"
              alt="BookConnect"
              fill
              className="object-contain"
              priority
            />
          </div>
          <div>
            <h1 className="text-white text-2xl font-bold leading-tight">
              BookConnect
            </h1>
            <p className="text-gray-400 text-sm">
              Autentifică-te ca să continui 📚
            </p>
          </div>
        </div>

        <form onSubmit={submit} className="space-y-3">
          <h2 className="text-white text-xl font-semibold mb-2">
            Autentificare
          </h2>

          {err && <p className="text-red-400 text-sm mb-2">{err}</p>}

          <input
            className="w-full border border-gray-500 rounded-md p-2 bg-black text-white outline-none focus:border-white transition"
            placeholder="Username"
            value={username}
            onChange={(e) => setU(e.target.value)}
            autoComplete="username"
          />

          <input
            type="password"
            className="w-full border border-gray-500 rounded-md p-2 bg-black text-white outline-none focus:border-white transition"
            placeholder="Parolă"
            value={password}
            onChange={(e) => setP(e.target.value)}
            autoComplete="current-password"
          />

          {/* forgot password */}
          <div className="flex justify-end">
            <button
              type="button"
              onClick={() => router.push("/reset-password")}
              className="text-sm text-gray-300 hover:text-white transition"
            >
              Ai uitat parola?
            </button>
          </div>

          <button
            className="w-full rounded-md bg-white text-black py-2 font-medium hover:bg-gray-100 transition"
            disabled={loading}
          >
            {loading ? "Se conectează..." : "Login"}
          </button>
        </form>

        {/* separator */}
        <div className="flex items-center gap-3 my-6">
          <div className="h-px bg-gray-600 flex-1" />
          <span className="text-gray-400 text-sm">sau</span>
          <div className="h-px bg-gray-600 flex-1" />
        </div>

        {/* social login (UI) */}
        <div className="flex flex-col gap-3">
          <button className="w-full border border-gray-600 rounded-md py-2 text-white hover:bg-white/10 transition">
            Continuă cu Google
          </button>
          <button className="w-full border border-gray-600 rounded-md py-2 text-white hover:bg-white/10 transition">
            Continuă cu iCloud
          </button>
          <button className="w-full border border-gray-600 rounded-md py-2 text-white hover:bg-white/10 transition">
            Continuă cu Facebook
          </button>
        </div>

        {/* register */}
        <p className="text-gray-300 text-sm mt-6 text-center">
          Nu ai cont?{" "}
          <button
            onClick={() => router.push("/register")}
            className="text-white font-semibold hover:underline"
          >
            Creează-l
          </button>
        </p>
      </div>
    </main>
  );
}
