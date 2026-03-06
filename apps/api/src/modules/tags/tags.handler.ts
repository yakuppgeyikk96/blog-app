import type { FastifyReply, FastifyRequest } from "fastify";
import type { TagsService } from "./tags.service";

export function createTagsHandler(tagsService: TagsService) {
  return {
    async listTagsHandler(
      _request: FastifyRequest,
      reply: FastifyReply,
    ) {
      const tags = await tagsService.list();

      return reply.status(200).send({ success: true, data: { tags } });
    },
  };
}
