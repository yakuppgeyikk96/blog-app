import fp from "fastify-plugin";
import type { FastifyReply, FastifyRequest } from "fastify";
import { eq } from "drizzle-orm";
import { users } from "../db/schema/index";

export default fp(async (fastify) => {
  fastify.decorate(
    "authenticate",
    async function (request: FastifyRequest, _reply: FastifyReply) {
      try {
        const payload = await request.jwtVerify<{ sub: string }>();

        const result = await fastify.db
          .select({
            id: users.id,
            email: users.email,
            name: users.name,
          })
          .from(users)
          .where(eq(users.id, payload.sub));

        const user = result[0];
        if (!user) {
          throw fastify.httpErrors.unauthorized("User not found");
        }

        request.user = user;
      } catch {
        throw fastify.httpErrors.unauthorized("Authentication required");
      }
    },
  );
});

declare module "@fastify/jwt" {
  interface FastifyJWT {
    user: {
      id: string;
      email: string;
      name: string;
    };
  }
}

declare module "fastify" {
  interface FastifyInstance {
    authenticate: (
      request: FastifyRequest,
      reply: FastifyReply,
    ) => Promise<void>;
  }
}
