import type { FastifyReply, FastifyRequest } from "fastify";
import type { AuthService } from "./auth.service.js";
import type { RegisterBodyType, LoginBodyType } from "./auth.schema.js";

const cookieOptions = {
  httpOnly: true,
  sameSite: "strict" as const,
  secure: process.env.NODE_ENV === "production",
  path: "/",
  maxAge: 7 * 24 * 60 * 60,
};

export function createAuthHandler(authService: AuthService) {
  return {
    async registerHandler(
      request: FastifyRequest<{ Body: RegisterBodyType }>,
      reply: FastifyReply,
    ) {
      const { user, token } = await authService.register(request.body);

      reply.setCookie("token", token, cookieOptions);

      return reply.status(201).send({ success: true, data: { user } });
    },

    async loginHandler(
      request: FastifyRequest<{ Body: LoginBodyType }>,
      reply: FastifyReply,
    ) {
      const { user, token } = await authService.login(request.body);

      reply.setCookie("token", token, cookieOptions);

      return reply.status(200).send({ success: true, data: { user } });
    },
  };
}
