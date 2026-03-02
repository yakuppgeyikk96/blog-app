"use client";

import { useState } from "react";
import { useAuth } from "@/contexts/auth-context";
import { AuthModal } from "@/components/auth/auth-modal";
import { LoginButton } from "./login-button";
import { ProfileDropdown } from "./profile-dropdown";

export function HeaderNav() {
  const { user, isLoading, logout } = useAuth();
  const [modalOpen, setModalOpen] = useState(false);

  if (isLoading) {
    return <div className="h-9 w-20 animate-pulse rounded-md bg-muted" />;
  }

  if (user) {
    return <ProfileDropdown user={user} onLogout={logout} />;
  }

  return (
    <>
      <LoginButton onClick={() => setModalOpen(true)} />
      <AuthModal open={modalOpen} onOpenChange={setModalOpen} />
    </>
  );
}
