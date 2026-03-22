import { and, count, desc, eq, inArray } from "drizzle-orm";
import type { DbType } from "../../db/connection";
import { postLikes, postBookmarks } from "../../db/schema/index";

export function createInteractionsRepository(db: DbType) {
  return {
    async toggleLike(userId: string, postId: string): Promise<boolean> {
      const deleted = await db
        .delete(postLikes)
        .where(and(eq(postLikes.userId, userId), eq(postLikes.postId, postId)))
        .returning({ postId: postLikes.postId });

      if (deleted.length > 0) {
        return false;
      }

      await db
        .insert(postLikes)
        .values({ userId, postId })
        .onConflictDoNothing();
      return true;
    },

    async toggleBookmark(userId: string, postId: string): Promise<boolean> {
      const deleted = await db
        .delete(postBookmarks)
        .where(
          and(
            eq(postBookmarks.userId, userId),
            eq(postBookmarks.postId, postId),
          ),
        )
        .returning({ postId: postBookmarks.postId });

      if (deleted.length > 0) {
        return false;
      }

      await db
        .insert(postBookmarks)
        .values({ userId, postId })
        .onConflictDoNothing();
      return true;
    },

    async getLikeCount(postId: string): Promise<number> {
      const [result] = await db
        .select({ total: count() })
        .from(postLikes)
        .where(eq(postLikes.postId, postId));

      return result?.total ?? 0;
    },

    async getLikeCounts(postIds: string[]): Promise<Map<string, number>> {
      if (postIds.length === 0) return new Map();

      const rows = await db
        .select({ postId: postLikes.postId, total: count() })
        .from(postLikes)
        .where(inArray(postLikes.postId, postIds))
        .groupBy(postLikes.postId);

      const map = new Map<string, number>();
      for (const row of rows) {
        map.set(row.postId, row.total);
      }
      return map;
    },

    async getUserInteractions(
      userId: string,
      postIds: string[],
    ): Promise<Map<string, { liked: boolean; bookmarked: boolean }>> {
      if (postIds.length === 0) return new Map();

      const [likes, bookmarks] = await Promise.all([
        db
          .select({ postId: postLikes.postId })
          .from(postLikes)
          .where(
            and(
              eq(postLikes.userId, userId),
              inArray(postLikes.postId, postIds),
            ),
          ),
        db
          .select({ postId: postBookmarks.postId })
          .from(postBookmarks)
          .where(
            and(
              eq(postBookmarks.userId, userId),
              inArray(postBookmarks.postId, postIds),
            ),
          ),
      ]);

      const likedSet = new Set(likes.map((r) => r.postId));
      const bookmarkedSet = new Set(bookmarks.map((r) => r.postId));

      const map = new Map<string, { liked: boolean; bookmarked: boolean }>();
      for (const id of postIds) {
        map.set(id, {
          liked: likedSet.has(id),
          bookmarked: bookmarkedSet.has(id),
        });
      }
      return map;
    },

    async getBookmarkedPostIds(
      userId: string,
      offset: number,
      limit: number,
    ): Promise<{ postIds: string[]; total: number }> {
      const whereClause = eq(postBookmarks.userId, userId);

      const rows = await db
        .select({ postId: postBookmarks.postId })
        .from(postBookmarks)
        .where(whereClause)
        .orderBy(desc(postBookmarks.createdAt))
        .limit(limit)
        .offset(offset);

      const [countResult] = await db
        .select({ total: count() })
        .from(postBookmarks)
        .where(whereClause);

      return {
        postIds: rows.map((r) => r.postId),
        total: countResult?.total ?? 0,
      };
    },
  };
}

export type InteractionsRepository = ReturnType<
  typeof createInteractionsRepository
>;
