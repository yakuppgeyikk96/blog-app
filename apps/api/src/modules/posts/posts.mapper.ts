import type { PostWithAuthor } from "./posts.repository";
import type { PostResponseDto, PostListItemDto } from "./posts.types";
import type { TagDto } from "@repo/shared-types";

interface InteractionData {
  likeCount: number;
  liked: boolean;
  bookmarked: boolean;
  commentCount: number;
}

const DEFAULT_INTERACTION: InteractionData = {
  likeCount: 0,
  liked: false,
  bookmarked: false,
  commentCount: 0,
};

export function toPostResponseDto(
  post: PostWithAuthor,
  tags: TagDto[] = [],
  interaction: InteractionData = DEFAULT_INTERACTION,
): PostResponseDto {
  return {
    id: post.id,
    title: post.title,
    slug: post.slug,
    summary: post.summary,
    content: post.content,
    coverImage: post.coverImage,
    published: post.published,
    author: {
      id: post.authorId,
      name: post.authorName,
      slug: post.authorSlug ?? "",
      avatar: post.authorAvatar,
    },
    tags,
    likeCount: interaction.likeCount,
    liked: interaction.liked,
    bookmarked: interaction.bookmarked,
    commentCount: interaction.commentCount,
    createdAt: post.createdAt,
    updatedAt: post.updatedAt,
  };
}

export function toPostListItemDto(
  post: PostWithAuthor,
  tags: TagDto[] = [],
  interaction: InteractionData = DEFAULT_INTERACTION,
): PostListItemDto {
  return {
    id: post.id,
    title: post.title,
    slug: post.slug,
    summary: post.summary,
    coverImage: post.coverImage,
    published: post.published,
    author: {
      id: post.authorId,
      name: post.authorName,
      slug: post.authorSlug ?? "",
      avatar: post.authorAvatar,
    },
    tags,
    likeCount: interaction.likeCount,
    liked: interaction.liked,
    bookmarked: interaction.bookmarked,
    commentCount: interaction.commentCount,
    createdAt: post.createdAt,
    updatedAt: post.updatedAt,
  };
}
