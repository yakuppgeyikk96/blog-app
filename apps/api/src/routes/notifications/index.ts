import type { FastifyPluginAsync } from "fastify";
import { createNotificationsRepository } from "../../modules/notifications/notifications.repository.js";
import { createNotificationsService } from "../../modules/notifications/notifications.service.js";
import { createNotificationsHandler } from "../../modules/notifications/notifications.handler.js";
import {
  listNotificationsSchema,
  unreadCountSchema,
  markAsReadSchema,
} from "../../modules/notifications/notifications.schema.js";

const notificationsRoutes: FastifyPluginAsync = async (fastify) => {
  const notificationsRepository = createNotificationsRepository(fastify.db);
  const notificationsService = createNotificationsService({
    notificationsRepository,
  });

  const handler = createNotificationsHandler(notificationsService);

  fastify.register(async (scope) => {
    scope.addHook("onRequest", fastify.authenticate);

    scope.get("/", { schema: listNotificationsSchema }, handler.listHandler);
    scope.get("/unread-count", { schema: unreadCountSchema }, handler.unreadCountHandler);
    scope.get("/stream", handler.streamHandler);
    scope.put("/:id/read", { schema: markAsReadSchema }, handler.markAsReadHandler);
  });
};

export default notificationsRoutes;
