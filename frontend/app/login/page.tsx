"use client";
import { useState } from "react";
import { api } from "@/lib/api";
import { useRouter } from "next/navigation";
import { useAuth } from "@/store/auth";

export default function LoginPage() {
  const [username, setU] = useState("");
  const [password, setP] = useState("");
  const [err, setErr] = useState<string | null>(null);

  const router = useRouter();
  const { setToken, setUser } = useAuth();

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr(null);

    try {
      const { data } = await api.post("/api/auth/login/", {
        username,
        password,
      });

      setToken(data.access);

      const me = await api.get("/api/auth/me/", {
        headers: {
          Authorization: `Bearer ${data.access}`,
        },
      });

      setUser(me.data);
      router.push("/dashboard");
    } catch (e: any) {
      setErr(e?.response?.data?.detail || "Login eșuat");
    }
  };

  return (
    <main className="min-h-dvh flex items-center justify-center p-6">
      <form
        onSubmit={submit}
        className="w-full max-w-sm space-y-3 border rounded-xl p-6"
      >
        <h1 className="text-xl font-semibold">Autentificare</h1>

        <input
          className="w-full border rounded p-2 bg-transparent"
          placeholder="Username"
          value={username}
          onChange={(e) => setU(e.target.value)}
        />

        <input
          type="password"
          className="w-full border rounded p-2 bg-transparent"
          placeholder="Parolă"
          value={password}
          onChange={(e) => setP(e.target.value)}
        />

        {err && <p className="text-red-500 text-sm">{err}</p>}

        <button className="w-full rounded bg-white text-black py-2 font-medium">
          Login
        </button>
      </form>
    </main>
  );
}
