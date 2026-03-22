"use client";

import { useState } from "react";
import { Heart, Bookmark } from "lucide-react";
import { useAuth } from "@/contexts/auth-context";
import { api } from "@/lib/api";
import { cn } from "@/lib/utils";

interface InteractionButtonsProps {
  postId: string;
  likeCount: number;
  liked: boolean;
  bookmarked: boolean;
}

export function InteractionButtons({
  postId,
  likeCount: initialLikeCount,
  liked: initialLiked,
  bookmarked: initialBookmarked,
}: InteractionButtonsProps) {
  const { user, openAuthModal } = useAuth();
  const [liked, setLiked] = useState(initialLiked);
  const [likeCount, setLikeCount] = useState(initialLikeCount);
  const [bookmarked, setBookmarked] = useState(initialBookmarked);

  async function handleLike(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();

    if (!user) {
      openAuthModal();
      return;
    }

    setLiked(!liked);
    setLikeCount(liked ? likeCount - 1 : likeCount + 1);

    try {
      const res = await api<{
        success: true;
        data: { liked: boolean; likeCount: number };
      }>(`/posts/${postId}/like`, { method: "POST" });
      setLiked(res.data.liked);
      setLikeCount(res.data.likeCount);
    } catch {
      setLiked(liked);
      setLikeCount(likeCount);
    }
  }

  async function handleBookmark(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();

    if (!user) {
      openAuthModal();
      return;
    }

    setBookmarked(!bookmarked);

    try {
      const res = await api<{
        success: true;
        data: { bookmarked: boolean };
      }>(`/posts/${postId}/bookmark`, { method: "POST" });
      setBookmarked(res.data.bookmarked);
    } catch {
      setBookmarked(bookmarked);
    }
  }

  return (
    <div className="flex items-center gap-3">
      <button
        type="button"
        onClick={handleLike}
        className="flex items-center gap-1 text-muted-foreground transition-colors hover:text-red-500"
      >
        <Heart
          className={cn(
            "size-4",
            liked && "fill-red-500 text-red-500",
          )}
        />
        <span className="text-xs">{likeCount}</span>
      </button>
      <button
        type="button"
        onClick={handleBookmark}
        className="text-muted-foreground transition-colors hover:text-yellow-500"
      >
        <Bookmark
          className={cn(
            "size-4",
            bookmarked && "fill-yellow-500 text-yellow-500",
          )}
        />
      </button>
    </div>
  );
}
