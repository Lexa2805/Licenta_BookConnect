"use client";
import { useState } from "react";
import { api } from "@/lib/api";
import { useRouter } from "next/navigation";

export default function RegisterPage() {
  const [username, setU] = useState("");
  const [email, setE] = useState("");
  const [password, setP] = useState("");
  const [role, setR] = useState<"reader"|"author"|"admin">("reader");
  const [err, setErr] = useState<string | null>(null);
  const [ok, setOk] = useState(false);
  const router = useRouter();

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr(null); setOk(false);
    try {
      await api.post("/auth/register/", { username, email, password, role });
      setOk(true);
      setTimeout(() => router.push("/login"), 800);
    } catch (e: any) {
      setErr(e?.response?.data?.detail || "Înregistrare eșuată");
    }
  };

  return (
    <main className="min-h-dvh flex items-center justify-center p-6">
      <form onSubmit={submit} className="w-full max-w-sm space-y-3 border rounded-xl p-6">
        <h1 className="text-xl font-semibold">Înregistrare</h1>
        <input className="w-full border rounded p-2 bg-transparent" placeholder="Username"
          value={username} onChange={(e) => setU(e.target.value)} />
        <input className="w-full border rounded p-2 bg-transparent" placeholder="Email"
          value={email} onChange={(e) => setE(e.target.value)} />
        <input type="password" className="w-full border rounded p-2 bg-transparent" placeholder="Parolă"
          value={password} onChange={(e) => setP(e.target.value)} />
        <select className="w-full border rounded p-2 bg-transparent" value={role}
          onChange={(e) => setR(e.target.value as any)}>
          <option value="reader">Reader</option>
          <option value="author">Author</option>
          <option value="admin">Admin</option>
        </select>
        {err && <p className="text-red-500 text-sm">{err}</p>}
        {ok && <p className="text-green-500 text-sm">Cont creat. Redirecționez la login…</p>}
        <button className="w-full rounded bg-white text-black py-2 font-medium">Creează cont</button>
      </form>
    </main>
  );
}
