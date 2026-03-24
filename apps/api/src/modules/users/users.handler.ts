import type { FastifyReply, FastifyRequest } from "fastify";
import type { UsersService } from "./users.service";
import type {
  UpdateProfileBodyType,
  AuthorSlugParamsType,
} from "./users.schema";

export function createUsersHandler(usersService: UsersService) {
  return {
    async getProfileHandler(
      request: FastifyRequest,
      reply: FastifyReply,
    ) {
      const user = await usersService.getProfile(request.user!.id);

      return reply.status(200).send({ success: true, data: { user } });
    },

    async updateProfileHandler(
      request: FastifyRequest<{ Body: UpdateProfileBodyType }>,
      reply: FastifyReply,
    ) {
      const user = await usersService.updateProfile(
        request.user!.id,
        request.body,
      );

      return reply.status(200).send({ success: true, data: { user } });
    },

    async uploadAvatarHandler(
      request: FastifyRequest,
      reply: FastifyReply,
    ) {
      const file = await request.file();
      if (!file) {
        return reply.status(400).send({
          success: false,
          message: "No file uploaded",
        });
      }

      const buffer = await file.toBuffer();
      const user = await usersService.uploadAvatar(
        request.user!.id,
        file.mimetype,
        file.filename,
        buffer,
      );

      return reply.status(200).send({ success: true, data: { user } });
    },

    async getAuthorProfileHandler(
      request: FastifyRequest<{ Params: AuthorSlugParamsType }>,
      reply: FastifyReply,
    ) {
      const author = await usersService.getAuthorProfile(request.params.slug);

      return reply.status(200).send({ success: true, data: { author } });
    },
  };
}
