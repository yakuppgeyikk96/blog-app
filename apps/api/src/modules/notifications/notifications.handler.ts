import type { FastifyReply, FastifyRequest } from "fastify";
import type { NotificationsService } from "./notifications.service";
import type {
  ListQuerystringType,
  NotificationIdParamsType,
} from "./notifications.schema";
import {
  addConnection,
  removeConnection,
} from "./notifications.emitter";

export function createNotificationsHandler(
  notificationsService: NotificationsService,
) {
  return {
    async listHandler(
      request: FastifyRequest<{ Querystring: ListQuerystringType }>,
      reply: FastifyReply,
    ) {
      const { limit = 20, cursor } = request.query;
      const result = await notificationsService.list(
        request.user!.id,
        limit,
        cursor,
      );

      return reply.status(200).send({ success: true, data: result });
    },

    async unreadCountHandler(
      request: FastifyRequest,
      reply: FastifyReply,
    ) {
      const count = await notificationsService.getUnreadCount(
        request.user!.id,
      );

      return reply.status(200).send({ success: true, data: { count } });
    },

    async markAsReadHandler(
      request: FastifyRequest<{ Params: NotificationIdParamsType }>,
      reply: FastifyReply,
    ) {
      await notificationsService.markAsRead(
        request.params.id,
        request.user!.id,
      );

      return reply.status(200).send({ success: true });
    },

    async streamHandler(
      request: FastifyRequest,
      reply: FastifyReply,
    ) {
      const userId = request.user!.id;

      reply.raw.writeHead(200, {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      });

      // Send initial heartbeat
      reply.raw.write(": connected\n\n");

      addConnection(userId, reply);

      // Keep-alive ping every 30s
      const heartbeat = setInterval(() => {
        reply.raw.write(": ping\n\n");
      }, 30000);

      request.raw.on("close", () => {
        clearInterval(heartbeat);
        removeConnection(userId, reply);
      });
    },
  };
}
