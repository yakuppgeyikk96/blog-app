import type { FastifyReply, FastifyRequest } from "fastify";
import type { UploadsService } from "./uploads.service";

export function createUploadsHandler(uploadsService: UploadsService) {
  return {
    async uploadImageHandler(
      request: FastifyRequest,
      reply: FastifyReply,
    ) {
      const file = await request.file();

      if (!file) {
        return reply
          .status(400)
          .send({ success: false, message: "No file provided" });
      }

      const buffer = await file.toBuffer();
      const result = await uploadsService.uploadImage(
        file.mimetype,
        file.filename,
        buffer,
      );

      return reply.status(201).send({ success: true, data: result });
    },
  };
}
