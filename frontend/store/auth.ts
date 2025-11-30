import { create } from "zustand";

type UserData = {
  id: string;
  username: string;
  email: string;
  role: string;
};

type AuthState = {
  user: UserData | null;
  setUser: (u: UserData | null) => void;
};

// Note: With NextAuth, we primarily use useSession() hook
// This store can be used for additional client-side state if needed
export const useAuth = create<AuthState>((set) => ({
  user: null,
  setUser: (u) => set({ user: u }),
}));
