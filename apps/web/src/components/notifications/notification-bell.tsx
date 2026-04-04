"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Bell } from "lucide-react";
import { useAuth } from "@/contexts/auth-context";
import { api } from "@/lib/api";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { formatDate, getInitials } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { NotificationDto } from "@repo/shared-types";

const NOTIFICATION_MESSAGES: Record<string, (actor: string, title: string) => string> = {
  post_liked: (actor, title) => `${actor} liked "${title}"`,
  post_commented: (actor, title) => `${actor} commented on "${title}"`,
  comment_replied: (actor, title) => `${actor} replied to your comment on "${title}"`,
};

function getNotificationMessage(n: NotificationDto): string {
  const fn = NOTIFICATION_MESSAGES[n.type];
  return fn ? fn(n.actor.name, n.post?.title ?? "a post") : "New notification";
}

export function NotificationBell() {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<NotificationDto[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [open, setOpen] = useState(false);
  const eventSourceRef = useRef<EventSource | null>(null);

  useEffect(() => {
    if (!user) return;

    // Fetch initial unread count
    api<{ success: true; data: { count: number } }>("/notifications/unread-count")
      .then((res) => setUnreadCount(res.data.count))
      .catch(() => {});

    // SSE connection via Next.js API route (same origin, cookies sent automatically)
    const source = new EventSource("/api/notifications/stream");
    eventSourceRef.current = source;

    source.onmessage = (event) => {
      try {
        const notification = JSON.parse(event.data) as NotificationDto;
        setNotifications((prev) => [notification, ...prev]);
        setUnreadCount((c) => c + 1);
      } catch {
        // Ignore parse errors (heartbeats)
      }
    };

    return () => {
      source.close();
      eventSourceRef.current = null;
    };
  }, [user]);

  useEffect(() => {
    if (!user || !open) return;

    api<{ success: true; data: { items: NotificationDto[]; hasMore: boolean } }>(
      "/notifications?limit=20",
    )
      .then((res) => setNotifications(res.data.items))
      .catch(() => {});
  }, [user, open]);

  async function handleMarkAsRead(id: string) {
    await api(`/notifications/${id}/read`, { method: "PUT" }).catch(() => {});
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n)),
    );
    setUnreadCount((c) => Math.max(0, c - 1));
  }

  if (!user) return null;

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="relative h-9 w-9 p-0">
          <Bell className="size-4 text-muted-foreground" />
          {unreadCount > 0 && (
            <span className="absolute -right-0.5 -top-0.5 flex size-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80 p-0">
        <div className="border-b px-4 py-3">
          <p className="text-sm font-semibold">Notifications</p>
        </div>
        <div className="max-h-80 overflow-y-auto">
          {notifications.length > 0 ? (
            notifications.map((n) => (
              <Link
                key={n.id}
                href={n.post ? `/posts/${n.post.slug}` : "#"}
                onClick={() => {
                  if (!n.read) handleMarkAsRead(n.id);
                  setOpen(false);
                }}
                className={cn(
                  "flex gap-3 px-4 py-3 transition-colors hover:bg-accent",
                  !n.read && "bg-accent/50",
                )}
              >
                <Avatar size="sm" className="mt-0.5 shrink-0">
                  {n.actor.avatar && (
                    <AvatarImage src={n.actor.avatar} alt={n.actor.name} />
                  )}
                  <AvatarFallback>
                    {getInitials(n.actor.name)}
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0 flex-1">
                  <p className="text-sm leading-snug">
                    {getNotificationMessage(n)}
                  </p>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {formatDate(n.createdAt)}
                  </p>
                </div>
                {!n.read && (
                  <span className="mt-2 size-2 shrink-0 rounded-full bg-blue-500" />
                )}
              </Link>
            ))
          ) : (
            <p className="px-4 py-8 text-center text-sm text-muted-foreground">
              No notifications yet
            </p>
          )}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
