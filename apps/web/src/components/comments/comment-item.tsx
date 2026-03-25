"use client";

import { useState } from "react";
import Link from "next/link";
import { MessageSquare, Pencil, Trash2 } from "lucide-react";
import type { CommentDto } from "@repo/shared-types";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { formatDate, getInitials } from "@/lib/format";
import { CommentForm } from "./comment-form";

interface CommentItemProps {
  comment: CommentDto;
  currentUserId?: string;
  postAuthorId: string;
  onReply?: (parentId: string, content: string) => Promise<void>;
  onEdit: (commentId: string, content: string) => Promise<void>;
  onDelete: (commentId: string) => Promise<void>;
  children?: React.ReactNode;
}

export function CommentItem({
  comment,
  currentUserId,
  postAuthorId,
  onReply,
  onEdit,
  onDelete,
  children,
}: CommentItemProps) {
  const [replying, setReplying] = useState(false);
  const [editing, setEditing] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const isAuthor = currentUserId === comment.author.id;
  const isPostAuthor = currentUserId === postAuthorId;
  const canEdit = isAuthor;
  const canDelete = isAuthor || isPostAuthor;
  const isEdited =
    new Date(comment.updatedAt).getTime() >
    new Date(comment.createdAt).getTime() + 1000;

  async function handleReply(content: string) {
    await onReply?.(comment.id, content);
    setReplying(false);
  }

  async function handleEdit(content: string) {
    await onEdit(comment.id, content);
    setEditing(false);
  }

  async function handleDelete() {
    setDeleting(true);
    try {
      await onDelete(comment.id);
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex gap-3">
        <Link href={`/authors/${comment.author.slug}`} className="shrink-0">
          <Avatar size="sm">
            {comment.author.avatar && (
              <AvatarImage src={comment.author.avatar} alt={comment.author.name} />
            )}
            <AvatarFallback>{getInitials(comment.author.name)}</AvatarFallback>
          </Avatar>
        </Link>

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 text-sm">
            <Link
              href={`/authors/${comment.author.slug}`}
              className="font-medium hover:underline"
            >
              {comment.author.name}
            </Link>
            <span className="text-muted-foreground">
              {formatDate(comment.createdAt)}
            </span>
            {isEdited && (
              <span className="text-xs text-muted-foreground">(edited)</span>
            )}
          </div>

          {editing ? (
            <div className="mt-2">
              <CommentForm
                onSubmit={handleEdit}
                placeholder="Edit your comment..."
                submitLabel="Save"
                onCancel={() => setEditing(false)}
                autoFocus
              />
            </div>
          ) : (
            <div
              className="mt-1 text-sm prose prose-sm prose-neutral dark:prose-invert max-w-none"
              dangerouslySetInnerHTML={{ __html: comment.content }}
            />
          )}

          {!editing && currentUserId && (
            <div className="mt-2 flex items-center gap-1">
              {onReply && !comment.parentId && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 text-xs text-muted-foreground"
                  onClick={() => setReplying(!replying)}
                >
                  <MessageSquare className="mr-1 size-3" />
                  Reply
                </Button>
              )}
              {canEdit && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 text-xs text-muted-foreground"
                  onClick={() => setEditing(true)}
                >
                  <Pencil className="mr-1 size-3" />
                  Edit
                </Button>
              )}
              {canDelete && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 text-xs text-muted-foreground hover:text-destructive"
                  onClick={handleDelete}
                  disabled={deleting}
                >
                  <Trash2 className="mr-1 size-3" />
                  {deleting ? "Deleting..." : "Delete"}
                </Button>
              )}
            </div>
          )}
        </div>
      </div>

      {replying && (
        <div className="ml-9">
          <CommentForm
            onSubmit={handleReply}
            placeholder={`Reply to ${comment.author.name}...`}
            submitLabel="Reply"
            onCancel={() => setReplying(false)}
            autoFocus
          />
        </div>
      )}

      {children && <div className="ml-9 space-y-4 border-l-2 pl-4">{children}</div>}
    </div>
  );
}
