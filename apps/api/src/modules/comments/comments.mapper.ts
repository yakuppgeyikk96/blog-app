import type { CommentWithAuthor } from "./comments.repository";
import type { CommentDto, CommentWithRepliesDto } from "@repo/shared-types";

export function toCommentDto(comment: CommentWithAuthor): CommentDto {
  return {
    id: comment.id,
    content: comment.content,
    author: {
      id: comment.authorId,
      name: comment.authorName,
      slug: comment.authorSlug ?? "",
      avatar: comment.authorAvatar,
    },
    parentId: comment.parentId,
    createdAt: comment.createdAt,
    updatedAt: comment.updatedAt,
  };
}

export function toThreadedComments(
  comments: CommentWithAuthor[],
): CommentWithRepliesDto[] {
  const topLevel: CommentWithRepliesDto[] = [];
  const repliesByParent = new Map<string, CommentDto[]>();

  for (const comment of comments) {
    if (comment.parentId) {
      const replies = repliesByParent.get(comment.parentId) ?? [];
      replies.push(toCommentDto(comment));
      repliesByParent.set(comment.parentId, replies);
    } else {
      topLevel.push({ ...toCommentDto(comment), replies: [] });
    }
  }

  for (const comment of topLevel) {
    comment.replies = repliesByParent.get(comment.id) ?? [];
  }

  return topLevel;
}
