import { create } from "zustand";

type UserData = {
  id: string;
  username: string;
  email: string;
  role: string;
};

type AuthState = {
  token: string | null;
  user: UserData | null;
  setToken: (t: string | null) => void;
  setUser: (u: UserData | null) => void;
};

export const useAuth = create<AuthState>((set) => ({
  token: null,
  user: null,
  setToken: (t) => set({ token: t }),
  setUser: (u) => set({ user: u }),
}));
