"use client";

import { useState } from "react";
import type { AuthResponse, RegisterInput } from "@repo/shared-types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/contexts/auth-context";
import { useAuthForm } from "@/hooks/use-auth-form";
import { api } from "@/lib/api";

interface RegisterFormProps {
  onSuccess: () => void;
}

export function RegisterForm({ onSuccess }: RegisterFormProps) {
  const { setUser } = useAuth();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const { isSubmitting, error, handleSubmit } = useAuthForm<RegisterInput>({
    async onSubmit(data) {
      const res = await api<{ success: true; data: AuthResponse }>("/auth/register", {
        method: "POST",
        body: JSON.stringify(data),
      });
      setUser(res.data.user);
      onSuccess();
    },
  });

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        handleSubmit({ name, email, password });
      }}
      className="space-y-4"
    >
      {error && (
        <p className="text-sm text-destructive">{error}</p>
      )}
      <div className="space-y-2">
        <Label htmlFor="register-name">Name</Label>
        <Input
          id="register-name"
          type="text"
          required
          minLength={1}
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="John Doe"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="register-email">Email</Label>
        <Input
          id="register-email"
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@example.com"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="register-password">Password</Label>
        <Input
          id="register-password"
          type="password"
          required
          minLength={8}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="••••••••"
        />
      </div>
      <Button type="submit" className="w-full" disabled={isSubmitting}>
        {isSubmitting ? "Creating account…" : "Register"}
      </Button>
    </form>
  );
}
