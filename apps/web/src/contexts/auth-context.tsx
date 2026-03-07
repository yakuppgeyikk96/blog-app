"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import { useRouter } from "next/navigation";
import type { UserResponseDto, AuthResponse } from "@repo/shared-types";
import { api, ApiError } from "@/lib/api";

interface AuthContextValue {
  user: UserResponseDto | null;
  isLoading: boolean;
  setUser: (user: UserResponseDto | null) => void;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [user, setUser] = useState<UserResponseDto | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    api<{ success: true; data: AuthResponse }>("/auth/me")
      .then((res) => setUser(res.data.user))
      .catch((err) => {
        if (!(err instanceof ApiError && err.status === 401)) {
          console.error("Failed to fetch user:", err);
        }
      })
      .finally(() => setIsLoading(false));
  }, []);

  const logout = useCallback(async () => {
    await api("/auth/logout", { method: "POST" });
    setUser(null);
    router.push("/");
  }, [router]);

  return (
    <AuthContext value={{ user, isLoading, setUser, logout }}>
      {children}
    </AuthContext>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
