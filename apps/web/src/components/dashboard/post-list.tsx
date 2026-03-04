import Link from "next/link";
import { FileText, Pencil } from "lucide-react";
import type { PostListItemDto } from "@repo/shared-types";
import { formatDate } from "@/lib/format";

interface PostListProps {
  posts: PostListItemDto[];
}

export function PostList({ posts }: PostListProps) {
  if (posts.length === 0) {
    return <EmptyState />;
  }

  return (
    <ul className="mt-6 divide-y divide-border rounded-lg border">
      {posts.map((post) => (
        <PostListItem key={post.id} post={post} />
      ))}
    </ul>
  );
}

function PostListItem({ post }: { post: PostListItemDto }) {
  return (
    <li className="flex items-center justify-between px-4 py-3">
      <div className="min-w-0 flex-1">
        <Link
          href={`/dashboard/posts/${post.id}/edit`}
          className="font-medium hover:underline"
        >
          {post.title}
        </Link>
        <div className="mt-0.5 flex items-center gap-2 text-sm text-muted-foreground">
          <StatusBadge published={post.published} />
          <span>{formatDate(post.createdAt)}</span>
        </div>
      </div>
      <Link
        href={`/dashboard/posts/${post.id}/edit`}
        className="ml-4 rounded-md p-2 text-muted-foreground hover:bg-accent hover:text-foreground"
      >
        <Pencil className="size-4" />
      </Link>
    </li>
  );
}

function StatusBadge({ published }: { published: boolean }) {
  if (published) {
    return (
      <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">
        Published
      </span>
    );
  }

  return (
    <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
      Draft
    </span>
  );
}

function EmptyState() {
  return (
    <div className="mt-12 flex flex-col items-center text-center">
      <FileText className="size-10 text-muted-foreground" />
      <p className="mt-3 text-muted-foreground">
        No posts yet. Create your first post!
      </p>
    </div>
  );
}
