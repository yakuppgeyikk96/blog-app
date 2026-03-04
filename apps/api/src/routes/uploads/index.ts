import type { FastifyPluginAsync } from "fastify";
import { createUploadsService } from "../../modules/uploads/uploads.service.js";
import { createUploadsHandler } from "../../modules/uploads/uploads.handler.js";
import { uploadImageSchema } from "../../modules/uploads/uploads.schema.js";

const uploadsRoutes: FastifyPluginAsync = async (fastify) => {
  const uploadsService = createUploadsService({
    s3: fastify.s3,
    s3Bucket: fastify.s3Bucket,
    s3PublicEndpoint: fastify.s3PublicEndpoint,
    httpErrors: fastify.httpErrors,
  });

  const handler = createUploadsHandler(uploadsService);

  fastify.register(async (scope) => {
    scope.addHook("onRequest", fastify.authenticate);

    scope.post("/image", { schema: uploadImageSchema }, handler.uploadImageHandler);
  });
};

export default uploadsRoutes;
