import type { FastifyPluginAsync } from "fastify";
import { createPostsRepository } from "../../modules/posts/posts.repository.js";
import { createPostsService } from "../../modules/posts/posts.service.js";
import { createPostsHandler } from "../../modules/posts/posts.handler.js";
import {
  createPostSchema,
  getPostSchema,
  getPostBySlugSchema,
  listPostsSchema,
  popularPostsSchema,
  updatePostSchema,
  deletePostSchema,
} from "../../modules/posts/posts.schema.js";
import { createTagsRepository } from "../../modules/tags/tags.repository.js";
import { createTagsService } from "../../modules/tags/tags.service.js";
import { createInteractionsRepository } from "../../modules/interactions/interactions.repository.js";
import { createInteractionsService } from "../../modules/interactions/interactions.service.js";
import { createInteractionsHandler } from "../../modules/interactions/interactions.handler.js";
import {
  toggleLikeSchema,
  toggleBookmarkSchema,
  recordViewSchema,
} from "../../modules/interactions/interactions.schema.js";
import { createCommentsRepository } from "../../modules/comments/comments.repository.js";
import { createCommentsService } from "../../modules/comments/comments.service.js";
import { createCommentsHandler } from "../../modules/comments/comments.handler.js";
import {
  listCommentsSchema,
  createCommentSchema,
} from "../../modules/comments/comments.schema.js";

const postsRoutes: FastifyPluginAsync = async (fastify) => {
  const postsRepository = createPostsRepository(fastify.db);
  const tagsRepository = createTagsRepository(fastify.db);
  const tagsService = createTagsService({ tagsRepository });
  const interactionsRepository = createInteractionsRepository(fastify.db);
  const interactionsService = createInteractionsService({
    interactionsRepository,
  });

  const commentsRepository = createCommentsRepository(fastify.db);
  const commentsService = createCommentsService({
    commentsRepository,
    postsRepository,
    httpErrors: fastify.httpErrors,
  });

  const postsService = createPostsService({
    postsRepository,
    tagsService,
    interactionsService,
    commentsService,
    httpErrors: fastify.httpErrors,
  });

  const handler = createPostsHandler(postsService);
  const interactionsHandler = createInteractionsHandler(interactionsService);
  const commentsHandler = createCommentsHandler(commentsService);

  // Public routes
  fastify.get(
    "/:id/comments",
    { schema: listCommentsSchema },
    commentsHandler.listCommentsHandler,
  );
  fastify.post(
    "/:id/view",
    { schema: recordViewSchema },
    interactionsHandler.recordViewHandler,
  );

  fastify.route({
    method: "GET",
    url: "/popular",
    schema: popularPostsSchema,
    onRequest: [fastify.optionalAuthenticate],
    handler: handler.popularPostsHandler,
  });

  // Public routes (with optional auth for like/bookmark status)
  fastify.route({
    method: "GET",
    url: "/",
    schema: listPostsSchema,
    onRequest: [fastify.optionalAuthenticate],
    handler: handler.listPostsHandler,
  });
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
    scope.get("/bookmarks", { schema: listPostsSchema }, handler.bookmarkedPostsHandler);
    scope.post("/", { schema: createPostSchema }, handler.createPostHandler);
    scope.put("/:id", { schema: updatePostSchema }, handler.updatePostHandler);
    scope.delete(
      "/:id",
      { schema: deletePostSchema },
      handler.deletePostHandler,
    );

    scope.post(
      "/:id/comments",
      { schema: createCommentSchema },
      commentsHandler.createCommentHandler,
    );
    scope.post(
      "/:id/like",
      { schema: toggleLikeSchema },
      interactionsHandler.toggleLikeHandler,
    );
    scope.post(
      "/:id/bookmark",
      { schema: toggleBookmarkSchema },
      interactionsHandler.toggleBookmarkHandler,
    );
  });
};

export default postsRoutes;
