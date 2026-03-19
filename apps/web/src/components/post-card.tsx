import Link from "next/link";
import type { PostListItemDto } from "@repo/shared-types";
import { formatDate } from "@/lib/format";
import { Badge } from "@/components/ui/badge";
import { BlurImage } from "@/components/blur-image";

interface PostCardProps {
  post: PostListItemDto;
}

export function PostCard({ post }: PostCardProps) {
  return (
    <Link
      href={`/posts/${post.slug}`}
      className="group block overflow-hidden rounded-lg border bg-card transition-colors hover:border-foreground/20"
    >
      {post.coverImage && (
        <div className="relative overflow-hidden">
          <BlurImage
            src={post.coverImage}
            alt={post.title}
            width={384}
            height={216}
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 384px, 384px"
            className="aspect-video w-full object-cover"
          />
        </div>
      )}
      <div className="p-4">
        <h2 className="line-clamp-2 text-lg font-semibold group-hover:underline">
          {post.title}
        </h2>
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
        <div className="mt-3 flex items-center gap-2 text-xs text-muted-foreground">
          <span>{post.author.name}</span>
          <span>&middot;</span>
          <span>{formatDate(post.createdAt)}</span>
        </div>
      </div>
    </Link>
  );
}
