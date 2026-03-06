"use client";

import { useState, useTransition } from "react";
import { EyeOff } from "lucide-react";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { unpublishPost } from "@/app/dashboard/posts/actions";

interface UnpublishPostButtonProps {
  postId: string;
  postTitle: string;
}

export function UnpublishPostButton({
  postId,
  postTitle,
}: UnpublishPostButtonProps) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  function handleUnpublish() {
    startTransition(async () => {
      const result = await unpublishPost(postId);
      setOpen(false);
      if (result.success) {
        toast.success("Post reverted to draft");
      } else {
        toast.error(result.error ?? "Failed to unpublish post");
      }
    });
  }

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger asChild>
        <button
          type="button"
          className="rounded-md p-2 text-muted-foreground hover:bg-amber-100 hover:text-amber-700 dark:hover:bg-amber-900/30 dark:hover:text-amber-400"
        >
          <EyeOff className="size-4" />
        </button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Unpublish post?</AlertDialogTitle>
          <AlertDialogDescription>
            &ldquo;{postTitle}&rdquo; will be reverted to draft and will no
            longer be visible to readers.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isPending}>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={handleUnpublish} disabled={isPending}>
            {isPending ? "Unpublishing…" : "Unpublish"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
