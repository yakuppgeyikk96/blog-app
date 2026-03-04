import fp from "fastify-plugin";
import { S3Client } from "@aws-sdk/client-s3";
import multipart from "@fastify/multipart";

export default fp(async (fastify) => {
  const s3 = new S3Client({
    endpoint: process.env.S3_ENDPOINT,
    region: process.env.S3_REGION ?? "us-east-1",
    credentials: {
      accessKeyId: process.env.S3_ACCESS_KEY!,
      secretAccessKey: process.env.S3_SECRET_KEY!,
    },
    forcePathStyle: true,
  });

  const bucket = process.env.S3_BUCKET ?? "blog-uploads";
  const publicEndpoint =
    process.env.S3_PUBLIC_ENDPOINT ?? process.env.S3_ENDPOINT!;

  await fastify.register(multipart, {
    limits: { fileSize: 5 * 1024 * 1024 },
  });

  fastify.decorate("s3", s3);
  fastify.decorate("s3Bucket", bucket);
  fastify.decorate("s3PublicEndpoint", publicEndpoint);
});

declare module "fastify" {
  interface FastifyInstance {
    s3: S3Client;
    s3Bucket: string;
    s3PublicEndpoint: string;
  }
}
