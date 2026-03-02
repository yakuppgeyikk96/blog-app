import type { FastifyPluginAsync } from "fastify";
import { createAuthRepository } from "../../modules/auth/auth.repository.js";
import { createAuthService } from "../../modules/auth/auth.service.js";
import { createAuthHandler } from "../../modules/auth/auth.handler.js";
import { registerSchema, loginSchema, logoutSchema, meSchema } from "../../modules/auth/auth.schema.js";

const authRoutes: FastifyPluginAsync = async (fastify) => {
  const authRepository = createAuthRepository(fastify.db);

  const authService = createAuthService({
    authRepository,
    jwtSign: (payload) => fastify.jwt.sign(payload),
    httpErrors: fastify.httpErrors,
  });

  const handler = createAuthHandler(authService);

  fastify.post("/register", { schema: registerSchema }, handler.registerHandler);
  fastify.post("/login", { schema: loginSchema }, handler.loginHandler);
  fastify.post("/logout", { schema: logoutSchema }, handler.logoutHandler);

  fastify.get("/me", {
    schema: meSchema,
    preHandler: [fastify.authenticate],
  }, handler.meHandler);
};

export default authRoutes;
