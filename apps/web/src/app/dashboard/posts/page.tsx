import Link from "next/link";
import { Plus } from "lucide-react";

import { Button } from "@/components/ui/button";

export default function MyPostsPage() {
  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">My Posts</h1>
        <Button
          asChild
          className="bg-emerald-600 text-white hover:bg-emerald-700"
        >
          <Link href="/dashboard/posts/create">
            <Plus className="size-4" />
            Create
          </Link>
        </Button>
      </div>
      <p className="mt-4 text-muted-foreground">Posts will be listed here.</p>
    </div>
  );
}
