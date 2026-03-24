import type { FastifyPluginAsync } from "fastify";
import { createUsersRepository } from "../../modules/users/users.repository.js";
import { createUsersService } from "../../modules/users/users.service.js";
import { createUsersHandler } from "../../modules/users/users.handler.js";
import { createUploadsService } from "../../modules/uploads/uploads.service.js";
import {
  getProfileSchema,
  updateProfileSchema,
  uploadAvatarSchema,
  getAuthorProfileSchema,
} from "../../modules/users/users.schema.js";

const usersRoutes: FastifyPluginAsync = async (fastify) => {
  const usersRepository = createUsersRepository(fastify.db);
  const uploadsService = createUploadsService({
    s3: fastify.s3,
    s3Bucket: fastify.s3Bucket,
    s3PublicEndpoint: fastify.s3PublicEndpoint,
    httpErrors: fastify.httpErrors,
  });

  const usersService = createUsersService({
    usersRepository,
    uploadsService,
    httpErrors: fastify.httpErrors,
  });

  const handler = createUsersHandler(usersService);

  // Public routes
  fastify.get(
    "/:slug",
    { schema: getAuthorProfileSchema },
    handler.getAuthorProfileHandler,
  );

  // Protected routes
  fastify.register(async (scope) => {
    scope.addHook("onRequest", fastify.authenticate);

    scope.get("/profile", { schema: getProfileSchema }, handler.getProfileHandler);
    scope.put("/profile", { schema: updateProfileSchema }, handler.updateProfileHandler);
    scope.post("/avatar", { schema: uploadAvatarSchema }, handler.uploadAvatarHandler);
  });
};

export default usersRoutes;
