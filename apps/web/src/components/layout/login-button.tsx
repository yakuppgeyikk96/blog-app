"use client";

import { Button } from "@/components/ui/button";

interface LoginButtonProps {
  onClick: () => void;
}

export function LoginButton({ onClick }: LoginButtonProps) {
  return (
    <Button variant="outline" onClick={onClick}>
      Login
    </Button>
  );
}
