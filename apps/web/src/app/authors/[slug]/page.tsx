import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Link from "next/link";
import { ExternalLink } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { PostCard } from "@/components/post-card";
import { formatDate, getInitials } from "@/lib/format";
import { fetchAuthorProfile, fetchAuthorPosts } from "./actions";

interface AuthorPageProps {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ page?: string }>;
}

export async function generateMetadata({
  params,
}: AuthorPageProps): Promise<Metadata> {
  const { slug } = await params;

  try {
    const { data } = await fetchAuthorProfile(slug);
    return {
      title: `${data.author.name} — BlogApp`,
      description: data.author.bio ?? undefined,
    };
  } catch {
    return { title: "Author Not Found" };
  }
}

export default async function AuthorPage({
  params,
  searchParams,
}: AuthorPageProps) {
  const { slug } = await params;
  const { page: pageParam } = await searchParams;
  const page = Math.max(1, Number(pageParam) || 1);

  let author;
  try {
    const response = await fetchAuthorProfile(slug);
    author = response.data.author;
  } catch {
    notFound();
  }

  let postsData;
  try {
    const response = await fetchAuthorPosts(author.id, page);
    postsData = response.data;
  } catch {
    postsData = { items: [], pagination: { total: 0, page: 1, limit: 12, totalPages: 0 } };
  }

  return (
    <div className="space-y-10">
      <section className="flex flex-col items-center gap-4 text-center">
        <Avatar className="size-24">
          {author.avatar && <AvatarImage src={author.avatar} alt={author.name} />}
          <AvatarFallback className="text-2xl">
            {getInitials(author.name)}
          </AvatarFallback>
        </Avatar>

        <div>
          <h1 className="text-3xl font-bold tracking-tight">{author.name}</h1>
          {author.bio && (
            <p className="mx-auto mt-2 max-w-md text-muted-foreground">
              {author.bio}
            </p>
          )}
        </div>

        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          <span>{author.postCount} posts</span>
          <span>Member since {formatDate(author.createdAt)}</span>
        </div>

        {author.website && (
          <a
            href={author.website}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-sm text-primary hover:underline"
          >
            <ExternalLink className="size-3.5" />
            {author.website.replace(/^https?:\/\//, "")}
          </a>
        )}
      </section>

      {postsData.items.length > 0 ? (
        <>
          <section className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {postsData.items.map((post) => (
              <PostCard key={post.id} post={post} />
            ))}
          </section>

          {postsData.pagination.totalPages > 1 && (
            <nav className="flex items-center justify-center gap-4">
              {page > 1 && (
                <Link
                  href={`/authors/${slug}?page=${page - 1}`}
                  className="rounded-md border px-4 py-2 text-sm hover:bg-accent"
                >
                  Previous
                </Link>
              )}
              <span className="text-sm text-muted-foreground">
                Page {postsData.pagination.page} of{" "}
                {postsData.pagination.totalPages}
              </span>
              {page < postsData.pagination.totalPages && (
                <Link
                  href={`/authors/${slug}?page=${page + 1}`}
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
          No published posts yet.
        </p>
      )}
    </div>
  );
}
