import type { FastifyReply, FastifyRequest } from "fastify";
import type { PostsService } from "./posts.service";
import type {
  CreatePostBodyType,
  UpdatePostBodyType,
  PostIdParamsType,
  PostSlugParamsType,
  ListPostsQuerystringType,
} from "./posts.schema";

export function createPostsHandler(postsService: PostsService) {
  return {
    async createPostHandler(
      request: FastifyRequest<{ Body: CreatePostBodyType }>,
      reply: FastifyReply,
    ) {
      const post = await postsService.create(request.body, request.user!.id);

      return reply.status(201).send({ success: true, data: { post } });
    },

    async getPostHandler(
      request: FastifyRequest<{ Params: PostIdParamsType }>,
      reply: FastifyReply,
    ) {
      const post = await postsService.getById(
        request.params.id,
        request.user?.id,
      );

      return reply.status(200).send({ success: true, data: { post } });
    },

    async getPostBySlugHandler(
      request: FastifyRequest<{ Params: PostSlugParamsType }>,
      reply: FastifyReply,
    ) {
      const post = await postsService.getBySlug(
        request.params.slug,
        request.user?.id,
      );

      return reply.status(200).send({ success: true, data: { post } });
    },

    async listPostsHandler(
      request: FastifyRequest<{ Querystring: ListPostsQuerystringType }>,
      reply: FastifyReply,
    ) {
      const { page = 1, limit = 10, tag, q } = request.query;
      const result = await postsService.list(page, limit, request.user?.id, tag, q);

      return reply.status(200).send({ success: true, data: result });
    },

    async myPostsHandler(
      request: FastifyRequest<{ Querystring: ListPostsQuerystringType }>,
      reply: FastifyReply,
    ) {
      const { page = 1, limit = 10 } = request.query;
      const result = await postsService.listByAuthor(
        request.user!.id,
        page,
        limit,
      );

      return reply.status(200).send({ success: true, data: result });
    },

    async bookmarkedPostsHandler(
      request: FastifyRequest<{ Querystring: ListPostsQuerystringType }>,
      reply: FastifyReply,
    ) {
      const { page = 1, limit = 10 } = request.query;
      const result = await postsService.listBookmarked(
        request.user!.id,
        page,
        limit,
      );

      return reply.status(200).send({ success: true, data: result });
    },

    async updatePostHandler(
      request: FastifyRequest<{
        Params: PostIdParamsType;
        Body: UpdatePostBodyType;
      }>,
      reply: FastifyReply,
    ) {
      const post = await postsService.update(
        request.params.id,
        request.body,
        request.user!.id,
      );

      return reply.status(200).send({ success: true, data: { post } });
    },

    async deletePostHandler(
      request: FastifyRequest<{ Params: PostIdParamsType }>,
      reply: FastifyReply,
    ) {
      await postsService.delete(request.params.id, request.user!.id);

      return reply.status(200).send({ success: true });
    },
  };
}
