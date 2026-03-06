"use client";

import { useState } from "react";
import { ImagePlus, Loader2, X } from "lucide-react";
import { toast } from "sonner";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface PublishDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  postId: string;
  initialSummary: string | null;
  initialCoverImage: string | null;
  initialTags: string[];
  onPublished: () => void;
}

export function PublishDialog({
  open,
  onOpenChange,
  postId,
  initialSummary,
  initialCoverImage,
  initialTags,
  onPublished,
}: PublishDialogProps) {
  const [summary, setSummary] = useState(initialSummary ?? "");
  const [coverImage, setCoverImage] = useState(initialCoverImage ?? "");
  const [tags, setTags] = useState<string[]>(initialTags);
  const [tagInput, setTagInput] = useState("");
  const [uploading, setUploading] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function addTag(raw: string) {
    const name = raw.trim().toLowerCase();
    if (!name) return;
    if (tags.includes(name)) {
      setTagInput("");
      return;
    }
    if (tags.length >= 5) return;
    setTags((prev) => [...prev, name]);
    setTagInput("");
  }

  function removeTag(name: string) {
    setTags((prev) => prev.filter((t) => t !== name));
  }

  function handleTagKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      addTag(tagInput);
    }
    if (e.key === "Backspace" && !tagInput && tags.length > 0) {
      setTags((prev) => prev.slice(0, -1));
    }
  }

  async function handleImageUpload(file: File) {
    setUploading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const data = await api<{ data: { url: string } }>("/uploads/image", {
        method: "POST",
        body: formData,
      });

      setCoverImage(data.data.url);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) handleImageUpload(file);
  }

  function handleRemoveCover() {
    setCoverImage("");
  }

  async function handlePublish() {
    setPublishing(true);
    setError(null);

    try {
      await api(`/posts/${postId}`, {
        method: "PUT",
        body: JSON.stringify({
          published: true,
          summary: summary || null,
          coverImage: coverImage || null,
          tags,
        }),
      });

      toast.success("Post published");
      onPublished();
      onOpenChange(false);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Publish failed";
      setError(message);
      toast.error(message);
    } finally {
      setPublishing(false);
    }
  }

  const busy = uploading || publishing;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Publish Post</DialogTitle>
          <DialogDescription>
            Add a summary and cover image before publishing.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="summary">Summary</Label>
              <span className="text-xs text-muted-foreground">
                {summary.length}/500
              </span>
            </div>
            <Textarea
              id="summary"
              value={summary}
              onChange={(e) => setSummary(e.target.value.slice(0, 500))}
              placeholder="A brief description of your post..."
              rows={3}
              maxLength={500}
            />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="tags">Tags</Label>
              <span className="text-xs text-muted-foreground">
                {tags.length}/5
              </span>
            </div>
            <div className="flex flex-wrap items-center gap-1.5 rounded-md border px-3 py-2">
              {tags.map((tag) => (
                <Badge key={tag} variant="secondary" className="gap-1">
                  {tag}
                  <button
                    type="button"
                    onClick={() => removeTag(tag)}
                    className="ml-0.5 rounded-full hover:text-destructive"
                  >
                    <X className="size-3" />
                  </button>
                </Badge>
              ))}
              {tags.length < 5 && (
                <Input
                  id="tags"
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={handleTagKeyDown}
                  onBlur={() => addTag(tagInput)}
                  placeholder={tags.length === 0 ? "Add tags..." : ""}
                  className="h-auto min-w-[80px] flex-1 border-0 p-0 shadow-none focus-visible:ring-0"
                />
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              Press Enter or comma to add a tag.
            </p>
          </div>

          <div className="space-y-2">
            <Label>Cover Image</Label>
            {coverImage ? (
              <div className="relative overflow-hidden rounded-md border">
                <img
                  src={coverImage}
                  alt="Cover preview"
                  className="h-48 w-full object-cover"
                />
                <Button
                  type="button"
                  variant="destructive"
                  size="icon-xs"
                  className="absolute top-2 right-2"
                  onClick={handleRemoveCover}
                >
                  <X />
                </Button>
              </div>
            ) : (
              <label className="flex h-32 cursor-pointer flex-col items-center justify-center gap-2 rounded-md border border-dashed border-muted-foreground/25 transition-colors hover:border-muted-foreground/50">
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/gif"
                  className="hidden"
                  onChange={handleFileChange}
                  disabled={uploading}
                />
                {uploading ? (
                  <Loader2 className="size-6 animate-spin text-muted-foreground" />
                ) : (
                  <>
                    <ImagePlus className="size-6 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">
                      Click to upload
                    </span>
                  </>
                )}
              </label>
            )}
          </div>

          {error && (
            <p className="text-sm text-destructive">{error}</p>
          )}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={busy}
          >
            Cancel
          </Button>
          <Button onClick={handlePublish} disabled={busy}>
            {publishing && <Loader2 className="animate-spin" />}
            Publish
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
