import { and, count, desc, eq, lt } from "drizzle-orm";
import type { DbType } from "../../db/connection";
import { notifications } from "../../db/schema/index";
import { users } from "../../db/schema/index";
import { posts } from "../../db/schema/index";

export type Notification = typeof notifications.$inferSelect;
export type NewNotification = typeof notifications.$inferInsert;

export interface NotificationWithDetails {
  id: string;
  type: string;
  recipientId: string;
  read: boolean;
  createdAt: Date;
  actorId: string;
  actorName: string;
  actorAvatar: string | null;
  actorSlug: string | null;
  postId: string | null;
  postTitle: string | null;
  postSlug: string | null;
}

const notificationColumns = {
  id: notifications.id,
  type: notifications.type,
  recipientId: notifications.recipientId,
  read: notifications.read,
  createdAt: notifications.createdAt,
  actorId: notifications.actorId,
  actorName: users.name,
  actorAvatar: users.avatar,
  actorSlug: users.slug,
  postId: notifications.postId,
  postTitle: posts.title,
  postSlug: posts.slug,
};

export function createNotificationsRepository(db: DbType) {
  return {
    async create(data: NewNotification): Promise<NotificationWithDetails> {
      const [created] = await db
        .insert(notifications)
        .values(data)
        .returning();

      if (!created) throw new Error("Failed to create notification");

      const [result] = await db
        .select(notificationColumns)
        .from(notifications)
        .innerJoin(users, eq(notifications.actorId, users.id))
        .leftJoin(posts, eq(notifications.postId, posts.id))
        .where(eq(notifications.id, created.id));

      return result!;
    },

    async findByRecipient(
      recipientId: string,
      limit: number,
      cursor?: string,
    ): Promise<{ items: NotificationWithDetails[]; hasMore: boolean }> {
      const conditions = [eq(notifications.recipientId, recipientId)];

      if (cursor) {
        const cursorNotif = await db
          .select({ createdAt: notifications.createdAt })
          .from(notifications)
          .where(eq(notifications.id, cursor));

        if (cursorNotif[0]) {
          conditions.push(lt(notifications.createdAt, cursorNotif[0].createdAt));
        }
      }

      const items = await db
        .select(notificationColumns)
        .from(notifications)
        .innerJoin(users, eq(notifications.actorId, users.id))
        .leftJoin(posts, eq(notifications.postId, posts.id))
        .where(and(...conditions))
        .orderBy(desc(notifications.createdAt))
        .limit(limit + 1);

      const hasMore = items.length > limit;
      if (hasMore) items.pop();

      return { items, hasMore };
    },

    async getUnreadCount(recipientId: string): Promise<number> {
      const [result] = await db
        .select({ total: count() })
        .from(notifications)
        .where(
          and(
            eq(notifications.recipientId, recipientId),
            eq(notifications.read, false),
          ),
        );

      return result?.total ?? 0;
    },

    async markAsRead(id: string, recipientId: string): Promise<boolean> {
      const result = await db
        .update(notifications)
        .set({ read: true })
        .where(
          and(
            eq(notifications.id, id),
            eq(notifications.recipientId, recipientId),
          ),
        )
        .returning({ id: notifications.id });

      return result.length > 0;
    },
  };
}

export type NotificationsRepository = ReturnType<
  typeof createNotificationsRepository
>;
