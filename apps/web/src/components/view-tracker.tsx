"use client";

import { useEffect } from "react";

interface ViewTrackerProps {
  postId: string;
}

export function ViewTracker({ postId }: ViewTrackerProps) {
  useEffect(() => {
    fetch(`/api/posts/${postId}/view`, { method: "POST" }).catch(() => {
      // Fire-and-forget — don't block the page
    });
  }, [postId]);

  return null;
}
