import Link from "next/link";
import { Eye, TrendingUp, X } from "lucide-react";
import { PostCard } from "@/components/post-card";
import { Badge } from "@/components/ui/badge";
import { SearchInput } from "@/components/search-input";
import { fetchPublishedPosts, fetchPopularPosts } from "./actions";

interface HomeProps {
  searchParams: Promise<{ page?: string; tag?: string; q?: string }>;
}

export default async function Home({ searchParams }: HomeProps) {
  const { page: pageParam, tag, q } = await searchParams;
  const page = Math.max(1, Number(pageParam) || 1);

  let data: Awaited<ReturnType<typeof fetchPublishedPosts>>["data"] | null =
    null;
  let popularPosts: Awaited<ReturnType<typeof fetchPopularPosts>>["data"]["items"] = [];

  try {
    const [postsResponse, popularResponse] = await Promise.all([
      fetchPublishedPosts(page, 12, tag, q),
      page === 1 && !tag && !q ? fetchPopularPosts(5) : Promise.resolve(null),
    ]);
    data = postsResponse.data;
    if (popularResponse) {
      popularPosts = popularResponse.data.items;
    }
  } catch {
    // Graceful fallback — show empty state on API failure
  }

  const items = data?.items ?? [];
  const pagination = data?.pagination;

  function buildPageHref(p: number) {
    const params = new URLSearchParams();
    if (p > 1) params.set("page", String(p));
    if (tag) params.set("tag", tag);
    if (q) params.set("q", q);
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

      <SearchInput />

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

      {popularPosts.length > 0 && (
        <section>
          <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold">
            <TrendingUp className="size-5" />
            Trending This Week
          </h2>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {popularPosts.map((post, i) => (
              <Link
                key={post.id}
                href={`/posts/${post.slug}`}
                className="flex items-start gap-3 rounded-lg border p-3 transition-colors hover:bg-accent"
              >
                <span className="text-2xl font-bold text-muted-foreground/50">
                  {i + 1}
                </span>
                <div className="min-w-0">
                  <p className="line-clamp-2 text-sm font-medium">{post.title}</p>
                  <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
                    <span>{post.author.name}</span>
                    <span className="flex items-center gap-0.5">
                      <Eye className="size-3" />
                      {post.viewCount}
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </section>
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
          {q
            ? "No posts found matching your search."
            : tag
              ? "No posts found with this tag."
              : "No posts published yet."}
        </p>
      )}
    </div>
  );
}
