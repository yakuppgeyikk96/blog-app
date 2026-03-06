import type { FastifyPluginAsync } from "fastify";
import { createPostsRepository } from "../../modules/posts/posts.repository.js";
import { createPostsService } from "../../modules/posts/posts.service.js";
import { createPostsHandler } from "../../modules/posts/posts.handler.js";
import {
  createPostSchema,
  getPostSchema,
  getPostBySlugSchema,
  listPostsSchema,
  updatePostSchema,
  deletePostSchema,
} from "../../modules/posts/posts.schema.js";
import { createTagsRepository } from "../../modules/tags/tags.repository.js";
import { createTagsService } from "../../modules/tags/tags.service.js";

const postsRoutes: FastifyPluginAsync = async (fastify) => {
  const postsRepository = createPostsRepository(fastify.db);
  const tagsRepository = createTagsRepository(fastify.db);
  const tagsService = createTagsService({ tagsRepository });

  const postsService = createPostsService({
    postsRepository,
    tagsService,
    httpErrors: fastify.httpErrors,
  });

  const handler = createPostsHandler(postsService);

  // Public routes
  fastify.get("/", { schema: listPostsSchema }, handler.listPostsHandler);
  fastify.route({
    method: "GET",
    url: "/by-slug/:slug",
    schema: getPostBySlugSchema,
    onRequest: [fastify.optionalAuthenticate],
    handler: handler.getPostBySlugHandler,
  });
  fastify.route({
    method: "GET",
    url: "/:id",
    schema: getPostSchema,
    onRequest: [fastify.optionalAuthenticate],
    handler: handler.getPostHandler,
  });

  // Protected routes
  fastify.register(async (scope) => {
    scope.addHook("onRequest", fastify.authenticate);

    scope.get("/me", { schema: listPostsSchema }, handler.myPostsHandler);
    scope.post("/", { schema: createPostSchema }, handler.createPostHandler);
    scope.put("/:id", { schema: updatePostSchema }, handler.updatePostHandler);
    scope.delete(
      "/:id",
      { schema: deletePostSchema },
      handler.deletePostHandler,
    );
  });
};

export default postsRoutes;
