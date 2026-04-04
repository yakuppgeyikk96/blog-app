import type { NotificationWithDetails } from "./notifications.repository";
import type { NotificationDto } from "@repo/shared-types";

export function toNotificationDto(
  n: NotificationWithDetails,
): NotificationDto {
  return {
    id: n.id,
    type: n.type as NotificationDto["type"],
    actor: {
      id: n.actorId,
      name: n.actorName,
      avatar: n.actorAvatar,
      slug: n.actorSlug ?? "",
    },
    post:
      n.postId && n.postTitle && n.postSlug
        ? { id: n.postId, title: n.postTitle, slug: n.postSlug }
        : null,
    read: n.read,
    createdAt: n.createdAt,
  };
}
