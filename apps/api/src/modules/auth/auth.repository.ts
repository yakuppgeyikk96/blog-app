import { eq, sql } from "drizzle-orm";
import type { DbType } from "../../db/connection";
import { users } from "../../db/schema/index";

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;

export function createAuthRepository(db: DbType) {
  return {
    async findById(id: string): Promise<User | undefined> {
      const result = await db
        .select()
        .from(users)
        .where(eq(users.id, id));

      return result[0];
    },

    async findByEmail(email: string): Promise<User | undefined> {
      const result = await db
        .select()
        .from(users)
        .where(eq(users.email, email));

      return result[0];
    },

    async findSlugStartingWith(baseSlug: string): Promise<{ slug: string }[]> {
      return db
        .select({ slug: users.slug })
        .from(users)
        .where(
          sql`${users.slug} = ${baseSlug} OR ${users.slug} LIKE ${baseSlug + "-%"}`,
        ) as Promise<{ slug: string }[]>;
    },

    async create(data: NewUser): Promise<User> {
      const result = await db.insert(users).values(data).returning();

      const user = result[0];
      if (!user) {
        throw new Error("Failed to create user");
      }

      return user;
    },
  };
}

export type AuthRepository = ReturnType<typeof createAuthRepository>;
