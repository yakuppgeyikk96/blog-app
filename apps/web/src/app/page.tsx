import Link from "next/link";
import { PostCard } from "@/components/post-card";
import { fetchPublishedPosts } from "./actions";

interface HomeProps {
  searchParams: Promise<{ page?: string }>;
}

export default async function Home({ searchParams }: HomeProps) {
  const { page: pageParam } = await searchParams;
  const page = Math.max(1, Number(pageParam) || 1);

  let data: Awaited<ReturnType<typeof fetchPublishedPosts>>["data"] | null =
    null;

  try {
    const response = await fetchPublishedPosts(page);
    data = response.data;
  } catch {
    // Graceful fallback — show empty state on API failure
  }

  const items = data?.items ?? [];
  const pagination = data?.pagination;

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
                  href={`/?page=${page - 1}`}
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
                  href={`/?page=${page + 1}`}
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
          No posts published yet.
        </p>
      )}
    </div>
  );
}
