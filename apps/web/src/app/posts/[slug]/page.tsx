import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { fetchPostBySlug } from "@/app/actions";
import { formatDate } from "@/lib/format";
import { Badge } from "@/components/ui/badge";

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
          <Image
            src={post.coverImage}
            alt={post.title}
            fill
            className="object-cover"
            priority
            unoptimized
          />
        </div>
      )}

      <header className="mb-8">
        <h1 className="text-4xl font-bold tracking-tight">{post.title}</h1>
        <div className="mt-4 flex items-center gap-2 text-sm text-muted-foreground">
          <span>{post.author.name}</span>
          <span>&middot;</span>
          <time dateTime={String(post.createdAt)}>
            {formatDate(post.createdAt)}
          </time>
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
    </article>
  );
}
