import type { CommentsRepository } from "./comments.repository";
import type { PostsRepository } from "../posts/posts.repository";
import type {
  CommentDto,
  CommentWithRepliesDto,
  CreateCommentInput,
} from "@repo/shared-types";
import { toCommentDto, toThreadedComments } from "./comments.mapper";
import { sanitizeContent } from "../../common/sanitize";

interface CommentsServiceDeps {
  commentsRepository: CommentsRepository;
  postsRepository: PostsRepository;
  httpErrors: {
    notFound: (message: string) => Error;
    forbidden: (message: string) => Error;
    badRequest: (message: string) => Error;
  };
}

const MAX_CONTENT_LENGTH = 2000;

export function createCommentsService({
  commentsRepository,
  postsRepository,
  httpErrors,
}: CommentsServiceDeps) {
  return {
    async createComment(
      postId: string,
      userId: string,
      input: CreateCommentInput,
    ): Promise<CommentDto> {
      const post = await postsRepository.findById(postId);
      if (!post || !post.published) {
        throw httpErrors.notFound("Post not found");
      }

      if (input.content.length > MAX_CONTENT_LENGTH) {
        throw httpErrors.badRequest(
          `Comment must be ${MAX_CONTENT_LENGTH} characters or less`,
        );
      }

      if (input.parentId) {
        const parent = await commentsRepository.findById(input.parentId);
        if (!parent || parent.postId !== postId) {
          throw httpErrors.badRequest("Invalid parent comment");
        }
        if (parent.parentId !== null) {
          throw httpErrors.badRequest("Cannot reply to a reply");
        }
      }

      const comment = await commentsRepository.create({
        postId,
        authorId: userId,
        parentId: input.parentId ?? null,
        content: sanitizeContent(input.content),
      });

      return toCommentDto(comment);
    },

    async listByPost(
      postId: string,
    ): Promise<{ comments: CommentWithRepliesDto[]; total: number }> {
      const [rows, total] = await Promise.all([
        commentsRepository.findByPostId(postId),
        commentsRepository.countByPostId(postId),
      ]);

      return {
        comments: toThreadedComments(rows),
        total,
      };
    },

    async updateComment(
      commentId: string,
      userId: string,
      content: string,
    ): Promise<CommentDto> {
      const existing = await commentsRepository.findById(commentId);
      if (!existing) {
        throw httpErrors.notFound("Comment not found");
      }

      if (existing.authorId !== userId) {
        throw httpErrors.forbidden("You can only edit your own comments");
      }

      if (content.length > MAX_CONTENT_LENGTH) {
        throw httpErrors.badRequest(
          `Comment must be ${MAX_CONTENT_LENGTH} characters or less`,
        );
      }

      const updated = await commentsRepository.update(
        commentId,
        sanitizeContent(content),
      );
      if (!updated) {
        throw httpErrors.notFound("Comment not found");
      }

      return toCommentDto(updated);
    },

    async deleteComment(
      commentId: string,
      userId: string,
    ): Promise<void> {
      const existing = await commentsRepository.findById(commentId);
      if (!existing) {
        throw httpErrors.notFound("Comment not found");
      }

      const isAuthor = existing.authorId === userId;
      const post = await postsRepository.findById(existing.postId);
      const isPostAuthor = post?.authorId === userId;

      if (!isAuthor && !isPostAuthor) {
        throw httpErrors.forbidden("You cannot delete this comment");
      }

      await commentsRepository.delete(commentId);
    },

    async getCommentCounts(
      postIds: string[],
    ): Promise<Map<string, number>> {
      return commentsRepository.countByPostIds(postIds);
    },
  };
}

export type CommentsService = ReturnType<typeof createCommentsService>;
