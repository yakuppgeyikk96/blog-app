import { PutObjectCommand, type S3Client } from "@aws-sdk/client-s3";
import { randomUUID } from "node:crypto";
import { extname } from "node:path";

interface UploadsServiceDeps {
  s3: S3Client;
  s3Bucket: string;
  s3PublicEndpoint: string;
  httpErrors: {
    badRequest: (message: string) => Error;
  };
}

const ALLOWED_MIME_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
]);

const MIME_TO_EXT: Record<string, string> = {
  "image/jpeg": ".jpg",
  "image/png": ".png",
  "image/webp": ".webp",
  "image/gif": ".gif",
};

const MAX_FILE_SIZE = 5 * 1024 * 1024;

export function createUploadsService({
  s3,
  s3Bucket,
  s3PublicEndpoint,
  httpErrors,
}: UploadsServiceDeps) {
  return {
    async uploadImage(
      mimetype: string,
      filename: string,
      buffer: Buffer,
    ): Promise<{ url: string }> {
      if (!ALLOWED_MIME_TYPES.has(mimetype)) {
        throw httpErrors.badRequest(
          "Invalid file type. Allowed: jpeg, png, webp, gif",
        );
      }

      if (buffer.length > MAX_FILE_SIZE) {
        throw httpErrors.badRequest("File size exceeds 5MB limit");
      }

      const ext = MIME_TO_EXT[mimetype] ?? extname(filename);
      const key = `covers/${randomUUID()}${ext}`;

      await s3.send(
        new PutObjectCommand({
          Bucket: s3Bucket,
          Key: key,
          Body: buffer,
          ContentType: mimetype,
        }),
      );

      const url = `${s3PublicEndpoint}/${key}`;

      return { url };
    },
  };
}

export type UploadsService = ReturnType<typeof createUploadsService>;
