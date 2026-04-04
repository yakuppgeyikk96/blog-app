import type { FastifyReply } from "fastify";
import type { NotificationDto } from "@repo/shared-types";

const connections = new Map<string, Set<FastifyReply>>();

export function addConnection(userId: string, reply: FastifyReply): void {
  if (!connections.has(userId)) {
    connections.set(userId, new Set());
  }
  connections.get(userId)!.add(reply);
}

export function removeConnection(userId: string, reply: FastifyReply): void {
  const userConnections = connections.get(userId);
  if (!userConnections) return;

  userConnections.delete(reply);
  if (userConnections.size === 0) {
    connections.delete(userId);
  }
}

export function broadcast(
  userId: string,
  notification: NotificationDto,
): void {
  const userConnections = connections.get(userId);
  if (!userConnections) return;

  const data = `data: ${JSON.stringify(notification)}\n\n`;
  for (const reply of userConnections) {
    reply.raw.write(data);
  }
}
