import type { FastifyReply, FastifyRequest } from "fastify";
import type { CommentsService } from "./comments.service";
import type {
  PostIdParamsType,
  CommentIdParamsType,
  CreateCommentBodyType,
  UpdateCommentBodyType,
} from "./comments.schema";

export function createCommentsHandler(commentsService: CommentsService) {
  return {
    async listCommentsHandler(
      request: FastifyRequest<{ Params: PostIdParamsType }>,
      reply: FastifyReply,
    ) {
      const result = await commentsService.listByPost(request.params.id);

      return reply.status(200).send({ success: true, data: result });
    },

    async createCommentHandler(
      request: FastifyRequest<{
        Params: PostIdParamsType;
        Body: CreateCommentBodyType;
      }>,
      reply: FastifyReply,
    ) {
      const comment = await commentsService.createComment(
        request.params.id,
        request.user!.id,
        request.body,
      );

      return reply.status(201).send({ success: true, data: { comment } });
    },

    async updateCommentHandler(
      request: FastifyRequest<{
        Params: CommentIdParamsType;
        Body: UpdateCommentBodyType;
      }>,
      reply: FastifyReply,
    ) {
      const comment = await commentsService.updateComment(
        request.params.id,
        request.user!.id,
        request.body.content,
      );

      return reply.status(200).send({ success: true, data: { comment } });
    },

    async deleteCommentHandler(
      request: FastifyRequest<{ Params: CommentIdParamsType }>,
      reply: FastifyReply,
    ) {
      await commentsService.deleteComment(
        request.params.id,
        request.user!.id,
      );

      return reply.status(200).send({ success: true });
    },
  };
}
