import { and, count, eq, ne, sql } from "drizzle-orm";
import type { DbType } from "../../db/connection";
import { users } from "../../db/schema/index";
import { posts } from "../../db/schema/index";

export type User = typeof users.$inferSelect;

export interface UserWithPostCount {
  id: string;
  name: string;
  avatar: string | null;
  bio: string | null;
  website: string | null;
  slug: string | null;
  createdAt: Date;
  postCount: number;
}

export function createUsersRepository(db: DbType) {
  return {
    async findById(id: string): Promise<User | undefined> {
      const result = await db
        .select()
        .from(users)
        .where(eq(users.id, id));

      return result[0];
    },

    async findBySlugWithPostCount(
      slug: string,
    ): Promise<UserWithPostCount | undefined> {
      const result = await db
        .select({
          id: users.id,
          name: users.name,
          avatar: users.avatar,
          bio: users.bio,
          website: users.website,
          slug: users.slug,
          createdAt: users.createdAt,
          postCount: count(posts.id),
        })
        .from(users)
        .leftJoin(
          posts,
          and(eq(posts.authorId, users.id), eq(posts.published, true)),
        )
        .where(eq(users.slug, slug))
        .groupBy(users.id);

      return result[0];
    },

    async updateProfile(
      id: string,
      data: Partial<Pick<User, "bio" | "website" | "slug" | "avatar">>,
    ): Promise<User | undefined> {
      const result = await db
        .update(users)
        .set(data)
        .where(eq(users.id, id))
        .returning();

      return result[0];
    },

    async isSlugTaken(slug: string, excludeUserId: string): Promise<boolean> {
      const result = await db
        .select({ id: users.id })
        .from(users)
        .where(and(eq(users.slug, slug), ne(users.id, excludeUserId)));

      return result.length > 0;
    },

    async findSlugStartingWith(
      baseSlug: string,
      excludeUserId?: string,
    ): Promise<{ slug: string }[]> {
      const slugCondition = sql`${users.slug} = ${baseSlug} OR ${users.slug} LIKE ${baseSlug + "-%"}`;

      return db
        .select({ slug: users.slug })
        .from(users)
        .where(
          excludeUserId
            ? and(slugCondition, ne(users.id, excludeUserId))
            : slugCondition,
        ) as Promise<{ slug: string }[]>;
    },
  };
}

export type UsersRepository = ReturnType<typeof createUsersRepository>;
