import type { FastifyPluginAsync } from "fastify";
import { createCommentsRepository } from "../../modules/comments/comments.repository.js";
import { createCommentsService } from "../../modules/comments/comments.service.js";
import { createCommentsHandler } from "../../modules/comments/comments.handler.js";
import { createPostsRepository } from "../../modules/posts/posts.repository.js";
import {
  updateCommentSchema,
  deleteCommentSchema,
} from "../../modules/comments/comments.schema.js";

const commentsRoutes: FastifyPluginAsync = async (fastify) => {
  const commentsRepository = createCommentsRepository(fastify.db);
  const postsRepository = createPostsRepository(fastify.db);
  const commentsService = createCommentsService({
    commentsRepository,
    postsRepository,
    httpErrors: fastify.httpErrors,
  });

  const handler = createCommentsHandler({ commentsService });

  fastify.register(async (scope) => {
    scope.addHook("onRequest", fastify.authenticate);

    scope.put("/:id", { schema: updateCommentSchema }, handler.updateCommentHandler);
    scope.delete("/:id", { schema: deleteCommentSchema }, handler.deleteCommentHandler);
  });
};

export default commentsRoutes;
