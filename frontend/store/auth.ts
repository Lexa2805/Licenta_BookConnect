import { create } from "zustand";

export type Role = "reader" | "author" | "admin";
export type User = { id: number; username: string; email: string; role: Role };

type AuthState = {
  accessToken: string | null;
  user: User | null;
  setToken: (t: string | null) => void;
  setUser: (u: User | null) => void;
  logout: () => void;
};

export const useAuth = create<AuthState>((set) => ({
  accessToken: typeof window !== "undefined" ? localStorage.getItem("access") : null,
  user: null,
  setToken: (t) => {
    if (typeof window !== "undefined") {
      t ? localStorage.setItem("access", t) : localStorage.removeItem("access");
    }
    set({ accessToken: t });
  },
  setUser: (u) => set({ user: u }),
  logout: () => {
    if (typeof window !== "undefined") localStorage.removeItem("access");
    set({ accessToken: null, user: null });
  },
}));
