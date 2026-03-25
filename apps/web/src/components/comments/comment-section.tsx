"use client";

import { useEffect, useState } from "react";
import { MessageSquare } from "lucide-react";
import type { CommentDto, CommentWithRepliesDto } from "@repo/shared-types";
import { useAuth } from "@/contexts/auth-context";
import { api } from "@/lib/api";
import { toast } from "sonner";
import { CommentForm } from "./comment-form";
import { CommentItem } from "./comment-item";

interface CommentSectionProps {
  postId: string;
  postAuthorId: string;
}

export function CommentSection({ postId, postAuthorId }: CommentSectionProps) {
  const { user, openAuthModal } = useAuth();
  const [comments, setComments] = useState<CommentWithRepliesDto[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api<{
      success: true;
      data: { comments: CommentWithRepliesDto[]; total: number };
    }>(`/posts/${postId}/comments`)
      .then((res) => {
        setComments(res.data.comments);
        setTotal(res.data.total);
      })
      .catch(() => toast.error("Failed to load comments"))
      .finally(() => setLoading(false));
  }, [postId]);

  async function handleCreate(content: string) {
    const res = await api<{
      success: true;
      data: { comment: CommentDto };
    }>(`/posts/${postId}/comments`, {
      method: "POST",
      body: JSON.stringify({ content }),
    });

    setComments((prev) => [
      ...prev,
      { ...res.data.comment, replies: [] },
    ]);
    setTotal((t) => t + 1);
  }

  async function handleReply(parentId: string, content: string) {
    const res = await api<{
      success: true;
      data: { comment: CommentDto };
    }>(`/posts/${postId}/comments`, {
      method: "POST",
      body: JSON.stringify({ content, parentId }),
    });

    setComments((prev) =>
      prev.map((c) =>
        c.id === parentId
          ? { ...c, replies: [...c.replies, res.data.comment] }
          : c,
      ),
    );
    setTotal((t) => t + 1);
  }

  async function handleEdit(commentId: string, content: string) {
    const res = await api<{
      success: true;
      data: { comment: CommentDto };
    }>(`/comments/${commentId}`, {
      method: "PUT",
      body: JSON.stringify({ content }),
    });

    const updated = res.data.comment;

    setComments((prev) =>
      prev.map((c) => {
        if (c.id === commentId) {
          return { ...c, ...updated };
        }
        return {
          ...c,
          replies: c.replies.map((r) =>
            r.id === commentId ? { ...r, ...updated } : r,
          ),
        };
      }),
    );
  }

  async function handleDelete(commentId: string) {
    await api(`/comments/${commentId}`, { method: "DELETE" });

    setComments((prev) => {
      const isTopLevel = prev.some((c) => c.id === commentId);
      if (isTopLevel) {
        const deleted = prev.find((c) => c.id === commentId);
        const removedCount = 1 + (deleted?.replies.length ?? 0);
        setTotal((t) => t - removedCount);
        return prev.filter((c) => c.id !== commentId);
      }

      return prev.map((c) => {
        const filtered = c.replies.filter((r) => r.id !== commentId);
        if (filtered.length < c.replies.length) {
          setTotal((t) => t - 1);
        }
        return { ...c, replies: filtered };
      });
    });
  }

  return (
    <section className="mt-12 border-t pt-8">
      <h2 className="flex items-center gap-2 text-xl font-semibold">
        <MessageSquare className="size-5" />
        {total} {total === 1 ? "Comment" : "Comments"}
      </h2>

      <div className="mt-6">
        {user ? (
          <CommentForm onSubmit={handleCreate} />
        ) : (
          <button
            type="button"
            onClick={openAuthModal}
            className="w-full rounded-md border border-dashed p-4 text-sm text-muted-foreground hover:border-foreground/20 hover:text-foreground transition-colors"
          >
            Log in to leave a comment
          </button>
        )}
      </div>

      {loading ? (
        <div className="mt-8 space-y-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex gap-3">
              <div className="size-6 shrink-0 animate-pulse rounded-full bg-muted" />
              <div className="flex-1 space-y-2">
                <div className="h-4 w-32 animate-pulse rounded bg-muted" />
                <div className="h-12 animate-pulse rounded bg-muted" />
              </div>
            </div>
          ))}
        </div>
      ) : comments.length > 0 ? (
        <div className="mt-8 space-y-6">
          {comments.map((comment) => (
            <CommentItem
              key={comment.id}
              comment={comment}
              currentUserId={user?.id}
              postAuthorId={postAuthorId}
              onReply={handleReply}
              onEdit={handleEdit}
              onDelete={handleDelete}
            >
              {comment.replies.map((reply) => (
                <CommentItem
                  key={reply.id}
                  comment={reply}
                  currentUserId={user?.id}
                  postAuthorId={postAuthorId}
                  onEdit={handleEdit}
                  onDelete={handleDelete}
                />
              ))}
            </CommentItem>
          ))}
        </div>
      ) : (
        <p className="mt-8 text-center text-sm text-muted-foreground">
          No comments yet. Be the first to share your thoughts!
        </p>
      )}
    </section>
  );
}
