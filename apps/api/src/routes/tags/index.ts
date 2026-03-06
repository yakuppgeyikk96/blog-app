import type { FastifyPluginAsync } from "fastify";
import { createTagsRepository } from "../../modules/tags/tags.repository.js";
import { createTagsService } from "../../modules/tags/tags.service.js";
import { createTagsHandler } from "../../modules/tags/tags.handler.js";
import { listTagsSchema } from "../../modules/tags/tags.schema.js";

const tagsRoutes: FastifyPluginAsync = async (fastify) => {
  const tagsRepository = createTagsRepository(fastify.db);
  const tagsService = createTagsService({ tagsRepository });
  const handler = createTagsHandler(tagsService);

  fastify.get("/", { schema: listTagsSchema }, handler.listTagsHandler);
};

export default tagsRoutes;
