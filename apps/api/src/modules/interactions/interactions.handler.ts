import type { FastifyReply, FastifyRequest } from "fastify";
import type { InteractionsService } from "./interactions.service";
import type { PostIdParamsType } from "./interactions.schema";

export function createInteractionsHandler(
  interactionsService: InteractionsService,
) {
  return {
    async toggleLikeHandler(
      request: FastifyRequest<{ Params: PostIdParamsType }>,
      reply: FastifyReply,
    ) {
      const result = await interactionsService.toggleLike(
        request.user!.id,
        request.params.id,
      );

      return reply.status(200).send({ success: true, data: result });
    },

    async toggleBookmarkHandler(
      request: FastifyRequest<{ Params: PostIdParamsType }>,
      reply: FastifyReply,
    ) {
      const result = await interactionsService.toggleBookmark(
        request.user!.id,
        request.params.id,
      );

      return reply.status(200).send({ success: true, data: result });
    },

    async recordViewHandler(
      request: FastifyRequest<{ Params: PostIdParamsType }>,
      reply: FastifyReply,
    ) {
      const ip = request.headers["x-forwarded-for"] as string ?? request.ip;
      await interactionsService.recordView(request.params.id, ip);

      return reply.status(200).send({ success: true });
    },
  };
}
