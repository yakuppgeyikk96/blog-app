import type { NotificationsRepository } from "./notifications.repository";
import type { NotificationDto, NotificationType } from "@repo/shared-types";
import { toNotificationDto } from "./notifications.mapper";
import { broadcast } from "./notifications.emitter";

interface NotificationsServiceDeps {
  notificationsRepository: NotificationsRepository;
}

interface NotifyInput {
  recipientId: string;
  actorId: string;
  type: NotificationType;
  postId?: string;
  commentId?: string;
}

export function createNotificationsService({
  notificationsRepository,
}: NotificationsServiceDeps) {
  return {
    async notify(input: NotifyInput): Promise<void> {
      // Don't notify yourself
      if (input.actorId === input.recipientId) return;

      const notification = await notificationsRepository.create({
        recipientId: input.recipientId,
        actorId: input.actorId,
        type: input.type,
        postId: input.postId ?? null,
        commentId: input.commentId ?? null,
      });

      const dto = toNotificationDto(notification);
      broadcast(input.recipientId, dto);
    },

    async list(
      recipientId: string,
      limit = 20,
      cursor?: string,
    ): Promise<{ items: NotificationDto[]; hasMore: boolean }> {
      const { items, hasMore } = await notificationsRepository.findByRecipient(
        recipientId,
        limit,
        cursor,
      );

      return {
        items: items.map(toNotificationDto),
        hasMore,
      };
    },

    async getUnreadCount(recipientId: string): Promise<number> {
      return notificationsRepository.getUnreadCount(recipientId);
    },

    async markAsRead(
      notificationId: string,
      recipientId: string,
    ): Promise<boolean> {
      return notificationsRepository.markAsRead(notificationId, recipientId);
    },
  };
}

export type NotificationsService = ReturnType<
  typeof createNotificationsService
>;
