import type { FastifyReply, FastifyRequest } from "fastify";
import type { InteractionsService } from "./interactions.service";
import type { PostIdParamsType } from "./interactions.schema";

interface InteractionsHandlerDeps {
  interactionsService: InteractionsService;
  onLike?: (userId: string, postId: string, liked: boolean) => Promise<void>;
}

export function createInteractionsHandler({
  interactionsService,
  onLike,
}: InteractionsHandlerDeps) {
  return {
    async toggleLikeHandler(
      request: FastifyRequest<{ Params: PostIdParamsType }>,
      reply: FastifyReply,
    ) {
      const result = await interactionsService.toggleLike(
        request.user!.id,
        request.params.id,
      );

      // Fire notification asynchronously — don't block the response
      if (result.liked && onLike) {
        onLike(request.user!.id, request.params.id, result.liked).catch(
          () => {},
        );
      }

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
      const ip = (request.headers["x-forwarded-for"] as string) ?? request.ip;
      await interactionsService.recordView(request.params.id, ip);

      return reply.status(200).send({ success: true });
    },
  };
}
