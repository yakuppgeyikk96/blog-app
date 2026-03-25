import { asc, count, eq, inArray, isNull } from "drizzle-orm";
import type { DbType } from "../../db/connection";
import { comments } from "../../db/schema/index";
import { users } from "../../db/schema/index";

export type Comment = typeof comments.$inferSelect;
export type NewComment = typeof comments.$inferInsert;

export interface CommentWithAuthor {
  id: string;
  postId: string;
  authorId: string;
  parentId: string | null;
  content: string;
  createdAt: Date;
  updatedAt: Date;
  authorName: string;
  authorSlug: string | null;
  authorAvatar: string | null;
}

const commentWithAuthorColumns = {
  id: comments.id,
  postId: comments.postId,
  authorId: comments.authorId,
  parentId: comments.parentId,
  content: comments.content,
  createdAt: comments.createdAt,
  updatedAt: comments.updatedAt,
  authorName: users.name,
  authorSlug: users.slug,
  authorAvatar: users.avatar,
};

export function createCommentsRepository(db: DbType) {
  return {
    async create(data: NewComment): Promise<CommentWithAuthor> {
      const [created] = await db.insert(comments).values(data).returning();
      if (!created) {
        throw new Error("Failed to create comment");
      }

      const [result] = await db
        .select(commentWithAuthorColumns)
        .from(comments)
        .innerJoin(users, eq(comments.authorId, users.id))
        .where(eq(comments.id, created.id));

      return result!;
    },

    async findById(id: string): Promise<Comment | undefined> {
      const [result] = await db
        .select()
        .from(comments)
        .where(eq(comments.id, id));

      return result;
    },

    async findByPostId(postId: string): Promise<CommentWithAuthor[]> {
      return db
        .select(commentWithAuthorColumns)
        .from(comments)
        .innerJoin(users, eq(comments.authorId, users.id))
        .where(eq(comments.postId, postId))
        .orderBy(asc(comments.createdAt));
    },

    async update(
      id: string,
      content: string,
    ): Promise<CommentWithAuthor | undefined> {
      const [updated] = await db
        .update(comments)
        .set({ content })
        .where(eq(comments.id, id))
        .returning();

      if (!updated) return undefined;

      const [result] = await db
        .select(commentWithAuthorColumns)
        .from(comments)
        .innerJoin(users, eq(comments.authorId, users.id))
        .where(eq(comments.id, updated.id));

      return result;
    },

    async delete(id: string): Promise<boolean> {
      const result = await db
        .delete(comments)
        .where(eq(comments.id, id))
        .returning({ id: comments.id });

      return result.length > 0;
    },

    async countByPostId(postId: string): Promise<number> {
      const [result] = await db
        .select({ total: count() })
        .from(comments)
        .where(eq(comments.postId, postId));

      return result?.total ?? 0;
    },

    async countByPostIds(
      postIds: string[],
    ): Promise<Map<string, number>> {
      if (postIds.length === 0) return new Map();

      const rows = await db
        .select({ postId: comments.postId, total: count() })
        .from(comments)
        .where(inArray(comments.postId, postIds))
        .groupBy(comments.postId);

      const map = new Map<string, number>();
      for (const row of rows) {
        map.set(row.postId, row.total);
      }
      return map;
    },
  };
}

export type CommentsRepository = ReturnType<typeof createCommentsRepository>;
