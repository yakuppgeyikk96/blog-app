"use client";

import { useAuth } from "@/contexts/auth-context";
import { AuthModal } from "@/components/auth/auth-modal";
import { LoginButton } from "./login-button";
import { ProfileDropdown } from "./profile-dropdown";

export function HeaderNav() {
  const { user, isLoading, logout, authModalOpen, setAuthModalOpen, openAuthModal } = useAuth();

  if (isLoading) {
    return <div className="h-9 w-20 animate-pulse rounded-md bg-muted" />;
  }

  if (user) {
    return <ProfileDropdown user={user} onLogout={logout} />;
  }

  return (
    <>
      <LoginButton onClick={openAuthModal} />
      <AuthModal open={authModalOpen} onOpenChange={setAuthModalOpen} />
    </>
  );
}
