import Link from "next/link";

import { HeaderNav } from "@/components/layout/header-nav";
import { ThemeToggle } from "@/components/theme-toggle";
import { NotificationBell } from "@/components/notifications/notification-bell";

export function Header() {
  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/60">
      <div className="mx-auto flex h-14 w-full max-w-5xl items-center justify-between px-4 sm:px-6">
        <Link href="/" className="text-lg font-bold">
          Papyra
        </Link>

        <nav className="flex items-center gap-2">
          <ThemeToggle />
          <NotificationBell />
          <HeaderNav />
        </nav>
      </div>
    </header>
  );
}
