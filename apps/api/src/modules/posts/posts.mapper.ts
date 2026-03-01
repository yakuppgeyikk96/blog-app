import type { PostWithAuthor } from "./posts.repository";
import type { PostResponseDto, PostListItemDto } from "./posts.types";

export function toPostResponseDto(post: PostWithAuthor): PostResponseDto {
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
    },
    createdAt: post.createdAt,
    updatedAt: post.updatedAt,
  };
}

export function toPostListItemDto(post: PostWithAuthor): PostListItemDto {
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
    },
    createdAt: post.createdAt,
    updatedAt: post.updatedAt,
  };
}
