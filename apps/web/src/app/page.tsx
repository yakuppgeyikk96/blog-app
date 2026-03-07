import Link from "next/link";
import { X } from "lucide-react";
import { PostCard } from "@/components/post-card";
import { Badge } from "@/components/ui/badge";
import { fetchPublishedPosts } from "./actions";

interface HomeProps {
  searchParams: Promise<{ page?: string; tag?: string }>;
}

export default async function Home({ searchParams }: HomeProps) {
  const { page: pageParam, tag } = await searchParams;
  const page = Math.max(1, Number(pageParam) || 1);

  let data: Awaited<ReturnType<typeof fetchPublishedPosts>>["data"] | null =
    null;

  try {
    const response = await fetchPublishedPosts(page, 12, tag);
    data = response.data;
  } catch {
    // Graceful fallback — show empty state on API failure
  }

  const items = data?.items ?? [];
  const pagination = data?.pagination;

  function buildPageHref(p: number) {
    const params = new URLSearchParams();
    if (p > 1) params.set("page", String(p));
    if (tag) params.set("tag", tag);
    const qs = params.toString();
    return qs ? `/?${qs}` : "/";
  }

  return (
    <div className="space-y-10">
      <section className="text-center">
        <h1 className="text-4xl font-bold tracking-tight">
          Welcome to BlogApp
        </h1>
        <p className="mt-2 text-lg text-muted-foreground">
          Discover stories, ideas, and insights.
        </p>
      </section>

      {tag && (
        <div className="flex items-center justify-center gap-2">
          <span className="text-sm text-muted-foreground">Filtered by:</span>
          <Badge variant="secondary" className="gap-1">
            {tag}
            <Link href="/">
              <X className="size-3" />
            </Link>
          </Badge>
        </div>
      )}

      {items.length > 0 ? (
        <>
          <section className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {items.map((post) => (
              <PostCard key={post.id} post={post} />
            ))}
          </section>

          {pagination && pagination.totalPages > 1 && (
            <nav className="flex items-center justify-center gap-4">
              {page > 1 && (
                <Link
                  href={buildPageHref(page - 1)}
                  className="rounded-md border px-4 py-2 text-sm hover:bg-accent"
                >
                  Previous
                </Link>
              )}
              <span className="text-sm text-muted-foreground">
                Page {pagination.page} of {pagination.totalPages}
              </span>
              {page < pagination.totalPages && (
                <Link
                  href={buildPageHref(page + 1)}
                  className="rounded-md border px-4 py-2 text-sm hover:bg-accent"
                >
                  Next
                </Link>
              )}
            </nav>
          )}
        </>
      ) : (
        <p className="text-center text-muted-foreground">
          {tag ? "No posts found with this tag." : "No posts published yet."}
        </p>
      )}
    </div>
  );
}
