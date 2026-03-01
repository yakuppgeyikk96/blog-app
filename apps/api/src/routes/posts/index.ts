import type { FastifyPluginAsync } from "fastify";
import { createPostsRepository } from "../../modules/posts/posts.repository.js";
import { createPostsService } from "../../modules/posts/posts.service.js";
import { createPostsHandler } from "../../modules/posts/posts.handler.js";
import {
  createPostSchema,
  getPostSchema,
  listPostsSchema,
  updatePostSchema,
  deletePostSchema,
} from "../../modules/posts/posts.schema.js";

const postsRoutes: FastifyPluginAsync = async (fastify) => {
  const postsRepository = createPostsRepository(fastify.db);

  const postsService = createPostsService({
    postsRepository,
    httpErrors: fastify.httpErrors,
  });

  const handler = createPostsHandler(postsService);

  // Public routes
  fastify.get("/", { schema: listPostsSchema }, handler.listPostsHandler);
  fastify.get("/:id", { schema: getPostSchema }, handler.getPostHandler);

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
