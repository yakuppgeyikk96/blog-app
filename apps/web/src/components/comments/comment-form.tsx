"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

interface CommentFormProps {
  onSubmit: (content: string) => Promise<void>;
  placeholder?: string;
  submitLabel?: string;
  onCancel?: () => void;
  autoFocus?: boolean;
}

export function CommentForm({
  onSubmit,
  placeholder = "Write a comment...",
  submitLabel = "Comment",
  onCancel,
  autoFocus = false,
}: CommentFormProps) {
  const [content, setContent] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!content.trim()) return;

    setSubmitting(true);
    try {
      await onSubmit(content.trim());
      setContent("");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <Textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder={placeholder}
        maxLength={2000}
        rows={3}
        autoFocus={autoFocus}
      />
      <div className="flex items-center gap-2">
        <Button type="submit" size="sm" disabled={submitting || !content.trim()}>
          {submitting ? "Posting..." : submitLabel}
        </Button>
        {onCancel && (
          <Button type="button" variant="ghost" size="sm" onClick={onCancel}>
            Cancel
          </Button>
        )}
      </div>
    </form>
  );
}
