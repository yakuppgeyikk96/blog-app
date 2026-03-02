"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import { api } from "@/lib/api";

interface CreatePostResponse {
  success: boolean;
  data: {
    post: {
      id: string;
    };
  };
}

export function CreatePostButton() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleCreate() {
    setLoading(true);
    try {
      const res = await api<CreatePostResponse>("/posts", {
        method: "POST",
        body: JSON.stringify({ title: "Untitled" }),
      });
      router.push(`/dashboard/posts/${res.data.post.id}/edit`);
    } catch {
      setLoading(false);
    }
  }

  return (
    <Button
      onClick={handleCreate}
      disabled={loading}
      className="bg-emerald-600 text-white hover:bg-emerald-700"
    >
      {loading ? (
        <Loader2 className="size-4 animate-spin" />
      ) : (
        <Plus className="size-4" />
      )}
      Create
    </Button>
  );
}
