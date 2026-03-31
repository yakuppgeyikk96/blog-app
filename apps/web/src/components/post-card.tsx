import Link from "next/link";
import { MessageSquare } from "lucide-react";
import type { PostListItemDto } from "@repo/shared-types";
import { formatDate } from "@/lib/format";
import { Badge } from "@/components/ui/badge";
import { BlurImage } from "@/components/blur-image";
import { InteractionButtons } from "@/components/interaction-buttons";

interface PostCardProps {
  post: PostListItemDto;
}

export function PostCard({ post }: PostCardProps) {
  return (
    <article className="group overflow-hidden rounded-lg border bg-card transition-colors hover:border-foreground/20">
      {post.coverImage && (
        <Link
          href={`/posts/${post.slug}`}
          className="relative block overflow-hidden"
        >
          <BlurImage
            src={post.coverImage}
            alt={post.title}
            width={600}
            height={340}
            className="aspect-video w-full object-cover"
          />
        </Link>
      )}
      <div className="p-4">
        <Link href={`/posts/${post.slug}`}>
          <h2 className="line-clamp-2 text-lg font-semibold group-hover:underline">
            {post.title}
          </h2>
        </Link>
        <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
          {post.summary ?? "No summary available"}
        </p>
        {post.tags.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1.5">
            {post.tags.map((tag) => (
              <Badge key={tag.id} variant="secondary" className="text-xs">
                {tag.name}
              </Badge>
            ))}
          </div>
        )}
        <div className="mt-3 flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Link
              href={`/authors/${post.author.slug}`}
              className="hover:underline"
            >
              {post.author.name}
            </Link>
            <span>&middot;</span>
            <span>{formatDate(post.createdAt)}</span>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href={`/posts/${post.slug}#comments`}
              className="flex items-center gap-1 text-muted-foreground hover:text-foreground"
            >
              <MessageSquare className="size-3.5" />
              <span className="text-xs">{post.commentCount}</span>
            </Link>
            <InteractionButtons
              postId={post.id}
              likeCount={post.likeCount}
              liked={post.liked}
              bookmarked={post.bookmarked}
            />
          </div>
        </div>
      </div>
    </article>
  );
}
