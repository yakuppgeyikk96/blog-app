import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Link from "next/link";
import { fetchPostBySlug } from "@/app/actions";
import { formatDate } from "@/lib/format";
import { Badge } from "@/components/ui/badge";
import { BlurImage } from "@/components/blur-image";
import { InteractionButtons } from "@/components/interaction-buttons";
import { CommentSection } from "@/components/comments/comment-section";

export const revalidate = 3600;

interface PostPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({
  params,
}: PostPageProps): Promise<Metadata> {
  const { slug } = await params;

  try {
    const { data } = await fetchPostBySlug(slug);
    return {
      title: data.post.title,
      description: data.post.summary ?? undefined,
    };
  } catch {
    return { title: "Post Not Found" };
  }
}

export default async function PostPage({ params }: PostPageProps) {
  const { slug } = await params;

  let post;
  try {
    const response = await fetchPostBySlug(slug);
    post = response.data.post;
  } catch {
    notFound();
  }

  return (
    <article className="mx-auto max-w-3xl">
      {post.coverImage && (
        <div className="relative mb-8 aspect-2/1 w-full overflow-hidden rounded-lg">
          <BlurImage
            src={post.coverImage}
            alt={post.title}
            fill
            className="object-cover"
            priority
          />
        </div>
      )}

      <header className="mb-8">
        <h1 className="text-4xl font-bold tracking-tight">{post.title}</h1>
        <div className="mt-4 flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Link
              href={`/authors/${post.author.slug}`}
              className="hover:underline"
            >
              {post.author.name}
            </Link>
            <span>&middot;</span>
            <time dateTime={String(post.createdAt)}>
              {formatDate(post.createdAt)}
            </time>
          </div>
          <InteractionButtons
            postId={post.id}
            likeCount={post.likeCount}
            liked={post.liked}
            bookmarked={post.bookmarked}
          />
        </div>
        {post.tags.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-1.5">
            {post.tags.map((tag) => (
              <Link key={tag.id} href={`/?tag=${tag.slug}`}>
                <Badge variant="secondary" className="hover:bg-secondary/80">
                  {tag.name}
                </Badge>
              </Link>
            ))}
          </div>
        )}
      </header>

      <div
        className="prose prose-neutral dark:prose-invert max-w-none"
        dangerouslySetInnerHTML={{ __html: post.content }}
      />

      <CommentSection postId={post.id} postAuthorId={post.author.id} />
    </article>
  );
}
